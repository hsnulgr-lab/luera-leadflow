
// OpenAI import removed to fix build error

// Client-side AI service using direct API call (for demo purposes)
// In production, this should be done via a backend proxy to hide the API key
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";

export const aiService = {
    async generateMessage(params: {
        leadName: string;
        company: string;
        sector?: string;
        tone?: 'professional' | 'friendly' | 'urgent' | 'offer';
    }): Promise<string> {
        // Fallback if no API keys (mock response)
        if (!GROQ_API_KEY && !OPENAI_API_KEY) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            return `Merhaba ${params.leadName}, ${params.company} için özel bir teklifimiz var. İşletmenizin büyümesine katkı sağlamak isteriz. Müsait olduğunuzda görüşebilir miyiz?`;
        }

        try {
            // Prefer Groq for speed, fallback to OpenAI
            const apiKey = GROQ_API_KEY || OPENAI_API_KEY;
            const baseURL = GROQ_API_KEY
                ? "https://api.groq.com/openai/v1"
                : "https://api.openai.com/v1";

            const model = GROQ_API_KEY ? "llama3-8b-8192" : "gpt-3.5-turbo";

            const response = await fetch(`${baseURL}/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: "system",
                            content: `Sen deneyimli bir B2B satış temsilcisisin. 
                            Görevin: Potansiyel müşteriye profesyonel, kısa ve etkileyici bir WhatsApp mesajı yazmak.
                            Şirketimiz: LUERA (Yapay Zeka ve Otomasyon Ajansı).
                            Hizmetimiz: İşletmelerin müşteri iletişimini otomize eden yapay zeka çözümleri.
                            
                            Kurallar:
                            1. Mesaj 3-4 cümleyi geçmemeli.
                            2. Samimi ama profesyonel ol.
                            3. Harekete geçirici bir soru ile bitir.
                            4. Emoji kullanımı: Ilımlı (en fazla 1-2 tane).`
                        },
                        {
                            role: "user",
                            content: `Müşteri Adı: ${params.leadName}
                            Şirket: ${params.company}
                            Sektör: ${params.sector || "Genel"}
                            Ton: ${params.tone || "professional"}
                            
                            Bu müşteri için bir tanışma mesajı yaz.`
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 150
                })
            });

            const data = await response.json();
            return data.choices[0]?.message?.content || "Mesaj oluşturulamadı.";

        } catch (error) {
            console.error("AI Generation failed:", error);
            return `Merhaba ${params.leadName}, ${params.company} markası için dijital dönüşüm fırsatlarını konuşmak isteriz.`;
        }
    }
};
