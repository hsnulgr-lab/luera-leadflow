import { useState } from "react";
import { X, Mail, Phone, Globe, MapPin, Star, Users, Linkedin, Instagram, Building, Tag, Trash2, MessageCircle, PhoneCall, ExternalLink, CalendarPlus } from "lucide-react";
import { Lead } from "@/types/lead";
import { cn } from "@/utils/cn";
import { useLeads } from "@/hooks/useLeads";
import { isTimeflowConnected } from "@/services/timeflowService";
import { CreateAppointmentModal } from "./CreateAppointmentModal";

interface LeadDetailPanelProps {
    lead: Lead | null;
    onClose: () => void;
    onAgentStart?: (lead: Lead) => void;
    variant?: 'modal' | 'inline';
}

const hasValidEmail = (email?: string) =>
    !!(email && email !== 'N/A' && email !== 'n/a' && email.includes('@'));

const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

export const LeadDetailPanel = ({ lead, onClose, onAgentStart, variant = 'modal' }: LeadDetailPanelProps) => {
    const { deleteLead } = useLeads();
    const [appointmentOpen, setAppointmentOpen] = useState(false);
    const timeflowConnected = isTimeflowConnected();

    if (!lead) return null;

    const handleDelete = async () => {
        if (!window.confirm("Bu lead'i silmek istediğinize emin misiniz?")) return;
        await deleteLead(lead.id);
        onClose();
    };

    const phone = lead.phone?.replace(/[^\d+]/g, '') || '';
    const waUrl   = phone ? `https://wa.me/${phone.startsWith('+') ? phone.slice(1) : phone}` : null;
    const callUrl = phone ? `tel:${lead.phone}` : null;
    const emailUrl = hasValidEmail(lead.email) ? `mailto:${lead.email}` : null;
    const webUrl  = lead.website
        ? (lead.website.startsWith('http') ? lead.website : `https://${lead.website}`)
        : null;

    const content = (
        <div className={cn(
            "relative w-full bg-white flex flex-col font-sans overflow-hidden",
            variant === 'modal'
                ? "max-w-sm rounded-[28px] shadow-[0_32px_80px_-12px_rgba(0,0,0,0.25)] animate-in fade-in slide-in-from-bottom-6 duration-300"
                : "h-full"
        )}>
            {/* ── HERO HEADER ─────────────────────────────────────── */}
            <div className="relative bg-gray-950 px-6 pt-6 pb-8 overflow-hidden">
                {/* Background glow orbs */}
                <div className="absolute -top-8 -right-8 w-40 h-40 bg-[#CCFF00]/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
                >
                    <X className="w-4 h-4 text-white/70" />
                </button>

                {/* Avatar + name */}
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-[#CCFF00] flex items-center justify-center font-black text-gray-900 text-lg shadow-lg shadow-[#CCFF00]/20 shrink-0">
                        {getInitials(lead.name || lead.company)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-white font-black text-lg leading-tight truncate pr-8">
                            {lead.name}
                        </h2>
                        <p className="text-white/50 text-xs mt-1 flex items-center gap-1 truncate">
                            <Tag className="w-3 h-3 shrink-0" />
                            {lead.company}
                        </p>
                    </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 mt-4 flex-wrap relative z-10">
                    {lead.rating && (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/20">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {lead.rating}
                        </span>
                    )}
                    {lead.employeeCount && (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/10 text-white/60 border border-white/10">
                            <Users className="w-3 h-3" />
                            {lead.employeeCount} çalışan
                        </span>
                    )}
                    {lead.score != null && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#CCFF00]/20 text-[#CCFF00] border border-[#CCFF00]/20">
                            Skor {lead.score}
                        </span>
                    )}
                    <span className={cn(
                        "px-2.5 py-1 rounded-full text-[11px] font-bold border",
                        lead.status === 'new'
                            ? "bg-green-400/10 text-green-400 border-green-400/20"
                            : "bg-white/10 text-white/50 border-white/10"
                    )}>
                        {lead.status === 'new' ? 'Yeni Lead' : lead.status}
                    </span>
                </div>
            </div>

            {/* ── QUICK ACTIONS ───────────────────────────────────── */}
            <div className="grid grid-cols-5 gap-0 border-b border-gray-100">
                {[
                    { label: 'WhatsApp', icon: MessageCircle, url: waUrl,   bg: 'hover:bg-[#25D366]/8', icon_color: waUrl   ? 'text-[#25D366]' : 'text-gray-300' },
                    { label: 'Ara',      icon: PhoneCall,     url: callUrl, bg: 'hover:bg-gray-50',      icon_color: callUrl ? 'text-gray-900' : 'text-gray-300' },
                    { label: 'E-posta',  icon: Mail,          url: emailUrl, bg: 'hover:bg-blue-50',    icon_color: emailUrl ? 'text-blue-500' : 'text-gray-300' },
                    { label: 'Website',  icon: Globe,         url: webUrl,  bg: 'hover:bg-purple-50',   icon_color: webUrl  ? 'text-purple-500' : 'text-gray-300' },
                ].map(({ label, icon: Icon, url, bg, icon_color }, i) => (
                    <button
                        key={label}
                        disabled={!url}
                        onClick={() => url && window.open(url, '_blank')}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1.5 py-4 transition-colors border-r border-gray-100",
                            url ? cn(bg, "cursor-pointer") : "cursor-not-allowed opacity-40"
                        )}
                    >
                        <Icon className={cn("w-5 h-5 transition-colors", icon_color)} strokeWidth={1.8} />
                        <span className={cn("text-[10px] font-semibold", url ? "text-gray-600" : "text-gray-300")}>
                            {label}
                        </span>
                    </button>
                ))}

                {/* Randevu Oluştur — TimeFlow bağlıysa aktif */}
                <button
                    onClick={() => timeflowConnected && setAppointmentOpen(true)}
                    disabled={!timeflowConnected}
                    title={timeflowConnected ? 'TimeFlow randevusu oluştur' : 'TimeFlow paketi gerekli'}
                    className={cn(
                        "flex flex-col items-center justify-center gap-1.5 py-4 transition-colors",
                        timeflowConnected ? "hover:bg-[#CCFF00]/10 cursor-pointer" : "cursor-not-allowed opacity-40"
                    )}
                >
                    <CalendarPlus className={cn("w-5 h-5", timeflowConnected ? "text-[#84cc16]" : "text-gray-300")} strokeWidth={1.8} />
                    <span className={cn("text-[10px] font-semibold", timeflowConnected ? "text-gray-600" : "text-gray-300")}>
                        Randevu
                    </span>
                </button>
            </div>

            {appointmentOpen && (
                <CreateAppointmentModal lead={lead} onClose={() => setAppointmentOpen(false)} />
            )}

            {/* ── SCROLLABLE BODY ─────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto no-scrollbar">

                {/* Contact details */}
                <div className="px-5 pt-4 pb-2 space-y-1">
                    {[
                        lead.email && {
                            icon: Mail,
                            label: 'E-Posta',
                            value: lead.email,
                            href: emailUrl,
                            muted: !hasValidEmail(lead.email),
                            accent: 'bg-blue-50 text-blue-500',
                        },
                        lead.phone && {
                            icon: Phone,
                            label: 'Telefon',
                            value: lead.phone,
                            href: callUrl,
                            accent: 'bg-gray-100 text-gray-600',
                        },
                        lead.address && {
                            icon: MapPin,
                            label: 'Adres',
                            value: lead.address,
                            href: null,
                            accent: 'bg-orange-50 text-orange-500',
                        },
                    ].filter(Boolean).map((row: any) => (
                        <div
                            key={row.label}
                            onClick={() => row.href && window.open(row.href, '_self')}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-2xl transition-colors",
                                row.href ? "hover:bg-gray-50 cursor-pointer" : ""
                            )}
                        >
                            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", row.accent)}>
                                <row.icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{row.label}</p>
                                <p className={cn(
                                    "text-sm font-semibold truncate",
                                    row.muted ? "text-gray-400 italic" : "text-gray-900"
                                )}>
                                    {row.value}
                                </p>
                            </div>
                            {row.href && <ExternalLink className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
                        </div>
                    ))}
                </div>

                {/* Enrichment section */}
                {(lead.hunterEmail || lead.linkedin || lead.instagram || lead.apolloSector) && (
                    <div className="px-5 pb-3">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                            Zenginleştirilmiş Veri
                        </p>
                        <div className="bg-gray-50 rounded-2xl overflow-hidden divide-y divide-gray-100/80">
                            {[
                                lead.hunterEmail && hasValidEmail(lead.hunterEmail) && {
                                    icon: Mail, label: 'Hunter Email', value: lead.hunterEmail,
                                    href: `mailto:${lead.hunterEmail}`,
                                    tag: 'Hunter', tagColor: 'bg-orange-100 text-orange-600',
                                },
                                lead.linkedin && {
                                    icon: Linkedin, label: 'LinkedIn',
                                    value: lead.linkedin.replace(/^https?:\/\/(www\.)?/i,'').replace(/\/$/,''),
                                    href: lead.linkedin,
                                    tag: 'LI', tagColor: 'bg-blue-100 text-blue-600',
                                },
                                lead.instagram && {
                                    icon: Instagram, label: 'Instagram',
                                    value: lead.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//i,'').replace(/\//,''),
                                    href: lead.instagram.startsWith('http') ? lead.instagram : `https://instagram.com/${lead.instagram}`,
                                    tag: 'IG', tagColor: 'bg-pink-100 text-pink-500',
                                },
                                lead.apolloSector && {
                                    icon: Building, label: 'Apollo Sektör', value: lead.apolloSector,
                                    href: null,
                                    tag: 'Apollo', tagColor: 'bg-gray-200 text-gray-500',
                                },
                            ].filter(Boolean).map((row: any) => (
                                <div
                                    key={row.label}
                                    onClick={() => row.href && window.open(row.href, '_blank')}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 transition-colors",
                                        row.href ? "hover:bg-gray-100/60 cursor-pointer" : ""
                                    )}
                                >
                                    <row.icon className="w-4 h-4 text-gray-400 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{row.label}</p>
                                        <p className="text-xs font-semibold text-gray-700 truncate">{row.value}</p>
                                    </div>
                                    <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wide", row.tagColor)}>
                                        {row.tag}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Social quick links */}
                {(lead.linkedin || lead.instagram) && (
                    <div className="px-5 pb-4 flex gap-2">
                        {lead.linkedin && (
                            <a
                                href={lead.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm shadow-blue-200"
                            >
                                <Linkedin className="w-4 h-4" />
                                LinkedIn
                            </a>
                        )}
                        {lead.instagram && (
                            <a
                                href={lead.instagram.startsWith('http') ? lead.instagram : `https://instagram.com/${lead.instagram}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs font-bold transition-all shadow-sm shadow-pink-200"
                            >
                                <Instagram className="w-4 h-4" />
                                Instagram
                            </a>
                        )}
                    </div>
                )}

                {/* Bottom padding */}
                <div className="h-2" />
            </div>

            {/* ── FOOTER ──────────────────────────────────────────── */}
            <div className="px-5 py-3 border-t border-gray-100/80 flex justify-center">
                <button
                    onClick={handleDelete}
                    className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
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
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full sm:max-w-sm">
                {content}
            </div>
        </div>
    );
};
