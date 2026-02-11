import { Trash2, Clock, CheckCircle2, Play, Loader2, RefreshCw, Send, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageQueueItem } from "@/types/whatsapp";
import { cn } from "@/utils/cn";

interface MessageQueueProps {
    queue: MessageQueueItem[];
    isSending: boolean;
    todaySentCount: number;
    totalSuccessRate: number;
    onClearQueue: () => void;
    onRemoveItem: (id: string) => void;
    onRetryItem: (id: string) => void;
    onSendQueue: () => void;
}

export const MessageQueue = ({
    queue,
    isSending,
    todaySentCount,
    totalSuccessRate,
    onClearQueue,
    onRemoveItem,
    onRetryItem,
    onSendQueue
}: MessageQueueProps) => {
    const pendingCount = queue.filter(m => m.status === 'pending').length;
    const sentCount = queue.filter(m => m.status === 'sent').length;
    const failedCount = queue.filter(m => m.status === 'failed').length;

    return (
        <div className="col-span-12 lg:col-span-4 bg-white border-l border-slate-100 flex flex-col min-h-0">
            <div className="p-6 border-b border-slate-50 bg-white z-10">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#CCFF00]" />
                        <h2 className="font-bold text-slate-900">Gönderim Kuyruğu</h2>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-red-500 h-8 px-2"
                        onClick={onClearQueue}
                        disabled={queue.length === 0 || isSending}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
                <div className="flex gap-2 text-xs font-medium text-slate-500">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-0">{queue.length} Toplam</Badge>
                    <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-0">{pendingCount} Bekleyen</Badge>
                    {sentCount > 0 && (
                        <Badge variant="secondary" className="bg-green-50 text-green-600 border-0">{sentCount} Gönderildi</Badge>
                    )}
                    {failedCount > 0 && (
                        <Badge variant="secondary" className="bg-red-50 text-red-600 border-0">{failedCount} Hata</Badge>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 custom-scrollbar">
                {queue.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 px-6">
                        {/* Animated empty state */}
                        <div className="relative mb-6">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/50 flex items-center justify-center">
                                <Send className="w-8 h-8 text-slate-300" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#CCFF00]/20 flex items-center justify-center">
                                <Zap className="w-3 h-3 text-[#CCFF00]" />
                            </div>
                        </div>

                        <p className="text-sm font-semibold text-slate-500 mb-1">Kuyruk Hazır</p>
                        <p className="text-xs text-slate-400 text-center leading-relaxed mb-6">
                            Müşteri seçip mesaj oluşturun,<br />kuyruğa ekleyin ve toplu gönderin
                        </p>

                        {/* Mini stats cards */}
                        <div className="w-full grid grid-cols-2 gap-2">
                            <div className="bg-white rounded-xl p-3 border border-slate-100 text-center">
                                <div className="flex items-center justify-center gap-1.5 mb-1">
                                    <TrendingUp className="w-3.5 h-3.5 text-[#CCFF00]" />
                                    <span className="text-lg font-bold text-slate-900">{todaySentCount}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium">Bugün Gönderilen</span>
                            </div>
                            <div className="bg-white rounded-xl p-3 border border-slate-100 text-center">
                                <div className="flex items-center justify-center gap-1.5 mb-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                    <span className="text-lg font-bold text-slate-900">%{totalSuccessRate}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium">Başarı Oranı</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    queue.map((item) => (
                        <div
                            key={item.id}
                            className={cn(
                                "bg-white p-4 rounded-xl border transition-all relative group overflow-hidden",
                                item.status === 'sending' ? "border-blue-200 shadow-md ring-1 ring-blue-100" :
                                    item.status === 'sent' ? "border-green-100 opacity-75" : "border-slate-100 hover:border-slate-200"
                            )}
                        >
                            {item.status === 'sending' && (
                                <div className="absolute bottom-0 left-0 h-1 bg-blue-500/20 w-full">
                                    <div className="h-full bg-blue-500 w-1/2 animate-[progress_1s_ease-in-out_infinite]" />
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-start gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                        {item.lead.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-semibold text-sm text-slate-900 leading-snug line-clamp-2 break-words">{item.lead.name}</h4>
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                            {item.lead.company}
                                        </p>
                                    </div>
                                </div>
                                {item.status === 'pending' && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-slate-300 hover:text-red-500 -mt-1 -mr-1 opacity-0 group-hover:opacity-100"
                                        onClick={() => onRemoveItem(item.id)}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                )}
                                {item.status === 'sent' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                                {item.status === 'failed' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-red-500 hover:text-orange-600 hover:bg-orange-50 gap-1 text-xs font-semibold"
                                        onClick={() => onRetryItem(item.id)}
                                    >
                                        <RefreshCw className="w-3 h-3" />
                                        Tekrar
                                    </Button>
                                )}
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2 pl-10 border-l-2 border-slate-100">
                                {item.message}
                            </p>
                        </div>
                    ))
                )}
            </div>

            {/* Premium Send Button */}
            <div className="p-6 border-t border-slate-50 bg-white">
                <div className="relative group">
                    {/* Rotating conic gradient border (only when active) */}
                    {pendingCount > 0 && !isSending && (
                        <>
                            <div className="absolute -inset-[2px] rounded-2xl overflow-hidden">
                                <div
                                    className="absolute inset-0 animate-[borderSpin_4s_linear_infinite]"
                                    style={{
                                        background: 'conic-gradient(from 0deg, #CCFF00, #22c55e, #CCFF00, transparent 50%)',
                                    }}
                                />
                            </div>
                            <div className="absolute -inset-1 bg-[#CCFF00]/30 rounded-2xl blur-lg animate-[breathe_3s_ease-in-out_infinite]" />
                            {/* Sparkle particles */}
                            <div className="absolute -top-1 left-[25%] w-1 h-1 bg-[#CCFF00] rounded-full animate-ping opacity-60" />
                            <div className="absolute -bottom-1 right-[25%] w-1 h-1 bg-[#22c55e] rounded-full animate-ping opacity-50" style={{ animationDelay: '0.8s' }} />
                        </>
                    )}

                    <button
                        className={cn(
                            "relative w-full overflow-hidden rounded-2xl transition-all duration-300",
                            isSending || pendingCount === 0
                                ? "bg-slate-200 cursor-not-allowed"
                                : "bg-slate-900 shadow-[0_0_30px_rgba(204,255,0,0.3)] hover:shadow-[0_0_50px_rgba(204,255,0,0.5)] hover:scale-[1.02] active:scale-[0.97]"
                        )}
                        onClick={onSendQueue}
                        disabled={isSending || pendingCount === 0}
                    >
                        {/* Scanning line sweep */}
                        {!isSending && pendingCount > 0 && (
                            <div className="absolute inset-0 animate-[scanLine_2.5s_ease-in-out_infinite]">
                                <div className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            </div>
                        )}

                        <div className={cn(
                            "relative flex items-center justify-center gap-3 px-6 py-4 transition-all",
                            isSending || pendingCount === 0
                                ? "text-slate-400"
                                : "text-white"
                        )}>
                            {isSending ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span className="text-lg font-bold">Gönderiliyor...</span>
                                </>
                            ) : (
                                <>
                                    <span className={cn(
                                        "flex h-2.5 w-2.5 rounded-full",
                                        pendingCount > 0
                                            ? "bg-[#CCFF00] shadow-[0_0_10px_rgba(204,255,0,0.8)] animate-pulse"
                                            : "bg-slate-300"
                                    )} />
                                    <span className="text-lg font-bold tracking-wide">
                                        {pendingCount > 0 ? `${pendingCount} Mesajı Gönder` : "Gönderimi Başlat"}
                                    </span>
                                    <div className={cn(
                                        "flex h-8 w-8 items-center justify-center rounded-full transition-transform",
                                        pendingCount > 0
                                            ? "bg-[#CCFF00] text-slate-900 group-hover:scale-110"
                                            : "bg-slate-300 text-slate-500"
                                    )}>
                                        <Play className="w-4 h-4 fill-current ml-0.5" />
                                    </div>
                                </>
                            )}
                        </div>
                    </button>
                </div>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes borderSpin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes breathe {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.02); }
                }
                @keyframes scanLine {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(500%); }
                }
            `}</style>
        </div>
    );
};
