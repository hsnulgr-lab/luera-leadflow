import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useEffect, useState } from 'react';

interface StatsCardProps {
    title: string;
    value: string | number;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
    icon: LucideIcon;
}

export const StatsCard = ({ title, value, change, changeType, icon: Icon }: StatsCardProps) => {
    const [displayValue, setDisplayValue] = useState(0);
    const numericValue = typeof value === 'number' ? value : parseInt(value.toString(), 10);
    const isNumeric = !isNaN(numericValue);

    // Animated counter effect
    useEffect(() => {
        if (!isNumeric) return;

        const duration = 800;
        const steps = 30;
        const increment = numericValue / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= numericValue) {
                setDisplayValue(numericValue);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.floor(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [numericValue, isNumeric]);

    return (
        <div className={cn(
            "relative overflow-hidden rounded-3xl p-6 transition-all duration-500 ease-out",
            "bg-white/70 backdrop-blur-xl",
            "border border-white/50",
            "shadow-[0_8px_32px_rgba(0,0,0,0.04)]",
            "hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)] hover:-translate-y-1",
            "group"
        )}>
            {/* Subtle inner glow */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/80 via-transparent to-transparent pointer-events-none" />

            <div className="relative flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase">
                        {title}
                    </p>
                    <h3 className="text-4xl font-semibold text-gray-900 tracking-tight">
                        {isNumeric ? displayValue : value}
                    </h3>
                </div>
                <div className="p-3 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/80 border border-gray-100/50 shadow-sm">
                    <Icon className="w-5 h-5 text-gray-500" />
                </div>
            </div>

            <div className="relative mt-4 flex items-center gap-1">
                {changeType === 'positive' && <TrendingUp className="w-3.5 h-3.5 text-green-500" />}
                {changeType === 'negative' && <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                <span className={cn(
                    "text-xs font-medium",
                    changeType === 'positive' && "text-green-600",
                    changeType === 'negative' && "text-red-500",
                    changeType === 'neutral' && "text-gray-400"
                )}>
                    {change}
                </span>
            </div>
        </div>
    );
};

