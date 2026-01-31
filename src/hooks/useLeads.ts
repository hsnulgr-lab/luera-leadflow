import { useState, useEffect, useCallback } from 'react';
import { Lead, ScheduleConfig } from '@/types/lead';
import { n8nService } from '@/services/n8nService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';

export const useLeads = () => {
    const { user } = useAuth();
    const { addNotification } = useNotifications();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
    const [isSearching, setIsSearching] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [automationProgress, setAutomationProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState([false, false, false, false]);

    // Fetch leads from Supabase on mount
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
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching leads:', error);
                toast.error('Lead\'ler yüklenemedi');
                return;
            }

            // Map Supabase data to Lead type
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

            // Force add Test Lead for User Request
            const testLead: Lead = {
                id: 'test-funi-loop',
                name: 'Funi Loop',
                company: 'Hobi Ürünleri',
                email: 'test@funiloop.com',
                phone: '905426026048',
                website: 'https://funiloop.com',
                status: 'new',
                dateAdded: new Date().toISOString(),
                score: 100
            };

            // Add to beginning of list
            mappedLeads.unshift(testLead);

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

    // Save leads to Supabase
    const saveLeadsToSupabase = async (newLeads: Lead[]) => {
        if (!user) return;

        try {
            const leadsToInsert = newLeads.map(lead => ({
                name: lead.name,
                company: lead.company || null,
                phone: lead.phone,
                email: lead.email || null,
                website: lead.website || null,
                status: 'new',
                score: lead.score || null,
            }));

            const { data, error } = await supabase
                .from('leads')
                .insert(leadsToInsert)
                .select();

            if (error) {
                console.error('Error saving leads:', error.message, error.details, error.hint);
                toast.error('Lead\'ler kaydedilemedi: ' + error.message);
            } else {
                console.log('Leads saved successfully:', data);
            }
        } catch (err) {
            console.error('Exception saving leads:', err);
            toast.error('Lead kaydetme hatası');
        }
    };

    const searchLeads = async (config: ScheduleConfig) => {
        setIsSearching(true);
        setAutomationProgress(0);
        setCompletedSteps([false, false, false, false]);
        setCurrentStep(0);

        try {
            // Step 1: Start Search
            setAutomationProgress(20);
            const newLeads = await n8nService.searchLeads(config);

            // Save to Supabase
            await saveLeadsToSupabase(newLeads);

            // Update local state
            setLeads(prev => [...newLeads, ...prev]);

            // Step 2-4: Simulate completion of other steps for visual feedback
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

            const leadCount = newLeads.length;
            toast.success(`${leadCount} lead bulundu ve kaydedildi!`);

            await addNotification(
                'success',
                'Arama Tamamlandı',
                `${config.sektor} sektöründe ${config.city} bölgesinde ${leadCount} yeni lead bulundu.`
            );
        } catch (error) {
            console.error("Search failed:", error);
            const errorMsg = error instanceof Error ? error.message : "Bilinmeyen hata";
            toast.error("Lead araması başarısız oldu: " + errorMsg);

            await addNotification(
                'error',
                'Arama Hatası',
                `${config.sektor} araması sırasında hata oluştu: ${errorMsg}`
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

        setLeads(leads.map(l => l.id === id ? { ...l, status: status as Lead['status'] } : l));
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

        setLeads(leads.filter(l => l.id !== id));
        toast.success('Lead silindi');
    };

    const toggleLeadSelection = (id: string) => {
        const newSelected = new Set(selectedLeads);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedLeads(newSelected);
    };

    const updateLeadPriority = async (id: string, priority: Lead['priority']) => {
        // Update local state immediately for responsiveness
        setLeads(leads.map(lead =>
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

        // Persist to Supabase (skip for test leads)
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
        setSelectedLeads(new Set(leads.map(l => l.id)));
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

        // Update status in Supabase for selected leads
        const selectedIds = Array.from(selectedLeads);
        const { error } = await supabase
            .from('leads')
            .update({ status: 'contacted' })
            .in('id', selectedIds);

        if (error) {
            console.error('Error updating leads:', error);
            toast.error('Güncelleme başarısız');
        } else {
            setLeads(leads.map(l => selectedLeads.has(l.id) ? { ...l, status: 'contacted' } : l));
            clearSelection();
            toast.success(`${selectedIds.length} lead güncellendi`);
        }

        setIsProcessing(false);
    };

    const [pendingSearches, setPendingSearches] = useState<{ id: string, config: ScheduleConfig, scheduledTime: string }[]>([]);

    // Load pending searches from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('pendingSearches');
        if (saved) {
            setPendingSearches(JSON.parse(saved));
        }
    }, []);

    // Timer effect - check every 30 seconds for due searches
    useEffect(() => {
        const checkScheduledSearches = () => {
            const now = new Date();
            let hasExecuted = false;

            pendingSearches.forEach(search => {
                const scheduledDate = new Date(search.scheduledTime);
                if (now >= scheduledDate) {
                    console.log(`⏰ Scheduled search triggered: ${search.config.sector} in ${search.config.city}`);

                    addNotification(
                        'automation',
                        'Planlı Arama Başladı',
                        `${search.config.city}/${search.config.district} bölgesinde ${search.config.sector} araması başlatıldı.`
                    );

                    searchLeads(search.config);
                    removeScheduledSearch(search.id);
                    hasExecuted = true;
                }
            });

            if (hasExecuted) {
                toast.success("Planlanmış arama başlatıldı!");
            }
        };

        checkScheduledSearches();
        const interval = setInterval(checkScheduledSearches, 30000);
        return () => clearInterval(interval);
    }, [pendingSearches]);

    const scheduleSearch = (config: ScheduleConfig, scheduledTime: Date) => {
        const newPending = {
            id: crypto.randomUUID(),
            config,
            scheduledTime: scheduledTime.toISOString()
        };

        const updated = [...pendingSearches, newPending];
        setPendingSearches(updated);
        localStorage.setItem('pendingSearches', JSON.stringify(updated));

        toast.success(`Arama planlandı: ${scheduledTime.toLocaleString('tr-TR')}`);
    };

    const removeScheduledSearch = (id: string) => {
        const updated = pendingSearches.filter(s => s.id !== id);
        setPendingSearches(updated);
        localStorage.setItem('pendingSearches', JSON.stringify(updated));
    };

    return {
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
    };
};
