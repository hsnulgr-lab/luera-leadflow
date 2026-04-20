import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface CooldownRecord {
    phone: string;
    contactedAt: string;
    cooldownUntil: string;
    leadNames: string[]; // Hangi işletmelere gönderildiğinin kaydı
}

const COOLDOWN_DAYS_DEFAULT = 7;
const getStorageKey = (userId: string) => `phone_cooldown_${userId}`;

/**
 * Telefon numarası bazlı cooldown sistemi.
 * Aynı numaraya sahip farklı lead'lere tekrar mesaj gönderilmesini engeller.
 * Cooldown süresi dolana kadar numara kilitli kalır.
 */
export const usePhoneCooldown = (userId?: string, cooldownDays: number = COOLDOWN_DAYS_DEFAULT) => {
    const [cooldownMap, setCooldownMap] = useState<Map<string, CooldownRecord>>(new Map());
    const [isLoading, setIsLoading] = useState(true);

    // Telefon numarasını normalize et (boşluk, tire, parantez temizle, +90 prefix)
    const normalizePhone = useCallback((phone: string): string => {
        if (!phone) return '';
        let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
        // Başında 0 varsa ve 11 hane → +90 olarak dönüştür
        if (cleaned.startsWith('0') && cleaned.length === 11) {
            cleaned = '+90' + cleaned.substring(1);
        }
        // Başında + yoksa ve 10 hane → +90 ekle
        if (!cleaned.startsWith('+') && cleaned.length === 10) {
            cleaned = '+90' + cleaned;
        }
        return cleaned;
    }, []);

    // Supabase + localStorage'dan cooldown kayıtlarını yükle
    useEffect(() => {
        if (!userId) {
            setIsLoading(false);
            return;
        }

        const loadCooldowns = async () => {
            const storageKey = getStorageKey(userId);
            const now = new Date();

            // 1. localStorage'dan hızlı yükleme
            try {
                const stored = localStorage.getItem(storageKey);
                if (stored) {
                    const records: CooldownRecord[] = JSON.parse(stored);
                    const activeRecords = records.filter(r => new Date(r.cooldownUntil) > now);
                    const map = new Map<string, CooldownRecord>();
                    activeRecords.forEach(r => map.set(r.phone, r));
                    setCooldownMap(map);
                }
            } catch (e) {
                console.error('[PhoneCooldown] localStorage read error:', e);
            }

            // 2. Supabase'den senkronize et
            try {
                const { data, error } = await supabase
                    .from('phone_cooldown')
                    .select('*')
                    .eq('user_id', userId)
                    .gt('cooldown_until', now.toISOString());

                if (!error && data) {
                    const map = new Map<string, CooldownRecord>();
                    data.forEach((row: any) => {
                        map.set(row.phone, {
                            phone: row.phone,
                            contactedAt: row.contacted_at,
                            cooldownUntil: row.cooldown_until,
                            leadNames: row.lead_names || [],
                        });
                    });
                    setCooldownMap(map);
                    // localStorage'ı güncelle
                    localStorage.setItem(storageKey, JSON.stringify(Array.from(map.values())));
                }
            } catch (e) {
                console.error('[PhoneCooldown] Supabase sync error:', e);
                // Supabase tablosu yoksa sessizce devam et, localStorage ile çalış
            }

            setIsLoading(false);
        };

        loadCooldowns();
    }, [userId]);

    // Telefon numaralarını cooldown'a ekle
    const addToCooldown = useCallback(async (phones: { phone: string; leadName: string }[]) => {
        if (!userId) return;

        const storageKey = getStorageKey(userId);
        const now = new Date();
        const cooldownUntil = new Date(now.getTime() + cooldownDays * 24 * 60 * 60 * 1000);

        const newRecords: CooldownRecord[] = [];

        setCooldownMap(prev => {
            const updated = new Map(prev);
            phones.forEach(({ phone, leadName }) => {
                const normalized = normalizePhone(phone);
                if (!normalized) return;

                const existing = updated.get(normalized);
                const leadNames = existing
                    ? [...new Set([...existing.leadNames, leadName])]
                    : [leadName];

                const record: CooldownRecord = {
                    phone: normalized,
                    contactedAt: now.toISOString(),
                    cooldownUntil: cooldownUntil.toISOString(),
                    leadNames,
                };
                updated.set(normalized, record);
                newRecords.push(record);
            });

            // localStorage güncelle
            localStorage.setItem(storageKey, JSON.stringify(Array.from(updated.values())));
            return updated;
        });

        // Supabase'e kaydet (upsert)
        try {
            const rows = newRecords.map(r => ({
                phone: r.phone,
                user_id: userId,
                contacted_at: r.contactedAt,
                cooldown_until: r.cooldownUntil,
                lead_names: r.leadNames,
            }));

            await supabase
                .from('phone_cooldown')
                .upsert(rows, { onConflict: 'user_id,phone' });
        } catch (e) {
            console.error('[PhoneCooldown] Supabase write error:', e);
            // Supabase tablosu yoksa bile localStorage ile çalışıyoruz
        }
    }, [userId, cooldownDays, normalizePhone]);

    // Bir telefon numarası cooldown'da mı?
    const isInCooldown = useCallback((phone: string): boolean => {
        const normalized = normalizePhone(phone);
        if (!normalized) return false;
        const record = cooldownMap.get(normalized);
        if (!record) return false;
        return new Date(record.cooldownUntil) > new Date();
    }, [cooldownMap, normalizePhone]);

    // Cooldown bilgisini getir
    const getCooldownInfo = useCallback((phone: string): CooldownRecord | null => {
        const normalized = normalizePhone(phone);
        if (!normalized) return null;
        const record = cooldownMap.get(normalized);
        if (!record) return null;
        if (new Date(record.cooldownUntil) <= new Date()) return null;
        return record;
    }, [cooldownMap, normalizePhone]);

    // Kalan süreyi insan okunur formatta döndür
    const getRemainingTime = useCallback((phone: string): string => {
        const info = getCooldownInfo(phone);
        if (!info) return '';

        const now = new Date();
        const until = new Date(info.cooldownUntil);
        const diffMs = until.getTime() - now.getTime();

        if (diffMs <= 0) return '';

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `${days}g ${hours}s kaldı`;
        if (hours > 0) return `${hours} saat kaldı`;

        const minutes = Math.floor(diffMs / (1000 * 60));
        return `${minutes} dk kaldı`;
    }, [getCooldownInfo]);

    // Lead listesinden cooldown'da olmayanları filtrele
    const filterAvailableLeads = useCallback(<T extends { phone: string }>(leads: T[]): T[] => {
        return leads.filter(lead => !isInCooldown(lead.phone));
    }, [isInCooldown]);

    // Cooldown'daki lead sayısı
    const getCooldownCount = useCallback(<T extends { phone: string }>(leads: T[]): number => {
        return leads.filter(lead => isInCooldown(lead.phone)).length;
    }, [isInCooldown]);

    return {
        isLoading,
        isInCooldown,
        getCooldownInfo,
        getRemainingTime,
        addToCooldown,
        filterAvailableLeads,
        getCooldownCount,
        normalizePhone,
        cooldownDays,
    };
};
