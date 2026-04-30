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
    linkedin?: string;
    hunterEmail?: string;
    employeeCount?: string | number;
    instagram?: string;
    facebook?: string;
    address?: string;
    rating?: string | number;
    apolloSector?: string;
}

export type PhoneType   = 'mobil' | 'sabit' | 'her ikisi';
export type EmailFilter = 'var' | 'yok' | 'hepsi';

export interface ScheduleConfig {
    date: Date | undefined;
    time: string;
    city: string;
    district: string;
    sector: string;
    limit: number;
    phoneType: PhoneType;
    emailFilter: EmailFilter;
}
