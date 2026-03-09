import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface QRCodeData {
    id: string;
    instance_name: string;
    qr_base64: string;
    updated_at: string;
}

export function useQRCode(instanceName: string = "gokhan") {
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    // Timestamp of when user clicked "QR Kod Oluştur" — only accept QRs updated AFTER this
    const [requestedAt, setRequestedAt] = useState<number | null>(null);

    // Fetch QR code from Supabase
    const fetchQRCode = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from("qr_codes")
                .select("*")
                .eq("instance_name", instanceName)
                .order("updated_at", { ascending: false })
                .limit(1)
                .single();

            if (fetchError) {
                if (fetchError.code === "PGRST116") {
                    console.log("[useQRCode] No QR code found for", instanceName);
                    setQrCode(null);
                    return null;
                }
                throw fetchError;
            }

            if (data) {
                const qrData = data as QRCodeData;
                const updatedAt = new Date(qrData.updated_at);

                if (requestedAt) {
                    // User is actively waiting for a NEW QR — only accept if updated AFTER click
                    if (updatedAt.getTime() > requestedAt) {
                        console.log("[useQRCode] New QR received after request!", qrData.updated_at);
                        setQrCode(qrData.qr_base64);
                        setLastUpdated(updatedAt);
                        return qrData.qr_base64;
                    } else {
                        console.log("[useQRCode] Waiting for new QR... (current is from before request)");
                        return null;
                    }
                } else {
                    // No active request — normal freshness check (75 seconds)
                    const timeDiff = Date.now() - updatedAt.getTime();
                    if (timeDiff < 75000) {
                        console.log("[useQRCode] Fresh QR code found!", qrData.updated_at);
                        setQrCode(qrData.qr_base64);
                        setLastUpdated(updatedAt);
                        return qrData.qr_base64;
                    } else {
                        setQrCode(null);
                        return null;
                    }
                }
            }

            return null;
        } catch (err) {
            console.error("[useQRCode] Error fetching QR code:", err);
            setError(err instanceof Error ? err.message : "Unknown error");
            return null;
        } finally {
            setLoading(false);
        }
    }, [instanceName, requestedAt]);

    // Subscribe to realtime updates AND Poll for backup
    useEffect(() => {
        console.log("[useQRCode] Setting up realtime subscription + Polling for", instanceName);

        // 1. Realtime Subscription
        const channel = supabase
            .channel("qr-codes-changes")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "qr_codes",
                    filter: `instance_name=eq.${instanceName}`,
                },
                (payload) => {
                    console.log("[useQRCode] Realtime update received:", payload);
                    if (payload.new && "qr_base64" in payload.new) {
                        const newUpdatedAt = new Date(payload.new.updated_at as string);
                        // If user is waiting, only accept if updated after request
                        if (requestedAt && newUpdatedAt.getTime() <= requestedAt) {
                            console.log("[useQRCode] Realtime: ignoring, QR is from before request");
                            return;
                        }
                        setQrCode(payload.new.qr_base64 as string);
                        setLastUpdated(newUpdatedAt);
                    }
                }
            )
            .subscribe();

        // 2. Initial fetch
        fetchQRCode();

        // 3. Polling fallback (Every 3 seconds)
        const intervalId = setInterval(() => {
            console.log("[useQRCode] Polling for QR code...");
            fetchQRCode();
        }, 3000);

        return () => {
            console.log("[useQRCode] Cleaning up subscription and polling");
            supabase.removeChannel(channel);
            clearInterval(intervalId);
        };
    }, [instanceName, fetchQRCode]);

    // Request new QR — sets timestamp, only QRs after this time will be accepted
    const requestNewQR = useCallback(() => {
        setQrCode(null);
        setLastUpdated(null);
        setRequestedAt(Date.now());
    }, []);

    // Clear QR code and reset request
    const clearQRCode = useCallback(() => {
        setQrCode(null);
        setLastUpdated(null);
        setRequestedAt(null);
    }, []);

    return {
        qrCode,
        loading,
        error,
        lastUpdated,
        fetchQRCode,
        clearQRCode,
        requestNewQR,
    };
}
