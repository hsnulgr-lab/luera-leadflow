import { Search, CheckCircle2, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";
import { Lead } from "@/types/whatsapp";

interface LeadSelectorProps {
    filteredLeads: Lead[];
    selectedLeads: Lead[];
    searchQuery: string;
    sentLeadIds: Set<string>;
    onSearchChange: (query: string) => void;
    onSelectLead: (leadId: string) => void;
    onSelectAll: () => void;
}

export const LeadSelector = ({
    filteredLeads,
    selectedLeads,
    searchQuery,
    sentLeadIds,
    onSearchChange,
    onSelectLead,
    onSelectAll,
}: LeadSelectorProps) => {
    const allSelected = filteredLeads.length > 0 && selectedLeads.length === filteredLeads.length;

    return (
        <div className="hidden lg:flex col-span-3 flex-col bg-white min-h-0">
            <div className="p-4 border-b border-slate-50 flex flex-col gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Lead ara..."
                        className="pl-10 bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-slate-200"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-3 py-2">
                <span>MÜŞTERİ LİSTESİ</span>
                <div className="flex items-center gap-2">
                    {selectedLeads.length > 0 && (
                        <span className="bg-[#CCFF00] text-slate-900 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            {selectedLeads.length} seçili
                        </span>
                    )}
                    <button
                        onClick={onSelectAll}
                        className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all",
                            allSelected
                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                    >
                        <Users className="w-3 h-3" />
                        {allSelected ? "Kaldır" : "Tümü"}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar h-[calc(100vh-180px)]">
                {filteredLeads.map(lead => {
                    const isSelected = selectedLeads.some(l => l.id === lead.id);
                    const isSent = sentLeadIds.has(lead.id);
                    return (
                        <button
                            key={lead.id}
                            onClick={() => onSelectLead(lead.id)}
                            className={cn(
                                "w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all border group",
                                isSent
                                    ? "bg-green-50/40 border-green-100/50 opacity-70"
                                    : isSelected
                                        ? "bg-[#CCFF00]/10 border-[#CCFF00] shadow-sm"
                                        : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-100"
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all shrink-0",
                                isSent ? "bg-green-100 text-green-600"
                                    : isSelected ? "bg-[#CCFF00] text-slate-900" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                            )}>
                                {isSent ? "✓" : lead.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                    <h3 className={cn(
                                        "font-semibold text-sm leading-snug line-clamp-2 break-words",
                                        isSent ? "text-slate-500" : "text-slate-900"
                                    )}>{lead.name}</h3>
                                    {isSent ? (
                                        <span className="text-[9px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full shrink-0">Gönderildi</span>
                                    ) : isSelected ? (
                                        <CheckCircle2 className="w-4 h-4 text-[#CCFF00] fill-slate-900 shrink-0 mt-0.5" />
                                    ) : null}
                                </div>
                                <p className="text-xs text-slate-500 truncate mt-0.5">{lead.company}</p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
