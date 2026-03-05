import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
    Loader2,
    Sparkles,
    CheckCircle2,
    MessageSquare,
    LayoutGrid,
    RefreshCw,
    Send,
    AlertTriangle,
    Users,
    ChevronRight,
    Edit3,
    Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { n8nEvolutionService } from "@/services/n8nEvolutionService";
import { useLeads } from "@/hooks/useLeads";
import { useQRCode } from "@/hooks/useQRCode";
import { useSentHistory } from "@/hooks/useSentHistory";
import { useWhatsApp } from "@/contexts/WhatsAppContext";
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
    const {
        messageQueue,
        setMessageQueue,
        isSending,
        bulkSendStatus,
        handleSendQueue: handleSendQueueContext,
        handleAddToQueue: handleAddToQueueContext
    } = useWhatsApp();
    const [previewMessage, setPreviewMessage] = useState<string>("");
    const [previewLead, setPreviewLead] = useState<Lead | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
    const [previewQueueItemId, setPreviewQueueItemId] = useState<string | null>(null);
    const [editingQueueMessage, setEditingQueueMessage] = useState(false);
    const [editedMessage, setEditedMessage] = useState("");

    const INSTANCE_NAME = "testwp";
    const { qrCode, clearQRCode } = useQRCode(INSTANCE_NAME);
    const { sentLeadIds, sentRecords, markAsSent, wasSent, getSentFromList } = useSentHistory();

    // Bugün gönderilen sayısı ve başarı oranı hesapla
    const today = new Date().toISOString().split('T')[0];
    const todaySentCount = sentRecords.filter(r => r.sentAt.startsWith(today)).length;
    const totalSentCount = sentRecords.length;
    const totalSuccessRate = totalSentCount > 0 ? 100 : 0; // Şimdilik tüm gönderilenler başarılı

    // Automatically close modal when connected
    useEffect(() => {
        if (connectionStatus === "connected") {
            setIsQRModalOpen(false);
        }
    }, [connectionStatus]);

    // 75-Second QR Code Timeout Logic
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        if (qrCode && connectionStatus === "connecting") {
            // When QR code is displayed to the user, start a 75-second timer
            timeoutId = setTimeout(() => {
                console.log("[WhatsAppPage] QR code expired after 75 seconds. Resetting UI.");
                clearQRCode();
                // Reset connection status so the user can generate a new one
                setConnectionStatus("disconnected");
            }, 75000); // 75 seconds
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [qrCode, connectionStatus, clearQRCode]);

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
            setPreviewLead(lead);
            // AI çağrısı burada yapılmıyor — sadece kuyruğa eklenince yapılacak
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

        // Duplikat koruması: hem kuyruk hem de gönderim geçmişi kontrolü
        const existingIds = new Set(messageQueue.map(m => m.lead.id));
        const inQueue = selectedLeads.filter(l => existingIds.has(l.id));
        const alreadySent = selectedLeads.filter(l => !existingIds.has(l.id) && wasSent(l.id));
        const duplicates = [...inQueue, ...alreadySent];
        const newLeads = selectedLeads.filter(l => !existingIds.has(l.id) && !wasSent(l.id));

        if (duplicates.length > 0) {
            const queueNames = inQueue.slice(0, 2).map(d => d.name);
            const sentNames = alreadySent.slice(0, 2).map(d => d.name);
            let warning = '';
            if (inQueue.length > 0) {
                warning += `${queueNames.join(', ')}${inQueue.length > 2 ? ` +${inQueue.length - 2}` : ''} zaten kuyrukta. `;
            }
            if (alreadySent.length > 0) {
                warning += `${sentNames.join(', ')}${alreadySent.length > 2 ? ` +${alreadySent.length - 2}` : ''} daha önce mesaj gönderilmiş.`;
            }
            setDuplicateWarning(warning);
        }

        if (newLeads.length === 0) {
            setSelectedLeads([]);
            setPreviewLead(null);
            setPreviewMessage("");
            return;
        }

        handleAddToQueueContext(newLeads, offerType);
        setSelectedLeads([]);
        setPreviewLead(null);
        setPreviewMessage("");
    };

    const handleSendQueue = async () => {
        await handleSendQueueContext();
    };

    const handleClearQueue = () => {
        setMessageQueue([]);

    };

    const handleRemoveFromQueue = (id: string) => {
        setMessageQueue(prev => prev.filter(item => item.id !== id));
    };

    // Retry: failed mesajı tekrar pending yap
    const handleRetryItem = (id: string) => {
        setMessageQueue(prev => prev.map(item =>
            item.id === id ? { ...item, status: 'pending' as const } : item
        ));

    };

    // Queue item preview handlers
    const previewQueueItem = messageQueue.find(q => q.id === previewQueueItemId);

    const handlePreviewQueueItem = (id: string) => {
        setPreviewQueueItemId(id);
        setEditingQueueMessage(false);
        const item = messageQueue.find(q => q.id === id);
        if (item) setEditedMessage(item.message);
    };

    const handleUpdateQueueMessage = (id: string, newMessage: string) => {
        setMessageQueue(prev => prev.map(q =>
            q.id === id ? { ...q, message: newMessage } : q
        ));
        setEditingQueueMessage(false);
    };

    const handleRegenerateQueueMessage = async (id: string) => {
        const item = messageQueue.find(q => q.id === id);
        if (!item) return;

        setMessageQueue(prev => prev.map(q =>
            q.id === id ? { ...q, message: "Yapay zeka mesajı yeniden oluşturuyor... 🤖", status: "generating" as const } : q
        ));

        try {
            const message = await n8nEvolutionService.generateMessage(item.lead.name, offerType);
            setMessageQueue(prev => prev.map(q =>
                q.id === id ? { ...q, message, status: "pending" as const } : q
            ));
            setEditedMessage(message);
        } catch {
            const fallback = `Merhaba ${item.lead.name}! 🚀 ${offerType} hakkında görüşmek isteriz.`;
            setMessageQueue(prev => prev.map(q =>
                q.id === id ? { ...q, message: fallback, status: "pending" as const } : q
            ));
            setEditedMessage(fallback);
        }
    };

    const filteredLeads = realLeads.filter(lead =>
        lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Toplu seçim: tüm filtrelenmiş lead'leri seç/kaldır
    const handleSelectAll = () => {
        if (selectedLeads.length === filteredLeads.length) {
            setSelectedLeads([]);
            setPreviewLead(null);
            setPreviewMessage("");
        } else {
            setSelectedLeads([...filteredLeads]);

        }
    };

    // Mobile Tab State
    const [activeMobileTab, setActiveMobileTab] = useState<'leads' | 'workspace' | 'queue'>('leads');

    // Calculate duplicates and new leads live
    const queueAnalysis = useMemo(() => {
        if (selectedLeads.length === 0) return { new: 0, duplicates: 0, existingIds: new Set() };

        const existingIds = new Set(messageQueue.map(m => m.lead.id));
        const duplicates = selectedLeads.filter(l => existingIds.has(l.id) || wasSent(l.id)).length;
        const newLeads = selectedLeads.length - duplicates;

        return { new: newLeads, duplicates, existingIds };
    }, [selectedLeads, messageQueue, sentLeadIds]); // sentLeadIds is used in wasSent check, but wasSent is a function from hook. 
    // We need to make sure we depend on what wasSent depends on, which is sentRecords or sentLeadIds from useSentHistory.
    // In useSentHistory, wasSent uses sentLeadIds. So adding sentLeadIds to dependency array is correct.

    return (
        <div className="h-screen bg-slate-50 flex flex-col overflow-hidden font-sans text-slate-900 pb-16 md:pb-0 relative">
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
                    {/* Mini Stats + Anti-Spam */}
                    {messageQueue.length > 0 && (
                        <div className="hidden md:flex items-center gap-2">
                            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                <Send className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-xs font-semibold text-slate-600">
                                    {messageQueue.filter(m => m.status === 'sent').length}
                                </span>
                                <span className="text-xs text-slate-400">/</span>
                                <span className="text-xs font-medium text-slate-400">{messageQueue.length}</span>
                            </div>
                            {messageQueue.some(m => m.status === 'sent') && (
                                <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                    <span className="text-xs font-bold text-green-600">
                                        %{Math.round((messageQueue.filter(m => m.status === 'sent').length / messageQueue.length) * 100)}
                                    </span>
                                </div>
                            )}
                            {messageQueue.some(m => m.status === 'sending') && (
                                <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 animate-pulse">
                                    <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                                    <span className="text-xs font-semibold text-blue-600">Gönderiliyor</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 bg-amber-50/80 px-2.5 py-1.5 rounded-lg border border-amber-100/50">
                                <span className="text-[10px]">🛡️</span>
                                <span className="text-[10px] font-medium text-amber-600">Anti-spam: 10-85sn aralık</span>
                            </div>
                        </div>
                    )}

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

            {/* 3-Column Layout */}
            <div className="flex-1 grid grid-cols-12 min-h-0 divide-x divide-slate-100 relative">

                {/* COLUMN 1: Lead Selection */}
                <div className={cn(
                    "col-span-12 lg:col-span-3 flex flex-col bg-white min-h-0 lg:flex relative", // Added relative for FAB positioning
                    activeMobileTab === 'leads' ? "flex" : "hidden"
                )}>
                    <LeadSelector
                        filteredLeads={filteredLeads}
                        selectedLeads={selectedLeads}
                        searchQuery={searchQuery}
                        sentLeadIds={sentLeadIds}
                        onSearchChange={setSearchQuery}
                        onSelectLead={handleSelectLead}
                        onSelectAll={handleSelectAll}
                    />

                    {/* Mobile FAB to go to Workspace */}
                    {selectedLeads.length > 0 && (
                        <div className="absolute bottom-4 right-4 md:hidden z-10 animate-in slide-in-from-bottom-2">
                            <Button
                                onClick={() => setActiveMobileTab('workspace')}
                                className="bg-slate-900 text-[#CCFF00] hover:bg-slate-800 shadow-lg rounded-full px-6 h-12 flex items-center gap-2"
                            >
                                <span>{selectedLeads.length} Seçili</span>
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    )}


                </div>

                {/* COLUMN 2: Workspace / Producer */}
                <div className={cn(
                    "col-span-12 lg:col-span-5 flex-col bg-slate-50/50 min-h-0 relative lg:flex",
                    activeMobileTab === 'workspace' ? "flex" : "hidden"
                )}>
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #0f172a 1px, transparent 0)', backgroundSize: '24px 24px' }}
                    />

                    <div className="flex-1 p-8 flex flex-col items-center justify-center overflow-y-auto z-10">
                        {selectedLeads.length > 0 ? (
                            <div className="w-full max-w-md animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                                <div className="text-center mb-6">
                                    <Badge className="bg-white hover:bg-white text-slate-500 border border-slate-200 shadow-sm mb-4 py-1.5 px-4">
                                        <Sparkles className="w-3.5 h-3.5 mr-2 text-purple-500" />
                                        Kuyruğa eklenince AI mesaj oluşturulacak
                                    </Badge>
                                </div>

                                <div className="bg-white rounded-3xl p-6 shadow-2xl shadow-slate-200/50 border border-slate-100">
                                    <h3 className="font-bold text-slate-900 text-sm mb-4">Seçilen Müşteriler ({selectedLeads.length})</h3>
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {selectedLeads.map(lead => (
                                            <div key={lead.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs shrink-0">
                                                    {lead.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-semibold text-slate-900 text-sm truncate">{lead.name}</p>
                                                    <p className="text-xs text-slate-400 truncate">{lead.company}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleSelectLead(lead.id)}
                                                    className="text-slate-300 hover:text-red-400 transition-colors p-1"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <p className="text-xs text-slate-400 text-center">
                                            <Sparkles className="w-3 h-3 inline mr-1 text-purple-400" />
                                            Her müşteri için yapay zeka tarafından özel teklif mesajı oluşturulacak
                                        </p>
                                    </div>
                                </div>

                                {/* Duplicate Warning */}
                                {queueAnalysis.duplicates > 0 && (
                                    <div className="mt-6 flex items-start gap-2.5 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 animate-in slide-in-from-top-2 duration-300">
                                        <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-xs font-semibold text-orange-700">Dikkat</p>
                                            <p className="text-[11px] text-orange-600 mt-0.5 leading-relaxed">
                                                Seçilen <strong>{selectedLeads.length}</strong> kişiden <strong>{queueAnalysis.duplicates}</strong> tanesi zaten kuyrukta veya gönderilmiş. Sadece <strong>{queueAnalysis.new}</strong> yeni kişi eklenecek.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-8 grid grid-cols-2 gap-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => { setSelectedLeads([]); setPreviewLead(null); }}
                                        className="h-12 bg-white border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:scale-105 transition-all duration-300"
                                    >
                                        İptal
                                    </Button>
                                    <Button
                                        className="h-12 bg-[#CCFF00] hover:bg-[#d9ff40] text-slate-900 font-bold shadow-[0_0_20px_rgba(204,255,0,0.4)] hover:shadow-[0_0_30px_rgba(204,255,0,0.6)] hover:scale-105 transition-all duration-300"
                                        onClick={() => {
                                            handleAddToQueue();
                                            if (window.innerWidth < 1024) setActiveMobileTab('queue');
                                        }}
                                        disabled={queueAnalysis.new === 0}
                                    >
                                        {queueAnalysis.new > 0 ? `Kuyruğa Ekle (${queueAnalysis.new})` : 'Eklenecek Yeni Yok'}
                                    </Button>
                                </div>
                                <p className="text-center text-xs text-slate-400 mt-4">
                                    {queueAnalysis.new > 0
                                        ? `${queueAnalysis.new} müşteri için AI mesaj oluşturulacak`
                                        : "Tüm seçilenler zaten işlem görmüş"
                                    }
                                </p>
                            </div>
                        ) : previewQueueItem ? (
                            <div className="w-full max-w-md animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                                <div className="text-center mb-6">
                                    <Badge className="bg-white hover:bg-white text-slate-500 border border-slate-200 shadow-sm mb-4 py-1.5 px-4">
                                        <Eye className="w-3.5 h-3.5 mr-2 text-blue-500" />
                                        Mesaj Önizleme
                                    </Badge>
                                </div>

                                <div className="bg-white rounded-3xl p-6 shadow-2xl shadow-slate-200/50 border border-slate-100 relative group">
                                    <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                                                {previewQueueItem.lead.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-sm">{previewQueueItem.lead.name}</h3>
                                                <p className="text-xs text-slate-400">{previewQueueItem.lead.company}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleRegenerateQueueMessage(previewQueueItem.id)}
                                                className="h-8 w-8 text-slate-400 hover:text-[#CCFF00] hover:bg-slate-900 transition-colors"
                                                title="Yeniden Oluştur"
                                                disabled={previewQueueItem.status === 'generating'}
                                            >
                                                <Sparkles className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => {
                                                    if (editingQueueMessage) {
                                                        handleUpdateQueueMessage(previewQueueItem.id, editedMessage);
                                                    } else {
                                                        setEditedMessage(previewQueueItem.message);
                                                        setEditingQueueMessage(true);
                                                    }
                                                }}
                                                className={cn(
                                                    "h-8 w-8 transition-colors",
                                                    editingQueueMessage ? "text-[#CCFF00] bg-slate-900 hover:bg-slate-800" : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                                                )}
                                                title={editingQueueMessage ? "Kaydet" : "Düzenle"}
                                                disabled={previewQueueItem.status === 'generating'}
                                            >
                                                {editingQueueMessage ? <CheckCircle2 className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="min-h-[120px]">
                                        {previewQueueItem.status === 'generating' ? (
                                            <div className="space-y-2">
                                                <div className="h-4 bg-purple-100 rounded w-3/4 animate-pulse" />
                                                <div className="h-4 bg-purple-100 rounded w-1/2 animate-pulse" />
                                                <div className="h-4 bg-purple-100 rounded w-5/6 animate-pulse" />
                                                <p className="text-xs text-purple-500 mt-3 italic">Yapay zeka mesaj oluşturuyor... 🤖</p>
                                            </div>
                                        ) : editingQueueMessage ? (
                                            <textarea
                                                className="w-full h-full min-h-[120px] bg-slate-50 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent p-3 text-slate-700 text-base leading-relaxed placeholder:text-slate-400 font-medium transition-all"
                                                value={editedMessage}
                                                onChange={(e) => setEditedMessage(e.target.value)}
                                                placeholder="Mesajınızı düzenleyin..."
                                                autoFocus
                                            />
                                        ) : (
                                            <div className="text-slate-700 text-base leading-relaxed whitespace-pre-wrap p-1 border border-transparent">
                                                {previewQueueItem.message}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                                        <div className="flex items-center gap-1.5">
                                            {previewQueueItem.lead.phone && (
                                                <span className="text-[10px] text-slate-400 font-medium">📱 {previewQueueItem.lead.phone}</span>
                                            )}
                                        </div>
                                        <Badge variant="secondary" className={cn(
                                            "text-[10px] border-0",
                                            previewQueueItem.status === 'generating' ? "bg-purple-50 text-purple-600" :
                                                previewQueueItem.status === 'pending' ? "bg-orange-50 text-orange-600" :
                                                    previewQueueItem.status === 'sent' ? "bg-green-50 text-green-600" :
                                                        "bg-slate-100 text-slate-500"
                                        )}>
                                            {previewQueueItem.status === 'generating' ? "Oluşturuluyor" :
                                                previewQueueItem.status === 'pending' ? "Bekliyor" :
                                                    previewQueueItem.status === 'sent' ? "Gönderildi" :
                                                        previewQueueItem.status === 'sending' ? "Gönderiliyor" : "Hata"}
                                        </Badge>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setPreviewQueueItemId(null)}
                                    className="mt-4 text-xs text-slate-400 hover:text-slate-600 transition-colors w-full text-center"
                                >
                                    Önizlemeyi Kapat
                                </button>
                            </div>
                        ) : (
                            <div className="text-center max-w-sm">
                                <div className="w-24 h-24 bg-white rounded-3xl shadow-xl shadow-indigo-100 border border-slate-50 flex items-center justify-center mx-auto mb-6 rotate-3 transform transition-transform hover:rotate-6">
                                    <LayoutGrid className="w-10 h-10 text-indigo-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Çalışma Alanı Boş</h2>
                                <p className="text-slate-500">
                                    Mesaj oluşturmaya başlamak için sol taraftaki listeden müşteri seçin veya kuyruktaki bir mesajı tıklayın.
                                </p>
                                <Button
                                    variant="outline"
                                    className="mt-4 md:hidden"
                                    onClick={() => setActiveMobileTab('leads')}
                                >
                                    Müşteri Seç
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUMN 3: Queue Manager */}
                <div className={cn(
                    "col-span-12 lg:col-span-4 bg-white flex flex-col min-h-0 lg:flex",
                    activeMobileTab === 'queue' ? "flex" : "hidden"
                )}>
                    <MessageQueue
                        queue={messageQueue}
                        isSending={isSending}
                        todaySentCount={todaySentCount}
                        totalSuccessRate={totalSuccessRate}
                        activePreviewId={previewQueueItemId}
                        onClearQueue={handleClearQueue}
                        onRemoveItem={handleRemoveFromQueue}
                        onRetryItem={handleRetryItem}
                        onSendQueue={handleSendQueue}
                        onPreviewItem={handlePreviewQueueItem}
                    />
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around lg:hidden z-30 pb-safe">
                <button
                    onClick={() => setActiveMobileTab('leads')}
                    className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-lg transition-colors",
                        activeMobileTab === 'leads' ? "text-[#CCFF00] bg-slate-900" : "text-slate-500 hover:bg-slate-50"
                    )}
                >
                    <Users className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-medium">Müşteriler</span>
                </button>
                <button
                    onClick={() => setActiveMobileTab('workspace')}
                    className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-lg transition-colors",
                        activeMobileTab === 'workspace' ? "text-[#CCFF00] bg-slate-900" : "text-slate-500 hover:bg-slate-50"
                    )}
                >
                    <LayoutGrid className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-medium">Çalışma Alanı</span>
                </button>
                <button
                    onClick={() => setActiveMobileTab('queue')}
                    className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-lg transition-colors relative",
                        activeMobileTab === 'queue' ? "text-[#CCFF00] bg-slate-900" : "text-slate-500 hover:bg-slate-50"
                    )}
                >
                    {messageQueue.length > 0 && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                    )}
                    <Send className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-medium">Kuyruk</span>
                </button>
            </div>
        </div>
    );
};

export default WhatsAppPage;
