import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Users, BarChart2, Settings, CalendarClock, ChevronLeft, ChevronRight, MessageSquare, LogOut, User, ChevronUp } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    isCollapsed: boolean;
    onCollapsedChange: (collapsed: boolean) => void;
}

export const Sidebar = ({ activeTab, onTabChange, isCollapsed, onCollapsedChange }: SidebarProps) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'leads', label: 'Leads', icon: Users },
        { id: 'analytics', label: 'Analiz', icon: BarChart2 },
        { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
        { id: 'scheduler', label: 'Planlayıcı', icon: CalendarClock },
    ];

    return (
        <aside className={cn(
            "fixed left-0 top-0 h-screen bg-white/80 backdrop-blur-xl border-r border-gray-100 z-30 transition-all duration-300 ease-in-out",
            isCollapsed ? "w-20" : "w-64"
        )}>
            {/* Logo Section */}
            <div className="relative p-6 border-b border-gray-100">
                <div className={cn(
                    "flex items-center gap-3 transition-all duration-300",
                    isCollapsed && "justify-center"
                )}>
                    {!isCollapsed && (
                        <div className="flex items-baseline gap-1.5">
                            <h1 className="text-2xl font-bold text-gray-900">
                                LUERA
                            </h1>
                            <span className="text-xs text-gray-400 tracking-wide">LeadFlow</span>
                        </div>
                    )}
                    {isCollapsed && (
                        <span className="text-2xl font-bold text-gray-900">L</span>
                    )}
                </div>

                {/* Collapse Toggle */}
                <button
                    onClick={() => onCollapsedChange(!isCollapsed)}
                    className={cn(
                        "absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full",
                        "bg-white border border-gray-200 shadow-sm",
                        "flex items-center justify-center",
                        "hover:bg-gray-50 transition-colors",
                        "text-gray-400 hover:text-gray-600"
                    )}
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="p-3 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => onTabChange(item.id)}
                            className={cn(
                                "relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                                isCollapsed && "justify-center px-3",
                                isActive
                                    ? "bg-[#CCFF00]/10 text-gray-900 font-medium"
                                    : "text-gray-500 hover:bg-gray-100/80 hover:text-gray-900"
                            )}
                        >
                            {/* Active Indicator */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#CCFF00] rounded-r-full" />
                            )}
                            <Icon size={20} className={cn(isActive && "text-gray-900")} />
                            {!isCollapsed && <span>{item.label}</span>}
                        </button>
                    );
                })}


                {/* Divider */}
                <div className="pt-4 mt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => onTabChange('settings')}
                        className={cn(
                            "relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                            isCollapsed && "justify-center px-3",
                            activeTab === 'settings'
                                ? "bg-[#CCFF00]/10 text-gray-900 font-medium"
                                : "text-gray-500 hover:bg-gray-100/80 hover:text-gray-900"
                        )}
                    >
                        {activeTab === 'settings' && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#CCFF00] rounded-r-full" />
                        )}
                        <Settings size={20} />
                        {!isCollapsed && <span>Ayarlar</span>}
                    </button>
                </div>
            </nav>

            {/* User Profile */}
            <div className="absolute bottom-0 w-full p-4 border-t border-gray-100 bg-white/50">
                {/* Notification */}
                {!isCollapsed && (
                    <div className="flex justify-end mb-3">
                        <NotificationDropdown />
                    </div>
                )}

                <div className="relative">
                    <button
                        onClick={() => !isCollapsed && setShowUserMenu(!showUserMenu)}
                        className={cn(
                            "w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 transition-colors",
                            isCollapsed && "justify-center"
                        )}
                    >
                        <div className="w-10 h-10 rounded-full bg-[#CCFF00] flex items-center justify-center shadow-md">
                            <span className="font-bold text-gray-900 text-sm">{(user?.name || 'U').charAt(0).toUpperCase()}</span>
                        </div>
                        {!isCollapsed && (
                            <>
                                <div className="flex-1 text-left">
                                    <p className="text-sm font-semibold text-gray-900">
                                        {(user?.name || 'Kullanıcı').split(' ')[0].charAt(0).toUpperCase() + (user?.name || 'Kullanıcı').split(' ')[0].slice(1).toLowerCase()}
                                    </p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                        {user?.role || 'User'}
                                    </p>
                                </div>
                                <ChevronUp className={cn(
                                    "w-4 h-4 text-gray-400 transition-transform",
                                    !showUserMenu && "rotate-180"
                                )} />
                            </>
                        )}
                    </button>

                    {/* Dropdown Menu */}
                    {showUserMenu && !isCollapsed && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                            <button
                                onClick={() => { onTabChange('settings'); setShowUserMenu(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <User className="w-4 h-4" />
                                Profil
                            </button>
                            <button
                                onClick={() => { onTabChange('settings'); setShowUserMenu(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <Settings className="w-4 h-4" />
                                Ayarlar
                            </button>
                            <div className="border-t border-gray-100" />
                            <button
                                onClick={async () => {
                                    await logout();
                                    setShowUserMenu(false);
                                    navigate('/login');
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Çıkış Yap
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};
