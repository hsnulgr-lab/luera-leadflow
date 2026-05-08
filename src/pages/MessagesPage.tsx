import { useState, useEffect } from "react";
import { Send, Search, CheckCircle2, Clock, Phone, MessageSquare, X, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/utils/cn";

interface SentRecord {
    id: string;
    lead_name: string;
    lead_company: string;
    phone: string;
    message: string;
    sent_at: string;
    instance_name: string;
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Az önce";
    if (mins < 60) return `${mins} dk önce`;
    if (hours < 24) return `${hours} sa önce`;
    if (days < 7) return `${days} gün önce`;
    return new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}

const MessagesPage = () => {
    const { user } = useAuth();
    const [records, setRecords] = useState<SentRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchRecords = async () => {
        if (!user) return;
        setIsLoading(true);
        const { data, error } = await supabase
            .from("whatsapp_sent_log")
            .select("id, lead_name, lead_company, phone, message, sent_at, instance_name")
            .eq("user_id", user.id)
            .order("sent_at", { ascending: false })
            .limit(200);

        if (!error && data) setRecords(data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchRecords();
    }, [user]);

    const filtered = records.filter(r => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            r.lead_name?.toLowerCase().includes(q) ||
            r.lead_company?.toLowerCase().includes(q) ||
            r.phone?.includes(q)
        );
    });

    // Group by date
    const grouped: Record<string, SentRecord[]> = {};
    filtered.forEach(r => {
        const date = new Date(r.sent_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(r);
    });

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gönderim Geçmişi</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {isLoading ? "Yükleniyor..." : `${records.length} mesaj gönderildi`}
                    </p>
                </div>
                <button
                    onClick={fetchRecords}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
                    Yenile
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="İsim, şirket veya telefon ara..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#CCFF00]/40 focus:border-[#CCFF00]/60 transition-all"
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Loading */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="rounded-2xl bg-white border border-gray-100 p-4 animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3.5 bg-gray-100 rounded w-1/3" />
                                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : records.length === 0 ? (
                /* Empty state */
                <div className="text-center py-20">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-50 flex items-center justify-center">
                        <MessageSquare className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">Henüz mesaj gönderilmemiş</p>
                    <p className="text-gray-400 text-sm mt-1">WhatsApp sayfasından mesaj gönderince burada görünecek.</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-sm">"{searchQuery}" için sonuç bulunamadı.</p>
                    <button onClick={() => setSearchQuery("")} className="mt-2 text-xs text-[#CCFF00] bg-slate-900 px-3 py-1.5 rounded-lg font-medium">
                        Aramayı Temizle
                    </button>
                </div>
            ) : (
                /* Grouped timeline */
                <div className="space-y-6">
                    {Object.entries(grouped).map(([date, items]) => (
                        <div key={date}>
                            {/* Date divider */}
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-px flex-1 bg-gray-100" />
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{date}</span>
                                <div className="h-px flex-1 bg-gray-100" />
                            </div>

                            <div className="space-y-2">
                                {items.map(record => {
                                    const isExpanded = expandedId === record.id;
                                    const initials = (record.lead_name || "?").substring(0, 2).toUpperCase();

                                    return (
                                        <div
                                            key={record.id}
                                            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                                        >
                                            <button
                                                onClick={() => setExpandedId(isExpanded ? null : record.id)}
                                                className="w-full text-left p-4"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {/* Avatar */}
                                                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center font-bold text-emerald-700 text-sm flex-shrink-0">
                                                        {initials}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-gray-900 text-sm truncate">{record.lead_name || "—"}</p>
                                                        <p className="text-xs text-gray-400 truncate">{record.lead_company || ""}</p>
                                                    </div>

                                                    {/* Meta */}
                                                    <div className="flex items-center gap-3 flex-shrink-0">
                                                        {record.phone && (
                                                            <span className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
                                                                <Phone className="w-3 h-3" />
                                                                {record.phone}
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            Gönderildi
                                                        </span>
                                                        <span className="flex items-center gap-1 text-xs text-gray-400">
                                                            <Clock className="w-3 h-3" />
                                                            {timeAgo(record.sent_at)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>

                                            {/* Expanded message */}
                                            {isExpanded && record.message && (
                                                <div className="px-4 pb-4 pt-0 border-t border-gray-50">
                                                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                        <div className="flex items-center gap-1.5 mb-2">
                                                            <Send className="w-3 h-3 text-emerald-500" />
                                                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Gönderilen Mesaj</span>
                                                        </div>
                                                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{record.message}</p>
                                                        <p className="text-[10px] text-gray-400 mt-2 text-right">
                                                            {new Date(record.sent_at).toLocaleString("tr-TR")}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MessagesPage;
