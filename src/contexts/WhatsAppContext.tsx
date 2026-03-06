import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Lead, MessageQueueItem } from '@/types/whatsapp';
import { n8nEvolutionService } from '@/services/n8nEvolutionService';
import { supabase } from '@/lib/supabase';
import { useSentHistory } from '@/hooks/useSentHistory';

interface WhatsAppContextType {
    messageQueue: MessageQueueItem[];
    isSending: boolean;
    bulkSendStatus: "idle" | "sending" | "completed";
    lastCompletionTime: Date | null;
    setMessageQueue: React.Dispatch<React.SetStateAction<MessageQueueItem[]>>;
    setIsSending: React.Dispatch<React.SetStateAction<boolean>>;
    setBulkSendStatus: React.Dispatch<React.SetStateAction<"idle" | "sending" | "completed">>;
    handleSendQueue: () => Promise<void>;
    handleAddToQueue: (leadsToAdd: Lead[]) => void;
}

const WhatsAppContext = createContext<WhatsAppContextType | null>(null);

export const WhatsAppProvider = ({ children }: { children: ReactNode }) => {
    const [messageQueue, setMessageQueue] = useState<MessageQueueItem[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [bulkSendStatus, setBulkSendStatus] = useState<"idle" | "sending" | "completed">("idle");
    const [lastCompletionTime, setLastCompletionTime] = useState<Date | null>(null);
    const { markAsSent } = useSentHistory();

    // Initial Load from LocalStorage
    useEffect(() => {
        const storedQueue = localStorage.getItem("whatsapp_message_queue");
        if (storedQueue) {
            setMessageQueue(JSON.parse(storedQueue));
        }
    }, []);

    // Save to LocalStorage on Change
    useEffect(() => {
        localStorage.setItem("whatsapp_message_queue", JSON.stringify(messageQueue));
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

    const handleSendQueue = async () => {
        setIsSending(true);
        const pendingItems = messageQueue.filter(item => item.status === 'pending');

        if (pendingItems.length === 0) {
            setIsSending(false);
            return;
        }

        try {
            setMessageQueue(prev => prev.map(msg => msg.status === 'pending' ? { ...msg, status: 'sending' } : msg));
            setBulkSendStatus('sending');

            const result = await n8nEvolutionService.sendBulkMessages(pendingItems);

            if (result.success) {
                setMessageQueue(prev => prev.map(msg => msg.status === 'sending' ? { ...msg, status: 'sent' } : msg));
                await markAsSent(pendingItems.map(item => ({ id: item.lead.id, name: item.lead.name })));
            } else {
                throw new Error("Bulk send failed");
            }
        } catch (error) {
            console.error("Queue send error:", error);
            setMessageQueue(prev => prev.map(msg => msg.status === 'sending' ? { ...msg, status: 'failed' } : msg));
        } finally {
            setIsSending(false);
        }
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
            n8nEvolutionService.generateMessage(item.lead.name, item.lead.company || '')
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
            setMessageQueue,
            setIsSending,
            setBulkSendStatus,
            handleSendQueue,
            handleAddToQueue
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
