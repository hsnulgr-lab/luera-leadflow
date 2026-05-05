/**
 * AI Service — Backend Proxy Versiyonu
 *
 * API key'ler artık Railway bridge server'da (server-side).
 * Client sadece /api/ai/generate endpoint'ine POST atar.
 * Dev'de Vite proxy üzerinden, prod'da Railway URL üzerinden.
 */

const AI_PROXY_URL = import.meta.env.DEV
    ? '/api/bridge/ai/generate'   // Vite proxy → localhost:3001/api/ai/generate
    : '/api/ai/generate';         // Production: same-origin via Railway

export const aiService = {
    async generateMessage(params: {
        leadName:        string;
        company:         string;
        sector?:         string;
        tone?:           'professional' | 'friendly' | 'urgent' | 'offer';
        businessName?:   string;
        businessSector?: string;
        businessOffer?:  string;
        senderName?:     string;
    }): Promise<string> {
        try {
            const res = await fetch(AI_PROXY_URL, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(params),
                signal:  AbortSignal.timeout(15_000),
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            if (data.message) return data.message;
            throw new Error('Empty response');

        } catch (error) {
            console.warn('[aiService] Proxy failed, using fallback:', error);
            // Statik fallback — bridge server ulaşılamazsa kullanılır
            return `Merhaba ${params.leadName}, ${params.company} işletmesi için özel bir teklifimiz var. Müsait olduğunuzda görüşebilir miyiz?`;
        }
    },
};
