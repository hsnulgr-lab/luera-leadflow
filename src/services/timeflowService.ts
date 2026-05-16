export interface AppointmentPayload {
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    date: string;
    start_time: string;
    end_time: string;
    service: string;
    notes?: string;
}

function parseConnectionString(raw: string): { apiKey: string; userId: string } {
    const parts = raw.split('|');
    return { apiKey: parts[0] ?? '', userId: parts[1] ?? '' };
}

export function getTimeflowApiKey(): string | null {
    return localStorage.getItem('timeflow_api_key');
}

export function isTimeflowConnected(): boolean {
    const raw = getTimeflowApiKey();
    if (!raw) return false;
    const { apiKey, userId } = parseConnectionString(raw);
    return !!(apiKey && userId);
}

export async function createTimeflowAppointment(payload: AppointmentPayload): Promise<{ success: boolean; error?: string }> {
    const raw = getTimeflowApiKey();
    if (!raw) return { success: false, error: 'TimeFlow bağlı değil' };

    const { apiKey, userId } = parseConnectionString(raw);
    if (!userId) return { success: false, error: 'TimeFlow bağlantı anahtarı geçersiz — yeniden kopyalayın' };

    const TIMEFLOW_GATEWAY = 'https://supabase.timeflow.lueratech.com/functions/v1/gateway';

    try {
        const res = await fetch(TIMEFLOW_GATEWAY, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                event_type: 'appointment.create',
                source_module: 'leadflow',
                user_id: userId,
                ...payload,
            }),
        });

        if (res.status === 409) {
            const data = await res.json();
            return { success: false, error: `Bu saatte çakışma var: ${data.conflict?.customer_name ?? ''}` };
        }

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            return { success: false, error: data.error ?? `Sunucu hatası (${res.status})` };
        }

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e?.message ?? 'Bağlantı hatası' };
    }
}
