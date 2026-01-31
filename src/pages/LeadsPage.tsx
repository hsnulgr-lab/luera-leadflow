import { useState } from "react";
import { Users } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { Lead } from "@/types/lead";
import { LeadDetailPanel } from "@/components/dashboard/LeadDetailPanel";
import { LeadCard } from "@/components/dashboard/LeadCard";
import { AIMessageDialog } from "@/components/dashboard/AIMessageDialog";
import { AIOfferDialog } from "@/components/dashboard/AIOfferDialog";


export const LeadsPage = () => {
    const [selectedDetailLead, setSelectedDetailLead] = useState<Lead | null>(null);
    const [whatsAppLead, setWhatsAppLead] = useState<Lead | null>(null);
    const [showAIDialog, setShowAIDialog] = useState(false);

    // AI Offer Dialog State
    const [offerLead, setOfferLead] = useState<Lead | null>(null);
    const [showOfferDialog, setShowOfferDialog] = useState(false);

    const {
        leads,
        updateLeadPriority,
    } = useLeads();

    const handleAgentStart = async (lead: Lead) => {
        setOfferLead(lead);
        setShowOfferDialog(true);
    };

    return (
        <>
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Leadlerin</h1>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="p-4">
                        {leads.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                                    <Users className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <p className="text-muted-foreground">
                                    Henüz lead bulunamadı.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {leads.map((lead) => (
                                    <LeadCard
                                        key={lead.id}
                                        lead={lead}
                                        onPriorityChange={updateLeadPriority}
                                        onClick={setSelectedDetailLead}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <LeadDetailPanel
                lead={selectedDetailLead}
                onClose={() => setSelectedDetailLead(null)}
                onAgentStart={handleAgentStart}
            />

            <AIMessageDialog
                lead={whatsAppLead}
                open={showAIDialog}
                onOpenChange={setShowAIDialog}
            />

            <AIOfferDialog
                lead={offerLead}
                open={showOfferDialog}
                onOpenChange={setShowOfferDialog}
            />

        </>
    );
};
