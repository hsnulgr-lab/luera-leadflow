/**
 * useRateLimit — Günlük arama kotası
 *
 * Premium: 20 arama/gün
 * Free   :  3 arama/gün  (gelecekte plan sistemi eklenince kullanılır)
 *
 * Supabase'deki search_usage tablosunu okur/günceller.
 * Tablo henüz yoksa localStorage fallback çalışır.
 */

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const DAILY_LIMIT = 20; // Premium plan

export const useRateLimit = () => {
    const { user } = useAuth();

    /** Kotayı kontrol et. true → devam edebilir, false → engelle */
    const checkAndIncrement = useCallback(async (): Promise<boolean> => {
        if (!user) return false;

        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        try {
            // Mevcut sayacı çek (yoksa oluştur)
            const { data, error } = await supabase
                .from('search_usage')
                .select('id, count')
                .eq('user_id', user.id)
                .eq('date', today)
                .maybeSingle();

            if (error) throw error;

            const currentCount = data?.count ?? 0;

            if (currentCount >= DAILY_LIMIT) {
                toast.error(
                    `Günlük arama limitine ulaştınız (${DAILY_LIMIT}/${DAILY_LIMIT}). ` +
                    `Limit her gün gece yarısı sıfırlanır.`,
                    { duration: 6000 }
                );
                return false;
            }

            // Upsert — sayacı artır
            const { error: upsertError } = await supabase
                .from('search_usage')
                .upsert(
                    { user_id: user.id, date: today, count: currentCount + 1, updated_at: new Date().toISOString() },
                    { onConflict: 'user_id,date' }
                );

            if (upsertError) throw upsertError;

            // Son 3 aramada uyarı göster
            const remaining = DAILY_LIMIT - (currentCount + 1);
            if (remaining <= 3 && remaining > 0) {
                toast.warning(`Günlük limitten ${remaining} arama hakkınız kaldı.`);
            }

            return true;

        } catch (err) {
            // Supabase tablosu henüz yoksa localStorage fallback
            console.warn('[RateLimit] Supabase unavailable, using localStorage fallback:', err);
            return localStorageFallback(user.id, today);
        }
    }, [user]);

    /** Bugünkü kullanımı döner (UI'da göstermek için) */
    const getUsage = useCallback(async (): Promise<{ used: number; limit: number }> => {
        if (!user) return { used: 0, limit: DAILY_LIMIT };
        const today = new Date().toISOString().split('T')[0];
        try {
            const { data } = await supabase
                .from('search_usage')
                .select('count')
                .eq('user_id', user.id)
                .eq('date', today)
                .maybeSingle();
            return { used: data?.count ?? 0, limit: DAILY_LIMIT };
        } catch {
            const key = `rl_${user.id}_${today}`;
            return { used: parseInt(localStorage.getItem(key) || '0'), limit: DAILY_LIMIT };
        }
    }, [user]);

    return { checkAndIncrement, getUsage, DAILY_LIMIT };
};

// ── localStorage fallback ────────────────────────────────────────────────────
function localStorageFallback(userId: string, today: string): boolean {
    const key = `rl_${userId}_${today}`;
    const count = parseInt(localStorage.getItem(key) || '0');
    if (count >= DAILY_LIMIT) {
        toast.error(`Günlük arama limitine ulaştınız (${DAILY_LIMIT}/${DAILY_LIMIT}).`);
        return false;
    }
    localStorage.setItem(key, String(count + 1));
    return true;
}
