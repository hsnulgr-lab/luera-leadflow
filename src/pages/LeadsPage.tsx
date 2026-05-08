import { useState, useMemo } from "react";
import { Users, Search, SlidersHorizontal, ArrowUpDown, X } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { Lead } from "@/types/lead";
import { LeadDetailPanel } from "@/components/dashboard/LeadDetailPanel";
import { LeadCard } from "@/components/dashboard/LeadCard";
import { AIOfferDialog } from "@/components/dashboard/AIOfferDialog";
import { cn } from "@/utils/cn";

type StatusFilter = "all" | "new" | "contacted" | "interested" | "closed";
type SortOption = "newest" | "oldest" | "name_az" | "priority";

const STATUS_LABELS: Record<StatusFilter, string> = {
    all: "Hepsi",
    new: "Yeni",
    contacted: "Ulaşıldı",
    interested: "İlgili",
    closed: "Kapandı",
};

const STATUS_COLORS: Record<StatusFilter, string> = {
    all: "bg-slate-100 text-slate-700 border-slate-200",
    new: "bg-blue-50 text-blue-700 border-blue-200",
    contacted: "bg-amber-50 text-amber-700 border-amber-200",
    interested: "bg-green-50 text-green-700 border-green-200",
    closed: "bg-gray-100 text-gray-600 border-gray-200",
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "newest", label: "En Yeni" },
    { value: "oldest", label: "En Eski" },
    { value: "name_az", label: "İsim A-Z" },
    { value: "priority", label: "Öncelik" },
];

export const LeadsPage = () => {
    const [selectedDetailLead, setSelectedDetailLead] = useState<Lead | null>(null);
    const [offerLead, setOfferLead] = useState<Lead | null>(null);
    const [showOfferDialog, setShowOfferDialog] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [sortBy, setSortBy] = useState<SortOption>("newest");
    const [showSort, setShowSort] = useState(false);

    const { leads, updateLeadPriority } = useLeads();

    const handleAgentStart = async (lead: Lead) => {
        setOfferLead(lead);
        setShowOfferDialog(true);
    };

    // Status counts
    const statusCounts = useMemo(() => {
        const counts: Record<StatusFilter, number> = { all: leads.length, new: 0, contacted: 0, interested: 0, closed: 0 };
        leads.forEach(l => {
            const s = (l.status || "new") as StatusFilter;
            if (s in counts) counts[s]++;
        });
        return counts;
    }, [leads]);

    // Filtered + sorted leads
    const filteredLeads = useMemo(() => {
        let result = [...leads];

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(l =>
                l.name?.toLowerCase().includes(q) ||
                l.company?.toLowerCase().includes(q) ||
                l.phone?.includes(q) ||
                l.email?.toLowerCase().includes(q)
            );
        }

        // Status filter
        if (statusFilter !== "all") {
            result = result.filter(l => (l.status || "new") === statusFilter);
        }

        // Sort
        switch (sortBy) {
            case "newest":
                result.sort((a, b) => new Date(b.dateAdded || 0).getTime() - new Date(a.dateAdded || 0).getTime());
                break;
            case "oldest":
                result.sort((a, b) => new Date(a.dateAdded || 0).getTime() - new Date(b.dateAdded || 0).getTime());
                break;
            case "name_az":
                result.sort((a, b) => (a.name || "").localeCompare(b.name || "", "tr"));
                break;
            case "priority":
                const priorityOrder = { high: 0, medium: 1, low: 2, undefined: 3 };
                result.sort((a, b) => (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3) - (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3));
                break;
        }

        return result;
    }, [leads, searchQuery, statusFilter, sortBy]);

    return (
        <>
            <div className="p-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Tüm Leadler</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {leads.length > 0
                                ? `${leads.length} potansiyel müşteri · ${statusCounts.interested} ilgili · ${statusCounts.contacted} ulaşıldı`
                                : "Henüz hiç lead yok"}
                        </p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-3 mb-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="İsim, şirket, telefon veya email ara..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#CCFF00]/40 focus:border-[#CCFF00]/60 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Sort */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSort(!showSort)}
                            className={cn(
                                "flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all",
                                showSort
                                    ? "bg-slate-900 text-white border-slate-900"
                                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                            )}
                        >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                            {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                        </button>
                        {showSort && (
                            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-gray-100 shadow-lg z-10 py-1 min-w-[140px]">
                                {SORT_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => { setSortBy(opt.value); setShowSort(false); }}
                                        className={cn(
                                            "w-full text-left px-4 py-2 text-sm transition-colors",
                                            sortBy === opt.value
                                                ? "bg-[#CCFF00]/10 text-gray-900 font-semibold"
                                                : "text-gray-600 hover:bg-gray-50"
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Filter Tabs */}
                <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
                    {(Object.keys(STATUS_LABELS) as StatusFilter[]).map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-all",
                                statusFilter === status
                                    ? "bg-slate-900 text-white border-slate-900"
                                    : STATUS_COLORS[status] + " hover:opacity-80"
                            )}
                        >
                            {STATUS_LABELS[status]}
                            <span className={cn(
                                "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                                statusFilter === status ? "bg-white/20 text-white" : "bg-white/70"
                            )}>
                                {statusCounts[status]}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Lead List */}
                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <div className="p-4">
                        {leads.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-2xl flex items-center justify-center">
                                    <Users className="w-8 h-8 text-gray-300" />
                                </div>
                                <p className="text-gray-500 font-medium">Henüz lead bulunamadı</p>
                                <p className="text-gray-400 text-sm mt-1">Dashboard'dan arama yaparak lead ekleyin.</p>
                            </div>
                        ) : filteredLeads.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-12 h-12 mx-auto mb-3 bg-gray-50 rounded-xl flex items-center justify-center">
                                    <Search className="w-6 h-6 text-gray-300" />
                                </div>
                                <p className="text-gray-500 text-sm font-medium">Sonuç bulunamadı</p>
                                <p className="text-gray-400 text-xs mt-1">Farklı bir arama terimi veya filtre deneyin.</p>
                                <button
                                    onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
                                    className="mt-3 text-xs text-[#CCFF00] bg-slate-900 px-3 py-1.5 rounded-lg font-medium hover:bg-slate-800 transition-colors"
                                >
                                    Filtreleri Temizle
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <p className="text-xs text-gray-400 font-medium">
                                        {filteredLeads.length === leads.length
                                            ? `${leads.length} lead gösteriliyor`
                                            : `${filteredLeads.length} / ${leads.length} lead gösteriliyor`}
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    {filteredLeads.map((lead) => (
                                        <LeadCard
                                            key={lead.id}
                                            lead={lead}
                                            onPriorityChange={updateLeadPriority}
                                            onClick={setSelectedDetailLead}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <LeadDetailPanel
                lead={selectedDetailLead}
                onClose={() => setSelectedDetailLead(null)}
                onAgentStart={handleAgentStart}
            />

            <AIOfferDialog
                lead={offerLead}
                open={showOfferDialog}
                onOpenChange={setShowOfferDialog}
            />
        </>
    );
};
