import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface UserSettings {
    n8n_webhook_url: string | null;
    gemini_api_key: string | null;
    evolution_instance_name: string | null;
}

export const useUserSettings = () => {
    const { user } = useAuth();
    const [settings, setSettings] = useState<UserSettings>({
        n8n_webhook_url: null,
        gemini_api_key: null,
        evolution_instance_name: null,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        const load = async () => {
            const { data } = await supabase
                .from('user_settings')
                .select('n8n_webhook_url, gemini_api_key, evolution_instance_name')
                .eq('user_id', user.id)
                .single();

            if (data) {
                setSettings(data);
            }
            setIsLoading(false);
        };

        load();
    }, [user]);

    return { settings, isLoading };
};
