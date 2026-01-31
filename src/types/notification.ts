export type NotificationType = 'lead' | 'message' | 'automation' | 'alert' | 'success' | 'warning' | 'error';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    leadId?: string;
    actionUrl?: string;
}
