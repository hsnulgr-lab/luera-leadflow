import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
    CheckCircle2, ChevronRight, Loader2, Sparkles, Building2, User, MapPin, Briefcase,
    UtensilsCrossed, Scissors, HeartPulse, Wrench, HardHat, BookOpen,
    ShoppingBag, Scale, TrendingUp, Home, Monitor, MoreHorizontal, LucideIcon
} from 'lucide-react';
import { cn } from '@/utils/cn';

const SECTORS: { id: string; label: string; icon: LucideIcon }[] = [
    { id: 'restoran',    label: 'Restoran & Kafe',     icon: UtensilsCrossed },
    { id: 'guzellik',   label: 'Güzellik & Kuaför',   icon: Scissors        },
    { id: 'saglik',     label: 'Sağlık & Klinik',     icon: HeartPulse      },
    { id: 'oto',        label: 'Otomotiv & Servis',   icon: Wrench          },
    { id: 'insaat',     label: 'İnşaat & Tadilat',    icon: HardHat         },
    { id: 'egitim',     label: 'Eğitim & Kurslar',    icon: BookOpen        },
    { id: 'perakende',  label: 'Perakende & Mağaza',  icon: ShoppingBag     },
    { id: 'hukuk',      label: 'Hukuk & Danışmanlık', icon: Scale           },
    { id: 'muhasebe',   label: 'Muhasebe & Finans',   icon: TrendingUp      },
    { id: 'gayrimenkul',label: 'Gayrimenkul',          icon: Home            },
    { id: 'teknoloji',  label: 'Teknoloji & Yazılım', icon: Monitor         },
    { id: 'diger',      label: 'Diğer',               icon: MoreHorizontal  },
];

const CITIES = [
    'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya',
    'Adana', 'Konya', 'Gaziantep', 'Mersin', 'Kayseri',
    'Eskişehir', 'Samsun', 'Trabzon', 'Diyarbakır', 'Diğer',
];

const inputCls = "w-full bg-gray-800/80 border border-gray-700 rounded-2xl px-4 py-3.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-[#CCFF00]/50 focus:ring-2 focus:ring-[#CCFF00]/10 transition-all";

