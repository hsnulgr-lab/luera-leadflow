/**
 * Evolution API — Direkt servis
 * QR kod, bağlantı durumu, instance yönetimi
 */

const getBase = () =>
    import.meta.env.VITE_EVOLUTION_API_URL || 'https://evo-n59ivh0wermz8to4ky2k8v7f.vps.lueratech.com';

const KEY = import.meta.env.VITE_EVOLUTION_API_KEY || 'mySecretKey123';

const headers = () => ({
    'Content-Type': 'application/json',
    'apikey': KEY,
});

export type ConnectionState = 'open' | 'close' | 'connecting';

export const evolutionService = {

    /** Instance oluştur — zaten varsa hata vermez */
    async createInstance(instanceName: string): Promise<boolean> {
        try {
            const res = await fetch(`${getBase()}/instance/create`, {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify({ instanceName, qrcode: true, integration: "WHATSAPP-BAILEYS" }),
            });
            return res.ok || res.status === 409; // 409 = zaten var
        } catch (err) {
            console.error('[Evolution] createInstance error:', err);
            return false;
        }
    },

    /** Instance yoksa oluştur, varsa dokunma */
    async ensureInstance(instanceName: string): Promise<boolean> {
        const state = await this.getConnectionState(instanceName);
        if (state !== null) return true; // zaten var
        return this.createInstance(instanceName);
    },

    /** QR kod base64 döner — yoksa null */
    async getQRCode(instanceName: string): Promise<string | null> {
        try {
            const res = await fetch(`${getBase()}/instance/connect/${instanceName}`, {
                headers: headers(),
            });
            if (!res.ok) return null;
            const data = await res.json();
            // Evolution v2: { base64: "data:image/png;base64,..." }
            return data.base64 || data.qrcode?.base64 || null;
        } catch (err) {
            console.error('[Evolution] getQRCode error:', err);
            return null;
        }
    },

    /** Bağlantı durumu: 'open' | 'close' | 'connecting' | null (instance yok) */
    async getConnectionState(instanceName: string): Promise<ConnectionState | null> {
        try {
            const res = await fetch(`${getBase()}/instance/connectionState/${instanceName}`, {
                headers: headers(),
            });
            if (res.status === 404) return null; // instance yok
            if (!res.ok) return 'close';
            const data = await res.json();
            return data.instance?.state || data.state || 'close';
        } catch (err) {
            console.error('[Evolution] getConnectionState error:', err);
            return 'close';
        }
    },

    /** WhatsApp bağlantısını kes (instance kalır) */
    async disconnect(instanceName: string): Promise<boolean> {
        try {
            const res = await fetch(`${getBase()}/instance/logout/${instanceName}`, {
                method: 'DELETE',
                headers: headers(),
            });
            return res.ok;
        } catch (err) {
            console.error('[Evolution] disconnect error:', err);
            return false;
        }
    },

    /** Instance'ı tamamen sil */
    async deleteInstance(instanceName: string): Promise<boolean> {
        try {
            const res = await fetch(`${getBase()}/instance/delete/${instanceName}`, {
                method: 'DELETE',
                headers: headers(),
            });
            return res.ok;
        } catch (err) {
            console.error('[Evolution] deleteInstance error:', err);
            return false;
        }
    },

    /**
     * WhatsApp mesajı gönder
     * phone: herhangi bir formatta olabilir (0532..., +90532..., 90532...)
     * Döner: { success, messageId? }
     */
    async sendTextMessage(
        instanceName: string,
        phone: string,
        text: string
    ): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            const number = normalizePhone(phone);
            if (!number) {
                return { success: false, error: 'Geçersiz telefon numarası' };
            }

            const res = await fetch(`${getBase()}/message/sendText/${instanceName}`, {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify({
                    number,
                    text,
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                const errMsg = data?.message || data?.error || `HTTP ${res.status}`;
                console.error('[Evolution] sendTextMessage failed:', errMsg);
                return { success: false, error: errMsg };
            }

            return {
                success: true,
                messageId: data?.key?.id || data?.messageId || undefined,
            };
        } catch (err: any) {
            console.error('[Evolution] sendTextMessage error:', err);
            return { success: false, error: err?.message || 'Network error' };
        }
    },

    /** Instance adı üret: lf- + userId ilk 12 karakter */
    generateInstanceName(userId: string): string {
        return `lf-${userId.replace(/-/g, '').substring(0, 12)}`;
    },
};

/**
 * Telefon numarasını Evolution API formatına normalize et.
 * Evolution API: uluslararası format, + işareti yok.
 * Türkiye: 905XXXXXXXXX (11 hane)
 */
export function normalizePhone(raw: string): string | null {
    if (!raw) return null;

    // Sadece rakamları al
    let digits = raw.replace(/\D/g, '');

    // 0XXXXXXXXXX (11 hane, Türkiye yerel) → 90XXXXXXXXXX
    if (digits.startsWith('0') && digits.length === 11) {
        digits = '90' + digits.slice(1);
    }

    // 90XXXXXXXXXX (12 hane) → zaten doğru
    if (digits.startsWith('90') && digits.length === 12) return digits;

    // 5XXXXXXXXX (10 hane, başında ülke kodu yok) → 905XXXXXXXXX
    if (digits.length === 10 && !digits.startsWith('0')) {
        digits = '90' + digits;
        if (digits.length === 12) return digits;
    }

    // Diğer uluslararası numaralar (min 10 hane)
    if (digits.length >= 10) return digits;

    return null;
}
