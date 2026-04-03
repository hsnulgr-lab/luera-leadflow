import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

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

// Yeni kullanıcı için Evolution API'de instance oluştur
const createEvolutionInstance = async (userId: string) => {
    const evolutionUrl = import.meta.env.VITE_EVOLUTION_API_URL;
    const evolutionKey = import.meta.env.VITE_EVOLUTION_API_KEY;

    if (!evolutionUrl || !evolutionKey) return null;

    const instanceName = `user_${userId.replace(/-/g, '').substring(0, 16)}`;

    try {
        const response = await fetch(`${evolutionUrl}/instance/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': evolutionKey,
            },
            body: JSON.stringify({
                instanceName,
                token: instanceName,
                qrcode: true,
            }),
        });

        if (response.ok) {
            return instanceName;
        }
    } catch (err) {
        console.error('Evolution instance oluşturulamadı:', err);
    }

    return instanceName; // Hata olsa bile instance adını kaydet
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
                return { success: false, error: error.message };
            }

            // Kullanıcı oluşturulduysa Evolution instance aç ve user_settings kaydet
            if (data.user) {
                const instanceName = await createEvolutionInstance(data.user.id);

                await supabase.from('user_settings').upsert({
                    user_id: data.user.id,
                    n8n_webhook_url: import.meta.env.VITE_N8N_WEBHOOK_URL || null,
                    gemini_api_key: null,
                    evolution_instance_name: instanceName,
                }, { onConflict: 'user_id' });
            }

            return { success: true };
        } catch (err) {
            return { success: false, error: 'Kayıt olurken bir hata oluştu' };
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout }}>
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
