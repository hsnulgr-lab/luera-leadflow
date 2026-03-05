import { useContext } from 'react';
import { LeadContext } from '@/contexts/LeadContext';

export const useLeads = () => {
    const context = useContext(LeadContext);
    if (!context) {
        throw new Error('useLeads must be used within LeadProvider');
    }
    return context;
};

