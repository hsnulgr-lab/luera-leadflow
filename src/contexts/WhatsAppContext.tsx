import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { Lead, MessageQueueItem } from '@/types/whatsapp';
import { n8nEvolutionService } from '@/services/n8nEvolutionService';
import { evolutionService } from '@/services/evolutionService';
import { supabase } from '@/lib/supabase';
import { useSentHistory } from '@/hooks/useSentHistory';
import { usePhoneCooldown } from '@/hooks/usePhoneCooldown';
import { useAuth } from '@/contexts/AuthContext';
import { getUserInstanceName } from '@/services/n8nEvolutionService';
import { useWarmup, WarmupPhase } from '@/hooks/useWarmup';
import { useUserSettings } from '@/hooks/useUserSettings';

// Sabit max limit (warm-up tamamlandığında ulaşılan)
export const DAILY_SEND_LIMIT = 80;
// Ortalama gecikme (35-120s random → ~77s ortalama)
export const AVG_DELAY_SECONDS = 77;

interface SentRecord {
    leadId: string;
    leadName: string;
    sentAt: string;
}

interface WhatsAppContextType {
    messageQueue: MessageQueueItem[];
    isSending: boolean;
    bulkSendStatus: "idle" | "sending" | "completed";
    lastCompletionTime: Date | null;
    sentLeadIds: Set<string>;
    sentRecords: SentRecord[];
    wasSent: (leadId: string) => boolean;
    getSentFromList: (leads: { id: string; name: string }[]) => { id: string; name: string }[];
    setMessageQueue: React.Dispatch<React.SetStateAction<MessageQueueItem[]>>;
    setIsSending: React.Dispatch<React.SetStateAction<boolean>>;
    setBulkSendStatus: React.Dispatch<React.SetStateAction<"idle" | "sending" | "completed">>;
    handleSendQueue: () => Promise<void>;
    handleAddToQueue: (leadsToAdd: Lead[]) => void;
    // Günlük limit + warm-up
    todaySentCount: number;
    remainingToday: number;
    dailyLimitReached: boolean;
    warmup: WarmupPhase;
    resetWarmup: () => void;
    setWarmupStartDate: (date: string) => void;
    // Phone Cooldown
    isPhoneInCooldown: (phone: string) => boolean;
    getPhoneCooldownInfo: (phone: string) => any;
    getPhoneRemainingTime: (phone: string) => string;
    filterAvailableLeads: <T extends { phone: string }>(leads: T[]) => T[];
    phoneCooldownCount: <T extends { phone: string }>(leads: T[]) => number;
}

const WhatsAppContext = createContext<WhatsAppContextType | null>(null);

