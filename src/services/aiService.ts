/**
 * AI Service — n8n Groq Webhook (ai-message)
 *
 * Field isimleri n8n node'undaki $json.body.* ile eşleşmeli.
 */

const N8N_BASE = 'https://n8n.vps.lueratech.com';
const AI_WEBHOOK_URL = `${N8N_BASE}/webhook/ai-message`;

export const aiService = {
    async generateMessage(params: {
        // Lead (hedef işletme) alanları — n8n node field isimleriyle eşleşir
        leadName?:       string;
        companyName:     string;   // node: $json.body.companyName
        sector?:         string;   // node: $json.body.sector
        address?:        string;   // node: $json.body.address
        rating?:         number | null; // node: $json.body.rating
        website?:        string;   // node: $json.body.website
        instagram?:      string;   // node: $json.body.instagram
        // Ton
        tone?:           'professional' | 'friendly' | 'curious';
        // Gönderen (kullanıcının işletmesi) alanları
        senderName?:     string;
        businessName?:   string;
        businessSector?: string;
        businessOffer?:  string;
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
            // n8n Groq node'u choices[0].message.content veya message döndürür
            const msg = data.message
                || data.choices?.[0]?.message?.content
                || null;
            if (msg) return msg.trim();
            throw new Error('Empty response');

        } catch (error) {
            console.warn('[aiService] n8n failed, using fallback:', error);
            return `Merhaba ${params.companyName} 👋 İşletmeniz için hazırladığımız analizi 2 dakikada anlatabilir miyim? İlgilenmiyorsanız söylemeniz yeterli 🙏`;
        }
    },
};
