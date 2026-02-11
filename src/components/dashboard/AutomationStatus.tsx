import { CheckCircle2, Loader2, Circle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Step {
    label: string;
    completed: boolean;
}

interface AutomationStatusProps {
    progress: number;
    currentStep: number;
    steps: Step[];
}

export const AutomationStatus = ({ progress, currentStep, steps }: AutomationStatusProps) => {
    const isComplete = progress >= 100;

    return (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800/80">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            isComplete ? "bg-[#CCFF00]/15" : "bg-slate-800"
                        )}>
                            {isComplete ? (
                                <CheckCircle2 className="w-4 h-4 text-[#CCFF00]" />
                            ) : (
                                <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-white">
                                {isComplete ? "Tarama Tamamlandı" : "Tarama Devam Ediyor"}
                            </h3>
                            <p className="text-[11px] text-slate-500">
                                {isComplete ? "Tüm veriler başarıyla toplandı" : "Lütfen bekleyin..."}
                            </p>
                        </div>
                    </div>
                    <div className={cn(
                        "text-lg font-bold tabular-nums",
                        isComplete ? "text-[#CCFF00]" : "text-white"
                    )}>
                        {progress}%
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="px-5 pt-4 pb-1">
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className={cn(
                            "h-full rounded-full transition-all duration-700 ease-out relative",
                            isComplete
                                ? "bg-[#CCFF00]"
                                : "bg-gradient-to-r from-[#CCFF00]/70 to-[#CCFF00]"
                        )}
                        style={{ width: `${progress}%` }}
                    >
                        {!isComplete && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                        )}
                    </div>
                </div>
            </div>

            {/* Steps */}
            <div className="px-5 py-4 space-y-0.5">
                {steps.map((step, index) => {
                    const isActive = index === currentStep && !step.completed;
                    const isPending = !step.completed && index > currentStep;

                    return (
                        <div
                            key={index}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300",
                                isActive && "bg-slate-800/60"
                            )}
                        >
                            {/* Indicator */}
                            <div className="flex-shrink-0">
                                {step.completed ? (
                                    <div className="w-5 h-5 rounded-full bg-[#CCFF00]/15 flex items-center justify-center">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-[#CCFF00]" />
                                    </div>
                                ) : isActive ? (
                                    <div className="relative w-5 h-5 flex items-center justify-center">
                                        <div className="w-2 h-2 bg-[#CCFF00] rounded-full" />
                                        <div className="absolute inset-0 rounded-full border border-[#CCFF00]/30 animate-ping" />
                                    </div>
                                ) : (
                                    <div className="w-5 h-5 flex items-center justify-center">
                                        <Circle className="w-3 h-3 text-slate-600" />
                                    </div>
                                )}
                            </div>

                            {/* Label */}
                            <span className={cn(
                                "text-sm font-medium flex-1",
                                step.completed && "text-slate-300",
                                isActive && "text-white",
                                isPending && "text-slate-600"
                            )}>
                                {step.label}
                            </span>

                            {/* Status */}
                            {isActive && (
                                <span className="text-[10px] font-semibold tracking-wider uppercase text-[#CCFF00]/70">
                                    İşleniyor
                                </span>
                            )}
                            {step.completed && (
                                <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-500">
                                    Tamam
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Inline CSS for shimmer */}
            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
                .animate-shimmer {
                    animation: shimmer 1.5s infinite;
                }
            `}</style>
        </div>
    );
};
