import { Lead, LeadPriority } from '@/types/lead';
import { Mail, Phone, Flame, Thermometer, Snowflake, ExternalLink } from 'lucide-react';
import { cn } from '@/utils/cn';

interface LeadCardProps {
    lead: Lead;
    onPriorityChange: (id: string, priority: LeadPriority) => void;
    onClick?: (lead: Lead) => void;
}

const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const getAvatarGradient = (name: string) => {
    const gradients = [
        'from-slate-700 to-slate-900',
        'from-zinc-700 to-zinc-900',
        'from-neutral-700 to-neutral-900',
        'from-stone-700 to-stone-900',
        'from-gray-700 to-gray-900',
    ];
    const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % gradients.length;
    return gradients[idx];
};

const priorityConfig = {
    hot: {
        color: 'bg-red-500',
        borderColor: 'border-red-500',
        icon: Flame,
        label: 'Sıcak',
        textColor: 'text-red-500',
        bgColor: 'bg-red-50'
    },
    warm: {
        color: 'bg-orange-400',
        borderColor: 'border-orange-400',
        icon: Thermometer,
        label: 'Ilık',
        textColor: 'text-orange-500',
        bgColor: 'bg-orange-50'
    },
    cold: {
        color: 'bg-blue-400',
        borderColor: 'border-blue-400',
        icon: Snowflake,
        label: 'Soğuk',
        textColor: 'text-blue-500',
        bgColor: 'bg-blue-50'
    },
};

const getNextPriority = (current: LeadPriority): LeadPriority => {
    if (!current) return 'hot';
    if (current === 'hot') return 'warm';
    if (current === 'warm') return 'cold';
    return null;
};

const truncateName = (name: string, maxLen = 45) =>
    name.length > maxLen ? name.slice(0, maxLen) + '…' : name;

export const LeadCard = ({ lead, onPriorityChange, onClick }: LeadCardProps) => {
    const priority = lead.priority ? priorityConfig[lead.priority] : null;
    const PriorityIcon = priority?.icon;

    const handlePriorityClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const nextPriority = getNextPriority(lead.priority || null);
        onPriorityChange(lead.id, nextPriority);
    };

    const hasValidEmail = lead.email && lead.email !== 'N/A' && lead.email !== 'n/a' && lead.email.includes('@');

    return (
        <div
            className={cn(
                "group relative flex items-center gap-3 p-4 rounded-xl transition-all duration-200 cursor-pointer",
                "border bg-white",
                priority
                    ? `border-l-[3px] ${priority.borderColor} border-t-gray-100 border-r-gray-100 border-b-gray-100`
                    : "border-gray-100 hover:border-gray-200",
                "hover:shadow-md"
            )}
            onClick={() => onClick?.(lead)}
        >
            {/* Priority Toggle */}
            <div onClick={handlePriorityClick} className="flex-shrink-0">
                <button
                    className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                        priority
                            ? `${priority.bgColor} ${priority.textColor}`
                            : "bg-gray-50 text-gray-300 hover:bg-gray-100 hover:text-gray-400"
                    )}
                    title={priority ? `${priority.label} Lead - Değiştirmek için tıkla` : 'Öncelik belirle'}
                >
                    {PriorityIcon ? (
                        <PriorityIcon className="w-3.5 h-3.5" />
                    ) : (
                        <Flame className="w-3.5 h-3.5" />
                    )}
                </button>
            </div>

            {/* Avatar */}
            <div className={cn(
                `w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarGradient(lead.name || lead.company)}`,
                "flex items-center justify-center font-bold text-xs flex-shrink-0 text-white",
                "group-hover:scale-105 transition-transform"
            )}>
                {getInitials(lead.name || lead.company)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-gray-900 truncate">
                    {truncateName(lead.name || lead.company)}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {lead.company !== lead.name ? lead.company : (lead as any).sector || 'İşletme'}
                </p>
            </div>

            {/* Contact Badges */}
            <div className="hidden lg:flex items-center gap-1.5 flex-shrink-0">
                {lead.phone && (
                    <a
                        href={`tel:${lead.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    >
                        <Phone className="w-3 h-3" />
                        <span>{lead.phone}</span>
                    </a>
                )}
                {hasValidEmail && (
                    <a
                        href={`mailto:${lead.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    >
                        <Mail className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">{lead.email}</span>
                    </a>
                )}
                {lead.website && (
                    <a
                        href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                        <ExternalLink className="w-3 h-3" />
                    </a>
                )}
            </div>
        </div>
    );
};
