import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
    Loader2,
    Sparkles,
    CheckCircle2,
    MessageSquare,
    LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { n8nEvolutionService } from "@/services/n8nEvolutionService";
import { useLeads } from "@/hooks/useLeads";
import { useQRCode } from "@/hooks/useQRCode";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/badge";

// Types
import { Lead, MessageQueueItem } from "@/types/whatsapp";

// Components
import { WhatsAppConnection } from "@/components/whatsapp/WhatsAppConnection";
import { LeadSelector } from "@/components/whatsapp/LeadSelector";
import { MessageQueue } from "@/components/whatsapp/MessageQueue";

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

        if (storedLeads) setSelectedLeads(JSON.parse(storedLeads));
        if (storedQueue) setMessageQueue(JSON.parse(storedQueue));
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
                const timer = setTimeout(() => {
                    setBulkSendStatus('completed');
                    setLastCompletionTime(new Date());
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
        setIsQRModalOpen(true);

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
            setMessageQueue(prev => prev.map(msg => msg.status === 'pending' ? { ...msg, status: 'sending' } : msg));
            setBulkSendStatus('sending');

            const result = await n8nEvolutionService.sendBulkMessages(pendingItems);

            if (result.success) {
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

    const filteredLeads = realLeads.filter(lead =>
        lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                    <WhatsAppConnection
                        connectionStatus={connectionStatus}
                        qrCode={qrCode}
                        isQRModalOpen={isQRModalOpen}
                        onConnect={handleConnect}
                        onOpenChange={(open) => {
                            setIsQRModalOpen(open);
                        }}
                    />
                </div>
            </header>

            {/* Status Banner */}
            {(bulkSendStatus === 'sending' || bulkSendStatus === 'completed') && (
                <div className={cn(
                    "relative overflow-hidden px-6 py-2 flex items-center justify-center gap-3 transition-all duration-300",
                    bulkSendStatus === 'sending'
                        ? "bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-b border-amber-100"
                        : "bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 border-b border-emerald-100"
                )}>
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

                {/* COLUMN 1: Lead Selection */}
                <LeadSelector
                    filteredLeads={filteredLeads}
                    selectedLeads={selectedLeads}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onSelectLead={handleSelectLead}
                />

                {/* COLUMN 2: Workspace / Producer */}
                <div className="col-span-12 lg:col-span-5 flex flex-col bg-slate-50/50 min-h-0 relative">
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

                                    <div className="flex justify-end mt-4">
                                        <span className="text-[10px] text-slate-300 font-medium">Şimdi</span>
                                    </div>
                                </div>

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

                {/* COLUMN 3: Queue Manager */}
                <MessageQueue
                    queue={messageQueue}
                    isSending={isSending}
                    onClearQueue={handleClearQueue}
                    onRemoveItem={handleRemoveFromQueue}
                    onSendQueue={handleSendQueue}
                />
            </div>
        </div>
    );
};

export default WhatsAppPage;
