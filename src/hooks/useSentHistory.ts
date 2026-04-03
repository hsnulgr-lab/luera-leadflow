import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface SentRecord {
    leadId: string;
    leadName: string;
    sentAt: string;
}

// Her kullanıcıya özel localStorage key
const getStorageKey = (userId: string) => `whatsapp_sent_history_${userId}`;

/**
 * Dual-layer duplicate protection:
 * 1. localStorage (kullanıcıya özel key) for instant offline checks
 * 2. Supabase whatsapp_sent_log (user_id ile izole, RLS) for permanent server-side record
 */
export const useSentHistory = (userId?: string) => {
    const [sentLeadIds, setSentLeadIds] = useState<Set<string>>(new Set());
    const [sentRecords, setSentRecords] = useState<SentRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setIsLoading(false);
            return;
        }

        const storageKey = getStorageKey(userId);

        const loadHistory = async () => {
            let localRecords: SentRecord[] = [];
            try {
                const stored = localStorage.getItem(storageKey);
                if (stored) {
                    localRecords = JSON.parse(stored);
                    setSentRecords(localRecords);
                    setSentLeadIds(new Set(localRecords.map(r => r.leadId)));
                }
            } catch (e) {
                console.error('localStorage read error:', e);
            }

            try {
                const { data, error } = await supabase
                    .from('whatsapp_sent_log')
                    .select('lead_id, lead_name, sent_at')
                    .eq('user_id', userId)
                    .order('sent_at', { ascending: false });

                if (!error && data) {
                    const supabaseRecords: SentRecord[] = data.map(row => ({
                        leadId: row.lead_id,
                        leadName: row.lead_name,
                        sentAt: row.sent_at,
                    }));

                    const mergedMap = new Map<string, SentRecord>();
                    for (const r of localRecords) mergedMap.set(r.leadId, r);
                    for (const r of supabaseRecords) mergedMap.set(r.leadId, r);
                    const merged = Array.from(mergedMap.values());

                    setSentRecords(merged);
                    setSentLeadIds(new Set(merged.map(r => r.leadId)));
                    localStorage.setItem(storageKey, JSON.stringify(merged));
                }
            } catch (e) {
                console.error('Supabase sync error:', e);
            }

            setIsLoading(false);
        };

        loadHistory();
    }, [userId]);

    const markAsSent = useCallback(async (leads: { id: string; name: string }[]) => {
        if (!userId) return;

        const storageKey = getStorageKey(userId);
        const now = new Date().toISOString();
        const newRecords: SentRecord[] = leads.map(lead => ({
            leadId: lead.id,
            leadName: lead.name,
            sentAt: now,
        }));

        setSentRecords(prev => {
            const updated = [...newRecords, ...prev];
            localStorage.setItem(storageKey, JSON.stringify(updated));
            return updated;
        });
        setSentLeadIds(prev => {
            const updated = new Set(prev);
            leads.forEach(l => updated.add(l.id));
            return updated;
        });

        try {
            const rows = leads.map(lead => ({
                lead_id: lead.id,
                lead_name: lead.name,
                sent_at: now,
                user_id: userId,
            }));

            const { error } = await supabase
                .from('whatsapp_sent_log')
                .upsert(rows, { onConflict: 'user_id,lead_id' });

            if (error) {
                console.error('Supabase write error:', error);
            }
        } catch (e) {
            console.error('Supabase insert error:', e);
        }
    }, [userId]);

    const wasSent = useCallback((leadId: string): boolean => {
        return sentLeadIds.has(leadId);
    }, [sentLeadIds]);

    const getSentDate = useCallback((leadId: string): string | null => {
        const record = sentRecords.find(r => r.leadId === leadId);
        return record ? record.sentAt : null;
    }, [sentRecords]);

    const filterNewLeads = useCallback((leads: { id: string }[]): { id: string }[] => {
        return leads.filter(l => !sentLeadIds.has(l.id));
    }, [sentLeadIds]);

    const getSentFromList = useCallback((leads: { id: string; name: string }[]): { id: string; name: string }[] => {
        return leads.filter(l => sentLeadIds.has(l.id));
    }, [sentLeadIds]);

    return {
        sentLeadIds,
        sentRecords,
        isLoading,
        markAsSent,
        wasSent,
        getSentDate,
        filterNewLeads,
        getSentFromList,
    };
};
