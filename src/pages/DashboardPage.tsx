import { useState, useEffect } from "react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { LeadCard } from "@/components/dashboard/LeadCard";
import { SchedulePanel } from "@/components/dashboard/SchedulePanel";

import { AutomationStatus } from "@/components/dashboard/AutomationStatus";
import { LeadDetailPanel } from "@/components/dashboard/LeadDetailPanel";
import { AIMessageDialog } from "@/components/dashboard/AIMessageDialog";
import { AIOfferDialog } from "@/components/dashboard/AIOfferDialog";
import { useLeads } from "@/hooks/useLeads";
import { ScheduleConfig, Lead } from "@/types/lead";
import { Users, Target, Send, TrendingUp, Zap } from "lucide-react";

export const DashboardPage = () => {
    const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
        date: undefined,
        time: "",
        city: "",
        district: "",
        sector: "",
        limit: 30
    });

    const [selectedDetailLead, setSelectedDetailLead] = useState<Lead | null>(null);
    const [whatsAppLead, setWhatsAppLead] = useState<Lead | null>(null);
    const [showAIDialog, setShowAIDialog] = useState(false);

    // AI Offer Dialog State
    const [offerLead, setOfferLead] = useState<Lead | null>(null);
    const [showOfferDialog, setShowOfferDialog] = useState(false);

    const handleAgentStart = async (lead: Lead) => {
        // Instead of immediate start, open Offer Dialog
        setOfferLead(lead);
        setShowOfferDialog(true);
    };

    const {
        leads,
        isSearching,
        automationProgress,
        currentStep,
        completedSteps,
        searchLeads,
        updateLeadPriority,
    } = useLeads();

    const automationSteps = [
        { label: "Tarama Başlatıldı", completed: completedSteps[0] },
        { label: "İşletme Verileri Toplanıyor", completed: completedSteps[1] },
        { label: "İletişim Bilgileri Doğrulanıyor", completed: completedSteps[2] },
        { label: "Sonuçlar Sisteme İşleniyor", completed: completedSteps[3] },
    ];

    const [sentCount, setSentCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [marqueeState, setMarqueeState] = useState<'scrolling' | 'static'>('scrolling');

    // Marquee Cycle Logic
    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (marqueeState === 'scrolling') {
            // Scroll for 20 seconds then switch to static
            timer = setTimeout(() => {
                setMarqueeState('static');
            }, 20000);
        } else {
            // Stay static for 6 seconds then switch back to scrolling
            timer = setTimeout(() => {
                setMarqueeState('scrolling');
            }, 6000);
        }

        return () => clearTimeout(timer);
    }, [marqueeState]);

    useEffect(() => {
        const loadCounts = () => {
            const storedQueue = localStorage.getItem("whatsapp_message_queue");
            if (storedQueue) {
                const queue = JSON.parse(storedQueue) as any[];

                const sent = queue.filter(item => item.status === 'sent').length;
                setSentCount(sent);

                const pending = queue.filter(item => item.status === 'pending' || item.status === 'sending').length;
                setPendingCount(pending);
            }
        };

        loadCounts();
        window.addEventListener('storage', loadCounts);
        return () => window.removeEventListener('storage', loadCounts);
    }, []);

    return (
        <>
            <div className="p-6">


                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatsCard
                        title="Toplam Lead"
                        value={leads.length}
                        change="+12% bu hafta"
                        changeType="positive"
                        icon={Users}
                    />

                    {/* Live Tips / Marquee Card */}
                    <div className="relative group overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
                        {/* Pulse Effect */}
                        <div className="absolute inset-0 bg-[#CCFF00]/5 blur-xl group-hover:bg-[#CCFF00]/10 transition-colors duration-500" />

                        <div className="relative h-full flex flex-col justify-between p-6">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#CCFF00] opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#CCFF00]"></span>
                                    </span>
                                    Sistem Durumu
                                </p>
                                <Zap className="w-5 h-5 text-[#CCFF00]" />
                            </div>

                            <div className="relative h-14 overflow-hidden flex items-center">
                                {marqueeState === 'scrolling' ? (
                                    <div className="animate-marquee whitespace-nowrap text-sm font-medium text-slate-200">
                                        1. Kriterleri belirleyin • 2. Aramayı başlatın • 3. Müşterileri seçin • 4. Otomasyonu başlatın
                                    </div>
                                ) : (
                                    <div className="w-full text-center animate-fade-in text-sm font-bold text-[#CCFF00] leading-tight px-2">
                                        Potansiyel müşterilerinize ulaşmanın en güçlü yolu.
                                    </div>
                                )}
                            </div>

                            <div className="mt-2 text-xs text-slate-500 font-medium">
                                {pendingCount > 0 ? `${pendingCount} mesaj sırada bekliyor` : "Sistem kullanıma hazır"}
                            </div>
                        </div>

                        {/* CSS for Marquee */}
                        <style>{`
                            .animate-marquee {
                                animation: marquee 20s linear infinite;
                            }
                            @keyframes marquee {
                                0% { transform: translateX(100%); }
                                100% { transform: translateX(-150%); }
                            }
                            .animate-fade-in {
                                animation: fadeIn 0.5s ease-out forwards;
                            }
                            @keyframes fadeIn {
                                from { opacity: 0; transform: translateY(5px); }
                                to { opacity: 1; transform: translateY(0); }
                            }
                        `}</style>
                    </div>

                    <StatsCard
                        title="Gönderilen Mesaj"
                        value={sentCount}
                        change="+8% artış"
                        changeType="positive"
                        icon={Send}
                    />
                    <StatsCard
                        title="Dönüşüm Oranı"
                        value="23%"
                        change="+5% bu ay"
                        changeType="positive"
                        icon={TrendingUp}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Schedule & Automation */}
                    <div className="space-y-6">
                        <SchedulePanel
                            config={scheduleConfig}
                            onConfigChange={setScheduleConfig}
                            onStartSearch={() => searchLeads(scheduleConfig)}
                            isSearching={isSearching}
                        />

                        {(isSearching || automationProgress > 0) && (
                            <AutomationStatus
                                progress={automationProgress}
                                currentStep={currentStep}
                                steps={automationSteps}
                            />
                        )}
                    </div>

                    {/* Right Column - Leads */}
                    <div className="lg:col-span-2">
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">Bulunan Leadler</h2>
                                    <p className="text-sm text-muted-foreground">
                                        {leads.length > 0
                                            ? `${leads.length} lead bulundu`
                                            : "Aramaya başlamak için takvimden seçim yapın"
                                        }
                                    </p>
                                </div>
                            </div>

                            {leads.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                                        <Users className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-muted-foreground">
                                        Henüz lead bulunamadı. Sol panelden arama yapın.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto pt-1 pr-2 custom-scrollbar">
                                    {leads.map((lead) => (
                                        <LeadCard
                                            key={lead.id}
                                            lead={lead}
                                            onPriorityChange={updateLeadPriority}
                                            onClick={setSelectedDetailLead}
                                        />
                                    ))}

                                    <div className="pt-6 mt-6 border-t border-border/50">
                                        <button
                                            onClick={() => window.location.href = '/whatsapp'}
                                            className="group relative w-full overflow-hidden rounded-2xl bg-slate-900 p-px shadow-xl shadow-slate-900/10 transition-all hover:shadow-slate-900/20 active:scale-[0.98]"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-[#CCFF00]/20 to-emerald-500/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                                            <div className="relative flex items-center justify-between rounded-2xl bg-slate-950 px-6 py-5 transition-colors group-hover:bg-slate-900/90">
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className="text-lg font-bold text-white flex items-center gap-2">
                                                        <span className="flex h-2 w-2 rounded-full bg-[#CCFF00] shadow-[0_0_8px_rgba(204,255,0,0.6)] animate-pulse" />
                                                        Otomasyonu Başlat
                                                    </span>
                                                    <span className="text-xs font-medium text-slate-400 group-hover:text-slate-300">
                                                        {leads.length} potansiyel müşteriye ulaşılacak
                                                    </span>
                                                </div>

                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#CCFF00] text-slate-900 shadow-[0_0_15px_rgba(204,255,0,0.3)] transition-all group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(204,255,0,0.5)]">
                                                    <Send className="w-5 h-5 ml-0.5" />
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>


            <LeadDetailPanel
                lead={selectedDetailLead}
                onClose={() => setSelectedDetailLead(null)}
                onAgentStart={handleAgentStart}
            />

            <AIMessageDialog
                lead={whatsAppLead}
                open={showAIDialog}
                onOpenChange={setShowAIDialog}
            />

            <AIOfferDialog
                lead={offerLead}
                open={showOfferDialog}
                onOpenChange={setShowOfferDialog}
            />

        </>
    );
};

