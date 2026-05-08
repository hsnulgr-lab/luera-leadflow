import { useState, useEffect, useRef, useCallback } from "react";

import { LeadCard } from "@/components/dashboard/LeadCard";
import { SchedulePanel } from "@/components/dashboard/SchedulePanel";
import { LeadDetailPanel } from "@/components/dashboard/LeadDetailPanel";
import { TodayTasks } from "@/components/dashboard/TodayTasks";
import { AIMessageDialog } from "@/components/dashboard/AIMessageDialog";
import { AIOfferDialog } from "@/components/dashboard/AIOfferDialog";
import { useLeads } from "@/hooks/useLeads";
import { ScheduleConfig, Lead } from "@/types/lead";
import { Users, Target, Send, TrendingUp, CheckCircle2, Loader2, Sparkles, Coffee, Lightbulb, BarChart3, MessageCircle, Zap, History, CalendarClock, Activity, Search, Mail, Globe } from "lucide-react";
import { cn } from "@/utils/cn";
import { useAuth } from "@/contexts/AuthContext";

export const DashboardPage = () => {
    const { user } = useAuth();
    const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>(() => {
        const saved = localStorage.getItem('dashboard_schedule_config');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {}
        }
        return {
            date: undefined,
            time: "",
            city: "",
            district: "",
            sector: "",
            limit: 30,
            phoneType: "her ikisi" as const,
            emailFilter: "hepsi" as const
        };
    });

    useEffect(() => {
        localStorage.setItem('dashboard_schedule_config', JSON.stringify(scheduleConfig));
    }, [scheduleConfig]);

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

    const hasValidEmail = (lead: Lead) =>
        !!(lead.email && lead.email !== 'N/A' && lead.email !== 'n/a' && lead.email.includes('@'));

    const filteredLeads = leads.filter(lead => {
        const ef = scheduleConfig.emailFilter;
        if (ef === 'var')  return hasValidEmail(lead);
        if (ef === 'yok')  return !hasValidEmail(lead);
        return true;
    });

    const [sentCount, setSentCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [slide1, setSlide1] = useState(0);
    const [slide2, setSlide2] = useState(0);
    const [slide3, setSlide3] = useState(0);

    // Elapsed timer for active search
    const searchStartTime = useRef<Date | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    useEffect(() => {
        if (isSearching) {
            if (!searchStartTime.current) searchStartTime.current = new Date();
            const interval = setInterval(() => {
                setElapsedSeconds(Math.floor((Date.now() - searchStartTime.current!.getTime()) / 1000));
            }, 1000);
            return () => clearInterval(interval);
        } else {
            searchStartTime.current = null;
            setElapsedSeconds(0);
        }
    }, [isSearching]);

    // Search history
    const [searchHistory, setSearchHistory] = useState<Array<{
        city: string; district: string; sector: string;
        resultCount: number; timestamp: string;
    }>>([]);

    useEffect(() => {
        const load = () => {
            try {
                const h = JSON.parse(localStorage.getItem('search_history') || '[]');
                setSearchHistory(h);
            } catch (_) {}
        };
        load();
        window.addEventListener('storage', load);
        return () => window.removeEventListener('storage', load);
    }, [leads]); // leads değişince de yenile (arama bitince)

    // Independent timers — different speeds so they don't feel robotic
    useEffect(() => {
        const t1 = setInterval(() => setSlide1(p => p + 1), 12000);  // 12s
        const t2 = setInterval(() => setSlide2(p => p + 1), 16000);  // 16s
        const t3 = setInterval(() => setSlide3(p => p + 1), 20000);  // 20s
        return () => { clearInterval(t1); clearInterval(t2); clearInterval(t3); };
    }, []);


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

                {/* Today's Follow-up Tasks */}
                <TodayTasks onLeadClick={setSelectedDetailLead} />

                {/* Stats Bar */}
                <div className="flex gap-4 mb-6">
                    {/* CARD 1: Greeting + Lead Snapshot — rotating carousel */}
                    {(() => {
                        const hour = new Date().getHours();
                        const greeting = hour < 6 ? 'İyi geceler' : hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';
                        const leadsWithPhone = leads.filter(l => l.phone && l.phone.length > 3).length;
                        const leadsNoPhone = leads.length - leadsWithPhone;
                        const phoneRate = leads.length > 0 ? Math.round((leadsWithPhone / leads.length) * 100) : 0;
                        const leadsWithEmail = leads.filter(l => l.email && l.email !== 'N/A' && l.email.includes('@')).length;
                        const leadsWithWebsite = leads.filter(l => l.website).length;
                        const todayLeads = leads.filter(l => {
                            if (!l.dateAdded) return false;
                            const d = new Date(l.dateAdded);
                            const now = new Date();
                            return d.toDateString() === now.toDateString();
                        }).length;

                        const slides = [
                            {
                                icon: <Coffee className="w-4 h-4 text-[#CCFF00]" />,
                                label: 'LUERA AI',
                                value: <>{greeting}, <span className="capitalize">{user?.name || 'Kullanıcı'}</span> 👋</>,
                                sub: <span className="text-xs text-gray-400">{leads.length > 0 ? `Sizin için ${leads.length} potansiyel müşteri hazırladım.` : 'Yeni fırsatlar bulmak için arama başlatın.'}</span>,
                            },
                            {
                                icon: <Users className="w-4 h-4 text-[#CCFF00]" />,
                                label: 'MÜŞTERİ PORTFÖYÜ',
                                value: <>{leads.length}</>,
                                sub: <><TrendingUp className="w-3 h-3 text-green-500" /><span className="text-xs font-medium text-green-600">{leadsWithPhone} doğrulanmış numara • {leadsNoPhone} eksik</span></>,
                            },
                            {
                                icon: <History className="w-4 h-4 text-[#CCFF00]" />,
                                label: 'SON ARAMALAR',
                                value: <>{searchHistory.length > 0 ? `${searchHistory.length} arama` : '—'}</>,
                                sub: searchHistory.length > 0 ? (
                                    <div className="flex flex-col gap-0.5 mt-0.5">
                                        {searchHistory.slice(0, 2).map((h, i) => (
                                            <div key={i} className="flex items-center gap-1.5">
                                                <Search className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                                                <span className="text-[11px] text-gray-500 truncate capitalize">
                                                    {h.sector} · {h.district || h.city}
                                                    <span className="text-gray-400"> — {h.resultCount} lead</span>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : <span className="text-xs text-gray-400">Henüz arama yapılmadı.</span>,
                            },
                            {
                                icon: <CalendarClock className="w-4 h-4 text-[#CCFF00]" />,
                                label: 'BUGÜNÜN ÖZETİ',
                                value: <>{todayLeads} lead</>,
                                sub: <div className="flex items-center gap-3 mt-0.5">
                                    <span className="flex items-center gap-1 text-[11px] text-gray-500"><Mail className="w-3 h-3 text-blue-400" />{leadsWithEmail} email</span>
                                    <span className="flex items-center gap-1 text-[11px] text-gray-500"><Globe className="w-3 h-3 text-purple-400" />{leadsWithWebsite} site</span>
                                    <span className="flex items-center gap-1 text-[11px] text-gray-500"><Send className="w-3 h-3 text-green-400" />{sentCount} mesaj</span>
                                </div>,
                            },
                        ];
                        const slide = slides[slide1 % slides.length];
                        const searchActive = isSearching || automationProgress > 0;
                        return (
                            <div className="flex-1 min-w-0 group relative rounded-2xl p-5 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                                {!searchActive && (
                                    <div className="absolute top-2.5 right-5 flex gap-1">
                                        {slides.map((_, i) => (
                                            <div key={i} className={cn("w-1.5 h-1.5 rounded-full transition-all duration-300", i === slide1 % slides.length ? "bg-slate-900 w-3" : "bg-gray-300")} />
                                        ))}
                                    </div>
                                )}
                                {searchActive ? (
                                    <div key="card1-search" className="animate-slideUp">
                                        <div className="flex items-center justify-between mb-2.5">
                                            <p className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase">ARAMA AKTİF</p>
                                            <div className="p-2.5 rounded-xl bg-slate-900 shrink-0">
                                                <Search className="w-4 h-4 text-[#CCFF00]" />
                                            </div>
                                        </div>
                                        {/* Location + sector */}
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="text-sm leading-none">📍</span>
                                            <span className="text-sm font-bold text-gray-900 capitalize truncate">
                                                {scheduleConfig.district ? `${scheduleConfig.district} / ${scheduleConfig.city}` : scheduleConfig.city || '—'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 mb-2.5">
                                            <span className="text-sm leading-none">🔍</span>
                                            <span className="text-sm font-semibold text-gray-700 capitalize truncate">{scheduleConfig.sector || '—'}</span>
                                        </div>
                                        {/* Stats mini-cards */}
                                        <div className="grid grid-cols-2 gap-1.5 mb-2">
                                            <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5">
                                                <div className="text-[9px] text-gray-400 font-semibold tracking-wide mb-0.5">HEDEF</div>
                                                <div className="text-sm font-bold text-gray-800">🎯 {scheduleConfig.limit}</div>
                                            </div>
                                            <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5">
                                                <div className="text-[9px] text-gray-400 font-semibold tracking-wide mb-0.5">MEVCUT</div>
                                                <div className="text-sm font-bold text-gray-800">👤 {leads.length}</div>
                                            </div>
                                        </div>
                                        {/* Status badge full width */}
                                        {automationProgress >= 100
                                            ? <div className="text-[11px] text-green-700 font-semibold bg-green-50 border border-green-100 px-2.5 py-1.5 rounded-lg text-center">✅ Tüm veriler başarıyla toplandı</div>
                                            : <div className="text-[11px] text-amber-600 font-medium bg-amber-50 border border-amber-100 px-2.5 py-1.5 rounded-lg text-center animate-pulse">⏳ Taranıyor, lütfen bekleyin...</div>
                                        }
                                    </div>
                                ) : (
                                    <div className="relative h-[100px]">
                                        <div key={slide1} className="absolute inset-0 animate-slideUp">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase truncate pr-3">{slide.label}</p>
                                                <div className="p-2 rounded-xl bg-slate-900 shrink-0">{slide.icon}</div>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 tracking-tight truncate">{slide.value}</h3>
                                            <div className="mt-1 flex items-start gap-1.5 line-clamp-2 leading-snug break-words whitespace-normal">{slide.sub}</div>
                                        </div>
                                    </div>
                                )}
                                <style>{`
                                    @keyframes slideUp { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: translateY(0); } }
                                    .animate-slideUp { animation: slideUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
                                `}</style>
                            </div>
                        );
                    })()}

                    {/* Aktif Tarama — enhanced with radar sweep, elapsed timer, city/sector badges, node steps */}
                    <div
                        className="group relative rounded-2xl bg-slate-900 border border-slate-800 shadow-sm overflow-hidden min-w-0 transition-all duration-[2000ms] ease-out"
                        style={{ flex: (isSearching || automationProgress > 0) ? 2 : 1 }}
                    >
                        {/* Floating blobs */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute w-32 h-32 rounded-full bg-[#CCFF00]/15 blur-2xl animate-float1" />
                            <div className="absolute w-20 h-20 rounded-full bg-[#CCFF00]/12 blur-xl animate-float2" />
                            <div className="absolute w-16 h-16 rounded-full bg-cyan-400/10 blur-2xl animate-float3" />
                        </div>

                        {/* Grid dots */}
                        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                            style={{ backgroundImage: 'radial-gradient(circle, #CCFF00 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                        />

                        {/* RADAR SWEEP — only during search */}
                        {isSearching && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-end overflow-hidden">
                                <div className="absolute w-[380px] h-[380px] rounded-full animate-radar-spin opacity-60"
                                    style={{ background: 'conic-gradient(from 0deg, transparent 70%, rgba(204,255,0,0.18) 100%)' }}
                                />
                                <div className="absolute w-28 h-28 rounded-full border border-[#CCFF00]/15 animate-ring1" />
                                <div className="absolute w-52 h-52 rounded-full border border-[#CCFF00]/08 animate-ring2" />
                            </div>
                        )}

                        {/* Scanning glow */}
                        <div className={cn(
                            "absolute inset-0 bg-gradient-to-r from-[#CCFF00]/0 via-[#CCFF00]/5 to-[#CCFF00]/0 transition-opacity duration-700",
                            isSearching ? "opacity-100 animate-pulse" : "opacity-0"
                        )} />

                        <div className="relative p-5">
                            {/* Header row */}
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className={cn(
                                            "absolute inline-flex h-full w-full rounded-full bg-[#CCFF00] opacity-75",
                                            isSearching ? "animate-ping" : ""
                                        )} />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#CCFF00]" />
                                    </span>
                                    Aktif Tarama
                                    {/* Elapsed timer */}
                                    {isSearching && elapsedSeconds > 0 && (
                                        <span className="font-mono text-[#CCFF00]/50 text-[11px] tracking-widest">
                                            {String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:{String(elapsedSeconds % 60).padStart(2, '0')}
                                        </span>
                                    )}
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "text-lg font-bold tabular-nums transition-all duration-500",
                                        (isSearching || automationProgress > 0) ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2",
                                        automationProgress >= 100 ? "text-[#CCFF00]" : "text-white"
                                    )}>
                                        {automationProgress}%
                                    </span>
                                    <div className={cn(
                                        "p-2.5 rounded-xl transition-all duration-300",
                                        isSearching ? "bg-[#CCFF00]/20" : "bg-[#CCFF00]/10"
                                    )}>
                                        {isSearching ? (
                                            <Loader2 className="w-4 h-4 text-[#CCFF00] animate-spin" />
                                        ) : automationProgress >= 100 ? (
                                            <CheckCircle2 className="w-4 h-4 text-[#CCFF00]" />
                                        ) : (
                                            <Target className="w-4 h-4 text-[#CCFF00]" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Main status + context badges */}
                            <h3 className="text-3xl font-bold text-white tracking-tight transition-all duration-300">
                                {automationProgress >= 100 ? "Tamamlandı" : isSearching ? "Taranıyor" : "Hazır"}
                            </h3>

                            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                                {isSearching ? (
                                    <>
                                        <span className="text-xs font-medium text-[#CCFF00]/60">
                                            {automationSteps[currentStep]?.label || "İşlem devam ediyor..."}
                                        </span>
                                        {scheduleConfig.city && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#CCFF00]/10 text-[#CCFF00]/70 font-medium capitalize">
                                                📍 {scheduleConfig.district || scheduleConfig.city}
                                            </span>
                                        )}
                                        {scheduleConfig.sector && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 font-medium capitalize border border-slate-700">
                                                {scheduleConfig.sector}
                                            </span>
                                        )}
                                    </>
                                ) : automationProgress >= 100 ? (
                                    <span className="text-xs font-medium text-[#CCFF00]/60">Tüm veriler başarıyla toplandı</span>
                                ) : (
                                    <span className="text-xs font-medium text-slate-400">
                                        {pendingCount > 0 ? `${pendingCount} mesaj sırada` : "Sistem kullanıma hazır"}
                                    </span>
                                )}
                            </div>

                            {/* Progress section — smooth slide-in */}
                            <div
                                className="overflow-hidden transition-all duration-700 ease-out"
                                style={{
                                    maxHeight: (isSearching || automationProgress > 0) ? '160px' : '0px',
                                    opacity: (isSearching || automationProgress > 0) ? 1 : 0,
                                }}
                            >
                                <div className="mt-4">
                                    {/* Progress bar — slightly thicker */}
                                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#CCFF00] rounded-full transition-all duration-700 ease-out relative"
                                            style={{ width: `${automationProgress}%` }}
                                        >
                                            {isSearching && (
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Enhanced step nodes with connecting lines */}
                                    <div className="flex items-start mt-4">
                                        {automationSteps.map((step, i) => (
                                            <div key={i} className="flex flex-col items-center flex-1">
                                                <div className="flex items-center w-full">
                                                    {/* Left line */}
                                                    <div className={cn(
                                                        "flex-1 h-px transition-all duration-700",
                                                        i === 0 ? "invisible" :
                                                        completedSteps[i] ? "bg-[#CCFF00]/50" :
                                                        i <= currentStep && isSearching ? "bg-[#CCFF00]/30" : "bg-slate-700"
                                                    )} />
                                                    {/* Node */}
                                                    <div className={cn(
                                                        "relative w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-500 shrink-0",
                                                        step.completed
                                                            ? "bg-[#CCFF00] border-[#CCFF00] shadow-[0_0_10px_rgba(204,255,0,0.55)]"
                                                            : i === currentStep && isSearching
                                                            ? "bg-transparent border-[#CCFF00] shadow-[0_0_14px_rgba(204,255,0,0.4)]"
                                                            : "bg-transparent border-slate-700"
                                                    )}>
                                                        {step.completed ? (
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-900" />
                                                        ) : i === currentStep && isSearching ? (
                                                            <>
                                                                <div className="w-2 h-2 bg-[#CCFF00] rounded-full" />
                                                                <div className="absolute inset-[-3px] rounded-full border-2 border-[#CCFF00]/35 animate-ping" />
                                                            </>
                                                        ) : (
                                                            <span className="text-[9px] font-bold text-slate-500">{i + 1}</span>
                                                        )}
                                                    </div>
                                                    {/* Right line */}
                                                    <div className={cn(
                                                        "flex-1 h-px transition-all duration-700",
                                                        i === automationSteps.length - 1 ? "invisible" :
                                                        step.completed ? "bg-[#CCFF00]/50" : "bg-slate-700"
                                                    )} />
                                                </div>
                                                {/* Label below node */}
                                                <span className={cn(
                                                    "text-[9px] font-medium text-center mt-1.5 leading-tight px-0.5",
                                                    step.completed ? "text-[#CCFF00]/75"
                                                    : i === currentStep && isSearching ? "text-white"
                                                    : "text-slate-600"
                                                )}>
                                                    {step.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Keyframes */}
                        <style>{`
                            @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
                            .animate-shimmer { animation: shimmer 1.5s infinite; }
                            @keyframes float1 { 0%,100% { top: 10%; left: 5%; } 50% { top: 60%; left: 70%; } }
                            .animate-float1 { animation: float1 12s ease-in-out infinite; }
                            @keyframes float2 { 0%,100% { top: 70%; right: 10%; } 50% { top: 15%; right: 60%; } }
                            .animate-float2 { animation: float2 15s ease-in-out infinite; }
                            @keyframes float3 { 0%,100% { bottom: 20%; left: 40%; } 50% { bottom: 60%; left: 10%; } }
                            .animate-float3 { animation: float3 18s ease-in-out infinite; }
                            @keyframes radar-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                            .animate-radar-spin { animation: radar-spin 2.5s linear infinite; }
                            @keyframes ring1 { 0%,100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.6); opacity: 0; } }
                            .animate-ring1 { animation: ring1 2s ease-in-out infinite; }
                            @keyframes ring2 { 0%,100% { transform: scale(1); opacity: 0.3; } 50% { transform: scale(1.4); opacity: 0; } }
                            .animate-ring2 { animation: ring2 2.8s ease-in-out infinite 0.4s; }
                        `}</style>
                    </div>

                    {/* CARD 2: Messaging Stats — rotating carousel */}
                    {(() => {
                        const totalMessages = sentCount + pendingCount;
                        // Aktivite akışı — localStorage'dan son 3 olay
                        const recentActivity: Array<{icon: React.ReactNode; text: string; time: string}> = [];
                        if (searchHistory.length > 0) {
                            const last = searchHistory[0];
                            const mins = Math.round((Date.now() - new Date(last.timestamp).getTime()) / 60000);
                            const timeStr = mins < 60 ? `${mins}dk önce` : `${Math.round(mins/60)}sa önce`;
                            recentActivity.push({ icon: <Search className="w-2.5 h-2.5 text-blue-400" />, text: `${last.sector} · ${last.district || last.city} — ${last.resultCount} lead`, time: timeStr });
                        }
                        if (sentCount > 0) recentActivity.push({ icon: <Send className="w-2.5 h-2.5 text-green-400" />, text: `${sentCount} WhatsApp mesajı gönderildi`, time: 'bugün' });
                        if (leads.length > 0) recentActivity.push({ icon: <Users className="w-2.5 h-2.5 text-purple-400" />, text: `Toplam ${leads.length} lead portföyde`, time: '' });

                        const msgSlides = [
                            {
                                icon: <Send className="w-4 h-4 text-[#CCFF00]" />,
                                label: 'İLETİŞİM RAPORU',
                                value: <>{sentCount}</>,
                                sub: sentCount > 0
                                    ? <><CheckCircle2 className="w-3 h-3 text-green-500" /><span className="text-xs font-medium text-green-600">{sentCount} işletmeye başarıyla ulaşıldı.</span></>
                                    : <span className="text-xs font-medium text-gray-400">Henüz bir mesajlaşma başlatılmadı.</span>,
                            },
                            {
                                icon: <Activity className="w-4 h-4 text-[#CCFF00]" />,
                                label: 'AKTİVİTE AKIŞI',
                                value: <>{recentActivity.length > 0 ? 'Son Olaylar' : '—'}</>,
                                sub: recentActivity.length > 0 ? (
                                    <div className="flex flex-col gap-0.5">
                                        {recentActivity.slice(0, 2).map((a, i) => (
                                            <div key={i} className="flex items-center gap-1.5">
                                                {a.icon}
                                                <span className="text-[11px] text-gray-500 truncate">{a.text}</span>
                                                {a.time && <span className="text-[10px] text-gray-400 ml-auto shrink-0">{a.time}</span>}
                                            </div>
                                        ))}
                                    </div>
                                ) : <span className="text-xs text-gray-400">Henüz aktivite yok.</span>,
                            },
                            {
                                icon: <MessageCircle className="w-4 h-4 text-[#CCFF00]" />,
                                label: 'BEKLEYEN İŞLEMLER',
                                value: <>{pendingCount > 0 ? pendingCount : '—'}</>,
                                sub: pendingCount > 0
                                    ? <><Zap className="w-3 h-3 text-amber-500" /><span className="text-xs font-medium text-amber-600">Sırada {pendingCount} mesaj gönderilmeyi bekliyor.</span></>
                                    : <span className="text-xs text-gray-400">Şu anda kuyruk boş, yeni mesajlar oluşturabilirsiniz.</span>,
                            },
                            {
                                icon: <Zap className="w-4 h-4 text-[#CCFF00]" />,
                                label: 'HAREKET ÖZETİ',
                                value: <>{totalMessages}</>,
                                sub: <><BarChart3 className="w-3 h-3 text-blue-500" /><span className="text-xs font-medium text-blue-600">{sentCount} teslim edildi • {pendingCount} işleniyor</span></>,
                            },
                        ];
                        const idx = slide2 % msgSlides.length;
                        const slide = msgSlides[idx];
                        const searchActive2 = isSearching || automationProgress > 0;
                        // Live data for search mode
                        const liveEmail = leads.filter(l => l.email && l.email !== 'N/A' && l.email.includes('@')).length;
                        const liveWebsite = leads.filter(l => l.website).length;
                        const livePhone = leads.filter(l => l.phone && l.phone.length > 3).length;
                        const liveFull = leads.filter(l => l.phone && l.email && l.email !== 'N/A' && l.email.includes('@')).length;
                        const liveQuality = leads.length > 0 ? Math.round((liveFull / leads.length) * 100) : 0;
                        return (
                            <div className="flex-1 min-w-0 group relative rounded-2xl p-5 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                                {!searchActive2 && (
                                    <div className="absolute top-2.5 right-5 flex gap-1">
                                        {msgSlides.map((_, i) => (
                                            <div key={i} className={cn("w-1.5 h-1.5 rounded-full transition-all duration-300", i === idx ? "bg-slate-900 w-3" : "bg-gray-300")} />
                                        ))}
                                    </div>
                                )}
                                {searchActive2 ? (
                                    <div key="card2-search" className="animate-slideUp">
                                        <div className="flex items-center justify-between mb-2.5">
                                            <p className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase">CANLI VERİ</p>
                                            <div className="p-2.5 rounded-xl bg-slate-900 shrink-0">
                                                <Activity className="w-4 h-4 text-[#CCFF00]" />
                                            </div>
                                        </div>
                                        {/* 2x2 colored mini-cards */}
                                        <div className="grid grid-cols-2 gap-1.5 mb-2">
                                            <div className="rounded-lg bg-blue-50 border border-blue-100 px-2.5 py-1.5">
                                                <div className="text-[9px] text-blue-400 font-semibold tracking-wide mb-0.5">EMAIL</div>
                                                <div className="text-sm font-bold text-blue-700">📧 {liveEmail}</div>
                                            </div>
                                            <div className="rounded-lg bg-purple-50 border border-purple-100 px-2.5 py-1.5">
                                                <div className="text-[9px] text-purple-400 font-semibold tracking-wide mb-0.5">WEBSİTE</div>
                                                <div className="text-sm font-bold text-purple-700">🌐 {liveWebsite}</div>
                                            </div>
                                            <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5">
                                                <div className="text-[9px] text-gray-400 font-semibold tracking-wide mb-0.5">TELEFON</div>
                                                <div className="text-sm font-bold text-gray-700">📱 {livePhone}</div>
                                            </div>
                                            <div className="rounded-lg bg-green-50 border border-green-100 px-2.5 py-1.5">
                                                <div className="text-[9px] text-green-500 font-semibold tracking-wide mb-0.5">TAM VERİ</div>
                                                <div className="text-sm font-bold text-green-700">⭐ {liveFull}</div>
                                            </div>
                                        </div>
                                        {/* Quality bar */}
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-[#CCFF00] rounded-full transition-all duration-700" style={{width: `${liveQuality}%`}} />
                                            </div>
                                            <span className="text-[11px] font-bold text-gray-600 shrink-0">%{liveQuality} kalite</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative h-[100px]">
                                        <div key={slide2} className="absolute inset-0 animate-slideUp">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase truncate pr-3">{slide.label}</p>
                                                <div className="p-2 rounded-xl bg-slate-900 shrink-0">{slide.icon}</div>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 tracking-tight truncate">{slide.value}</h3>
                                            <div className="mt-1 flex items-start gap-1.5 line-clamp-2 leading-snug break-words whitespace-normal">{slide.sub}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* CARD 3: Performance Stats — rotating carousel, hides during automation */}
                    {(() => {
                        const convRate = leads.length > 0 ? Math.round((sentCount / leads.length) * 100) : 0;
                        const efficiency = leads.length > 0 ? Math.round((sentCount / leads.length) * 100) : 0;
                        // Lead kalite skoru
                        const leadsWithEmailQ = leads.filter(l => l.email && l.email !== 'N/A' && l.email.includes('@')).length;
                        const leadsWithWebsiteQ = leads.filter(l => l.website).length;
                        const highQuality = leads.filter(l => l.phone && l.email && l.email !== 'N/A' && l.email.includes('@')).length;
                        const qualityRate = leads.length > 0 ? Math.round((highQuality / leads.length) * 100) : 0;

                        // Pipeline
                        const newLeads = leads.filter(l => !l.status || l.status === 'new').length;
                        const contacted = leads.filter(l => l.status === 'contacted').length;
                        const interested = leads.filter(l => l.status === 'interested').length;
                        const closed = leads.filter(l => l.status === 'closed').length;

                        const convSlides = [
                            {
                                icon: <TrendingUp className="w-4 h-4 text-[#CCFF00]" />,
                                label: 'AĞ GENİŞLETMESİ',
                                value: <>%{convRate}</>,
                                sub: convRate > 50
                                    ? <><CheckCircle2 className="w-3 h-3 text-green-500" /><span className="text-xs font-medium text-green-600">Hedef kitleye hızla ulaşıyoruz!</span></>
                                    : <><TrendingUp className="w-3 h-3 text-amber-500" /><span className="text-xs font-medium text-amber-600">{leads.length - sentCount} yeni temas noktamız var.</span></>,
                            },
                            {
                                icon: <Sparkles className="w-4 h-4 text-[#CCFF00]" />,
                                label: 'LEAD KALİTESİ',
                                value: <>%{qualityRate}</>,
                                sub: <div className="flex items-center gap-3 mt-0.5">
                                    <span className="flex items-center gap-1 text-[11px] text-gray-500"><Mail className="w-3 h-3 text-blue-400" />{leadsWithEmailQ} email</span>
                                    <span className="flex items-center gap-1 text-[11px] text-gray-500"><Globe className="w-3 h-3 text-purple-400" />{leadsWithWebsiteQ} site</span>
                                    <span className="flex items-center gap-1 text-[11px] text-green-600 font-medium"><CheckCircle2 className="w-3 h-3" />{highQuality} tam</span>
                                </div>,
                            },
                            {
                                icon: <BarChart3 className="w-4 h-4 text-[#CCFF00]" />,
                                label: 'SATIŞ HUNİSİ',
                                value: <>{leads.length > 0 ? `${newLeads} aktif` : '—'}</>,
                                sub: leads.length > 0 ? (
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">{newLeads} yeni</span>
                                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600">{contacted} ulaşıldı</span>
                                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-green-50 text-green-600">{interested} ilgili</span>
                                        {closed > 0 && <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{closed} kapandı</span>}
                                    </div>
                                ) : <span className="text-xs text-gray-400">Lead arayarak huniyi doldurun.</span>,
                            },
                            {
                                icon: <Target className="w-4 h-4 text-[#CCFF00]" />,
                                label: 'ERİŞİM ORANI',
                                value: <>%{efficiency}</>,
                                sub: <><Target className="w-3 h-3 text-blue-500" /><span className="text-xs font-medium text-blue-600">{leads.length} fırsattan {sentCount} tanesiyle temasa geçildi.</span></>,
                            },
                        ];
                        const idx = slide3 % convSlides.length;
                        const slide = convSlides[idx];
                        return (
                            <div
                                className="group relative rounded-2xl p-5 bg-white border border-gray-100 shadow-sm hover:shadow-md min-w-0 overflow-hidden transition-all duration-[2000ms] ease-out"
                                style={{
                                    flex: (isSearching || automationProgress > 0) ? 0 : 1,
                                    opacity: (isSearching || automationProgress > 0) ? 0 : 1,
                                    padding: (isSearching || automationProgress > 0) ? 0 : undefined,
                                }}
                            >
                                <div className="absolute top-2.5 right-5 flex gap-1">
                                    {convSlides.map((_, i) => (
                                        <div key={i} className={cn("w-1.5 h-1.5 rounded-full transition-all duration-300", i === idx ? "bg-slate-900 w-3" : "bg-gray-300")} />
                                    ))}
                                </div>
                                <div className="relative h-[100px]">
                                    <div key={slide3} className="absolute inset-0 animate-slideUp">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase truncate pr-3">{slide.label}</p>
                                            <div className="p-2 rounded-xl bg-slate-900 shrink-0">{slide.icon}</div>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 tracking-tight truncate">{slide.value}</h3>
                                        <div className="mt-1 flex items-start gap-1.5 line-clamp-2 leading-snug break-words whitespace-normal">{slide.sub}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
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


                    </div>

                    {/* Right Column - Leads */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm">
                            <div className="px-6 py-5 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            Bulunan Leadler
                                            {leads.length > 0 && (
                                                <span className="px-2 py-0.5 bg-slate-900 text-[#CCFF00] rounded-md text-xs font-bold">
                                                    {leads.length}
                                                </span>
                                            )}
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-0.5">
                                            {leads.length > 0
                                                ? `${leads.length} potansiyel müşteri bulundu`
                                                : "Aramaya başlamak için sol panelden arama yapın"
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4">
                                {leads.length === 0 ? (
                                    <div className="text-center py-16">
                                        <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gray-50 flex items-center justify-center">
                                            <Users className="w-7 h-7 text-gray-300" />
                                        </div>
                                        <p className="text-sm text-gray-400">
                                            Henüz lead bulunamadı. Sol panelden arama yapın.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5 max-h-[calc(100vh-400px)] overflow-y-auto pr-1 custom-scrollbar">
                                        {filteredLeads.map((lead) => (
                                            <LeadCard
                                                key={lead.id}
                                                lead={lead}
                                                onPriorityChange={updateLeadPriority}
                                                onClick={setSelectedDetailLead}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>


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

