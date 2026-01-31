import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';
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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-200/50 p-6 shadow-2xl shadow-gray-200/50">
            {/* Animated background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#CCFF00]/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-400/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />

            {/* Success confetti when complete */}
            {isComplete && (
                <>
                    <div className="absolute top-2 left-1/4 w-1.5 h-1.5 bg-[#CCFF00] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="absolute top-4 left-1/3 w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                    <div className="absolute top-3 right-1/4 w-1.5 h-1.5 bg-[#CCFF00] rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                    <div className="absolute top-5 right-1/3 w-1 h-1 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '600ms' }} />
                </>
            )}

            {/* Header */}
            <div className="relative flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "relative w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                        isComplete ? "bg-[#CCFF00]" : "bg-purple-100"
                    )}>
                        {isComplete ? (
                            <Sparkles className="w-5 h-5 text-gray-900" />
                        ) : (
                            <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                        )}
                        {!isComplete && (
                            <div className="absolute inset-0 rounded-xl bg-purple-400 animate-ping opacity-20" />
                        )}
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-900">Otomasyon Durumu</h2>
                        <p className="text-xs text-gray-400">
                            {isComplete ? "Tüm işlemler tamamlandı!" : "İşlemler devam ediyor..."}
                        </p>
                    </div>
                </div>

                {/* Animated percentage */}
                <div className={cn(
                    "text-2xl font-black tabular-nums transition-all",
                    isComplete ? "text-[#9dcc00]" : "text-purple-600"
                )}>
                    <span className="animate-pulse">{progress}</span>%
                </div>
            </div>

            {/* Progress bar */}
            <div className="relative mb-6">
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={cn(
                            "h-full transition-all duration-700 ease-out rounded-full relative",
                            isComplete
                                ? "bg-gradient-to-r from-[#CCFF00] to-[#9dcc00]"
                                : "bg-gradient-to-r from-purple-500 to-purple-400"
                        )}
                        style={{ width: `${progress}%` }}
                    >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />

                        {/* Glowing tip */}
                        {!isComplete && (
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-300 rounded-full blur-sm animate-pulse" />
                        )}
                    </div>
                </div>
            </div>

            {/* Steps */}
            <div className="space-y-2">
                {steps.map((step, index) => {
                    const isActive = index === currentStep && !step.completed;
                    const isPending = !step.completed && index > currentStep;

                    return (
                        <div
                            key={index}
                            className={cn(
                                "flex items-center gap-3 p-2.5 rounded-lg transition-all duration-300",
                                step.completed && "bg-[#CCFF00]/10",
                                isActive && "bg-purple-50"
                            )}
                        >
                            {/* Step indicator */}
                            <div className={cn(
                                "relative w-6 h-6 rounded-full flex items-center justify-center transition-all",
                                step.completed && "bg-[#CCFF00]",
                                isActive && "bg-purple-500",
                                isPending && "bg-gray-100"
                            )}>
                                {step.completed ? (
                                    <CheckCircle2 className="w-4 h-4 text-gray-900" />
                                ) : isActive ? (
                                    <>
                                        <div className="w-2 h-2 bg-white rounded-full" />
                                        <div className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-40" />
                                    </>
                                ) : (
                                    <div className="w-2 h-2 bg-gray-300 rounded-full" />
                                )}
                            </div>

                            {/* Step label */}
                            <span className={cn(
                                "text-sm font-medium flex-1 transition-colors",
                                step.completed && "text-gray-900",
                                isActive && "text-purple-700",
                                isPending && "text-gray-400"
                            )}>
                                {step.label}
                            </span>

                            {/* Status badge */}
                            {isActive && (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 rounded-full">
                                    <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            )}
                            {step.completed && (
                                <span className="text-xs font-medium text-[#9dcc00] px-2 py-0.5 bg-[#CCFF00]/20 rounded-full">
                                    ✓
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* CSS */}
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
