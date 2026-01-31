import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Notification, NotificationType } from '@/types/notification';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    addNotification: (type: NotificationType, title: string, message: string, leadId?: string) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    clearNotification: (id: string) => Promise<void>;
    clearAll: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const unreadCount = notifications.filter(n => !n.read).length;

    const fetchNotifications = useCallback(async () => {
        if (!user) {
            setNotifications([]);
            setIsLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            const mappedNotes: Notification[] = (data || []).map(item => ({
                id: item.id,
                type: (item.type || 'success') as NotificationType,
                title: item.title,
                message: item.message || '',
                timestamp: new Date(item.created_at),
                read: item.read,
                leadId: item.lead_id,
            }));

            setNotifications(mappedNotes);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const addNotification = useCallback(async (
        type: NotificationType,
        title: string,
        message: string,
        leadId?: string
    ) => {
        if (!user) return;

        // Optimistic update
        const tempId = Date.now().toString();
        const newNote: Notification = {
            id: tempId,
            type,
            title,
            message,
            timestamp: new Date(),
            read: false,
            leadId,
        };
        setNotifications(prev => [newNote, ...prev]);

        try {
            const { data, error } = await supabase
                .from('notifications')
                .insert({
                    type,
                    title,
                    message,
                    user_id: user.id,
                    lead_id: leadId,
                    read: false,
                })
                .select()
                .single();

            if (error) throw error;

            // Update with real ID
            setNotifications(prev => prev.map(n => n.id === tempId ? {
                ...n,
                id: data.id,
                timestamp: new Date(data.created_at)
            } : n));

        } catch (err) {
            console.error('Error adding notification:', err);
            // Revert on error
            setNotifications(prev => prev.filter(n => n.id !== tempId));
        }
    }, [user]);

    const markAsRead = useCallback(async (id: string) => {
        // Optimistic update
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', id);

            if (error) throw error;
        } catch (err) {
            console.error('Error marking as read:', err);
            // Revert
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: false } : n)
            );
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length === 0) return;

        // Optimistic
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .in('id', unreadIds);

            if (error) throw error;
        } catch (err) {
            console.error('Error marking all read:', err);
            fetchNotifications(); // Re-fetch to sync
        }
    }, [notifications, fetchNotifications]);

    const clearNotification = useCallback(async (id: string) => {
        const noteToDelete = notifications.find(n => n.id === id);
        setNotifications(prev => prev.filter(n => n.id !== id));

        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (err) {
            console.error('Error deleting notification:', err);
            if (noteToDelete) {
                setNotifications(prev => [...prev, noteToDelete]);
            }
        }
    }, [notifications]);

    const clearAll = useCallback(async () => {
        setNotifications([]);

        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

            if (error) throw error;
        } catch (err) {
            console.error('Error clearing all:', err);
            fetchNotifications();
        }
    }, [fetchNotifications]);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            isLoading,
            addNotification,
            markAsRead,
            markAllAsRead,
            clearNotification,
            clearAll,
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};
