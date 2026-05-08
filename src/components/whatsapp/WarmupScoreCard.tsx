import { Flame, Shield, TrendingUp, ChevronRight } from "lucide-react";
import { WarmupPhase } from "@/hooks/useWarmup";
import { cn } from "@/utils/cn";

interface WarmupScoreCardProps {
    warmup: WarmupPhase;
    todaySentCount: number;
    remainingToday: number;
}

const PHASE_COLORS = {
    1: { bar: 'bg-red-400',    badge: 'bg-red-100 text-red-700 border-red-200',    icon: 'text-red-500',   glow: 'from-red-50'    },
    2: { bar: 'bg-orange-400', badge: 'bg-orange-100 text-orange-700 border-orange-200', icon: 'text-orange-500', glow: 'from-orange-50' },
    3: { bar: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: 'text-yellow-500', glow: 'from-yellow-50' },
    4: { bar: 'bg-lime-400',   badge: 'bg-lime-100 text-lime-700 border-lime-200',   icon: 'text-lime-600',  glow: 'from-lime-50'   },
    5: { bar: 'bg-green-500',  badge: 'bg-green-100 text-green-700 border-green-200', icon: 'text-green-600', glow: 'from-green-50'  },
} as const;

export const WarmupScoreCard = ({ warmup, todaySentCount, remainingToday }: WarmupScoreCardProps) => {
    const colors = PHASE_COLORS[warmup.phase];
    const progressPct = Math.min(100, Math.round((todaySentCount / warmup.dailyLimit) * 100));

    // 5 phase blokları için progress göster
    const totalDays = 30;
    const progressDays = Math.min(warmup.daysElapsed, totalDays);
    const warmupPct = Math.round((progressDays / totalDays) * 100);

    return (
        <div className={cn(
            "mx-6 mb-0 mt-3 rounded-2xl border border-slate-100 bg-gradient-to-r to-white p-4 shadow-sm",
            colors.glow
        )}>
            <div className="flex items-center gap-4">
                {/* Icon */}
                <div className={cn("w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-slate-100")}>
                    {warmup.phase <= 2
                        ? <Flame className={cn("w-5 h-5", colors.icon)} />
                        : warmup.phase <= 4
                        ? <TrendingUp className={cn("w-5 h-5", colors.icon)} />
                        : <Shield className={cn("w-5 h-5", colors.icon)} />
                    }
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Isınma Skoru</p>
                        <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wide", colors.badge)}>
                            Faz {warmup.phase} — {warmup.label}
                        </span>
                    </div>

                    {/* Daily limit progress bar */}
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={cn("h-full rounded-full transition-all duration-700", colors.bar)}
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                        <span className="text-xs font-bold text-slate-600 shrink-0 tabular-nums">
                            {todaySentCount}/{warmup.dailyLimit}
                        </span>
                    </div>
                </div>

                {/* Right stats */}
                <div className="hidden md:flex items-center gap-4 shrink-0 text-center">
                    {/* Remaining */}
                    <div>
                        <p className="text-lg font-black text-slate-900 tabular-nums">{remainingToday}</p>
                        <p className="text-[10px] text-slate-400 font-medium">kalan</p>
                    </div>
                    <div className="w-px h-8 bg-slate-100" />
                    {/* Days elapsed */}
                    <div>
                        <p className="text-lg font-black text-slate-900 tabular-nums">{warmup.daysElapsed}</p>
                        <p className="text-[10px] text-slate-400 font-medium">gün</p>
                    </div>
                    {warmup.daysUntilNext !== null && (
                        <>
                            <div className="w-px h-8 bg-slate-100" />
                            <div>
                                <p className="text-lg font-black text-slate-900 tabular-nums flex items-center gap-0.5">
                                    <ChevronRight className="w-3 h-3 text-slate-400" />
                                    {warmup.nextLimit}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium">{warmup.daysUntilNext}gün sonra</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Overall warmup progress (phase milestones) */}
            <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-slate-400 rounded-full transition-all duration-1000"
                        style={{ width: `${warmupPct}%` }}
                    />
                </div>
                <p className="text-[10px] text-slate-400 font-medium shrink-0">
                    {warmup.phase < 5
                        ? `${warmup.daysElapsed}/30 gün — ${warmup.description}`
                        : `Tam kapasite — ${warmup.description}`}
                </p>
            </div>
        </div>
    );
};
