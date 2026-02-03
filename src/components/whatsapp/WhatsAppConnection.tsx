import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

interface WhatsAppConnectionProps {
    connectionStatus: "connected" | "disconnected" | "connecting";
    qrCode: string | null;
    isQRModalOpen: boolean;
    onConnect: () => void;
    onOpenChange: (open: boolean) => void;
}

export const WhatsAppConnection = ({
    connectionStatus,
    qrCode,
    isQRModalOpen,
    onConnect,
    onOpenChange
}: WhatsAppConnectionProps) => {
    return (
        <div className="flex items-center gap-4">
            {connectionStatus !== "connected" && (
                <Button
                    size="sm"
                    onClick={onConnect}
                    disabled={connectionStatus === "connecting" && !qrCode}
                    className={cn(
                        "rounded-full font-bold transition-all",
                        qrCode ? "bg-[#CCFF00] text-slate-900 hover:bg-[#b8e600]" : "bg-slate-900 text-white hover:bg-slate-800"
                    )}
                >
                    {qrCode ? "QR Kodu Göster" : (connectionStatus === "connecting" ? "Hazırlanıyor..." : "QR Kod Oluştur")}
                </Button>
            )}
            {connectionStatus === "connected" && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1.5 gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Çevrimiçi
                </Badge>
            )}

            <Dialog open={isQRModalOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-3xl overflow-hidden p-0">
                    <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                        <div className="relative z-10">
                            <DialogTitle className="text-2xl font-bold text-white mb-2">WhatsApp Bağlantısı</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Otomasyonu başlatmak için cihazınızı bağlayın.
                            </DialogDescription>
                        </div>
                    </div>

                    <div className="p-8 flex flex-col items-center">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000" />
                            <div className="relative bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                {qrCode ? (
                                    <img src={qrCode} alt="QR" className="w-64 h-64 object-contain mix-blend-multiply" />
                                ) : (
                                    <div className="w-64 h-64 flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 w-full space-y-3">
                            <div className="flex items-center gap-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                                <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs shrink-0">1</span>
                                <span>WhatsApp {'>'} Ayarlar {'>'} Bağlı Cihazlar</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                                <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs shrink-0">2</span>
                                <span>Kamerayı QR koda tutun</span>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
