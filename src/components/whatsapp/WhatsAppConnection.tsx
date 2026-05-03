import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Unplug, Smartphone, Wifi, CheckCircle2 } from "lucide-react";
import { cn } from "@/utils/cn";

interface WhatsAppConnectionProps {
    connectionStatus: "connected" | "disconnected" | "connecting";
    qrCode: string | null;
    isQRModalOpen: boolean;
    isLoading?: boolean;
    onConnect: () => void;
    onDisconnect?: () => void;
    onOpenChange: (open: boolean) => void;
}

export const WhatsAppConnection = ({
    connectionStatus,
    qrCode,
    isQRModalOpen,
    isLoading = false,
    onConnect,
    onDisconnect,
    onOpenChange,
}: WhatsAppConnectionProps) => {
    return (
        <div className="flex items-center gap-3">
            {/* Bağlan butonu */}
            {connectionStatus !== "connected" && (
                <Button
                    size="sm"
                    onClick={onConnect}
                    className={cn(
                        "rounded-full font-bold transition-all h-9 px-4 text-sm",
                        isLoading
                            ? "bg-slate-100 text-slate-400 cursor-wait"
                            : qrCode
                                ? "bg-[#CCFF00] text-slate-900 hover:bg-[#b8e600] shadow-[0_0_16px_rgba(204,255,0,0.4)]"
                                : "bg-slate-900 text-white hover:bg-slate-700"
                    )}
                >
                    {isLoading ? (
                        <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Hazırlanıyor</>
                    ) : qrCode ? (
                        <><Smartphone className="w-3.5 h-3.5 mr-1.5" />QR Kodu Göster</>
                    ) : (
                        <><Wifi className="w-3.5 h-3.5 mr-1.5" />WhatsApp Bağla</>
                    )}
                </Button>
            )}

            {/* Bağlı badge */}
            {connectionStatus === "connected" && (
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span className="text-xs font-semibold text-emerald-700">WhatsApp Aktif</span>
                    </div>
                    {onDisconnect && (
                        <button
                            onClick={onDisconnect}
                            className="text-slate-300 hover:text-red-400 transition-colors p-1 rounded-full hover:bg-red-50"
                            title="Bağlantıyı Kes"
                        >
                            <Unplug className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}

            {/* Modal */}
            <Dialog open={isQRModalOpen} onOpenChange={onOpenChange}>
                <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-sm w-full outline-none [&>button]:hidden">
                    <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl shadow-black/20">

                        {/* Kapat butonu */}
                        <button
                            onClick={() => onOpenChange(false)}
                            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </button>

                        {connectionStatus === "connected" ? (
                            /* ── Bağlı ekranı ── */
                            <div className="flex flex-col items-center px-8 py-10">
                                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-5">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-500" strokeWidth={1.5} />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 mb-1.5">Bağlantı Aktif</h2>
                                <p className="text-sm text-slate-500 text-center mb-6">
                                    WhatsApp hesabınız bağlı.<br />Mesaj göndermeye hazırsınız.
                                </p>
                                {onDisconnect && (
                                    <button
                                        onClick={() => { onDisconnect(); onOpenChange(false); }}
                                        className="flex items-center gap-2 text-sm text-red-400 hover:text-red-600 transition-colors"
                                    >
                                        <Unplug className="w-3.5 h-3.5" />
                                        Bağlantıyı Kes
                                    </button>
                                )}
                            </div>
                        ) : (
                            /* ── QR ekranı ── */
                            <>
                                {/* Üst gradient başlık */}
                                <div className="relative bg-[#111827] px-8 pt-8 pb-6 overflow-hidden">
                                    {/* Dekoratif daireler */}
                                    <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-[#25D366]/10" />
                                    <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/5" />

                                    <div className="relative z-10">
                                        {/* WhatsApp ikonu */}
                                        <div className="w-12 h-12 rounded-2xl bg-[#25D366] flex items-center justify-center mb-4 shadow-lg shadow-[#25D366]/30">
                                            <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                            </svg>
                                        </div>
                                        <h2 className="text-xl font-bold text-white">WhatsApp Bağla</h2>
                                        <p className="text-sm text-white/50 mt-1">
                                            {qrCode ? "QR kodu telefonunuzla okutun" : "QR kod hazırlanıyor..."}
                                        </p>
                                    </div>
                                </div>

                                {/* QR alanı */}
                                <div className="px-8 py-7 flex flex-col items-center">
                                    <div className={cn(
                                        "relative w-56 h-56 rounded-2xl flex items-center justify-center transition-all duration-300",
                                        qrCode ? "bg-white ring-1 ring-slate-100 shadow-md" : "bg-slate-50"
                                    )}>
                                        {qrCode ? (
                                            <>
                                                {/* Köşe aksan çizgileri */}
                                                <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-[#25D366] rounded-tl-sm" />
                                                <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-[#25D366] rounded-tr-sm" />
                                                <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-[#25D366] rounded-bl-sm" />
                                                <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-[#25D366] rounded-br-sm" />
                                                <img
                                                    src={qrCode}
                                                    alt="WhatsApp QR"
                                                    className="w-44 h-44 object-contain"
                                                />
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="relative w-10 h-10">
                                                    <div className="absolute inset-0 rounded-full border-2 border-slate-200 border-t-[#25D366] animate-spin" />
                                                </div>
                                                <p className="text-xs text-slate-400 font-medium">Oluşturuluyor...</p>
                                            </div>
                                        )}
                                    </div>

                                    {qrCode && (
                                        <p className="mt-4 text-[11px] text-slate-400 flex items-center gap-1.5">
                                            <span className="w-1 h-1 rounded-full bg-slate-300 inline-block" />
                                            75 saniye geçerliliği var, otomatik yenilenir
                                        </p>
                                    )}

                                    {/* Adımlar */}
                                    <div className="w-full mt-6 space-y-2.5">
                                        {[
                                            "WhatsApp'ı açın → Ayarlar → Bağlı Cihazlar",
                                            "\"Cihaz Ekle\"ye dokunun",
                                            "Kamerayı bu QR koda tutun",
                                        ].map((step, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <span className="w-5 h-5 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center text-[10px] font-bold shrink-0">
                                                    {i + 1}
                                                </span>
                                                <span className="text-xs text-slate-500">{step}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
