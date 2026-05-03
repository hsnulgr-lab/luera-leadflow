export interface Lead {
    id: string;
    name: string;
    company: string;
    phone: string;
    // Extended fields for AI personalization
    website?: string;
    instagram?: string;
    facebook?: string;
    address?: string;
    rating?: string | number;
    apolloSector?: string;
    email?: string;
    score?: number;
    tags?: string[];
}

export interface MessageQueueItem {
    id: string;
    lead: Lead;
    message: string;
    status: "generating" | "pending" | "sending" | "sent" | "failed";
    error?: string;
}
