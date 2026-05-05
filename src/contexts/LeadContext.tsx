import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { Lead, ScheduleConfig } from '@/types/lead';
import { n8nService } from '@/services/n8nService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { sendLeadsToCallflow } from '@/services/callflowService';
import { useRateLimit } from '@/hooks/useRateLimit';

interface LeadContextType {
    leads: Lead[];
    selectedLeads: Set<string>;
    isSearching: boolean;
    isProcessing: boolean;
    isLoading: boolean;
    automationProgress: number;
    currentStep: number;
    completedSteps: boolean[];
    pendingSearches: { id: string, config: ScheduleConfig, scheduledTime: string }[];
    searchLeads: (config: ScheduleConfig) => Promise<void>;
    scheduleSearch: (config: ScheduleConfig, scheduledTime: Date) => void;
    removeScheduledSearch: (id: string) => void;
    toggleLeadSelection: (id: string) => void;
    updateLeadPriority: (id: string, priority: Lead['priority']) => Promise<void>;
    selectAllLeads: () => void;
    clearSelection: () => void;
    generateMessage: (id: string) => void;
    generateMessagesForSelected: () => void;
    analyzeSelected: () => void;
    bulkSend: () => Promise<void>;
    updateLeadStatus: (id: string, status: string) => Promise<void>;
    deleteLead: (id: string) => Promise<void>;
    refetch: () => Promise<void>;
}

export const LeadContext = createContext<LeadContextType | null>(null);

