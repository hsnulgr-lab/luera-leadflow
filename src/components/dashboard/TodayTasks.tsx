import { Bell, Phone, MessageCircle, ChevronRight } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { Lead } from "@/types/lead";
import { cn } from "@/utils/cn";

interface TodayTasksProps {
    onLeadClick: (lead: Lead) => void;
}

export const TodayTasks = ({ onLeadClick }: TodayTasksProps) => {
    const { leads } = useLeads();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Bugün veya geçmişte takip tarihi olan leadler
    const taskLeads = leads.filter(l => {
        if (!l.next_followup_at) return false;
        const d = new Date(l.next_followup_at);
        d.setHours(0, 0, 0, 0);
        return d <= today;
    });

    // Yarın takip edilecekler (bilgi amaçlı)
    const upcomingLeads = leads.filter(l => {
        if (!l.next_followup_at) return false;
        const d = new Date(l.next_followup_at);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === tomorrow.getTime();
    });

    if (taskLeads.length === 0 && upcomingLeads.length === 0) return null;

    const isOverdue = (dateStr: string) => {
        const d = new Date(dateStr);
        d.setHours(0, 0, 0, 0);
        return d < today;
    };

    return (
        <div className="bg-white rounded-2xl border border-amber-200/60 shadow-sm mb-6 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 bg-amber-50/70 border-b border-amber-100">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-400/20 flex items-center justify-center">
                        <Bell className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">
                            Bugünün Takipleri
                        </p>
                        <p className="text-xs text-amber-600">
                            {taskLeads.length} lead takip bekliyor
                            {upcomingLeads.length > 0 && ` • yarın ${upcomingLeads.length} daha`}
                        </p>
                    </div>
                </div>
                <span className="px-2.5 py-1 bg-amber-400 text-white text-xs font-bold rounded-full">
                    {taskLeads.length}
                </span>
            </div>

            {/* Task list */}
            <div className="divide-y divide-gray-50">
                {taskLeads.slice(0, 5).map(lead => {
                    const overdue = isOverdue(lead.next_followup_at!);
                    const phone = lead.phone?.replace(/[^\d+]/g, '') || '';
                    const waUrl = phone ? `https://wa.me/${phone.startsWith('+') ? phone.slice(1) : phone}` : null;

                    return (
                        <div
                            key={lead.id}
                            className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/70 transition-colors"
                        >
                            {/* Avatar */}
                            <div className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-black",
                                overdue ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"
                            )}>
                                {(lead.name || lead.company || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0" onClick={() => onLeadClick(lead)} role="button">
                                <p className="text-sm font-semibold text-gray-900 truncate">{lead.name}</p>
                                <p className="text-xs text-gray-500 truncate">{lead.company}</p>
                                {lead.notes && (
                                    <p className="text-xs text-gray-400 truncate mt-0.5 italic">"{lead.notes}"</p>
                                )}
                            </div>

                            {/* Date badge */}
                            <span className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                                overdue
                                    ? "bg-red-100 text-red-600"
                                    : "bg-amber-100 text-amber-700"
                            )}>
                                {overdue ? 'Gecikti' : 'Bugün'}
                            </span>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                {waUrl && (
                                    <button
                                        onClick={() => window.open(waUrl, '_blank')}
                                        className="w-7 h-7 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 flex items-center justify-center transition-colors"
                                        title="WhatsApp'ta aç"
                                    >
                                        <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                                    </button>
                                )}
                                {lead.phone && (
                                    <a
                                        href={`tel:${lead.phone}`}
                                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                                        title="Ara"
                                    >
                                        <Phone className="w-3.5 h-3.5 text-gray-600" />
                                    </a>
                                )}
                                <button
                                    onClick={() => onLeadClick(lead)}
                                    className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                                >
                                    <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {taskLeads.length > 5 && (
                <div className="px-5 py-2 bg-gray-50 text-center">
                    <p className="text-xs text-gray-400">+{taskLeads.length - 5} daha fazla lead</p>
                </div>
            )}
        </div>
    );
};
