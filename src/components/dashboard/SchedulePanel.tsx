import { ScheduleConfig } from '@/types/lead';
import { Button } from '@/components/ui/button';
import { MapPin, Briefcase, Target, Users } from 'lucide-react';

interface SchedulePanelProps {
    config: ScheduleConfig;
    onConfigChange: (config: ScheduleConfig) => void;
    onStartSearch: () => void;
    isSearching: boolean;
}

export const SchedulePanel = ({ config, onConfigChange, onStartSearch, isSearching }: SchedulePanelProps) => {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-200/50 shadow-2xl shadow-gray-200/50">
            {/* Animated Floating Orbs */}
            <div className="absolute top-4 right-4 w-20 h-20 bg-[#CCFF00]/20 rounded-full blur-2xl animate-pulse" />
            <div className="absolute top-1/2 right-0 w-16 h-16 bg-purple-400/10 rounded-full blur-xl animate-bounce" style={{ animationDuration: '3s' }} />
            <div className="absolute bottom-10 left-4 w-12 h-12 bg-[#CCFF00]/15 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }} />

            {/* Animated Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#CCFF00] to-transparent opacity-60 animate-shimmer" />

            {/* Header with floating icon */}
            <div className="relative px-6 pt-6 pb-3">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-xl bg-[#CCFF00] flex items-center justify-center animate-float overflow-hidden">
                            <img src="/luera-icon.png" alt="LUERA" className="w-8 h-8 object-contain" />
                        </div>
                        {/* Ping effect */}
                        <div className="absolute inset-0 rounded-xl bg-[#CCFF00] animate-ping opacity-30" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Lead Arama</h2>
                        <p className="text-xs text-gray-400">Potansiyel müşterilerinizi anında keşfedin</p>
                    </div>
                </div>
            </div>

            {/* Form Content */}
            <div className="relative px-6 pb-6 space-y-4">
                {/* Location Section */}
                <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-[#CCFF00]/30 transition-all duration-300 group">
                    <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4 text-[#CCFF00] group-hover:animate-bounce" />
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Konum</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            type="text"
                            placeholder="Şehir"
                            className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#CCFF00] focus:bg-white focus:ring-2 focus:ring-[#CCFF00]/20 transition-all outline-none text-sm font-medium placeholder:text-gray-400"
                            value={config.city}
                            onChange={(e) => onConfigChange({ ...config, city: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="İlçe"
                            className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#CCFF00] focus:bg-white focus:ring-2 focus:ring-[#CCFF00]/20 transition-all outline-none text-sm font-medium placeholder:text-gray-400"
                            value={config.district}
                            onChange={(e) => onConfigChange({ ...config, district: e.target.value })}
                        />
                    </div>
                </div>

                {/* Sector Section */}
                <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-[#CCFF00]/30 transition-all duration-300 group">
                    <div className="flex items-center gap-2 mb-3">
                        <Briefcase className="w-4 h-4 text-[#CCFF00] group-hover:animate-bounce" />
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Sektör</span>
                    </div>
                    <input
                        type="text"
                        placeholder="örn: restoran, avukat, diş hekimi, veteriner..."
                        className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#CCFF00] focus:bg-white focus:ring-2 focus:ring-[#CCFF00]/20 transition-all outline-none text-sm font-medium placeholder:text-gray-400"
                        value={config.sector}
                        onChange={(e) => onConfigChange({ ...config, sector: e.target.value })}
                    />
                </div>

                {/* Limit Section - Slider */}
                <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-[#CCFF00]/30 transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-[#CCFF00] group-hover:animate-bounce" />
                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">İşletme Sayısı</span>
                        </div>
                        <div className="px-3 py-1 rounded-lg bg-[#CCFF00] text-gray-900 font-bold text-sm shadow-sm">
                            {config.limit}
                        </div>
                    </div>
                    <div className="relative">
                        <input
                            type="range"
                            min="5"
                            max="100"
                            step="1"
                            className="w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#CCFF00] [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-[#CCFF00]/30 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                            value={config.limit}
                            onChange={(e) => onConfigChange({ ...config, limit: parseInt(e.target.value) || 30 })}
                        />
                        <div className="flex justify-between mt-2 text-xs text-gray-400 font-medium">
                            <span>5</span>
                            <span>25</span>
                            <span>50</span>
                            <span>75</span>
                            <span>100</span>
                        </div>
                    </div>
                </div>

                {/* Action Button with enhanced animations */}
                <div className="relative group">
                    {/* Animated gradient border */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#CCFF00] via-[#9dff00] to-[#CCFF00] rounded-2xl opacity-75 group-hover:opacity-100 blur transition-all animate-gradient-x" />

                    {/* Sparkle particles */}
                    <div className="absolute -top-1 left-1/4 w-2 h-2 bg-[#CCFF00] rounded-full animate-ping opacity-60" />
                    <div className="absolute -top-2 right-1/3 w-1.5 h-1.5 bg-[#e5ff66] rounded-full animate-ping opacity-50" style={{ animationDelay: '0.5s' }} />
                    <div className="absolute -bottom-1 right-1/4 w-2 h-2 bg-[#CCFF00] rounded-full animate-ping opacity-40" style={{ animationDelay: '1s' }} />

                    <Button
                        className={`relative w-full h-14 rounded-xl text-base font-bold transition-all overflow-hidden ${isSearching
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-[#CCFF00] hover:bg-[#b8e600] text-gray-900 shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                            }`}
                        type="button"
                        onClick={onStartSearch}
                        disabled={isSearching}
                    >
                        {/* Shimmer overlay */}
                        {!isSearching && (
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                        )}

                        {isSearching ? (
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                                <span>Aranıyor...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Target className="w-5 h-5 animate-pulse" />
                                <span>Aramayı Başlat</span>
                                <div className="ml-1 flex gap-0.5">
                                    <span className="w-1 h-1 bg-gray-900/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1 h-1 bg-gray-900/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1 h-1 bg-gray-900/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                    </Button>
                </div>
            </div>

            {/* CSS for custom animations */}
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
    );
};