export const LeadProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const { addNotification } = useNotifications();
    const { checkAndIncrement } = useRateLimit();

    // Core State
    const [leads, setLeads] = useState<Lead[]>([]);
    const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

    const isInitialSelectedLoad = useRef(true);
    const selectedLeadsStorageKey = user ? `selected_leads_${user.id}` : 'selected_leads';

    useEffect(() => {
        const stored = localStorage.getItem(selectedLeadsStorageKey);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setSelectedLeads(new Set(parsed));
                }
            } catch (e) {
                console.error("Error parsing selected leads", e);
            }
        }
    }, [selectedLeadsStorageKey]);

    useEffect(() => {
        if (isInitialSelectedLoad.current) {
            isInitialSelectedLoad.current = false;
            return;
        }
        localStorage.setItem(selectedLeadsStorageKey, JSON.stringify(Array.from(selectedLeads)));
    }, [selectedLeads, selectedLeadsStorageKey]);

    // UX State
    const [isSearching, setIsSearching] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Progress State
    const [automationProgress, setAutomationProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState([false, false, false, false]);

    // Schedule State
    const [pendingSearches, setPendingSearches] = useState<{ id: string, config: ScheduleConfig, scheduledTime: string }[]>([]);

    // Load pending searches on mount
    useEffect(() => {
        const saved = localStorage.getItem('pendingSearches');
        if (saved) {
            setPendingSearches(JSON.parse(saved));
        }
    }, []);

    const fetchLeads = useCallback(async () => {
        if (!user) {
            setLeads([]);
            setIsLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching leads:', error);
                toast.error('Lead\'ler yüklenemedi');
                return;
            }

            const mappedLeads: Lead[] = (data || []).map(item => ({
                id: item.id,
                name: item.name,
                company: item.company || '',
                email: item.email || '',
                phone: item.phone,
                website: item.website || '',
                status: item.status || 'new',
                priority: item.priority || null,
                dateAdded: item.created_at,
                score: item.score || 0,
            }));

            setLeads(mappedLeads);
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    const saveLeadsToSupabase = async (newLeads: Lead[]): Promise<Lead[]> => {
        if (!user || newLeads.length === 0) return [];
        try {
            const leadsToInsert = newLeads.map(lead => ({
                name: lead.name,
                company: lead.company || null,
                phone: lead.phone,
                email: lead.email || null,
                website: lead.website || null,
                status: 'new',
                score: lead.score || null,
                user_id: user.id,
            }));

            const { data, error } = await supabase
                .from('leads')
                .insert(leadsToInsert)
                .select();

            if (error) {
                console.error('SUPABASE INSERT ERROR DETAILS:', JSON.stringify(error, null, 2));
                toast.error(`Lead'ler kaydedilemedi: ${error.message} (${error.code})`);
                return newLeads;
            } else {
                console.log('Leads saved successfully:', data);

                const savedLeads: Lead[] = (data || []).map(item => ({
                    id: item.id,
                    name: item.name,
                    company: item.company || '',
                    email: item.email || '',
                    phone: item.phone || '',
                    website: item.website || '',
                    status: item.status || 'new',
                    priority: item.priority || null,
                    dateAdded: item.created_at,
                    score: item.score || 0,
                }));

                // CallFlow'a gönder (hata olsa bile lead akışını durdurmaz)
                try {
                    const leadsWithIds: Lead[] = (data ?? []).map((d: any) => ({
                        ...(newLeads.find(l => l.phone === d.phone && l.name === d.name) ?? newLeads[0]),
                        id: d.id,
                    }));
                    const result = await sendLeadsToCallflow(leadsWithIds);
                    if (result.success > 0) {
                        toast.success(`${result.success} lead CallFlow'a aktarıldı`);
                    }
                } catch {
                    // CallFlow hatası sessizce geç
                }

                return savedLeads.length > 0 ? savedLeads : newLeads;
            }
        } catch (err) {
            console.error('Exception saving leads:', err);
            toast.error('Lead kaydetme hatası');
            return newLeads;
        }

        return newLeads;
    };

    const searchLeads = async (config: ScheduleConfig) => {
        // ── Rate limit kontrolü ──────────────────────────────────────
        const allowed = await checkAndIncrement();
        if (!allowed) return; // toast zaten gösterildi

        setIsSearching(true);
        setAutomationProgress(0);
        setCompletedSteps([false, false, false, false]);
        setCurrentStep(0);

        try {
            setAutomationProgress(20);
            const newLeads = await n8nService.searchLeads(config, undefined);
            const persistedLeads = await saveLeadsToSupabase(newLeads);

            setLeads(prev => [...persistedLeads, ...prev]);

            setCompletedSteps([true, false, false, false]);
            setAutomationProgress(50);
            setCurrentStep(1);
            await new Promise(r => setTimeout(r, 500));

            setCompletedSteps([true, true, false, false]);
            setAutomationProgress(75);
            setCurrentStep(2);
            await new Promise(r => setTimeout(r, 500));

            setCompletedSteps([true, true, true, true]);
            setAutomationProgress(100);
            setCurrentStep(3);

            const leadCount = persistedLeads.length;
            toast.success(`${leadCount} lead bulundu ve kaydedildi!`);

            // Search history'yi localStorage'a kaydet
            try {
                const historyKey = 'search_history';
                const existing = JSON.parse(localStorage.getItem(historyKey) || '[]');
                const entry = {
                    city: config.city,
                    district: config.district || '',
                    sector: config.sector,
                    limit: config.limit,
                    resultCount: leadCount,
                    timestamp: new Date().toISOString(),
                };
                const updated = [entry, ...existing].slice(0, 10); // Son 10 arama
                localStorage.setItem(historyKey, JSON.stringify(updated));
            } catch (_) {}

            await addNotification(
                'success',
                'Arama Tamamlandı',
                `${config.sector} sektöründe ${config.city} bölgesinde ${leadCount} yeni lead bulundu.`
            );
        } catch (error) {
            console.error("Search failed:", error);
            const errorMsg = error instanceof Error ? error.message : "Bilinmeyen hata";
            toast.error("Lead araması başarısız oldu: " + errorMsg);

            await addNotification(
                'error',
                'Arama Hatası',
                `${config.sector} araması sırasında hata oluştu: ${errorMsg}`
            );
        } finally {
            setIsSearching(false);
        }
    };

    const updateLeadStatus = async (id: string, status: string) => {
        const { error } = await supabase
            .from('leads')
            .update({ status })
            .eq('id', id);

        if (error) {
            console.error('Error updating lead:', error);
            return;
        }

        setLeads(prev => prev.map(l => l.id === id ? { ...l, status: status as Lead['status'] } : l));
    };

    const deleteLead = async (id: string) => {
        const { error } = await supabase
            .from('leads')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting lead:', error);
            toast.error('Lead silinemedi');
            return;
        }

        setLeads(prev => prev.filter(l => l.id !== id));
        toast.success('Lead silindi');
    };

    const toggleLeadSelection = (id: string) => {
        setSelectedLeads(prev => {
            const newSelected = new Set(prev);
            if (newSelected.has(id)) {
                newSelected.delete(id);
            } else {
                newSelected.add(id);
            }
            return newSelected;
        });
    };

    const updateLeadPriority = async (id: string, priority: Lead['priority']) => {
        setLeads(prev => prev.map(lead =>
            lead.id === id ? { ...lead, priority } : lead
        ));

        const priorityLabels = {
            hot: '🔥 Sıcak',
            warm: '🌡️ Ilık',
            cold: '❄️ Soğuk'
        };

        if (priority) {
            toast.success(`Lead ${priorityLabels[priority]} olarak işaretlendi`);
        } else {
            toast.info('Öncelik kaldırıldı');
        }

        if (!id.startsWith('test-')) {
            try {
                await supabase
                    .from('leads')
                    .update({ priority })
                    .eq('id', id);
            } catch (error) {
                console.error('Priority update failed:', error);
            }
        }
    };

    const selectAllLeads = () => {
        setLeads(prev => {
            setSelectedLeads(new Set(prev.map(l => l.id)));
            return prev;
        });
    };

    const clearSelection = () => {
        setSelectedLeads(new Set());
    };

    const generateMessage = (id: string) => {
        console.log('Generating message for', id);
    };

    const generateMessagesForSelected = () => {
        setIsProcessing(true);
        setTimeout(() => setIsProcessing(false), 1000);
    };

    const analyzeSelected = () => {
        setIsProcessing(true);
        setTimeout(() => setIsProcessing(false), 1000);
    };

    const bulkSend = async () => {
        setIsProcessing(true);
        const selectedIds = Array.from(selectedLeads);
        const { error } = await supabase
            .from('leads')
            .update({ status: 'contacted' })
            .in('id', selectedIds);

        if (error) {
            console.error('Error updating leads:', error);
            toast.error('Güncelleme başarısız');
        } else {
            setLeads(prev => prev.map(l => selectedLeads.has(l.id) ? { ...l, status: 'contacted' } : l));
            clearSelection();
            toast.success(`${selectedIds.length} lead güncellendi`);
        }

        setIsProcessing(false);
    };

    // Timer effect for pending searches
    useEffect(() => {
        const checkScheduledSearches = () => {
            const now = new Date();
            let hasExecuted = false;

            setPendingSearches(currentPending => {
                let updatedPending = [...currentPending];
                currentPending.forEach(search => {
                    const scheduledDate = new Date(search.scheduledTime);
                    if (now >= scheduledDate) {
                        console.log(`⏰ Scheduled search triggered: ${search.config.sector} in ${search.config.city}`);

                        addNotification(
                            'automation',
                            'Planlı Arama Başladı',
                            `${search.config.city}/${search.config.district} bölgesinde ${search.config.sector} araması başlatıldı.`
                        );

                        searchLeads(search.config);
                        updatedPending = updatedPending.filter(s => s.id !== search.id);
                        hasExecuted = true;
                    }
                });
                if (updatedPending.length !== currentPending.length) {
                    localStorage.setItem('pendingSearches', JSON.stringify(updatedPending));
                }
                return updatedPending;
            });

            if (hasExecuted) {
                toast.success("Planlanmış arama başlatıldı!");
            }
        };

        checkScheduledSearches();
        const interval = setInterval(checkScheduledSearches, 30000);
        return () => clearInterval(interval);
    }, [addNotification]);

    const scheduleSearch = (config: ScheduleConfig, scheduledTime: Date) => {
        const newPending = {
            id: crypto.randomUUID(),
            config,
            scheduledTime: scheduledTime.toISOString()
        };

        setPendingSearches(prev => {
            const updated = [...prev, newPending];
            localStorage.setItem('pendingSearches', JSON.stringify(updated));
            return updated;
        });

        toast.success(`Arama planlandı: ${scheduledTime.toLocaleString('tr-TR')}`);
    };

    const removeScheduledSearch = (id: string) => {
        setPendingSearches(prev => {
            const updated = prev.filter(s => s.id !== id);
            localStorage.setItem('pendingSearches', JSON.stringify(updated));
            return updated;
        });
    };

    return (
        <LeadContext.Provider value={{
            leads,
            selectedLeads,
            isSearching,
            isProcessing,
            isLoading,
            automationProgress,
            currentStep,
            completedSteps,
            pendingSearches,
            searchLeads,
            scheduleSearch,
            removeScheduledSearch,
            toggleLeadSelection,
            updateLeadPriority,
            selectAllLeads,
            clearSelection,
            generateMessage,
            generateMessagesForSelected,
            analyzeSelected,
            bulkSend,
            updateLeadStatus,
            deleteLead,
            refetch: fetchLeads,
        }}>
            {children}
        </LeadContext.Provider>
    );
};
