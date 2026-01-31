import { ScheduleConfig, Lead } from "@/types/lead";

const WEBHOOK_ID = "e3c9c128-2078-4702-8fc2-bf55da50302c";
const PROXY_PATH = `/api/n8n/webhook/${WEBHOOK_ID}`;

// Helper to get the correct URL (Proxy in Dev, Direct in Prod)
const getApiUrl = (key: "search" | "agent") => {
    // In development (localhost), ALWAYS use the proxy to avoid CORS errors
    if (import.meta.env.DEV) {
        return PROXY_PATH;
    }

    // In production (if hosted on same domain or properly configured), use full URL or relative
    // For now, defaulting to the full URL for production build if not proxying
    return `https://n8n.lueratech.com/webhook/${WEBHOOK_ID}`;
};



export const n8nService = {
    // Extend params to support optional scheduling
    async searchLeads(config: ScheduleConfig, scheduledTime?: string): Promise<Lead[]> {
        const apiUrl = getApiUrl("search");

        if (!apiUrl) {
            console.error("n8n Search URL is not defined");
            throw new Error("Lead Arama Webhook URL tanımlanmamış. Ayarlar sayfasından ekleyin.");
        }

        // Improved query format for better Google Maps accuracy
        // Combine sector + district + city for more specific results
        const googleQuery = [config.sector, config.district, config.city]
            .filter(Boolean)
            .join(' ')
            .trim();

        const payload = {
            "Lokayon": config.district
                ? `${config.district}, ${config.city}`
                : config.city,
            "Anahtar Kelime": config.sector,
            "GoogleQuery": googleQuery, // Combined query: "veteriner çankaya ankara"
            "Sehir": config.city,
            "Semt": config.district || "",
            "Sektor": config.sector,
            "Taranacak İşletme Sayısı": config.limit || 30,
            "scheduledTime": scheduledTime,
            // Critical Scraper Settings
            "scrapeContacts": true,
            "scrapeSocialMediaProfiles": {
                "instagrams": true,
                "facebooks": true,
                "youtubes": false,
                "tiktoks": false,
                "twitters": false
            },
            "scrapeReviewsPersonalData": false
        };

        try {
            console.log("Fetching from:", apiUrl);
            console.log("Search Payload:", JSON.stringify(payload, null, 2));

            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`n8n hatası: ${response.statusText}`);
            }

            const text = await response.text();
            console.log("n8n Raw Response:", text);

            if (!text) {
                console.warn("n8n boş yanıt döndürdü (Muhtemelen filtreler sonucu 0 kayıt kaldı). Boş liste dönülüyor.");
                return [];
            }

            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                throw new Error(`n8n'den beklenen JSON gelmedi. Gelen veri: ${text.substring(0, 100)}...`);
            }

            // Handle different response structures gracefully
            // Handle different response structures gracefully
            if (Array.isArray(result)) {
                return result.map(mapN8nToLead);
            } else if (result && typeof result === 'object') {
                // If single object (e.g. n8n loop responding 1 by 1)
                // Check if it has 'data' property which is an array
                if (result.data && Array.isArray(result.data)) {
                    return result.data.map(mapN8nToLead);
                }
                // Check if it's a single lead object
                if (result["Company Name"] || result.title || result.id) {
                    return [mapN8nToLead(result)];
                }
            }

            return [];
        } catch (error) {
            console.error("n8n search failed:", error);
            throw error;
        }
    },

    async startAutonomousAgent(lead: Lead): Promise<boolean> {
        // ... implementation remains same but calls generateAnalyzedMessage internally if needed, 
        // but for now let's keep it separate or just use generateAnalyzedMessage instead.
        // Actually the previous functionality was "Start Agent" which might be async.
        // The new request is "Create Message" button.
        try {
            await this.generateAnalyzedMessage(lead);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    },

    async generateAnalyzedMessage(lead: Lead): Promise<string> {
        // Default to the user's provided URL if not set
        const defaultAgentUrl = "https://n8n.lueratech.com/webhook/lead-agent";
        const apiUrl = getApiUrl("agent") || defaultAgentUrl;

        if (!apiUrl) {
            throw new Error("Webhook URL config is missing.");
        }

        const payload = {
            action: "analyze_and_generate",
            leadId: lead.id,
            name: lead.name,
            company: lead.company,
            phone: lead.phone,
            email: lead.email,
            website: lead.website,
            timestamp: new Date().toISOString()
        };

        if (!payload.website) {
            throw new Error("Analiz için müşterinin web sitesi gereklidir.");
        }

        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`n8n Hatası (${response.status}): ${errText}`);
            }

            const data = await response.json();

            // Handle various n8n response formats
            // 1. { text: "..." }
            // 2. { output: "..." }
            // 3. { message: "..." }
            // 4. [ { text: "..." } ]

            let message = "";
            const content = Array.isArray(data) ? data[0] : data;

            message = content.text || content.message || content.output || content.result || "";

            if (!message && typeof content === 'string') {
                message = content;
            }

            if (!message) {
                // Try to dump full JSON if detailed field missing
                console.warn("Unexpected n8n response format:", data);
                message = typeof data === 'object' ? JSON.stringify(data) : String(data);
            }

            return message;
        } catch (error) {
            console.error("Analysis failed:", error);
            throw error;
        }
    },

    // =====================================================
    // WhatsApp Messaging via n8n Workflows
    // =====================================================

    /**
     * Send a single WhatsApp message via n8n workflow
     */
    async sendWhatsAppMessage(
        phone: string,
        message: string,
        companyName?: string,
        companyCategory?: string
    ): Promise<{ success: boolean; messageId?: string; error?: string }> {
        const webhookUrl = localStorage.getItem("n8n_whatsapp_single_url")
            || "https://n8n.lueratech.com/webhook/whatsapp-send-single";

        try {
            const response = await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone,
                    message,
                    companyName: companyName || "",
                    companyCategory: companyCategory || ""
                }),
            });

            const data = await response.json();

            if (data.success) {
                return {
                    success: true,
                    messageId: data.messageId
                };
            } else {
                return {
                    success: false,
                    error: data.error || data.message || "Mesaj gönderilemedi"
                };
            }
        } catch (error) {
            console.error("WhatsApp send failed:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Bilinmeyen hata"
            };
        }
    },

    /**
     * Send bulk WhatsApp messages via n8n workflow
     * Note: n8n workflow handles rate limiting (30-75 seconds between messages)
     */
    async sendBulkWhatsAppMessages(
        leads: Array<{ phone: string; companyName?: string; companyCategory?: string }>,
        messageTemplate: string
    ): Promise<{
        success: boolean;
        totalSent: number;
        successful: number;
        failed: number;
        results: Array<{ phone: string; success: boolean; error?: string }>;
    }> {
        const webhookUrl = localStorage.getItem("n8n_whatsapp_bulk_url")
            || "https://n8n.lueratech.com/webhook/whatsapp-send-bulk";

        try {
            const response = await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: messageTemplate,
                    leads: leads.map(lead => ({
                        phone: lead.phone,
                        companyName: lead.companyName || "",
                        companyCategory: lead.companyCategory || ""
                    }))
                }),
            });

            const data = await response.json();

            return {
                success: data.success || false,
                totalSent: data.totalSent || 0,
                successful: data.successful || 0,
                failed: data.failed || 0,
                results: data.results || []
            };
        } catch (error) {
            console.error("Bulk WhatsApp send failed:", error);
            return {
                success: false,
                totalSent: 0,
                successful: 0,
                failed: leads.length,
                results: leads.map(l => ({
                    phone: l.phone,
                    success: false,
                    error: error instanceof Error ? error.message : "Bilinmeyen hata"
                }))
            };
        }
    }
};

// Helper to map n8n/Google Maps raw data to our Lead type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapN8nToLead(item: any): Lead {
    return {
        id: item.id || crypto.randomUUID(),
        name: item["Company Name"] || item.title || "İsimsiz Şirket",
        company: item["Company Category"] || item.categoryName || "Bilinmiyor",
        email: item.Email || item.email || "cagrı@example.com", // Fallback for UI if missing
        phone: item["Phone Number"] || item.phone || "",
        status: "new",
        website: item.Website || item.website || undefined,
        score: calculateScore(item),
        lastActivity: "Yeni Eklendi",
        tags: [item["Company Category"]].filter(Boolean),
        dateAdded: new Date().toISOString()
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calculateScore(item: any): number {
    let score = 50;
    if (item.Email) score += 20;
    if (item["Phone Number"]) score += 20;
    if (item.Website) score += 10;
    return Math.min(score, 100);
}
