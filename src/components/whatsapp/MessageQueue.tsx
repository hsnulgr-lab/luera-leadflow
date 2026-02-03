import { Trash2, Clock, CheckCircle2, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageQueueItem } from "@/types/whatsapp";
import { cn } from "@/utils/cn";

interface MessageQueueProps {
    queue: MessageQueueItem[];
    isSending: boolean;
    onClearQueue: () => void;
    onRemoveItem: (id: string) => void;
    onSendQueue: () => void;
}

export const MessageQueue = ({
    queue,
    isSending,
    onClearQueue,
    onRemoveItem,
    onSendQueue
}: MessageQueueProps) => {
    const pendingCount = queue.filter(m => m.status === 'pending').length;

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
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 custom-scrollbar">
                {queue.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 opacity-50">
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center">
                            <Clock className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-medium">Kuyruk boş</p>
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
                                {item.status === 'failed' && <div className="text-xs text-red-500 font-bold">Hata</div>}
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2 pl-10 border-l-2 border-slate-100">
                                {item.message}
                            </p>
                        </div>
                    ))
                )}
            </div>

            <div className="p-6 border-t border-slate-50 bg-white">
                <button
                    className={cn(
                        "group relative w-full overflow-hidden rounded-2xl p-px transition-all duration-300",
                        isSending || pendingCount === 0
                            ? "bg-slate-200 cursor-not-allowed"
                            : "bg-gradient-to-r from-emerald-400 via-[#CCFF00] to-emerald-400 shadow-[0_0_30px_rgba(204,255,0,0.3)] hover:shadow-[0_0_40px_rgba(204,255,0,0.5)] active:scale-[0.98]"
                    )}
                    onClick={onSendQueue}
                    disabled={isSending || pendingCount === 0}
                >
                    <div className={cn(
                        "relative flex items-center justify-center gap-3 rounded-2xl px-6 py-4 transition-all",
                        isSending || pendingCount === 0
                            ? "bg-slate-100 text-slate-400"
                            : "bg-slate-900 text-white group-hover:bg-slate-800"
                    )}>
                        {isSending ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-lg font-bold">Gönderiliyor...</span>
                            </>
                        ) : (
                            <>
                                <span className="flex h-2.5 w-2.5 rounded-full bg-[#CCFF00] shadow-[0_0_10px_rgba(204,255,0,0.8)] animate-pulse" />
                                <span className="text-lg font-bold">
                                    {pendingCount > 0 ? `${pendingCount} Mesajı Gönder` : "Gönderimi Başlat"}
                                </span>
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#CCFF00] text-slate-900 transition-transform group-hover:scale-110">
                                    <Play className="w-4 h-4 fill-current ml-0.5" />
                                </div>
                            </>
                        )}
                    </div>
                </button>
            </div>
        </div>
    );
};
