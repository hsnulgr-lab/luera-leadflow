import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface QRCodeData {
    id: string;
    instance_name: string;
    qr_base64: string;
    updated_at: string;
}

export function useQRCode(instanceName: string = "testwp") {
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
                // No QR code found is not an error
                if (fetchError.code === "PGRST116") {
                    console.log("[useQRCode] No QR code found for", instanceName);
                    setQrCode(null);
                    return null;
                }
                throw fetchError;
            }

            if (data) {
                const qrData = data as QRCodeData;

                // Check if this is a relatively fresh QR code (updated in last 15 minutes)
                // We use 15 minutes to account for server/browser time sync differences
                const updatedAt = new Date(qrData.updated_at);
                const timeDiff = Date.now() - updatedAt.getTime();
                const threeMinutes = 3 * 60 * 1000;

                if (timeDiff < threeMinutes) {
                    console.log("[useQRCode] Fresh QR code found!", qrData.updated_at);
                    setQrCode(qrData.qr_base64);
                    setLastUpdated(updatedAt);
                    return qrData.qr_base64;
                } else {
                    console.log("[useQRCode] QR code is stale (older than 3 mins), ignoring");
                    setQrCode(null);
                    return null;
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
    }, [instanceName]);

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
                        setQrCode(payload.new.qr_base64 as string);
                        setLastUpdated(new Date());
                    }
                }
            )
            .subscribe();

        // 2. Initial fetch
        fetchQRCode();

        // 3. Polling fallback (Every 3 seconds)
        // This ensures that even if Realtime fails (firewall, config), we still get the QR
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

    // Clear QR code
    const clearQRCode = useCallback(() => {
        setQrCode(null);
        setLastUpdated(null);
    }, []);

    return {
        qrCode,
        loading,
        error,
        lastUpdated,
        fetchQRCode,
        clearQRCode,
    };
}
