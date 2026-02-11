import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Briefcase, Plus, Play, Users, Trash2, Timer, CheckCircle2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/utils/cn";
import { useLeads } from "@/hooks/useLeads";

// --- iOS-style Scroll Wheel Column ---
const WheelColumn = ({ items, selected, onSelect, label }: {
    items: string[];
    selected: string;
    onSelect: (val: string) => void;
    label: string;
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const itemHeight = 40;
    const isScrollingRef = useRef(false);

    // Scroll to selected on mount
    useEffect(() => {
        const idx = items.indexOf(selected);
        if (idx >= 0 && containerRef.current) {
            containerRef.current.scrollTop = idx * itemHeight;
        }
    }, []);

    const handleScroll = useCallback(() => {
        if (!containerRef.current) return;
        if (isScrollingRef.current) return;

        isScrollingRef.current = true;
        // Debounce
        setTimeout(() => {
            if (!containerRef.current) return;
            const scrollTop = containerRef.current.scrollTop;
            const idx = Math.round(scrollTop / itemHeight);
            const clamped = Math.max(0, Math.min(idx, items.length - 1));
            onSelect(items[clamped]);
            isScrollingRef.current = false;
        }, 80);
    }, [items, onSelect, itemHeight]);

    return (
        <div className="flex-1 flex flex-col items-center">
            <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</span>
            <div className="relative h-[200px] w-full">
                {/* Gradient masks */}
                <div className="absolute top-0 left-0 right-0 h-[80px] bg-gradient-to-b from-white to-transparent z-10 pointer-events-none rounded-t-xl" />
                <div className="absolute bottom-0 left-0 right-0 h-[80px] bg-gradient-to-t from-white to-transparent z-10 pointer-events-none rounded-b-xl" />
                {/* Center highlight */}
                <div className="absolute top-1/2 left-1 right-1 -translate-y-1/2 h-[40px] bg-[#CCFF00]/15 border border-[#CCFF00]/30 rounded-lg z-[5] pointer-events-none" />

                {/* Scrollable area */}
                <div
                    ref={containerRef}
                    className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory"
                    onScroll={handleScroll}
                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        paddingTop: `${itemHeight * 2}px`,
                        paddingBottom: `${itemHeight * 2}px`,
                    }}
                >
                    {items.map((item) => (
                        <div
                            key={item}
                            className={cn(
                                "h-[40px] flex items-center justify-center snap-center cursor-pointer transition-all duration-150",
                                selected === item
                                    ? "text-slate-900 font-bold text-xl"
                                    : "text-slate-400 font-medium text-base"
                            )}
                            onClick={() => {
                                onSelect(item);
                                const idx = items.indexOf(item);
                                containerRef.current?.scrollTo({ top: idx * itemHeight, behavior: 'smooth' });
                            }}
                        >
                            {item}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Generate hour/minute arrays
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

// Live countdown hook
const useCountdown = (targetDate: string | null) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (!targetDate) { setTimeLeft(''); return; }

        const update = () => {
            const diff = new Date(targetDate).getTime() - Date.now();
            if (diff <= 0) { setTimeLeft('Şimdi'); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(h > 0 ? `${h}s ${m}dk ${s}sn` : m > 0 ? `${m}dk ${s}sn` : `${s}sn`);
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    return timeLeft;
};

export const SchedulerPage = () => {
    const { pendingSearches, scheduleSearch, searchLeads, removeScheduledSearch } = useLeads();

    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [time, setTime] = useState("");
    const [city, setCity] = useState("");
    const [district, setDistrict] = useState("");
    const [sector, setSector] = useState("");
    const [limit, setLimit] = useState(30);


    // Completed count from localStorage
    const [completedCount, setCompletedCount] = useState(0);
    useEffect(() => {
        const count = parseInt(localStorage.getItem('completedSearchCount') || '0');
        setCompletedCount(count);
    }, []);

    // Sorted pending searches (nearest first)
    const sortedSearches = useMemo(() =>
        [...pendingSearches].sort((a, b) =>
            new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
        ), [pendingSearches]);

    // Nearest search countdown
    const nearestSearch = sortedSearches.length > 0 ? sortedSearches[0].scheduledTime : null;
    const countdown = useCountdown(nearestSearch);

    const handleSchedule = () => {
        if (!selectedDate || !time || !city || !sector) return;

        const [hours, minutes] = time.split(':').map(Number);
        const scheduledDate = new Date(selectedDate);
        scheduledDate.setHours(hours, minutes);

        if (scheduledDate < new Date()) return;

        scheduleSearch({
            city,
            district,
            sector,
            limit,
            date: selectedDate,
            time
        }, scheduledDate);

        // Reset form
        setSelectedDate(undefined);
        setTime("");
        setCity("");
        setDistrict("");
        setSector("");
        setLimit(30);
    };

    // Quick sector suggestions
    const sectorSuggestions = ['Restoran', 'Avukat', 'Diş Hekimi', 'Veteriner', 'Eczane', 'Kuaför'];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                            <CalendarIcon className="w-5 h-5 text-[#CCFF00]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Arama Planlayıcı</h1>
                            <p className="text-sm text-gray-400">İleri tarihli lead aramaları planlayın</p>
                        </div>
                    </div>
                </div>

                {/* Mini Stat Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {/* Bekleyen */}
                    <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200/60 p-4 shadow-sm hover:shadow-md transition-all">
                        <div className="absolute top-2 right-2 w-8 h-8 bg-[#CCFF00]/10 rounded-full blur-xl" />
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-50">
                                <Timer className="w-4 h-4 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Bekleyen</p>
                                <p className="text-xl font-bold text-gray-900">{pendingSearches.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* En Yakın */}
                    <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200/60 p-4 shadow-sm hover:shadow-md transition-all">
                        <div className="absolute top-2 right-2 w-8 h-8 bg-blue-500/10 rounded-full blur-xl" />
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-50">
                                <Clock className="w-4 h-4 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">En Yakın</p>
                                <p className={cn(
                                    "text-lg font-bold tabular-nums",
                                    countdown ? "text-gray-900" : "text-gray-300"
                                )}>
                                    {countdown || "—"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tamamlanan */}
                    <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200/60 p-4 shadow-sm hover:shadow-md transition-all">
                        <div className="absolute top-2 right-2 w-8 h-8 bg-emerald-500/10 rounded-full blur-xl" />
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-50">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Tamamlanan</p>
                                <p className="text-xl font-bold text-gray-900">{completedCount}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                    {/* Schedule Form — 2 cols */}
                    <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 shadow-2xl">
                        {/* Floating orbs */}
                        <div className="absolute top-6 right-6 w-24 h-24 bg-[#CCFF00]/10 rounded-full blur-3xl animate-pulse" />
                        <div className="absolute bottom-16 left-4 w-16 h-16 bg-cyan-400/8 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
                        <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-[#CCFF00]/5 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }} />

                        {/* Top shimmer line */}
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00]/60 to-transparent animate-shimmer" />

                        {/* Grid pattern */}
                        <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
                            style={{ backgroundImage: 'radial-gradient(circle, #CCFF00 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                        />

                        {/* Header */}
                        <div className="relative px-5 pt-5 pb-2">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-xl bg-[#CCFF00] flex items-center justify-center overflow-hidden">
                                        <Plus className="w-5 h-5 text-slate-900" />
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">Yeni Arama Planla</h2>
                                    <p className="text-[11px] text-slate-400">Otomatik arama zamanlayın</p>
                                </div>
                            </div>
                        </div>

                        <div className="relative p-5 space-y-3">
                            {/* Date & Time */}
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-2.5">
                                    <CalendarIcon className="w-3.5 h-3.5 text-[#CCFF00]" />
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Tarih & Saat</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button
                                                className={cn(
                                                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-left transition-all hover:border-[#CCFF00]/40 outline-none text-xs font-medium",
                                                    !selectedDate && "text-slate-500",
                                                    selectedDate && "text-white border-[#CCFF00]/30"
                                                )}
                                            >
                                                <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
                                                {selectedDate ? format(selectedDate, "d MMM yyyy", { locale: tr }) : "Tarih seç"}
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={selectedDate}
                                                onSelect={setSelectedDate}
                                                initialFocus
                                                locale={tr}
                                                disabled={(date) => date < new Date()}
                                            />
                                        </PopoverContent>
                                    </Popover>

                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button
                                                className={cn(
                                                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-left transition-all hover:border-[#CCFF00]/40 outline-none text-xs font-medium",
                                                    !time && "text-slate-500",
                                                    time && "text-white border-[#CCFF00]/30"
                                                )}
                                            >
                                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                                {time || "Saat seç"}
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-52 p-4" align="start">
                                            <div className="flex items-center gap-0">
                                                <WheelColumn
                                                    items={HOURS}
                                                    selected={time ? time.split(':')[0] : '09'}
                                                    onSelect={(h) => {
                                                        const m = time ? time.split(':')[1] : '00';
                                                        setTime(`${h}:${m}`);
                                                    }}
                                                    label="Saat"
                                                />
                                                <span className="text-2xl font-bold text-slate-300 mx-1 mt-4">:</span>
                                                <WheelColumn
                                                    items={MINUTES}
                                                    selected={time ? time.split(':')[1] : '00'}
                                                    onSelect={(m) => {
                                                        const h = time ? time.split(':')[0] : '09';
                                                        setTime(`${h}:${m}`);
                                                    }}
                                                    label="Dakika"
                                                />
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            {/* Location */}
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-2.5">
                                    <MapPin className="w-3.5 h-3.5 text-[#CCFF00]" />
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Konum</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="text"
                                        placeholder="Şehir"
                                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-[#CCFF00]/50 focus:ring-1 focus:ring-[#CCFF00]/20 transition-all outline-none text-xs font-medium text-white placeholder:text-slate-500"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        placeholder="İlçe (opsiyonel)"
                                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-[#CCFF00]/50 focus:ring-1 focus:ring-[#CCFF00]/20 transition-all outline-none text-xs font-medium text-white placeholder:text-slate-500"
                                        value={district}
                                        onChange={(e) => setDistrict(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Sector */}
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-2.5">
                                    <Briefcase className="w-3.5 h-3.5 text-[#CCFF00]" />
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Sektör</span>
                                </div>
                                <input
                                    type="text"
                                    placeholder="örn: restoran, avukat..."
                                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-[#CCFF00]/50 focus:ring-1 focus:ring-[#CCFF00]/20 transition-all outline-none text-xs font-medium text-white placeholder:text-slate-500"
                                    value={sector}
                                    onChange={(e) => setSector(e.target.value)}
                                />
                                {/* Quick suggestions */}
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {sectorSuggestions.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setSector(s.toLowerCase())}
                                            className={cn(
                                                "px-2 py-0.5 rounded-md text-[10px] font-medium transition-all",
                                                sector.toLowerCase() === s.toLowerCase()
                                                    ? "bg-[#CCFF00] text-slate-900"
                                                    : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                                            )}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Limit */}
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-3.5 h-3.5 text-[#CCFF00]" />
                                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">İşletme Sayısı</span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-md bg-[#CCFF00] text-slate-900 font-bold text-xs">
                                        {limit}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="5"
                                    max="100"
                                    step="1"
                                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#CCFF00] [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-[#CCFF00]/30 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-900"
                                    value={limit}
                                    onChange={(e) => setLimit(parseInt(e.target.value))}
                                />
                            </div>

                            {/* Submit */}
                            <Button
                                className="w-full h-11 rounded-xl text-sm font-bold bg-[#CCFF00] hover:bg-[#b8e600] text-slate-900 shadow-lg shadow-[#CCFF00]/20 transition-all hover:scale-[1.02] active:scale-[0.98] mt-1"
                                onClick={handleSchedule}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Aramayı Planla
                            </Button>
                        </div>

                        {/* CSS for animations */}
                        <style>{`
                            @keyframes shimmer {
                                0% { transform: translateX(-100%); }
                                100% { transform: translateX(100%); }
                            }
                            .animate-shimmer {
                                animation: shimmer 3s infinite;
                            }
                        `}</style>
                    </div>

                    {/* Timeline Panel — 3 cols */}
                    <div className="lg:col-span-3 relative overflow-hidden rounded-2xl bg-white border border-gray-200/60 shadow-sm min-h-[600px] flex flex-col">
                        {/* Subtle background orb */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#CCFF00]/5 rounded-full blur-3xl" />

                        {/* Header */}
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold text-gray-900">Planlanmış Aramalar</h2>
                                <span className="px-2 py-0.5 text-[11px] font-bold text-slate-900 bg-[#CCFF00] rounded-full">
                                    {pendingSearches.length}
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-5 overflow-y-auto">
                            {sortedSearches.length === 0 ? (
                                /* Enhanced Empty State */
                                <div className="flex flex-col items-center justify-center h-full py-16">
                                    {/* Animated clock illustration */}
                                    <div className="relative mb-6">
                                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200/60 flex items-center justify-center shadow-sm">
                                            <CalendarIcon className="w-9 h-9 text-slate-300" />
                                        </div>
                                        {/* Pulsing ring */}
                                        <div className="absolute -inset-2 rounded-2xl border-2 border-dashed border-slate-200/50 animate-spin" style={{ animationDuration: '20s' }} />
                                        {/* Small floating dot */}
                                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#CCFF00] shadow-lg shadow-[#CCFF00]/30 flex items-center justify-center">
                                            <Plus className="w-2.5 h-2.5 text-slate-900" />
                                        </div>
                                    </div>
                                    <h3 className="text-base font-bold text-gray-800 mb-1">Henüz planlı arama yok</h3>
                                    <p className="text-sm text-gray-400 text-center max-w-[240px] leading-relaxed">
                                        Sol panelden yeni bir arama planlayın — belirlediğiniz saatte otomatik çalışsın
                                    </p>
                                    <div className="flex items-center gap-2 mt-5">
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                                            <Zap className="w-3 h-3 text-[#CCFF00]" />
                                            <span className="text-[11px] font-medium text-slate-500">Tam zamanında çalışır</span>
                                        </div>

                                    </div>
                                </div>
                            ) : (
                                /* Timeline */
                                <div className="relative pl-6">
                                    {/* Timeline line */}
                                    <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-[#CCFF00] via-gray-200 to-gray-100 rounded-full" />

                                    <div className="space-y-4">
                                        {sortedSearches.map((search, idx) => {
                                            const isNext = idx === 0;
                                            const searchDate = new Date(search.scheduledTime);
                                            const isPast = searchDate < new Date();

                                            return (
                                                <div key={search.id} className="relative group">
                                                    {/* Timeline node */}
                                                    <div className={cn(
                                                        "absolute -left-6 top-4 w-3.5 h-3.5 rounded-full border-2 transition-all z-10",
                                                        isNext
                                                            ? "bg-[#CCFF00] border-[#CCFF00] shadow-md shadow-[#CCFF00]/30"
                                                            : isPast
                                                                ? "bg-gray-300 border-gray-300"
                                                                : "bg-white border-gray-300 group-hover:border-[#CCFF00]"
                                                    )}>
                                                        {isNext && (
                                                            <div className="absolute inset-0 rounded-full bg-[#CCFF00] animate-ping opacity-40" />
                                                        )}
                                                    </div>

                                                    {/* Card */}
                                                    <div className={cn(
                                                        "p-4 rounded-xl border transition-all duration-300",
                                                        isNext
                                                            ? "bg-gradient-to-r from-[#CCFF00]/5 to-white border-[#CCFF00]/30 shadow-md"
                                                            : "bg-white border-gray-100 hover:border-[#CCFF00]/20 hover:shadow-sm"
                                                    )}>
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                {/* Date & Time */}
                                                                <div className="flex items-center gap-2">
                                                                    <span className={cn(
                                                                        "text-sm font-bold",
                                                                        isNext ? "text-slate-900" : "text-gray-700"
                                                                    )}>
                                                                        {format(searchDate, "d MMM yyyy", { locale: tr })}
                                                                    </span>
                                                                    <span className={cn(
                                                                        "px-1.5 py-0.5 rounded text-[10px] font-bold",
                                                                        isNext ? "bg-[#CCFF00] text-slate-900" : "bg-gray-100 text-gray-500"
                                                                    )}>
                                                                        {format(searchDate, "HH:mm")}
                                                                    </span>
                                                                    {isNext && (
                                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-600">
                                                                            Sıradaki
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* Details */}
                                                                <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                                                                    <span className="flex items-center gap-1">
                                                                        <MapPin className="w-3 h-3" />
                                                                        {search.config.city}{search.config.district ? `, ${search.config.district}` : ''}
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <Briefcase className="w-3 h-3" />
                                                                        {search.config.sector}
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <Users className="w-3 h-3" />
                                                                        {search.config.limit}
                                                                    </span>
                                                                </div>

                                                                {/* Relative time */}
                                                                <p className="text-[11px] text-gray-300 mt-1.5">
                                                                    {formatDistanceToNow(searchDate, { addSuffix: true, locale: tr })}
                                                                </p>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    className="p-1.5 text-gray-400 hover:text-slate-900 hover:bg-[#CCFF00]/80 rounded-lg transition-all"
                                                                    onClick={() => searchLeads(search.config)}
                                                                    title="Şimdi Başlat"
                                                                >
                                                                    <Play className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                    onClick={() => removeScheduledSearch(search.id)}
                                                                    title="Sil"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
