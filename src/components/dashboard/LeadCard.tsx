import { Lead, LeadPriority } from '@/types/lead';
import { Mail, Phone, Flame, Thermometer, Snowflake } from 'lucide-react';
import { cn } from '@/utils/cn';

interface LeadCardProps {
    lead: Lead;
    onPriorityChange: (id: string, priority: LeadPriority) => void;
    onClick?: (lead: Lead) => void;
}

const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const statusConfig = {
    new: { color: 'bg-[#CCFF00]', label: 'Yeni' },
    contacted: { color: 'bg-blue-500', label: 'İletişimde' },
    interested: { color: 'bg-emerald-500', label: 'İlgili' },
    closed: { color: 'bg-slate-300', label: 'Kapalı' },
};

const priorityConfig = {
    hot: {
        color: 'bg-red-500',
        borderColor: 'border-red-500',
        icon: Flame,
        label: 'Sıcak',
        textColor: 'text-red-500'
    },
    warm: {
        color: 'bg-orange-400',
        borderColor: 'border-orange-400',
        icon: Thermometer,
        label: 'Ilık',
        textColor: 'text-orange-400'
    },
    cold: {
        color: 'bg-blue-400',
        borderColor: 'border-blue-400',
        icon: Snowflake,
        label: 'Soğuk',
        textColor: 'text-blue-400'
    },
};

const getNextPriority = (current: LeadPriority): LeadPriority => {
    if (!current) return 'hot';
    if (current === 'hot') return 'warm';
    if (current === 'warm') return 'cold';
    return null;
};

export const LeadCard = ({ lead, onPriorityChange, onClick }: LeadCardProps) => {
    const status = statusConfig[lead.status as keyof typeof statusConfig] || statusConfig.new;
    const priority = lead.priority ? priorityConfig[lead.priority] : null;
    const PriorityIcon = priority?.icon;

    const handlePriorityClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const nextPriority = getNextPriority(lead.priority || null);
        onPriorityChange(lead.id, nextPriority);
    };

    return (
        <div
            className={cn(
                "group relative flex items-center gap-4 p-5 rounded-2xl transition-all duration-300 cursor-pointer",
                "border bg-white",
                priority
                    ? `border-l-4 ${priority.borderColor} border-t-slate-100 border-r-slate-100 border-b-slate-100`
                    : "border-slate-100",
                "hover:border-slate-200 hover:shadow-lg hover:shadow-slate-100"
            )}
            onClick={() => onClick?.(lead)}
        >
            {/* Priority Toggle Button */}
            <div onClick={handlePriorityClick}>
                <button
                    className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300",
                        priority
                            ? `${priority.color} text-white shadow-lg`
                            : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:scale-110"
                    )}
                    title={priority ? `${priority.label} Lead - Değiştirmek için tıkla` : 'Öncelik belirle'}
                >
                    {PriorityIcon ? (
                        <PriorityIcon className="w-4 h-4" />
                    ) : (
                        <Flame className="w-4 h-4" />
                    )}
                </button>
            </div>

            {/* Avatar */}
            <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center font-semibold text-sm flex-shrink-0 transition-all duration-300",
                "bg-slate-900 text-white group-hover:scale-105"
            )}>
                {getInitials(lead.name || lead.company)}
            </div>

            {/* Main Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[15px] tracking-[-0.01em] text-slate-900">
                        {lead.name}
                    </h3>
                    <span className={cn("w-2 h-2 rounded-full flex-shrink-0", status.color)} />
                    {priority && (
                        <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                            priority.textColor,
                            "bg-opacity-10",
                            priority.color.replace('bg-', 'bg-opacity-10 bg-')
                        )}>
                            {priority.label}
                        </span>
                    )}
                </div>
                <p className="text-[13px] mt-0.5 text-slate-500">
                    {lead.company}
                </p>
            </div>

            {/* Contact Info */}
            <div className="hidden xl:flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                    <Phone className="w-3 h-3" />
                    <span>{lead.phone}</span>
                </div>
                {lead.email && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] bg-slate-100 text-slate-600">
                        <Mail className="w-3 h-3" />
                        <span className="truncate max-w-[100px]">{lead.email}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
