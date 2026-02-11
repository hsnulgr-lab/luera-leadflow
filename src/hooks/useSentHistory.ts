import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface SentRecord {
    leadId: string;
    leadName: string;
    sentAt: string;
}

const STORAGE_KEY = 'whatsapp_sent_history';

/**
 * Dual-layer duplicate protection:
 * 1. localStorage for instant offline checks
 * 2. Supabase whatsapp_sent_log for permanent server-side record
 */
export const useSentHistory = () => {
    const [sentLeadIds, setSentLeadIds] = useState<Set<string>>(new Set());
    const [sentRecords, setSentRecords] = useState<SentRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load from both localStorage and Supabase on mount
    useEffect(() => {
        const loadHistory = async () => {
            // 1. Instant load from localStorage
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const records: SentRecord[] = JSON.parse(stored);
                    setSentRecords(records);
                    setSentLeadIds(new Set(records.map(r => r.leadId)));
                }
            } catch (e) {
                console.error('localStorage read error:', e);
            }

            // 2. Sync with Supabase (source of truth)
            try {
                const { data, error } = await supabase
                    .from('whatsapp_sent_log')
                    .select('lead_id, lead_name, sent_at')
                    .order('sent_at', { ascending: false });

                if (!error && data) {
                    const records: SentRecord[] = data.map(row => ({
                        leadId: row.lead_id,
                        leadName: row.lead_name,
                        sentAt: row.sent_at,
                    }));
                    setSentRecords(records);
                    setSentLeadIds(new Set(records.map(r => r.leadId)));
                    // Update localStorage with server data
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
                }
            } catch (e) {
                console.error('Supabase sync error:', e);
                // localStorage fallback already loaded
            }

            setIsLoading(false);
        };

        loadHistory();
    }, []);

    // Mark leads as sent
    const markAsSent = useCallback(async (leads: { id: string; name: string }[]) => {
        const now = new Date().toISOString();
        const newRecords: SentRecord[] = leads.map(lead => ({
            leadId: lead.id,
            leadName: lead.name,
            sentAt: now,
        }));

        // 1. Update state immediately
        setSentRecords(prev => {
            const updated = [...newRecords, ...prev];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
        setSentLeadIds(prev => {
            const updated = new Set(prev);
            leads.forEach(l => updated.add(l.id));
            return updated;
        });

        // 2. Persist to Supabase
        try {
            const rows = leads.map(lead => ({
                lead_id: lead.id,
                lead_name: lead.name,
                sent_at: now,
            }));

            const { error } = await supabase
                .from('whatsapp_sent_log')
                .upsert(rows, { onConflict: 'lead_id' });

            if (error) {
                console.error('Supabase write error:', error);
            }
        } catch (e) {
            console.error('Supabase insert error:', e);
            // localStorage already saved as backup
        }
    }, []);

    // Check if a lead was already sent
    const wasSent = useCallback((leadId: string): boolean => {
        return sentLeadIds.has(leadId);
    }, [sentLeadIds]);

    // Get sent date for a lead
    const getSentDate = useCallback((leadId: string): string | null => {
        const record = sentRecords.find(r => r.leadId === leadId);
        return record ? record.sentAt : null;
    }, [sentRecords]);

    // Filter out already-sent leads
    const filterNewLeads = useCallback((leads: { id: string }[]): { id: string }[] => {
        return leads.filter(l => !sentLeadIds.has(l.id));
    }, [sentLeadIds]);

    // Get list of sent leads from a set
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
