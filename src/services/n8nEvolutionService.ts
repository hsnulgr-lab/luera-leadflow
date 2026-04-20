import { supabase } from '@/lib/supabase';

const PROXY_BASE = "/api/n8n/webhook";
const PROD_BASE = "https://n8n.lueratech.com/webhook";

const getN8nUrl = (endpoint: string) => {
    const baseUrl = import.meta.env.DEV ? PROXY_BASE : PROD_BASE;
    return `${baseUrl}/${endpoint}`;
};

// Kullanıcının evolution_instance_name'ini Supabase'den çek
const getUserInstanceName = async (userId: string): Promise<string> => {
    const { data } = await supabase
        .from('user_settings')
        .select('evolution_instance_name')
        .eq('user_id', userId)
        .single();

    return data?.evolution_instance_name || import.meta.env.VITE_EVOLUTION_INSTANCE_NAME || 'testwp';
};

export const n8nEvolutionService = {
    async startSession(instanceName: string): Promise<{ success: boolean; message: string }> {
        console.log("[N8N Service] Triggering session start for:", instanceName);

        try {
            const response = await fetch(getN8nUrl("whatsapp-start"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    instanceName,
                    action: "start_session"
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || `Error: ${response.statusText}`);
            }

            return { success: true, message: data.message || "Session start triggered successfully" };
        } catch (error) {
            console.error("[N8N Service] Trigger failed:", error);
            throw error;
        }
    },

    async generateMessage(companyName: string, companyCategory: string = ""): Promise<string> {
        try {
            const response = await fetch(getN8nUrl(import.meta.env.VITE_N8N_AI_WEBHOOK || "whatsapp-ai-preview"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ companyName, companyCategory })
            });

            if (!response.ok) throw new Error("AI generation failed");

            const data = await response.json();
            return data.message || "Mesaj oluşturulamadı.";
        } catch (error) {
            console.error("AI Generation Error:", error);
            return `Merhaba ${companyName}! Sizinle görüşmek isteriz.`;
        }
    },

    async sendBulkMessages(
        leads: any[],
        instanceName: string
    ): Promise<{ success: boolean; message: string; totalSent?: number }> {
        try {
            console.log("[N8N Service] Sending bulk request for", leads.length, "leads via", instanceName);

            const formattedLeads = leads.map(l => ({
                phone: l.lead.phone,
                message: l.message,
                companyName: l.lead.name,
                companyCategory: l.lead.company
            }));

            const response = await fetch(getN8nUrl("whatsapp-bulk-v19"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    leads: formattedLeads,
                    instanceName,
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
                message: "Dev Modu: Toplu gönderim simüle edildi",
                totalSent: leads.length
            };
        }
    }
};

export { getUserInstanceName };
