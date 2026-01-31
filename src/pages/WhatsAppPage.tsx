import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
    Loader2,
    Sparkles,
    CheckCircle2,
    Clock,
    MessageSquare,
    LayoutGrid,
    Search,
    Trash2,
    Play
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { n8nEvolutionService } from "@/services/n8nEvolutionService";
import { useLeads } from "@/hooks/useLeads";
import { useQRCode } from "@/hooks/useQRCode";
import { cn } from "@/utils/cn";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Lead {
    id: string;
    name: string;
    company: string;
    phone: string;
}

interface MessageQueueItem {
    id: string;
    lead: Lead;
    message: string;
    status: "pending" | "sending" | "sent" | "failed";
    error?: string;
}

const WhatsAppPage = () => {
    // UI State
    const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting">("disconnected");
    const [selectedLeads, setSelectedLeads] = useState<Lead[]>([]);
    const [messageQueue, setMessageQueue] = useState<MessageQueueItem[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [previewMessage, setPreviewMessage] = useState<string>("");
    const [previewLead, setPreviewLead] = useState<Lead | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [bulkSendStatus, setBulkSendStatus] = useState<"idle" | "sending" | "completed">("idle");
    const [lastCompletionTime, setLastCompletionTime] = useState<Date | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const INSTANCE_NAME = "testwp";
    const { qrCode, clearQRCode } = useQRCode(INSTANCE_NAME);

    // Automatically open modal when QR code arrives - REMOVED per user request
    const [dismissedQR, setDismissedQR] = useState<string | null>(null);

    // Automatically close modal when connected
    // Automatically close modal when connected
    useEffect(() => {
        if (connectionStatus === "connected") {
            setIsQRModalOpen(false);
        }
    }, [connectionStatus]);

    // Load state from local storage on mount
    useEffect(() => {
        const storedLeads = localStorage.getItem("whatsapp_selected_leads");
        const storedQueue = localStorage.getItem("whatsapp_message_queue");
        // const storedStatus = localStorage.getItem("whatsapp_bulk_status");

        if (storedLeads) setSelectedLeads(JSON.parse(storedLeads));
        if (storedQueue) setMessageQueue(JSON.parse(storedQueue));
        // if (storedStatus) setBulkSendStatus(storedStatus as any);
    }, []);

    // Save state to local storage on changes
    useEffect(() => {
        localStorage.setItem("whatsapp_selected_leads", JSON.stringify(selectedLeads));
    }, [selectedLeads]);

    useEffect(() => {
        localStorage.setItem("whatsapp_message_queue", JSON.stringify(messageQueue));
    }, [messageQueue]);

    // Listen for bulk send completion notifications from Supabase
    useEffect(() => {
        const channel = supabase
            .channel('whatsapp-completion-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications'
                },
                (payload) => {
                    const notification = payload.new as { title: string; message: string };
                    if (notification.title.includes('Tamamlandı')) {
                        setBulkSendStatus('completed');
                        setLastCompletionTime(new Date());

                        // Reset status after 20 seconds
                        setTimeout(() => {
                            setBulkSendStatus('idle');
                        }, 20000);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Fail-safe: Automatically complete status when queue is empty of active items
    useEffect(() => {
        if (bulkSendStatus === 'sending') {
            const hasActiveItems = messageQueue.some(item => item.status === 'pending' || item.status === 'sending');
            if (!hasActiveItems) {
                // If all items are processed (sent/failed), complete the batch status
                const timer = setTimeout(() => {
                    setBulkSendStatus('completed');
                    setLastCompletionTime(new Date());

                    // Reset to idle after 5 seconds
                    setTimeout(() => setBulkSendStatus('idle'), 5000);
                }, 1000);
                return () => clearTimeout(timer);
            }
        }
    }, [messageQueue, bulkSendStatus]);

    const { leads: realLeads } = useLeads();
    const offerType = "yapay zeka çözümleri ile işletmenizi büyütme";

    // Action: Start Connection Process
    const handleConnect = async () => {
        // Always open modal immediately on click
        setIsQRModalOpen(true);
        setDismissedQR(null);

        if (qrCode) {
            return;
        }

        setConnectionStatus("connecting");
        clearQRCode();

        try {
            await n8nEvolutionService.startSession(INSTANCE_NAME);

        } catch (error) {
            console.error("Connection failed:", error);
            setConnectionStatus("disconnected");
        }
    };

    const handleSelectLead = async (leadId: string) => {
        const lead = realLeads.find(l => l.id === leadId);
        if (!lead) return;

        if (selectedLeads.find(l => l.id === leadId)) {
            setSelectedLeads(selectedLeads.filter(l => l.id !== leadId));
            if (previewLead?.id === leadId) {
                setPreviewLead(null);
                setPreviewMessage("");
            }
        } else {
            setSelectedLeads([...selectedLeads, lead]);
            setPreviewLead(lead); // Auto-preview last selected
            generatePreview(lead);
        }
    };

    const generatePreview = async (lead: Lead) => {
        setIsPreviewLoading(true);
        setPreviewMessage("Yapay zeka şirketi analiz edip özel teklif mesajı hazırlıyor... 🤖");

        try {
            const message = await n8nEvolutionService.generateMessage(lead.name, offerType);
            setPreviewMessage(message);
        } catch (error) {
            console.error("AI Error:", error);
            setPreviewMessage("Mesaj oluşturulamadı. Lütfen tekrar deneyin.");
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const handleAddToQueue = () => {
        if (selectedLeads.length === 0) {
            return;
        }

        const newQueue = selectedLeads.map(lead => {
            // Use preview message if this is the lead we currently previewed
            const message = (previewLead?.id === lead.id && previewMessage)
                ? previewMessage
                : `Merhaba ${lead.name}! 🚀 ${offerType} hakkında görüşmek isteriz.`;

            return {
                id: crypto.randomUUID(),
                lead,
                message,
                status: "pending" as const
            };
        });

        setMessageQueue(prev => [...prev, ...newQueue]);
        setSelectedLeads([]); // Clear selection after adding
        setPreviewLead(null);
        setPreviewMessage("");
    };

    const handleSendQueue = async () => {
        setIsSending(true);

        const pendingItems = messageQueue.filter(item => item.status === 'pending');
        if (pendingItems.length === 0) {
            setIsSending(false);
            return;
        }

        try {
            // Update UI to show we are processing
            setMessageQueue(prev => prev.map(msg => msg.status === 'pending' ? { ...msg, status: 'sending' } : msg));
            setBulkSendStatus('sending');

            // Send all to N8N for bulk processing
            const result = await n8nEvolutionService.sendBulkMessages(pendingItems);

            if (result.success) {
                // Mark all as sent (queued in N8N)
                setMessageQueue(prev => prev.map(msg => msg.status === 'sending' ? { ...msg, status: 'sent' } : msg));
            } else {
                throw new Error("Bulk send failed");
            }
        } catch (error) {
            console.error("Queue send error:", error);
            setMessageQueue(prev => prev.map(msg => msg.status === 'sending' ? { ...msg, status: 'failed' } : msg));
        } finally {
            setIsSending(false);
        }
    };

    const handleClearQueue = () => setMessageQueue([]);

    const handleRemoveFromQueue = (id: string) => {
        setMessageQueue(prev => prev.filter(item => item.id !== id));
    };

    // Filter leads
    const filteredLeads = realLeads.filter(lead =>
        lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pendingCount = messageQueue.filter(m => m.status === 'pending').length;

    return (
        <div className="h-screen bg-slate-50 flex flex-col overflow-hidden font-sans text-slate-900">
            {/* Top Bar */}
            <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-[#CCFF00]">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">WhatsApp Otomasyonu</h1>
                        <p className="text-xs text-slate-500 font-medium hidden md:block">Yapay Zeka Destekli Mesajlaşma Merkezi</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {connectionStatus !== "connected" && (
                        <Button
                            size="sm"
                            onClick={handleConnect}
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
                </div>
            </header>

            {/* Thin Status Banner - Below Header */}
            {(bulkSendStatus === 'sending' || bulkSendStatus === 'completed') && (
                <div className={cn(
                    "relative overflow-hidden px-6 py-2 flex items-center justify-center gap-3 transition-all duration-300",
                    bulkSendStatus === 'sending'
                        ? "bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-b border-amber-100"
                        : "bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 border-b border-emerald-100"
                )}>
                    {/* Shimmer Animation */}
                    <div className={cn(
                        "absolute inset-0 -translate-x-full",
                        bulkSendStatus === 'sending'
                            ? "bg-gradient-to-r from-transparent via-amber-200/40 to-transparent"
                            : "bg-gradient-to-r from-transparent via-emerald-200/40 to-transparent"
                    )} style={{ animation: 'shimmer 2s infinite' }} />

                    {bulkSendStatus === 'sending' ? (
                        <>
                            <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                            <span className="text-xs font-medium text-amber-700">Mesajlar gönderiliyor...</span>
                            <span className="text-xs text-amber-500">🛡️ Spam korumalı</span>
                            <span className="relative flex h-1.5 w-1.5 ml-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                            </span>
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-xs font-medium text-emerald-700">Tüm mesajlar başarıyla gönderildi!</span>
                            <span className="text-xs text-emerald-500">{lastCompletionTime?.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </>
                    )}
                </div>
            )}

            {/* 3-Column Layout */}
            <div className="flex-1 grid grid-cols-12 min-h-0 divide-x divide-slate-100">

                {/* COLUMN 1: Lead Selection (25%) */}
                <div className="hidden lg:flex col-span-3 flex-col bg-white min-h-0">
                    <div className="p-4 border-b border-slate-50 flex flex-col gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Lead ara..."
                                className="pl-10 bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-slate-200"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
                        <span>MÜŞTERİ LİSTESİ</span>
                        <span>{filteredLeads.length} Kişi</span>
                    </div>

                    <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar h-[calc(100vh-180px)]">
                        {filteredLeads.map(lead => {
                            const isSelected = selectedLeads.some(l => l.id === lead.id);
                            return (
                                <button
                                    key={lead.id}
                                    onClick={() => handleSelectLead(lead.id)}
                                    className={cn(
                                        "w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all border group",
                                        isSelected
                                            ? "bg-[#CCFF00]/10 border-[#CCFF00] shadow-sm"
                                            : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-100"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all shrink-0",
                                        isSelected ? "bg-[#CCFF00] text-slate-900" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                                    )}>
                                        {lead.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <h3 className="font-semibold text-sm text-slate-900 leading-snug line-clamp-2 break-words">{lead.name}</h3>
                                            {isSelected && <CheckCircle2 className="w-4 h-4 text-[#CCFF00] fill-slate-900 shrink-0 mt-0.5" />}
                                        </div>
                                        <p className="text-xs text-slate-500 truncate mt-0.5">{lead.company}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* COLUMN 2: Workspace / Producer (45%) */}
                <div className="col-span-12 lg:col-span-5 flex flex-col bg-slate-50/50 min-h-0 relative">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #0f172a 1px, transparent 0)', backgroundSize: '24px 24px' }}
                    />

                    <div className="flex-1 p-8 flex flex-col items-center justify-center overflow-y-auto z-10">
                        {selectedLeads.length > 0 && previewLead ? (
                            <div className="w-full max-w-md animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                                <div className="text-center mb-6">
                                    <Badge className="bg-white hover:bg-white text-slate-500 border border-slate-200 shadow-sm mb-4 py-1.5 px-4">
                                        <Sparkles className="w-3.5 h-3.5 mr-2 text-purple-500" />
                                        Llama 3.3 70B ile oluşturuldu
                                    </Badge>
                                </div>

                                <div className="bg-white rounded-3xl p-6 shadow-2xl shadow-slate-200/50 border border-slate-100 relative group">
                                    {/* Chat Header */}
                                    <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                                                {previewLead.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-sm">{previewLead.name}</h3>
                                                <p className="text-xs text-slate-400">{previewLead.company}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => generatePreview(previewLead)}
                                                className="h-8 w-8 text-slate-400 hover:text-[#CCFF00] hover:bg-slate-900 transition-colors"
                                                title="Yeniden Oluştur"
                                            >
                                                <Sparkles className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => setIsEditing(!isEditing)}
                                                className={cn(
                                                    "h-8 w-8 transition-colors",
                                                    isEditing ? "text-[#CCFF00] bg-slate-900 hover:bg-slate-800" : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                                                )}
                                                title="Düzenle"
                                            >
                                                {isEditing ? <CheckCircle2 className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Message Body */}
                                    <div className="min-h-[120px]">
                                        {isPreviewLoading ? (
                                            <div className="space-y-2">
                                                <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse" />
                                                <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse" />
                                                <div className="h-4 bg-slate-100 rounded w-5/6 animate-pulse" />
                                            </div>
                                        ) : isEditing ? (
                                            <textarea
                                                className="w-full h-full min-h-[120px] bg-slate-50 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent p-3 text-slate-700 text-base leading-relaxed placeholder:text-slate-400 font-medium transition-all"
                                                value={previewMessage}
                                                onChange={(e) => setPreviewMessage(e.target.value)}
                                                placeholder="Mesajınızı düzenleyin..."
                                                autoFocus
                                            />
                                        ) : (
                                            <div className="text-slate-700 text-base leading-relaxed whitespace-pre-wrap p-1 border border-transparent">
                                                {previewMessage}
                                            </div>
                                        )}
                                    </div>

                                    {/* Timestamp */}
                                    <div className="flex justify-end mt-4">
                                        <span className="text-[10px] text-slate-300 font-medium">Şimdi</span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-8 grid grid-cols-2 gap-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setSelectedLeads([])}
                                        className="h-12 bg-white border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:scale-105 transition-all duration-300"
                                    >
                                        İptal
                                    </Button>
                                    <Button
                                        className="h-12 bg-[#CCFF00] hover:bg-[#d9ff40] text-slate-900 font-bold shadow-[0_0_20px_rgba(204,255,0,0.4)] hover:shadow-[0_0_30px_rgba(204,255,0,0.6)] hover:scale-105 transition-all duration-300"
                                        onClick={() => {
                                            setIsEditing(false);
                                            handleAddToQueue();
                                        }}
                                        disabled={isPreviewLoading}
                                    >
                                        Kuyruğa Ekle
                                    </Button>
                                </div>
                                <p className="text-center text-xs text-slate-400 mt-4">
                                    {selectedLeads.length > 1 ? `ve ${selectedLeads.length - 1} diğer kişi için de eklenecek` : "Seçili kişi için kuyruğa eklenecek"}
                                </p>
                            </div>
                        ) : (
                            <div className="text-center max-w-sm">
                                <div className="w-24 h-24 bg-white rounded-3xl shadow-xl shadow-indigo-100 border border-slate-50 flex items-center justify-center mx-auto mb-6 rotate-3 transform transition-transform hover:rotate-6">
                                    <LayoutGrid className="w-10 h-10 text-indigo-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Çalışma Alanı Boş</h2>
                                <p className="text-slate-500">
                                    Mesaj oluşturmaya başlamak için sol taraftaki listeden bir veya daha fazla müşteri seçin.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUMN 3: Queue Manager (30%) */}
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
                                onClick={handleClearQueue}
                                disabled={messageQueue.length === 0 || isSending}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex gap-2 text-xs font-medium text-slate-500">
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-0">{messageQueue.length} Toplam</Badge>
                            <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-0">{pendingCount} Bekleyen</Badge>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 custom-scrollbar">
                        {messageQueue.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 opacity-50">
                                <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center">
                                    <Clock className="w-8 h-8" />
                                </div>
                                <p className="text-sm font-medium">Kuyruk boş</p>
                            </div>
                        ) : (
                            messageQueue.map((item) => (
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
                                                onClick={() => handleRemoveFromQueue(item.id)}
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
                            onClick={handleSendQueue}
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
            </div>

            {/* QR Code Modal */}
            <Dialog open={isQRModalOpen} onOpenChange={(open) => {
                setIsQRModalOpen(open);
                if (!open && qrCode) {
                    setDismissedQR(qrCode);
                }
            }}>
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
                                <span>Kamerayı QR koda tutun (Dismissable)</span>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default WhatsAppPage;
