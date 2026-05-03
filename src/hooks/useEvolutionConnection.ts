import { useState, useEffect, useRef, useCallback } from 'react';
import { evolutionService, ConnectionState } from '@/services/evolutionService';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const getWsBase = () => {
    const url = import.meta.env.VITE_EVOLUTION_API_URL || '';
    return url.replace(/^https?/, 'wss').replace(/\/$/, '');
};
const API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY || '';

export const useEvolutionConnection = (instanceName: string | null) => {
    const { user } = useAuth();
    const [connectionState, setConnectionState] = useState<ConnectionState>('close');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const wsFailCount = useRef(0);
    const wsReconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const qrTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mountedRef = useRef(true);

    // ─── Yardımcı temizleyiciler ────────────────────────────────────────────
    const stopPolling = useCallback(() => {
        if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
        if (qrTimeoutRef.current) { clearTimeout(qrTimeoutRef.current); qrTimeoutRef.current = null; }
    }, []);

    const stopWs = useCallback(() => {
        if (wsReconnectTimer.current) { clearTimeout(wsReconnectTimer.current); wsReconnectTimer.current = null; }
        if (wsRef.current) {
            wsRef.current.onclose = null;
            wsRef.current.onerror = null;
            wsRef.current.onmessage = null;
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    // ─── Polling: bağlantı açılınca durdur ─────────────────────────────────
    const startPolling = useCallback((iName: string) => {
        if (pollingRef.current) return; // zaten çalışıyor
        pollingRef.current = setInterval(async () => {
            if (!mountedRef.current) return;
            const state = await evolutionService.getConnectionState(iName);
            if (state === 'open') {
                if (mountedRef.current) {
                    setConnectionState('open');
                    setQrCode(null);
                }
                stopPolling();
            }
        }, 3000);
    }, [stopPolling]);

    // ─── WebSocket: bağlanmayı dene, 3 başarısız sonrası pes et ───────────
    const tryWebSocket = useCallback((iName: string) => {
        if (wsFailCount.current >= 3) return; // WS bu sunucuda çalışmıyor

        stopWs();
        const wsUrl = `${getWsBase()}/ws?apikey=${API_KEY}&instance=${iName}`;

        let ws: WebSocket;
        try { ws = new WebSocket(wsUrl); }
        catch { wsFailCount.current = 3; return; }

        wsRef.current = ws;

        ws.onopen = () => {
            wsFailCount.current = 0; // başarılı bağlantı, sayacı sıfırla
        };

        ws.onmessage = (event) => {
            if (!mountedRef.current) return;
            try {
                const msg = JSON.parse(event.data as string);
                if (msg.instance && msg.instance !== iName) return;

                if (msg.event === 'connection.update') {
                    const state: ConnectionState = msg.data?.state ?? 'close';
                    setConnectionState(state);
                    if (state === 'open') {
                        setQrCode(null);
                        if (qrTimeoutRef.current) { clearTimeout(qrTimeoutRef.current); qrTimeoutRef.current = null; }
                        stopPolling(); // WS açıksa polling'e gerek yok
                        setIsLoading(false);
                    }
                }

                if (msg.event === 'qrcode.updated') {
                    const base64 = msg.data?.qrcode?.base64 || msg.data?.base64 || null;
                    if (base64) {
                        setQrCode(base64);
                        setConnectionState('connecting');
                        setIsLoading(false);
                        // QR timeout'u yenile
                        if (qrTimeoutRef.current) clearTimeout(qrTimeoutRef.current);
                        qrTimeoutRef.current = setTimeout(() => {
                            if (mountedRef.current) setQrCode(null);
                        }, 75000);
                    }
                }
            } catch { /* parse hatası, yoksay */ }
        };

        ws.onerror = () => { /* sessizce */ };

        ws.onclose = () => {
            if (!mountedRef.current) return;
            wsFailCount.current += 1;
            wsRef.current = null;

            if (wsFailCount.current < 3) {
                // Tekrar dene
                wsReconnectTimer.current = setTimeout(() => tryWebSocket(iName), 5000);
            }
            // 3 başarısız sonrası WS denemesini bırak — polling devam eder
        };
    }, [stopWs, stopPolling]);

    // ─── Sayfa açılınca mevcut durumu kontrol et ───────────────────────────
    useEffect(() => {
        mountedRef.current = true;
        if (!instanceName) return;

        evolutionService.getConnectionState(instanceName).then((state) => {
            if (state && mountedRef.current) setConnectionState(state);
        });

        // WS'yi pasif olarak dene (başarılı olursa polling açılmadan önce bağlantıyı yakalarız)
        tryWebSocket(instanceName);

        return () => {
            mountedRef.current = false;
            stopPolling();
            stopWs();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [instanceName]);

    // ─── Bağlan: QR al + polling + WS ─────────────────────────────────────
    const connect = useCallback(async () => {
        if (!instanceName) return;
        setIsLoading(true);
        setQrCode(null);

        try {
            // 1. Instance yoksa oluştur
            await evolutionService.ensureInstance(instanceName);

            // 2. QR kodunu HTTP ile al (anında göster)
            const qr = await evolutionService.getQRCode(instanceName);
            if (mountedRef.current) {
                if (qr) {
                    setQrCode(qr);
                    setConnectionState('connecting');
                    // QR 75s sonra süresi dolar
                    if (qrTimeoutRef.current) clearTimeout(qrTimeoutRef.current);
                    qrTimeoutRef.current = setTimeout(() => {
                        if (mountedRef.current) setQrCode(null);
                    }, 75000);
                }
                setIsLoading(false);
            }

            // 3. Bağlantı tespiti için polling başlat
            startPolling(instanceName);

            // 4. WS'yi de dene (çalışırsa polling'i durdurur)
            tryWebSocket(instanceName);

        } catch (err) {
            console.error('[useEvolutionConnection] connect error:', err);
            if (mountedRef.current) {
                setConnectionState('close');
                setIsLoading(false);
            }
        }
    }, [instanceName, startPolling, tryWebSocket]);

    // ─── Bağlantıyı kes ────────────────────────────────────────────────────
    const disconnect = useCallback(async () => {
        if (!instanceName) return;
        setIsLoading(true);
        await evolutionService.disconnect(instanceName);
        if (mountedRef.current) {
            setConnectionState('close');
            setQrCode(null);
            stopPolling();
            setIsLoading(false);
        }
    }, [instanceName, stopPolling]);

    // ─── Manuel durum kontrolü ──────────────────────────────────────────────
    const checkState = useCallback(async () => {
        if (!instanceName) return;
        const state = await evolutionService.getConnectionState(instanceName);
        if (state && mountedRef.current) setConnectionState(state);
        return state;
    }, [instanceName]);

    // ─── Instance provision ─────────────────────────────────────────────────
    const provisionInstance = useCallback(async () => {
        if (!user || !instanceName) return;
        try {
            await evolutionService.createInstance(instanceName);
            await supabase.from('user_settings').upsert(
                { user_id: user.id, evolution_instance_name: instanceName },
                { onConflict: 'user_id' }
            );
        } catch (err) {
            console.error('[provisionInstance] error:', err);
        }
    }, [user, instanceName]);

    return {
        connectionState,
        isConnected: connectionState === 'open',
        qrCode,
        isLoading,
        connect,
        disconnect,
        checkState,
        provisionInstance,
    };
};
