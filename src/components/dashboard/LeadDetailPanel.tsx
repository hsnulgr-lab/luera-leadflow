import { X, Mail, Phone, Globe, MapPin, Star, Users, Linkedin, Instagram, Building, Tag, Trash2, MessageCircle, PhoneCall } from "lucide-react";
import { Lead } from "@/types/lead";
import { cn } from "@/utils/cn";
import { useLeads } from "@/hooks/useLeads";

interface LeadDetailPanelProps {
    lead: Lead | null;
    onClose: () => void;
    onAgentStart?: (lead: Lead) => void;
    variant?: 'modal' | 'inline';
}

const hasValidEmail = (email?: string) =>
    !!(email && email !== 'N/A' && email !== 'n/a' && email.includes('@'));

export const LeadDetailPanel = ({ lead, onClose, onAgentStart, variant = 'modal' }: LeadDetailPanelProps) => {
    const { deleteLead } = useLeads();

    if (!lead) return null;

    const handleDelete = async () => {
        if (!window.confirm("Bu lead'i silmek istediğinize emin misiniz?")) return;
        await deleteLead(lead.id);
        onClose();
    };

    const phone = lead.phone?.replace(/[^\d+]/g, '') || '';
    const waUrl  = phone ? `https://wa.me/${phone.startsWith('+') ? phone.slice(1) : phone}` : null;
    const callUrl = phone ? `tel:${lead.phone}` : null;
    const emailUrl = hasValidEmail(lead.email) ? `mailto:${lead.email}` : null;
    const webUrl = lead.website
        ? (lead.website.startsWith('http') ? lead.website : `https://${lead.website}`)
        : null;

    const quickActions = [
        { label: 'WhatsApp', icon: MessageCircle, url: waUrl, color: 'bg-[#25D366] hover:bg-[#1ebe5d] text-white', disabled: !waUrl },
        { label: 'Ara',       icon: PhoneCall,    url: callUrl, color: 'bg-gray-900 hover:bg-black text-white', disabled: !callUrl },
        { label: 'E-posta',   icon: Mail,         url: emailUrl, color: 'bg-blue-500 hover:bg-blue-600 text-white', disabled: !emailUrl },
        { label: 'Website',   icon: Globe,        url: webUrl,  color: 'bg-purple-500 hover:bg-purple-600 text-white', disabled: !webUrl },
    ];

    const infoRows = [
        lead.email && { icon: Mail,   label: 'E-Posta',  value: lead.email,   href: emailUrl, dimmed: !hasValidEmail(lead.email) },
        lead.phone && { icon: Phone,  label: 'Telefon',  value: lead.phone,   href: callUrl },
        lead.address && { icon: MapPin, label: 'Adres',   value: lead.address, href: null },
    ].filter(Boolean) as { icon: any; label: string; value: string; href: string | null; dimmed?: boolean }[];

    const enrichRows = [
        lead.hunterEmail && hasValidEmail(lead.hunterEmail) && {
            icon: Mail, label: 'Hunter Email', value: lead.hunterEmail, href: `mailto:${lead.hunterEmail}`,
            badge: 'Hunter', badgeColor: 'bg-orange-50 text-orange-600',
        },
        lead.linkedin && {
            icon: Linkedin, label: 'LinkedIn', value: lead.linkedin.replace(/^https?:\/\/(www\.)?/i,'').split('/').slice(0,3).join('/'),
            href: lead.linkedin, badge: 'LinkedIn', badgeColor: 'bg-blue-50 text-blue-600',
        },
        lead.instagram && {
            icon: Instagram, label: 'Instagram', value: '@' + (lead.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//i,'').replace(/\//,'')),
            href: lead.instagram.startsWith('http') ? lead.instagram : `https://instagram.com/${lead.instagram}`,
            badge: 'IG', badgeColor: 'bg-pink-50 text-pink-600',
        },
        lead.apolloSector && {
            icon: Building, label: 'Sektör (Apollo)', value: lead.apolloSector, href: null,
            badge: 'Apollo', badgeColor: 'bg-gray-100 text-gray-500',
        },
    ].filter(Boolean) as { icon: any; label: string; value: string; href: string | null; badge: string; badgeColor: string }[];

    const content = (
        <div className={cn(
            "relative w-full bg-white flex flex-col font-sans",
            variant === 'modal'
                ? "max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300"
                : "h-full"
        )}>
            {/* Gradient top bar */}
            <div className="h-1 w-full bg-gradient-to-r from-[#CCFF00] via-green-300 to-[#CCFF00]" />

            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-3 border-b border-gray-100">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            lead.status === 'new' ? "bg-[#CCFF00]/20 text-[#6d8a00]" : "bg-gray-100 text-gray-500"
                        )}>
                            {lead.status === 'new' ? 'YENİ' : lead.status === 'contacted' ? 'İLETİŞİM' : lead.status}
                        </span>
                        {lead.rating && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600">
                                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                {lead.rating}
                            </span>
                        )}
                        {lead.score != null && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-600">
                                Skor {lead.score}
                            </span>
                        )}
                    </div>
                    <h2 className="text-xl font-black text-gray-900 leading-tight truncate">{lead.name}</h2>
                    <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1 truncate">
                        <Tag className="w-3 h-3 shrink-0" />
                        {lead.company}
                        {lead.employeeCount && (
                            <span className="ml-1 flex items-center gap-0.5 text-gray-400">
                                <Users className="w-3 h-3" />
                                {lead.employeeCount} çalışan
                            </span>
                        )}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
                >
                    <X className="w-4 h-4 text-gray-500" />
                </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">

                {/* Quick action buttons */}
                <div className="grid grid-cols-4 gap-2">
                    {quickActions.map(({ label, icon: Icon, url, color, disabled }) => (
                        <button
                            key={label}
                            disabled={disabled}
                            onClick={() => url && window.open(url, '_blank')}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-semibold transition-all",
                                disabled ? "bg-gray-50 text-gray-300 cursor-not-allowed" : cn(color, "shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-[0.97]")
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Contact info */}
                {infoRows.length > 0 && (
                    <div className="rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                        {infoRows.map(({ icon: Icon, label, value, href, dimmed }) => (
                            <div
                                key={label}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 transition-colors",
                                    href ? "hover:bg-gray-50 cursor-pointer" : "bg-white"
                                )}
                                onClick={() => href && window.open(href, '_self')}
                            >
                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                                    <Icon className="w-4 h-4 text-gray-500" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                                    <p className={cn("text-sm font-semibold truncate mt-0.5", dimmed ? "text-gray-400 italic" : "text-gray-900")}>
                                        {value}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Enrichment data */}
                {enrichRows.length > 0 && (
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Zenginleştirilmiş Veri</p>
                        <div className="rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                            {enrichRows.map(({ icon: Icon, label, value, href, badge, badgeColor }) => (
                                <div
                                    key={label}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 transition-colors",
                                        href ? "hover:bg-gray-50 cursor-pointer" : "bg-white"
                                    )}
                                    onClick={() => href && window.open(href, '_blank')}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                                        <Icon className="w-4 h-4 text-gray-500" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                                        <p className="text-sm font-semibold text-gray-900 truncate mt-0.5">{value}</p>
                                    </div>
                                    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0", badgeColor)}>
                                        {badge}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 flex justify-center">
                <button
                    onClick={handleDelete}
                    className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    Sistemden Sil
                </button>
            </div>
        </div>
    );

    if (variant === 'inline') return content;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full sm:max-w-md">
                {content}
            </div>
        </div>
    );
};
