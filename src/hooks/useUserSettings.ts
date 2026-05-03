import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface UserSettings {
    n8n_webhook_url: string | null;
    gemini_api_key: string | null;
    evolution_instance_name: string | null;
    // 🏢 İşletme bilgileri — mesaj kişiselleştirme için
    business_name: string | null;        // "Luera Ajans"
    business_sector: string | null;      // "Dijital Pazarlama"
    business_offer: string | null;       // "Müşteri bulma ve WhatsApp otomasyonu"
    sender_name: string | null;          // "Furkan"
    business_website: string | null;
    business_instagram: string | null;
}

const DEFAULT_SETTINGS: UserSettings = {
    n8n_webhook_url: null,
    gemini_api_key: null,
    evolution_instance_name: null,
    business_name: null,
    business_sector: null,
    business_offer: null,
    sender_name: null,
    business_website: null,
    business_instagram: null,
};

export const useUserSettings = () => {
    const { user } = useAuth();
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        const load = async () => {
            const { data } = await supabase
                .from('user_settings')
                .select('n8n_webhook_url, gemini_api_key, evolution_instance_name, business_name, business_sector, business_offer, sender_name, business_website, business_instagram')
                .eq('user_id', user.id)
                .single();

            if (data) {
                setSettings({ ...DEFAULT_SETTINGS, ...data });
            }
            setIsLoading(false);
        };

        load();
    }, [user]);

    return { settings, isLoading };
};
