export interface Lead {
    id: string;
    name: string;
    company: string;
    phone: string;
}

export interface MessageQueueItem {
    id: string;
    lead: Lead;
    message: string;
    status: "pending" | "sending" | "sent" | "failed";
    error?: string;
}
