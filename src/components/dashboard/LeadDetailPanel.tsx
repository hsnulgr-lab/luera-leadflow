import { X, Mail, Phone, Calendar, Building, Tag, Target, MessageCircle, Globe, ExternalLink, ArrowUpRight } from "lucide-react";
import { Lead } from "@/types/lead";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

interface LeadDetailPanelProps {
    lead: Lead | null;
    onClose: () => void;
    onAgentStart?: (lead: Lead) => void;
    variant?: 'modal' | 'inline';
}

export const LeadDetailPanel = ({ lead, onClose, onAgentStart, variant = 'modal' }: LeadDetailPanelProps) => {
    if (!lead) return null;

    const handleWhatsApp = () => {
        const phone = lead.phone.replace(/[^\d]/g, '');
        if (phone) {
            window.open(`https://wa.me/${phone}`, '_blank');
        } else {
            alert("Geçerli bir telefon numarası bulunamadı.");
        }
    };

    const content = (
        <div className={cn(
            "relative w-full bg-white rounded-[32px] overflow-hidden flex flex-col font-sans",
            variant === 'modal' ? "max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-300" : "h-full shadow-none border-0 bg-transparent"
        )}>
            {/* Top Decoration */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-[#CCFF00]/10 via-green-50/20 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#CCFF00]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header / Title Section */}
            <div className="relative p-8 pb-4 flex items-start justify-between z-10 shrink-0">
                <div className="space-y-4">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                        <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            lead.status === 'new' ? "bg-[#CCFF00]/20 text-[#6d8a00]" : "bg-gray-100 text-gray-500"
                        )}>
                            {lead.status === 'new' ? 'YENİ' : lead.status === 'contacted' ? 'İLETİŞİM' : lead.status}
                        </span>
                        {lead.score && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-600 flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                SKOR: {lead.score}
                            </span>
                        )}
                    </div>

                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-2">{lead.name}</h2>
                        <div className="flex items-center gap-2 text-gray-400 font-medium text-sm">
                            <Building className="w-4 h-4" />
                            <span>{lead.company}</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors -mr-2 -mt-2"
                >
                    <X className="w-4 h-4 text-gray-400" />
                </button>
            </div>

            {/* Content Body */}
            <div className="p-8 pt-2 space-y-6 overflow-y-auto no-scrollbar flex-1">

                {/* Information Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gray-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />

                    {/* Email Row */}
                    <div className="flex items-start gap-4 relative z-10 p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group/item" onClick={() => window.open(`mailto:${lead.email}`)}>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">E-POSTA</p>
                            <p className="font-bold text-gray-900 text-sm mt-0.5">{lead.email || "N/A"}</p>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-gray-300 opacity-0 group-hover/item:opacity-100 transition-all" />
                    </div>

                    {/* Phone Row */}
                    <div className="flex items-start gap-4 relative z-10 p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group/item" onClick={handleWhatsApp}>
                        <div className="w-10 h-10 rounded-xl bg-[#CCFF00]/20 text-[#7a9900] flex items-center justify-center shrink-0">
                            <Phone className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">TELEFON</p>
                            <p className="font-bold text-gray-900 text-sm mt-0.5 font-mono">{lead.phone}</p>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-gray-300 opacity-0 group-hover/item:opacity-100 transition-all" />
                    </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center mb-3">
                            <Calendar className="w-4 h-4" />
                        </div>
                        <div className="text-lg font-bold text-gray-900">{new Date(lead.dateAdded).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-400 font-medium mt-1">Eklendiği tarih</div>
                    </div>

                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center mb-3">
                            <Tag className="w-4 h-4" />
                        </div>
                        <div className="text-lg font-bold text-gray-900 truncate">{lead.tags?.[0] || lead.company}</div>
                        <div className="text-xs text-gray-400 font-medium mt-1">Sektör</div>
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-2">
                    <div className={cn(
                        "grid gap-3",
                        lead.website ? "grid-cols-2" : "grid-cols-1"
                    )}>
                        <Button
                            className="h-12 bg-[#CCFF00] hover:bg-[#b8e600] text-gray-900 border-0 rounded-xl font-bold shadow-lg shadow-[#CCFF00]/20 hover:shadow-[#CCFF00]/40 transition-all"
                            onClick={handleWhatsApp}
                        >
                            <MessageCircle className="w-5 h-5 mr-2" />
                            WhatsApp
                        </Button>

                        {lead.website && (
                            <Button
                                className="h-12 bg-gray-900 hover:bg-black text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                                onClick={() => window.open(lead.website?.startsWith('http') ? lead.website : `https://${lead.website}`, '_blank')}
                            >
                                <Globe className="w-5 h-5 mr-2" />
                                Web Sitesi
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    if (variant === 'inline') {
        return content;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            {content}
        </div>
    );
};
