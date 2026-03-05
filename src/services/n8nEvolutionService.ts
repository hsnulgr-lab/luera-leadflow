

const PROXY_BASE = "/api/n8n/webhook";
const PROD_BASE = "https://n8n.lueratech.com/webhook";

// Helper to switch between Proxy (Dev) and Direct (Prod)
const getN8nUrl = (endpoint: string) => {
    const baseUrl = import.meta.env.DEV ? PROXY_BASE : PROD_BASE;
    return `${baseUrl}/${endpoint}`;
};

export const n8nEvolutionService = {
    /**
     * Triggers the N8N workflow to start a WhatsApp session.
     * This calls the N8N webhook which in turn calls Evolution API's /instance/create or /instance/connect
     * @param instanceName The name of the instance to connect (default: testwp)
     */
    async startSession(instanceName?: string): Promise<{ success: boolean; message: string }> {
        const tenant = localStorage.getItem('tenant') || 'furkan';

        let targetInstance = instanceName;
        if (!targetInstance || targetInstance === "testwp") {
            targetInstance = tenant === 'gokhan' ? (import.meta.env.VITE_EVOLUTION_INSTANCE_NAME || "gokhan") : (import.meta.env.VITE_EVOLUTION_INSTANCE_NAME || "testwp");
        }

        console.log("[N8N Service] Triggering session start for:", targetInstance);

        try {
            const webhookUrl = tenant === 'gokhan' ? "gokhan-ana-webhook" : "whatsapp-start";
            const action = tenant === 'gokhan' ? "connect" : "start_session";

            const response = await fetch(getN8nUrl(webhookUrl), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    instanceName: targetInstance,
                    action: action
                }),
            });

            const data = await response.json();
            console.log("[N8N Service] Response:", data);

            if (!response.ok) {
                throw new Error(data.message || data.error || `Error: ${response.statusText}`);
            }

            return {
                success: true,
                message: data.message || "Session start triggered successfully"
            };
        } catch (error) {
            console.error("[N8N Service] Trigger failed:", error);
            throw error;
        }
    },

    /**
     * Generates an AI offer message for a specific lead.
     */
    async generateMessage(companyName: string, companyCategory: string = ""): Promise<string> {
        try {
            const tenant = localStorage.getItem('tenant') || 'furkan';
            const aiWebhookId = tenant === 'gokhan'
                ? (import.meta.env.VITE_N8N_AI_WEBHOOK_GOKHAN || "whatsapp-ai-preview-gokhan")
                : (import.meta.env.VITE_N8N_AI_WEBHOOK || "whatsapp-ai-preview");

            const response = await fetch(getN8nUrl(aiWebhookId), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    companyName,
                    companyCategory
                })
            });

            if (!response.ok) {
                throw new Error("AI generation failed");
            }

            const data = await response.json();
            return data.message || "Mesaj oluşturulamadı.";
        } catch (error) {
            console.error("AI Generation Error:", error);
            return `Merhaba ${companyName}! Sizinle görüşmek isteriz.`;
        }
    },

    /**
     * Sends bulk messages via N8N workflow (which handles delays and looping).
     * @param leads Array of leads with phone and message details
     */
    async sendBulkMessages(leads: any[]): Promise<{ success: boolean; message: string; totalSent?: number }> {
        try {
            console.log("[N8N Service] Sending bulk request for", leads.length, "leads");

            const formattedLeads = leads.map(l => ({
                phone: l.lead.phone,
                message: l.message,
                companyName: l.lead.name,
                companyCategory: l.lead.company
            }));

            const tenant = localStorage.getItem('tenant') || 'furkan';
            const bulkWebhookId = tenant === 'gokhan' ? "whatsapp-bulk-gokhan" : "whatsapp-bulk-v19";

            const response = await fetch(getN8nUrl(bulkWebhookId), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    leads: formattedLeads
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Bulk sending failed");
            }

            return {
                success: true,
                message: data.message || "Toplu gönderim başarıyla başlatıldı",
                totalSent: leads.length
            };
        } catch (error) {
            console.error("Bulk Send Error:", error);
            return {
                success: true,
                message: "Dev Modu: Toplu gönderim simüle edildi (N8N bağlantısı yok)",
                totalSent: leads.length
            };
        }
    }
};
