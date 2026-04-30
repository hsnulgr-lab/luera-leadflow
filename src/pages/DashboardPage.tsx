import { useState, useEffect, useRef, useCallback } from "react";

import { LeadCard } from "@/components/dashboard/LeadCard";
import { SchedulePanel } from "@/components/dashboard/SchedulePanel";
import { LeadDetailPanel } from "@/components/dashboard/LeadDetailPanel";
import { AIMessageDialog } from "@/components/dashboard/AIMessageDialog";
import { AIOfferDialog } from "@/components/dashboard/AIOfferDialog";
import { useLeads } from "@/hooks/useLeads";
import { ScheduleConfig, Lead } from "@/types/lead";
import { Users, Target, Send, TrendingUp, CheckCircle2, Loader2, Sparkles, Coffee, Lightbulb, BarChart3, MessageCircle, Zap } from "lucide-react";
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


                {/* Stats Bar */}
                <div className="flex gap-4 mb-6">
                    {/* CARD 1: Greeting + Lead Snapshot — rotating carousel */}
                    {(() => {
                        const hour = new Date().getHours();
                        const greeting = hour < 6 ? 'İyi geceler' : hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';
                        const leadsWithPhone = leads.filter(l => l.phone && l.phone.length > 3).length;
                        const leadsNoPhone = leads.length - leadsWithPhone;
                        const phoneRate = leads.length > 0 ? Math.round((leadsWithPhone / leads.length) * 100) : 0;
                        const slides = [
                            {
                                icon: <Coffee className="w-4 h-4 text-[#CCFF00]" />,
                                label: 'LUERA AI',
                                value: <span className="text-xl">{greeting}, <span className="capitalize">{user?.name || 'Kullanıcı'}</span> 👋</span>,
                                sub: <span className="text-xs text-gray-400">{leads.length > 0 ? `Sizin için ${leads.length} potansiyel müşteri hazırladım.` : 'Yeni fırsatlar bulmak için arama başlatın.'}</span>,
                            },
                            {
                                icon: <Users className="w-4 h-4 text-[#CCFF00]" />,
                                label: 'MÜŞTERİ PORTFÖYÜ',
                                value: <>{leads.length}</>,
                                sub: <><TrendingUp className="w-3 h-3 text-green-500" /><span className="text-xs font-medium text-green-600">{leadsWithPhone} doğrulanmış numara • {leadsNoPhone} eksik</span></>,
                            },
                            {
                                icon: <Target className="w-4 h-4 text-[#CCFF00]" />,
                                label: 'İLETİŞİM GÜCÜ',
                                value: <span className="text-2xl">%{phoneRate}</span>,
                                sub: <span className="text-xs text-gray-400">Portföyünüzün %{phoneRate}'i WhatsApp gönderimine uygun.</span>,
                            },
                            {
                                icon: <Lightbulb className="w-4 h-4 text-[#CCFF00]" />,
                                label: 'YAPAY ZEKA',
                                value: <span className="text-xl">{pendingCount > 0 ? "Aksiyon Gerekli" : sentCount > 0 ? "Görev Tamamlandı" : "Asistan Beklemede"}</span>,
                                sub: <><Sparkles className="w-3 h-3 text-purple-500 shrink-0 mt-0.5" /><span className="text-xs font-medium text-purple-600 line-clamp-2">{pendingCount > 0 ? `${pendingCount} adet taslak oluşturuldu, gönderim onayı bekliyor.` : sentCount > 0 ? 'Hedef kilitlendi. Ağınızı büyütmek için yeni bir tarama başlatın.' : 'Asistanınız yeni hedef belirlemenizi bekliyor.'}</span></>,
                            },
                        ];
                        const slide = slides[slide1 % slides.length];
                        return (
                            <div className="flex-1 min-w-0 group relative rounded-2xl p-5 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                                <div className="absolute top-2.5 right-5 flex gap-1">
                                    {slides.map((_, i) => (
                                        <div key={i} className={cn("w-1.5 h-1.5 rounded-full transition-all duration-300", i === slide1 % slides.length ? "bg-slate-900 w-3" : "bg-gray-300")} />
                                    ))}
                                </div>
                                <div className="relative h-[110px]">
                                    <div key={slide1} className="absolute inset-0 animate-slideUp">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase truncate pr-4">{slide.label}</p>
                                            <div className="p-2.5 rounded-xl bg-slate-900 shrink-0">{slide.icon}</div>
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 tracking-tight truncate">{slide.value}</h3>
                                        <div className="mt-2 flex items-start gap-1.5 line-clamp-2 leading-snug break-words whitespace-normal">{slide.sub}</div>
                                    </div>
                                </div>
                                <style>{`
                                    @keyframes slideUp { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: translateY(0); } }
                                    .animate-slideUp { animation: slideUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
                                `}</style>
                            </div>
                        );
                    })()}

                    {/* Aktif Tarama — with integrated automation progress */}
                    <div
                        className="group relative rounded-2xl bg-slate-900 border border-slate-800 shadow-sm overflow-hidden min-w-0 transition-all duration-[2000ms] ease-out"
                        style={{ flex: (isSearching || automationProgress > 0) ? 2 : 1 }}
                    >
                        {/* Animated background layers */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute w-32 h-32 rounded-full bg-[#CCFF00]/15 blur-2xl animate-float1" />
                            <div className="absolute w-20 h-20 rounded-full bg-[#CCFF00]/12 blur-xl animate-float2" />
                            <div className="absolute w-16 h-16 rounded-full bg-cyan-400/10 blur-2xl animate-float3" />
                        </div>

                        {/* Layer 3: Subtle grid pattern */}
                        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                            style={{ backgroundImage: 'radial-gradient(circle, #CCFF00 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                        />

                        {/* Scanning glow effect (active during search) */}
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

                            {/* Main value */}
                            <h3 className="text-3xl font-bold text-white tracking-tight transition-all duration-300">
                                {automationProgress >= 100 ? "Tamamlandı" : isSearching ? "Taranıyor" : "Hazır"}
                            </h3>

                            {/* Subtitle / current step */}
                            <div className="mt-1.5">
                                {isSearching ? (
                                    <span className="text-xs font-medium text-[#CCFF00]/60">
                                        {automationSteps[currentStep]?.label || "İşlem devam ediyor..."}
                                    </span>
                                ) : automationProgress >= 100 ? (
                                    <span className="text-xs font-medium text-[#CCFF00]/60">
                                        Tüm veriler başarıyla toplandı
                                    </span>
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
                                    maxHeight: (isSearching || automationProgress > 0) ? '120px' : '0px',
                                    opacity: (isSearching || automationProgress > 0) ? 1 : 0,
                                }}
                            >
                                <div className="mt-4">
                                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#CCFF00] rounded-full transition-all duration-700 ease-out relative"
                                            style={{ width: `${automationProgress}%` }}
                                        >
                                            {isSearching && (
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Step indicators */}
                                    <div className="flex items-center gap-3 mt-3">
                                        {automationSteps.map((step, i) => (
                                            <div key={i} className="flex items-center gap-1.5">
                                                {step.completed ? (
                                                    <CheckCircle2 className="w-3 h-3 text-[#CCFF00]" />
                                                ) : i === currentStep && isSearching ? (
                                                    <div className="relative w-3 h-3 flex items-center justify-center">
                                                        <div className="w-1.5 h-1.5 bg-[#CCFF00] rounded-full" />
                                                        <div className="absolute inset-0 rounded-full border border-[#CCFF00]/40 animate-ping" />
                                                    </div>
                                                ) : (
                                                    <div className="w-3 h-3 rounded-full border border-slate-700 flex items-center justify-center">
                                                        <div className="w-1 h-1 rounded-full bg-slate-600" />
                                                    </div>
                                                )}
                                                <span className={cn(
                                                    "text-[10px] font-medium hidden md:inline",
                                                    step.completed ? "text-slate-300" : i === currentStep && isSearching ? "text-white" : "text-slate-600"
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
                        `}</style>
                    </div>

                    {/* CARD 2: Messaging Stats — rotating carousel */}
                    {(() => {
                        const totalMessages = sentCount + pendingCount;
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
                            {
                                icon: <Sparkles className="w-4 h-4 text-[#CCFF00]" />,
                                label: 'SATIŞ İPUCU',
                                value: <span className="text-xl">Dönüşüm +%40</span>,
                                sub: <><Lightbulb className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" /><span className="text-xs font-medium text-amber-600 line-clamp-2">Özelleştirilmiş mesajlar sayesinde potansiyellerinizi ciddi oranda artırın.</span></>,
                            },
                        ];
                        const idx = slide2 % msgSlides.length;
                        const slide = msgSlides[idx];
                        return (
                            <div className="flex-1 min-w-0 group relative rounded-2xl p-5 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                                <div className="absolute top-2.5 right-5 flex gap-1">
                                    {msgSlides.map((_, i) => (
                                        <div key={i} className={cn("w-1.5 h-1.5 rounded-full transition-all duration-300", i === idx ? "bg-slate-900 w-3" : "bg-gray-300")} />
                                    ))}
                                </div>
                                <div className="relative h-[110px]">
                                    <div key={slide2} className="absolute inset-0 animate-slideUp">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase truncate pr-4">{slide.label}</p>
                                            <div className="p-2.5 rounded-xl bg-slate-900 shrink-0">{slide.icon}</div>
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 tracking-tight truncate">{slide.value}</h3>
                                        <div className="mt-2 flex items-start gap-1.5 line-clamp-2 leading-snug break-words whitespace-normal">{slide.sub}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* CARD 3: Performance Stats — rotating carousel, hides during automation */}
                    {(() => {
                        const convRate = leads.length > 0 ? Math.round((sentCount / leads.length) * 100) : 0;
                        const efficiency = leads.length > 0 ? Math.round((sentCount / leads.length) * 100) : 0;
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
                                icon: <BarChart3 className="w-4 h-4 text-[#CCFF00]" />,
                                label: 'ERİŞİM ORANI',
                                value: <span className="text-2xl">%{efficiency}</span>,
                                sub: <><Target className="w-3 h-3 text-blue-500" /><span className="text-xs font-medium text-blue-600">{leads.length} fırsattan {sentCount} tanesiyle temasa geçildi.</span></>,
                            },
                            {
                                icon: <Sparkles className="w-4 h-4 text-[#CCFF00]" />,
                                label: 'MOTOR DURUMU',
                                value: <span className="text-xl">{pendingCount > 0 ? 'İşlemde' : sentCount > 0 ? 'Tamamlandı' : 'Beklemede'}</span>,
                                sub: <span className="text-xs text-gray-400 line-clamp-2">{pendingCount > 0 ? `Satış asistanınız arka planda ${pendingCount} işlemi hızla yürütüyor...` : 'Sistem herhangi bir göreve tam kapasite hazır.'}</span>,
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
                                <div className="relative h-[110px]">
                                    <div key={slide3} className="absolute inset-0 animate-slideUp">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase truncate pr-4">{slide.label}</p>
                                            <div className="p-2.5 rounded-xl bg-slate-900 shrink-0">{slide.icon}</div>
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 tracking-tight truncate">{slide.value}</h3>
                                        <div className="mt-2 flex items-start gap-1.5 line-clamp-2 leading-snug break-words whitespace-normal">{slide.sub}</div>
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

