import { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, Users, MessageSquare, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationType } from '@/types/notification';
import { cn } from '@/utils/cn';

const getIcon = (type: NotificationType) => {
    switch (type) {
        case 'lead':
            return <Users className="w-4 h-4" />;
        case 'message':
            return <MessageSquare className="w-4 h-4" />;
        case 'automation':
            return <Zap className="w-4 h-4" />;
        case 'alert':
            return <AlertTriangle className="w-4 h-4" />;
        case 'success':
            return <CheckCircle2 className="w-4 h-4" />;
    }
};

const getIconColor = (type: NotificationType) => {
    switch (type) {
        case 'lead':
            return 'text-blue-400 bg-blue-400/10';
        case 'message':
            return 'text-green-400 bg-green-400/10';
        case 'automation':
            return 'text-[#CCFF00] bg-[#CCFF00]/10';
        case 'alert':
            return 'text-orange-400 bg-orange-400/10';
        case 'success':
            return 'text-emerald-400 bg-emerald-400/10';
    }
};

const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Şimdi';
    if (minutes < 60) return `${minutes} dk önce`;
    if (hours < 24) return `${hours} saat önce`;
    return `${days} gün önce`;
};

export const NotificationDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications();

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-[#CCFF00]/20 transition-colors group"
            >
                <Bell className="w-5 h-5 text-gray-500 group-hover:text-[#CCFF00] transition-colors" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#CCFF00] text-black text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown - Opens to the right */}
            {isOpen && (
                <div className="absolute left-full bottom-0 ml-2 w-80 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100]">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <h3 className="font-semibold text-white">Bildirimler</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-[#CCFF00] hover:underline flex items-center gap-1"
                            >
                                <Check className="w-3 h-3" />
                                Tümünü Okundu İşaretle
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="py-8 text-center text-gray-500">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>Bildirim yok</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => markAsRead(notification.id)}
                                    className={cn(
                                        "px-4 py-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors relative group",
                                        !notification.read && "bg-[#CCFF00]/5"
                                    )}
                                >
                                    <div className="flex gap-3">
                                        {/* Icon */}
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                            getIconColor(notification.type)
                                        )}>
                                            {getIcon(notification.type)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={cn(
                                                    "text-sm font-medium truncate",
                                                    notification.read ? "text-gray-300" : "text-white"
                                                )}>
                                                    {notification.title}
                                                </p>
                                                {!notification.read && (
                                                    <span className="w-2 h-2 bg-[#CCFF00] rounded-full flex-shrink-0 mt-1.5" />
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                {formatTime(notification.timestamp)}
                                            </p>
                                        </div>

                                        {/* Delete button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                clearNotification(notification.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                                        >
                                            <X className="w-3 h-3 text-gray-500" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-white/10 text-center">
                            <button className="text-xs text-gray-400 hover:text-white transition-colors">
                                Tüm Bildirimleri Gör
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
