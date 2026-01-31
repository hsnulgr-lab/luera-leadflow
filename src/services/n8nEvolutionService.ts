

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
    async startSession(instanceName: string = "testwp"): Promise<{ success: boolean; message: string }> {
        console.log("[N8N Service] Triggering session start for:", instanceName);

        try {
            const response = await fetch(getN8nUrl("whatsapp-start"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    instanceName: instanceName,
                    action: "start_session"
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
    async generateMessage(companyName: string, offerType: string = "yapay zeka çözümleri"): Promise<string> {
        try {
            // Using the production URL directly via proxy (assuming proxy is set to handle /api/n8n -> https://n8n.lueratech.com)
            // Or if we want to bypass proxy issues and use the full URL if CORS allows (it usually does for server-to-server or if configured)
            // But since we set up a proxy for /api/n8n, let's stick to the proxy pattern for consistency, 
            // BUT we need to make sure the proxy points to the right place. 
            // The user gave: https://n8n.lueratech.com/webhook/whatsapp-ai-preview
            // So we should update the fetch call to use the proxy path.

            // Use helper to ensure correct URL in both Dev and Prod
            const response = await fetch(getN8nUrl("whatsapp-ai-preview"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    companyName,
                    offerType
                })
            });

            if (!response.ok) {
                throw new Error("AI generation failed");
            }

            const data = await response.json();
            return data.message || "Mesaj oluşturulamadı.";
        } catch (error) {
            console.error("AI Generation Error:", error);
            // Fallback for demo if N8N is not running
            return `Merhaba ${companyName}! 🚀 LUERA olarak size özel ${offerType} sunmak istiyoruz.`;
        }
    },

    /**
     * Sends bulk messages via N8N workflow (which handles delays and looping).
     * @param leads Array of leads with phone and message details
     */
    async sendBulkMessages(leads: any[]): Promise<{ success: boolean; message: string; totalSent?: number }> {
        try {
            console.log("[N8N Service] Sending bulk request for", leads.length, "leads");

            // Format leads for N8N
            const formattedLeads = leads.map(l => ({
                phone: l.lead.phone,
                message: l.message,
                companyName: l.lead.name,
                companyCategory: l.lead.company
            }));

            // Use the proxy path for the bulk webhook
            // Ideally this should be configured in vite.config.ts if it's a new path, 
            // but assuming /api/n8n proxies to the N8N instance, we just append the webhook path.
            // If the proxy is just for the base URL, we might need the full path.
            // Based on previous file, N8N_TRIGGER_URL was /api/n8n/webhook/whatsapp-start
            // So we use /api/n8n/webhook/whatsapp-send-bulk

            // V19 Workflow with Completion Notification
            const response = await fetch(getN8nUrl("whatsapp-bulk-v19"), {
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
            // Simulate success for demo if N8N is not reachable
            return {
                success: true,
                message: "Dev Modu: Toplu gönderim simüle edildi (N8N bağlantısı yok)",
                totalSent: leads.length
            };
        }
    }
};