export const OnboardingPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);

    const [selectedSector, setSelectedSector] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [senderName, setSenderName] = useState(user?.name || '');
    const [businessOffer, setBusinessOffer] = useState('');
    const [city, setCity] = useState('');

    const canNext1 = !!selectedSector;
    const canNext2 = businessName.trim().length > 0 && senderName.trim().length > 0 && !!city;

    const handleComplete = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            await supabase.from('user_settings').upsert({
                user_id: user.id,
                business_sector: selectedSector,
                business_name: businessName.trim(),
                sender_name: senderName.trim(),
                business_offer: businessOffer.trim() || null,
                onboarding_completed: true,
            }, { onConflict: 'user_id' });
            navigate('/', { replace: true });
        } catch (e) {
            console.error('Onboarding save error:', e);
        } finally {
            setIsSaving(false);
        }
    };

    const sectorObj = SECTORS.find(s => s.id === selectedSector);

    const STEP_LABELS = ['Sektör', 'İşletme', 'Hazır'];

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            {/* Background glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#CCFF00]/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative w-full max-w-lg">
                {/* Logo */}
                <div className="text-center mb-8">
                    <span className="text-3xl font-black text-white tracking-tight">
                        LUERA <span className="text-[#CCFF00]">LeadFlow</span>
                    </span>
                    <p className="text-gray-500 text-sm mt-1">Sistemi sizin için kişiselleştirelim</p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-0 mb-8">
                    {[1, 2, 3].map(s => (
                        <div key={s} className="flex items-center">
                            <div className="flex flex-col items-center gap-1.5">
                                <div className={cn(
                                    "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                                    step > s  ? "bg-[#CCFF00] text-gray-900 shadow-[0_0_16px_rgba(204,255,0,0.35)]"
                                    : step === s ? "bg-[#CCFF00]/15 text-[#CCFF00] border-2 border-[#CCFF00]/60 shadow-[0_0_12px_rgba(204,255,0,0.15)]"
                                    : "bg-gray-800 text-gray-600 border border-gray-700"
                                )}>
                                    {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                                </div>
                                <span className={cn(
                                    "text-[10px] font-semibold tracking-wide",
                                    step >= s ? "text-gray-400" : "text-gray-600"
                                )}>
                                    {STEP_LABELS[s - 1]}
                                </span>
                            </div>
                            {s < 3 && (
                                <div className={cn(
                                    "w-20 h-px mb-5 mx-2 transition-all duration-500",
                                    step > s ? "bg-[#CCFF00]/40" : "bg-gray-800"
                                )} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Card */}
                <div className="bg-gray-900/90 backdrop-blur-sm rounded-3xl border border-gray-800/80 p-7 shadow-2xl">

                    {/* ── ADIM 1: Sektör ── */}
                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
                            <h2 className="text-xl font-bold text-white mb-1">Hangi sektörde müşteri arıyorsunuz?</h2>
                            <p className="text-gray-500 text-sm mb-5">Mesajlarınız bu sektöre göre otomatik kişiselleştirilecek.</p>

                            <div className="grid grid-cols-3 gap-2.5">
                                {SECTORS.map(sector => {
                                    const Icon = sector.icon;
                                    const active = selectedSector === sector.id;
                                    return (
                                        <button
                                            key={sector.id}
                                            onClick={() => setSelectedSector(sector.id)}
                                            className={cn(
                                                "flex flex-col items-center gap-2.5 p-4 rounded-2xl border text-center transition-all duration-200",
                                                active
                                                    ? "bg-[#CCFF00]/10 border-[#CCFF00]/40 shadow-[0_0_16px_rgba(204,255,0,0.08)] scale-[1.02]"
                                                    : "bg-gray-800/50 border-gray-700/60 hover:bg-gray-800 hover:border-gray-600"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
                                                active ? "bg-[#CCFF00]/20" : "bg-gray-700/60"
                                            )}>
                                                <Icon className={cn("w-4.5 h-4.5", active ? "text-[#CCFF00]" : "text-gray-400")} strokeWidth={1.75} />
                                            </div>
                                            <span className={cn(
                                                "text-[11px] font-semibold leading-tight",
                                                active ? "text-[#CCFF00]" : "text-gray-500"
                                            )}>
                                                {sector.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                disabled={!canNext1}
                                onClick={() => setStep(2)}
                                className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#CCFF00] text-gray-900 font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#d4ff33] active:scale-[0.98] transition-all"
                            >
                                Devam Et <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* ── ADIM 2: İşletme Bilgileri ── */}
                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
                            <button onClick={() => setStep(1)} className="flex items-center gap-1 text-gray-600 text-xs mb-5 hover:text-gray-300 transition-colors">
                                <ChevronRight className="w-3 h-3 rotate-180" /> Geri
                            </button>

                            <h2 className="text-xl font-bold text-white mb-1">İşletmenizi tanıtalım</h2>
                            <p className="text-gray-500 text-sm mb-5">Bu bilgiler WhatsApp mesajlarınızda otomatik kullanılacak.</p>

                            {/* Seçili sektör pill */}
                            {sectorObj && (() => {
                                const Icon = sectorObj.icon;
                                return (
                                    <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 bg-[#CCFF00]/10 rounded-full border border-[#CCFF00]/20">
                                        <Icon className="w-3.5 h-3.5 text-[#CCFF00]" strokeWidth={2} />
                                        <span className="text-xs font-bold text-[#CCFF00]">{sectorObj.label}</span>
                                    </div>
                                );
                            })()}

                            <div className="space-y-3.5">
                                {/* İşletme adı */}
                                <div className="relative">
                                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                    <input
                                        type="text"
                                        value={businessName}
                                        onChange={e => setBusinessName(e.target.value)}
                                        placeholder="İşletme / Şirket Adı *"
                                        className={cn(inputCls, "pl-10")}
                                    />
                                </div>

                                {/* Adınız */}
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                    <input
                                        type="text"
                                        value={senderName}
                                        onChange={e => setSenderName(e.target.value)}
                                        placeholder="Adınız (mesajlarda görünür) *"
                                        className={cn(inputCls, "pl-10")}
                                    />
                                </div>

                                {/* Ne sunuyorsunuz */}
                                <div className="relative">
                                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                    <input
                                        type="text"
                                        value={businessOffer}
                                        onChange={e => setBusinessOffer(e.target.value)}
                                        placeholder="Ne sunuyorsunuz? (isteğe bağlı)"
                                        className={cn(inputCls, "pl-10")}
                                    />
                                </div>

                                {/* Şehir — buton grid */}
                                <div>
                                    <div className="flex items-center gap-1.5 mb-2.5">
                                        <MapPin className="w-3.5 h-3.5 text-gray-600" />
                                        <span className="text-xs font-semibold text-gray-500">Şehir seçin *</span>
                                    </div>
                                    <div className="grid grid-cols-5 gap-1.5">
                                        {CITIES.map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setCity(c)}
                                                className={cn(
                                                    "py-2 px-1 rounded-xl text-[11px] font-semibold border transition-all duration-150",
                                                    city === c
                                                        ? "bg-[#CCFF00]/10 border-[#CCFF00]/50 text-[#CCFF00] shadow-[0_0_10px_rgba(204,255,0,0.1)]"
                                                        : "bg-gray-800/60 border-gray-700/80 text-gray-500 hover:bg-gray-800 hover:text-gray-300"
                                                )}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                disabled={!canNext2}
                                onClick={() => setStep(3)}
                                className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#CCFF00] text-gray-900 font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#d4ff33] active:scale-[0.98] transition-all"
                            >
                                Devam Et <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* ── ADIM 3: Hazır ── */}
                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-bottom-3 duration-300 text-center">
                            {/* Success icon */}
                            <div className="relative w-24 h-24 mx-auto mb-6">
                                <div className="absolute inset-0 rounded-full bg-[#CCFF00]/20 animate-ping" />
                                <div className="relative w-24 h-24 rounded-full bg-[#CCFF00]/15 border-2 border-[#CCFF00]/40 flex items-center justify-center shadow-[0_0_40px_rgba(204,255,0,0.2)]">
                                    <Sparkles className="w-10 h-10 text-[#CCFF00]" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-black text-white mb-1">Her şey hazır! 🎉</h2>
                            <p className="text-gray-500 text-sm mb-6">
                                Profiliniz oluşturuldu. Müşteri bulmaya başlayabilirsiniz.
                            </p>

                            {/* Summary cards */}
                            <div className="grid grid-cols-2 gap-2.5 mb-5 text-left">
                                <div className="bg-gray-800/60 rounded-2xl p-3.5 border border-gray-700/50">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Sektör</p>
                                    <p className="text-sm font-bold text-white">{sectorObj?.label}</p>
                                </div>
                                <div className="bg-gray-800/60 rounded-2xl p-3.5 border border-gray-700/50">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Şehir</p>
                                    <p className="text-sm font-bold text-white">📍 {city}</p>
                                </div>
                                <div className="bg-gray-800/60 rounded-2xl p-3.5 border border-gray-700/50">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">İşletme</p>
                                    <p className="text-sm font-bold text-white truncate">{businessName}</p>
                                </div>
                                <div className="bg-gray-800/60 rounded-2xl p-3.5 border border-gray-700/50">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">İletişim</p>
                                    <p className="text-sm font-bold text-white">{senderName}</p>
                                </div>
                            </div>

                            {/* WhatsApp reminder */}
                            <div className="flex items-center gap-3 bg-[#25D366]/8 border border-[#25D366]/20 rounded-2xl px-4 py-3 text-left mb-5">
                                <span className="text-2xl shrink-0">💬</span>
                                <div>
                                    <p className="text-sm font-bold text-white">WhatsApp'ı bağlamayı unutmayın</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Menüden WhatsApp → QR kodu okutun → Hazır!</p>
                                </div>
                            </div>

                            <button
                                onClick={handleComplete}
                                disabled={isSaving}
                                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#CCFF00] text-gray-900 font-black text-sm hover:bg-[#d4ff33] active:scale-[0.98] transition-all disabled:opacity-60 shadow-[0_4px_24px_rgba(204,255,0,0.25)]"
                            >
                                {isSaving
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor...</>
                                    : <><Sparkles className="w-4 h-4" /> Dashboard'a Başla</>
                                }
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-center text-gray-700 text-xs mt-4">
                    Bu ayarları daha sonra Ayarlar sayfasından değiştirebilirsiniz.
                </p>
            </div>
        </div>
    );
};