export const WhatsAppProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [messageQueue, setMessageQueue] = useState<MessageQueueItem[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [bulkSendStatus, setBulkSendStatus] = useState<"idle" | "sending" | "completed">("idle");
    const [lastCompletionTime, setLastCompletionTime] = useState<Date | null>(null);
    const { settings: userSettings } = useUserSettings();
    // Warm-up için kullanıcının kendi instance adı — multi-tenant uyumlu
    const instanceName = userSettings.evolution_instance_name || import.meta.env.VITE_EVOLUTION_INSTANCE_NAME || 'testwp';
    const { warmup, resetWarmup, setStartDate: setWarmupStartDate } = useWarmup(instanceName);

    // İşletme bilgileri — mesaj kişiselleştirme için
    const senderBusiness = {
        senderName:        userSettings.sender_name,
        businessName:      userSettings.business_name,
        businessSector:    userSettings.business_sector,
        businessOffer:     userSettings.business_offer,
        businessWebsite:   userSettings.business_website,
        businessInstagram: userSettings.business_instagram,
    };
    const { markAsSent, sentLeadIds, sentRecords, wasSent, getSentFromList } = useSentHistory(user?.id);
    const {
        isInCooldown: isPhoneInCooldown,
        getCooldownInfo: getPhoneCooldownInfo,
        getRemainingTime: getPhoneRemainingTime,
        addToCooldown,
        filterAvailableLeads,
        getCooldownCount: phoneCooldownCount,
    } = usePhoneCooldown(user?.id);
    const isInitialLoad = useRef(true);

    // Kullanıcıya özel localStorage key
    const queueStorageKey = user ? `whatsapp_message_queue_${user.id}` : 'whatsapp_message_queue';

    // Initial Load from LocalStorage
    useEffect(() => {
        const storedQueue = localStorage.getItem(queueStorageKey);
        if (storedQueue) {
            setMessageQueue(JSON.parse(storedQueue));
        }
    }, []);

    // Save to LocalStorage on Change — skip first render to avoid writing []
    useEffect(() => {
        if (isInitialLoad.current) {
            isInitialLoad.current = false;
            return;
        }
        localStorage.setItem(queueStorageKey, JSON.stringify(messageQueue));
    }, [messageQueue]);

    // Listen for bulk send completion notifications from Supabase
    useEffect(() => {
        const channel = supabase
            .channel('whatsapp-completion-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications'
                },
                (payload) => {
                    const notification = payload.new as { title: string; message: string };
                    if (notification.title.includes('Tamamlandı')) {
                        setBulkSendStatus('completed');
                        setLastCompletionTime(new Date());

                        setTimeout(() => {
                            setBulkSendStatus('idle');
                        }, 20000);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Fail-safe completion checker
    useEffect(() => {
        if (bulkSendStatus === 'sending') {
            const hasActiveItems = messageQueue.some(item => item.status === 'pending' || item.status === 'sending');
            if (!hasActiveItems) {
                const timer = setTimeout(() => {
                    setBulkSendStatus('completed');
                    setLastCompletionTime(new Date());
                    setTimeout(() => setBulkSendStatus('idle'), 5000);
                }, 1000);
                return () => clearTimeout(timer);
            }
        }
    }, [messageQueue, bulkSendStatus]);

    // Günlük limit — warm-up fazına göre dinamik
    const today = new Date().toISOString().split('T')[0];
    const todaySentCount = sentRecords.filter(r => r.sentAt.startsWith(today)).length;
    const effectiveDailyLimit = warmup.dailyLimit; // faza göre 10/25/40/60/80
    const remainingToday = Math.max(0, effectiveDailyLimit - todaySentCount);
    const dailyLimitReached = todaySentCount >= effectiveDailyLimit;

    const handleSendQueue = async () => {
        setIsSending(true);
        setBulkSendStatus('sending');

        const pendingItems = messageQueue.filter(item => item.status === 'pending');

        if (pendingItems.length === 0) {
            setIsSending(false);
            setBulkSendStatus('idle');
            return;
        }

        // 🛡️ Günlük limit — warm-up fazına göre kırp
        const allowedItems = pendingItems.slice(0, remainingToday);
        if (allowedItems.length === 0) {
            console.warn(`[Anti-ban] Günlük limit (${effectiveDailyLimit} — Faz ${warmup.phase}) doldu.`);
            setIsSending(false);
            setBulkSendStatus('idle');
            return;
        }

        // Limit aşan itemları failed yap
        if (allowedItems.length < pendingItems.length) {
            const blockedIds = new Set(pendingItems.slice(allowedItems.length).map(i => i.id));
            setMessageQueue(prev => prev.map(msg =>
                blockedIds.has(msg.id)
                    ? { ...msg, status: 'failed' as const, error: `Faz ${warmup.phase} günlük limiti (${effectiveDailyLimit}) aşıldı` }
                    : msg
            ));
        }

        // Kullanıcının WhatsApp instance adını al
        const evInstanceName = user
            ? await getUserInstanceName(user.id)
            : (import.meta.env.VITE_EVOLUTION_INSTANCE_NAME || 'testwp');

        // ── Her mesajı sırayla, anti-spam delay ile gönder ──────────────────
        for (let i = 0; i < allowedItems.length; i++) {
            const item = allowedItems[i];

            // Gönderiliyor durumuna al
            setMessageQueue(prev => prev.map(msg =>
                msg.id === item.id ? { ...msg, status: 'sending' as const } : msg
            ));

            // Evolution API'ye gönder
            const result = await evolutionService.sendTextMessage(
                evInstanceName,
                item.lead.phone,
                item.message
            );

            if (result.success) {
                setMessageQueue(prev => prev.map(msg =>
                    msg.id === item.id ? { ...msg, status: 'sent' as const } : msg
                ));
                await markAsSent([{ id: item.lead.id, name: item.lead.name }]);
                if (item.lead.phone) {
                    await addToCooldown([{ phone: item.lead.phone, leadName: item.lead.name }]);
                }
            } else {
                setMessageQueue(prev => prev.map(msg =>
                    msg.id === item.id
                        ? { ...msg, status: 'failed' as const, error: result.error || 'Gönderilemedi' }
                        : msg
                ));
            }

            // 🕐 Anti-spam delay: son mesaj değilse bekle (10–85 saniye arası random)
            if (i < allowedItems.length - 1) {
                const delay = Math.floor(Math.random() * (85000 - 10000 + 1)) + 10000;
                console.log(`[Anti-spam] ${item.lead.name} gönderildi → ${Math.round(delay / 1000)}sn bekleniyor...`);
                await new Promise(res => setTimeout(res, delay));
            }
        }

        setIsSending(false);
        setBulkSendStatus('completed');
        setTimeout(() => setBulkSendStatus('idle'), 5000);
    };

    const handleAddToQueue = (newLeads: Lead[]) => {
        if (newLeads.length === 0) return;

        const newQueue = newLeads.map(lead => ({
            id: crypto.randomUUID(),
            lead,
            message: "Yapay zeka mesaj oluşturuyor... 🤖",
            status: "generating" as const
        }));

        setMessageQueue(prev => [...prev, ...newQueue]);

        for (const item of newQueue) {
            n8nEvolutionService.generateMessage(item.lead, "", senderBusiness)
                .then(message => {
                    setMessageQueue(prev => prev.map(q =>
                        q.id === item.id ? { ...q, message, status: "pending" as const } : q
                    ));
                })
                .catch(() => {
                    setMessageQueue(prev => prev.map(q =>
                        q.id === item.id
                            ? { ...q, message: `Merhaba ${item.lead.name}! 🚀 Sizinle görüşmek isteriz.`, status: "pending" as const }
                            : q
                    ));
                });
        }
    };

    return (
        <WhatsAppContext.Provider value={{
            messageQueue,
            isSending,
            bulkSendStatus,
            lastCompletionTime,
            sentLeadIds,
            sentRecords,
            wasSent,
            getSentFromList,
            setMessageQueue,
            setIsSending,
            setBulkSendStatus,
            handleSendQueue,
            handleAddToQueue,
            // Günlük limit + warm-up
            todaySentCount,
            remainingToday,
            dailyLimitReached,
            warmup,
            resetWarmup,
            setWarmupStartDate,
            // Phone Cooldown
            isPhoneInCooldown,
            getPhoneCooldownInfo,
            getPhoneRemainingTime,
            filterAvailableLeads,
            phoneCooldownCount,
        }}>
            {children}
        </WhatsAppContext.Provider>
    );
};

export const useWhatsApp = () => {
    const context = useContext(WhatsAppContext);
    if (!context) {
        throw new Error('useWhatsApp must be used within WhatsAppProvider');
    }
    return context;
};
