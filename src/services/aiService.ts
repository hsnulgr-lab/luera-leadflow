/**
 * AI Service — n8n Groq Webhook
 *
 * n8n/webhook/ai-message → Groq LLM → kişiselleştirilmiş mesaj
 */

const N8N_BASE = 'https://n8n.vps.lueratech.com';
const AI_WEBHOOK_URL = `${N8N_BASE}/webhook/ai-message`;

export const aiService = {
    async generateMessage(params: {
        leadName:        string;
        company:         string;
        sector?:         string;
        rating?:         number | null;
        hasWebsite?:     boolean;
        hasEmail?:       boolean;
        tone?:           'professional' | 'friendly' | 'curious';
        businessName?:   string;
        businessSector?: string;
        businessOffer?:  string;
        senderName?:     string;
    }): Promise<string> {
        try {
            const res = await fetch(AI_WEBHOOK_URL, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(params),
                signal:  AbortSignal.timeout(20_000),
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            if (data.message) return data.message;
            throw new Error('Empty response');

        } catch (error) {
            console.warn('[aiService] n8n failed, using fallback:', error);
            const name = params.leadName || params.company;
            return `Merhaba ${name} 👋 ${params.company} hakkında kısa bir bilgi paylaşmak istedim — sizin için hazırladığımız analizi 2 dakikada anlatabilir miyim?`;
        }
    },
};
