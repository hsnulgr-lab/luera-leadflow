/**
 * CallFlow Integration Service (Bridge Server üzerinden)
 *
 * Multi-tenant: Her LeadFlow kullanıcısı kendi CallFlow API key'ini girer.
 * Lead'ler bridge server'a gider, server key'i doğrulayıp doğru user_id'ye yazar.
 */

import { Lead } from "@/types/lead";

// Bridge server URL — env'den okunabilir
const CALLFLOW_API_URL =
    (import.meta.env.VITE_CALLFLOW_API_URL as string) ||
    "https://callflow-production-3ce4.up.railway.app";

/** Kullanıcının ayarlardaki API key'ini al */
function getCallflowApiKey(): string | null {
    return localStorage.getItem("callflow_api_key");
}

/** API key'i kaydet */
export function setCallflowApiKey(key: string): void {
    localStorage.setItem("callflow_api_key", key);
}

/** API key'i sil */
export function clearCallflowApiKey(): void {
    localStorage.removeItem("callflow_api_key");
}

/** Lead -> CallFlow payload */
function leadToPayload(lead: Lead) {
    return {
        name:          lead.name || lead.company || lead.phone,
        phone:         lead.phone,
        email:         lead.email || undefined,
        source:        "leadflow",
        leadflow_id:   lead.id,
        tags:          lead.tags ?? [],
        custom_fields: {
            company:  lead.company,
            website:  lead.website,
            status:   lead.status,
            priority: lead.priority,
            score:    lead.score,
        },
    };
}

/** Tek bir lead'i CallFlow'a gönder */
export async function sendLeadToCallflow(lead: Lead): Promise<boolean> {
    const apiKey = getCallflowApiKey();
    if (!apiKey) return false;

    try {
        const res = await fetch(`${CALLFLOW_API_URL}/api/leadflow/receive`, {
            method:  "POST",
            headers: {
                "Content-Type":  "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify(leadToPayload(lead)),
        });

        return res.ok;
    } catch {
        return false;
    }
}

/** Birden fazla lead'i toplu gönder (tek istekle) */
export async function sendLeadsToCallflow(
    leads: Lead[]
): Promise<{ success: number; fail: number }> {
    const apiKey = getCallflowApiKey();
    if (!apiKey) return { success: 0, fail: leads.length };
    if (leads.length === 0) return { success: 0, fail: 0 };

    try {
        const res = await fetch(`${CALLFLOW_API_URL}/api/leadflow/receive-bulk`, {
            method:  "POST",
            headers: {
                "Content-Type":  "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ leads: leads.map(leadToPayload) }),
        });

        if (!res.ok) return { success: 0, fail: leads.length };

        const data = await res.json();
        return {
            success: (data.success ?? 0) + (data.duplicate ?? 0), // duplicate'i başarılı say
            fail:    data.fail ?? 0,
        };
    } catch {
        return { success: 0, fail: leads.length };
    }
}
