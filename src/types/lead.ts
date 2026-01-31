export type LeadStatus = 'new' | 'contacted' | 'interested' | 'closed';
export type LeadPriority = 'hot' | 'warm' | 'cold' | null;

export interface Lead {
    id: string;
    name: string;
    company: string;
    email: string;
    phone: string;
    website?: string;
    status: LeadStatus;
    priority?: LeadPriority;
    dateAdded: string;
    score?: number;
    lastActivity?: string;
    tags?: string[];
}

export interface ScheduleConfig {
    date: Date | undefined;
    time: string;
    city: string;
    district: string;
    sector: string;
    limit: number;
}
