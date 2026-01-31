import { useState } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Briefcase, Plus, Play, Users, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/utils/cn";
import { useLeads } from "@/hooks/useLeads";
import { toast } from "sonner";


export const SchedulerPage = () => {
    const { pendingSearches, scheduleSearch, searchLeads, removeScheduledSearch } = useLeads();

    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [time, setTime] = useState("");
    const [city, setCity] = useState("");
    const [district, setDistrict] = useState("");
    const [sector, setSector] = useState("");
    const [limit, setLimit] = useState(30);

    const handleSchedule = () => {
        if (!selectedDate || !time || !city || !sector) {
            toast.error("Lütfen tüm alanları doldurun.");
            return;
        }

        const [hours, minutes] = time.split(':').map(Number);
        const scheduledDate = new Date(selectedDate);
        scheduledDate.setHours(hours, minutes);

        if (scheduledDate < new Date()) {
            toast.error("Geçmiş bir tarih seçemezsiniz.");
            return;
        }

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

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Arama Planlayıcı</h1>
                <p className="text-gray-500 mt-1">İleri tarihli lead aramaları planlayın</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Schedule Form */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-200/50 shadow-2xl shadow-gray-200/50">
                    {/* Animated Floating Orbs */}
                    <div className="absolute top-4 right-4 w-20 h-20 bg-[#CCFF00]/20 rounded-full blur-2xl animate-pulse" />
                    <div className="absolute bottom-10 left-4 w-12 h-12 bg-[#CCFF00]/15 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }} />

                    {/* Animated Line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#CCFF00] to-transparent opacity-60 animate-shimmer" />

                    {/* Header */}
                    <div className="relative px-6 pt-6 pb-3">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-xl bg-[#CCFF00] flex items-center justify-center animate-float overflow-hidden">
                                    <img src="/luera-icon.png" alt="LUERA" className="w-8 h-8 object-contain" />
                                </div>
                                <div className="absolute inset-0 rounded-xl bg-[#CCFF00] animate-ping opacity-30" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Yeni Arama Planla</h2>
                                <p className="text-xs text-gray-400">Otomatik arama zamanlayın</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative p-6 space-y-4">
                        {/* Date & Time */}
                        <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-[#CCFF00]/30 transition-all duration-300">
                            <div className="flex items-center gap-2 mb-3">
                                <CalendarIcon className="w-4 h-4 text-[#CCFF00]" />
                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tarih & Saat</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-gray-50 text-left transition-all hover:border-[#CCFF00]/50 focus:border-[#CCFF00] focus:ring-2 focus:ring-[#CCFF00]/20 outline-none text-sm font-medium",
                                                !selectedDate && "text-gray-400",
                                                selectedDate && "text-gray-900 border-gray-200 bg-white"
                                            )}
                                        >
                                            <CalendarIcon className="w-4 h-4 text-gray-400" />
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
                                                "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-gray-50 text-left transition-all hover:border-[#CCFF00]/50 focus:border-[#CCFF00] focus:ring-2 focus:ring-[#CCFF00]/20 outline-none text-sm font-medium",
                                                !time && "text-gray-400",
                                                time && "text-gray-900 border-gray-200 bg-white"
                                            )}
                                        >
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            {time || "Saat seç"}
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-72 p-3" align="start">
                                        <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1">
                                            {Array.from({ length: 24 }).map((_, hour) => (
                                                ["00", "30"].map((minute) => {
                                                    const t = `${hour.toString().padStart(2, "0")}:${minute}`;
                                                    return (
                                                        <button
                                                            key={t}
                                                            className={cn(
                                                                "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                                                time === t
                                                                    ? "bg-[#CCFF00] text-gray-900 shadow-sm"
                                                                    : "bg-gray-50 hover:bg-[#CCFF00]/30 text-gray-700"
                                                            )}
                                                            onClick={() => setTime(t)}
                                                        >
                                                            {t}
                                                        </button>
                                                    );
                                                })
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-[#CCFF00]/30 transition-all duration-300">
                            <div className="flex items-center gap-2 mb-3">
                                <MapPin className="w-4 h-4 text-[#CCFF00]" />
                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Konum</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder="Şehir"
                                    className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#CCFF00] focus:bg-white focus:ring-2 focus:ring-[#CCFF00]/20 transition-all outline-none text-sm font-medium placeholder:text-gray-400"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="İlçe"
                                    className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#CCFF00] focus:bg-white focus:ring-2 focus:ring-[#CCFF00]/20 transition-all outline-none text-sm font-medium placeholder:text-gray-400"
                                    value={district}
                                    onChange={(e) => setDistrict(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Sector */}
                        <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-[#CCFF00]/30 transition-all duration-300">
                            <div className="flex items-center gap-2 mb-3">
                                <Briefcase className="w-4 h-4 text-[#CCFF00]" />
                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Sektör</span>
                            </div>
                            <input
                                type="text"
                                placeholder="örn: restoran, avukat, diş hekimi..."
                                className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#CCFF00] focus:bg-white focus:ring-2 focus:ring-[#CCFF00]/20 transition-all outline-none text-sm font-medium placeholder:text-gray-400"
                                value={sector}
                                onChange={(e) => setSector(e.target.value)}
                            />
                        </div>

                        {/* Limit */}
                        <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-[#CCFF00]/30 transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-[#CCFF00]" />
                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">İşletme Sayısı</span>
                                </div>
                                <div className="px-3 py-1 rounded-lg bg-[#CCFF00] text-gray-900 font-bold text-sm shadow-sm">
                                    {limit}
                                </div>
                            </div>
                            <input
                                type="range"
                                min="5"
                                max="100"
                                step="1"
                                className="w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#CCFF00] [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-[#CCFF00]/30 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
                                value={limit}
                                onChange={(e) => setLimit(parseInt(e.target.value))}
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#CCFF00] via-[#9dff00] to-[#CCFF00] rounded-2xl opacity-75 group-hover:opacity-100 blur transition-all" />
                            <Button
                                className="relative w-full h-14 rounded-xl text-base font-bold bg-[#CCFF00] hover:bg-[#b8e600] text-gray-900 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                onClick={handleSchedule}
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Planla
                            </Button>
                        </div>
                    </div>

                    {/* CSS for animations */}
                    <style>{`
                        @keyframes shimmer {
                            0% { transform: translateX(-100%); }
                            100% { transform: translateX(100%); }
                        }
                        @keyframes float {
                            0%, 100% { transform: translateY(0px); }
                            50% { transform: translateY(-5px); }
                        }
                        .animate-shimmer {
                            animation: shimmer 3s infinite;
                        }
                        .animate-float {
                            animation: float 2s ease-in-out infinite;
                        }
                    `}</style>
                </div>

                {/* Scheduled Searches List */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-200/50 shadow-2xl shadow-gray-200/50">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#CCFF00]/10 rounded-full blur-3xl animate-pulse" />

                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900">
                            Planlanmış Aramalar
                        </h2>
                        <span className="text-sm font-bold text-gray-900 bg-[#CCFF00] px-3 py-1 rounded-full">
                            {pendingSearches.length} arama
                        </span>
                    </div>

                    <div className="p-4 max-h-[500px] overflow-y-auto">
                        {pendingSearches.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#CCFF00]/20 flex items-center justify-center">
                                    <CalendarIcon className="w-8 h-8 text-[#CCFF00]" />
                                </div>
                                <p className="text-gray-500 text-sm font-medium">Henüz planlanmış arama yok</p>
                                <p className="text-gray-400 text-xs mt-1">Soldan yeni bir arama planlayın</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendingSearches.map((search, idx) => (
                                    <div
                                        key={idx}
                                        className="p-4 bg-white rounded-xl border border-gray-100 hover:border-[#CCFF00]/30 hover:shadow-md transition-all duration-300 group"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                                    <CalendarIcon className="w-4 h-4 text-[#CCFF00]" />
                                                    {format(new Date(search.scheduledTime), "d MMMM yyyy, HH:mm", { locale: tr })}
                                                </div>
                                                <div className="mt-2 space-y-1">
                                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {search.config.city}, {search.config.district}
                                                    </p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Briefcase className="w-3 h-3" />
                                                        {search.config.sector} • {search.config.limit} işletme
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-50 group-hover:opacity-100"
                                                    onClick={() => removeScheduledSearch(search.id)}
                                                    title="Sil"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="p-2 text-gray-400 hover:text-gray-900 hover:bg-[#CCFF00] rounded-lg transition-all group-hover:opacity-100 opacity-50"
                                                    onClick={() => searchLeads(search.config)}
                                                    title="Şimdi Başlat"
                                                >
                                                    <Play className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
