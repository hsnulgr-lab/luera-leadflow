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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(mapSupabaseUser(session?.user ?? null));
            setIsLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(mapSupabaseUser(session?.user ?? null));
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                // Denenen veritabanında başarısız olduysa, diğer veritabanını dene
                const currentTenant = localStorage.getItem('tenant') || 'furkan';
                const otherTenant = currentTenant === 'furkan' ? 'gokhan' : 'furkan';

                const otherUrl = otherTenant === 'gokhan' ? import.meta.env.VITE_GOKHAN_SUPABASE_URL : import.meta.env.VITE_SUPABASE_URL;
                const otherKey = otherTenant === 'gokhan' ? import.meta.env.VITE_GOKHAN_SUPABASE_ANON_KEY : import.meta.env.VITE_SUPABASE_ANON_KEY;

                if (otherUrl && otherKey) {
                    const { createClient } = await import('@supabase/supabase-js');
                    const tempClient = createClient(otherUrl, otherKey);

                    const { data: otherData, error: otherError } = await tempClient.auth.signInWithPassword({
                        email,
                        password
                    });

                    // Diğer veritabanında başarılı olduysa, sistemi o kullanıcıya geçir ve yenile
                    if (!otherError && otherData.user) {
                        localStorage.setItem('tenant', otherTenant);
                        window.location.reload();
                        return { success: true };
                    }
                }

                console.error("Supabase Login Error:", error);
                return { success: false, error: 'Kullanıcı adı veya şifre hatalı' };
            }

            setUser(mapSupabaseUser(data.user));
            return { success: true };
        } catch (err) {
            console.error("Unexpected Login Error:", err);
            return { success: false, error: 'Giriş yapılırken bir hata oluştu' };
        }
    };

    const signup = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { name },
                },
            });

            if (error) {
                return { success: false, error: error.message };
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
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                signup,
                logout,
            }}
        >
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
