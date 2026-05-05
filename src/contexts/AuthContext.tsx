import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { evolutionService } from '@/services/evolutionService';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
    forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapSupabaseUser = (supabaseUser: SupabaseUser | null): User | null => {
    if (!supabaseUser) return null;
    return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
        role: 'Premium',
    };
};

// Yeni kullanıcı için Evolution API'de instance oluştur ve adını döndür
const provisionEvolutionInstance = async (userId: string): Promise<string> => {
    const instanceName = evolutionService.generateInstanceName(userId);
    await evolutionService.createInstance(instanceName);
    return instanceName;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(mapSupabaseUser(session?.user ?? null));
            setIsLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(mapSupabaseUser(session?.user ?? null));
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                console.error('Supabase Login Error:', error);
                return { success: false, error: 'Kullanıcı adı veya şifre hatalı' };
            }

            setUser(mapSupabaseUser(data.user));

            // Mevcut kullanıcının instance'ı yoksa oluştur (background, login'i bloklamaz)
            if (data.user) {
                supabase
                    .from('user_settings')
                    .select('evolution_instance_name')
                    .eq('user_id', data.user.id)
                    .single()
                    .then(async ({ data: settings }) => {
                        if (!settings?.evolution_instance_name) {
                            const instanceName = await provisionEvolutionInstance(data.user!.id);
                            await supabase.from('user_settings').upsert(
                                { user_id: data.user!.id, evolution_instance_name: instanceName },
                                { onConflict: 'user_id' }
                            );
                        }
                    });
            }

            return { success: true };
        } catch (err) {
            console.error('Unexpected Login Error:', err);
            return { success: false, error: 'Giriş yapılırken bir hata oluştu' };
        }
    };

    const signup = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { name } },
            });

            if (error) {
                // Yaygın hataları Türkçeye çevir
                if (error.message.includes('already registered') || error.message.includes('User already exists')) {
                    return { success: false, error: 'Bu e-posta adresi zaten kayıtlı.' };
                }
                if (error.message.includes('Password should be at least')) {
                    return { success: false, error: 'Şifre en az 6 karakter olmalı.' };
                }
                return { success: false, error: error.message };
            }

            // Kullanıcı oluşturulduysa, arka planda Evolution + user_settings (signup'ı bloklamaz)
            if (data.user) {
                const userId = data.user.id;
                Promise.resolve().then(async () => {
                    try {
                        const instanceName = await provisionEvolutionInstance(userId);
                        await supabase.from('user_settings').upsert({
                            user_id: userId,
                            n8n_webhook_url: import.meta.env.VITE_N8N_WEBHOOK_URL || null,
                            gemini_api_key: null,
                            evolution_instance_name: instanceName,
                        }, { onConflict: 'user_id' });
                    } catch (e) {
                        console.error('[Signup] Background provisioning failed:', e);
                        // Sessizce devam et — kullanıcı deneyimini bozmaz
                    }
                });
            }

            return { success: true };
        } catch (err) {
            return { success: false, error: 'Kayıt olurken bir hata oluştu' };
        }
    };

    const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) return { success: false, error: error.message };
            return { success: true };
        } catch (err) {
            return { success: false, error: 'Bir hata oluştu, lütfen tekrar deneyin.' };
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, forgotPassword, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
