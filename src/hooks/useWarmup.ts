/**
 * useWarmup — WhatsApp numara ısınma sistemi
 *
 * Yeni bir numara direkt toplu gönderime sokulursa ban garantidir.
 * Bu hook numaranın kaç günlük olduğunu izler ve güvenli günlük limiti hesaplar.
 *
 * Faz tablosu (Türkiye gerçeği):
 *   Faz 1 — 0-7 gün   : 10/gün  (sadece test, tanışma)
 *   Faz 2 — 8-14 gün  : 25/gün  (yavaş ısınma)
 *   Faz 3 — 15-21 gün : 40/gün  (normal kullanım)
 *   Faz 4 — 22-30 gün : 60/gün  (aktif kullanım)
 *   Faz 5 — 30+ gün   : 80/gün  (tam kapasite)
 */

import { useState, useEffect, useCallback } from 'react';

export interface WarmupPhase {
    phase: 1 | 2 | 3 | 4 | 5;
    label: string;
    dailyLimit: number;
    daysElapsed: number;
    daysUntilNext: number | null;
    nextLimit: number | null;
    color: string;        // tailwind text color
    bgColor: string;      // tailwind bg color
    description: string;
}

const PHASES: Omit<WarmupPhase, 'daysElapsed' | 'daysUntilNext' | 'nextLimit'>[] = [
    { phase: 1, label: 'Isınma Başlangıcı', dailyLimit: 10,  color: 'text-blue-500',   bgColor: 'bg-blue-50',   description: 'Numara yeni — sadece test gönderileri' },
    { phase: 2, label: 'Erken Isınma',      dailyLimit: 25,  color: 'text-cyan-500',   bgColor: 'bg-cyan-50',   description: 'Yavaş yavaş artıyor' },
    { phase: 3, label: 'Normal Kullanım',   dailyLimit: 40,  color: 'text-yellow-600', bgColor: 'bg-yellow-50', description: 'Numara stabilleşiyor' },
    { phase: 4, label: 'Aktif Kullanım',    dailyLimit: 60,  color: 'text-orange-500', bgColor: 'bg-orange-50', description: 'Güvenli bölgede' },
    { phase: 5, label: 'Tam Kapasite',      dailyLimit: 80,  color: 'text-green-600',  bgColor: 'bg-green-50',  description: 'Numara güvenilir' },
];

const PHASE_DAYS = [0, 7, 14, 21, 30]; // her fazın başladığı gün

const getStorageKey = (instanceName: string) => `warmup_start_${instanceName}`;

export const useWarmup = (instanceName: string) => {
    const storageKey = getStorageKey(instanceName);

    const getOrCreateStartDate = useCallback((): string => {
        const stored = localStorage.getItem(storageKey);
        if (stored) return stored;
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(storageKey, today);
        return today;
    }, [storageKey]);

    const calculatePhase = useCallback((): WarmupPhase => {
        const startDate = getOrCreateStartDate();
        const start = new Date(startDate);
        const now = new Date();
        const daysElapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        let phaseIndex = 0;
        for (let i = PHASE_DAYS.length - 1; i >= 0; i--) {
            if (daysElapsed >= PHASE_DAYS[i]) { phaseIndex = i; break; }
        }

        const current = PHASES[phaseIndex];
        const next = PHASES[phaseIndex + 1] || null;
        const daysUntilNext = next ? (PHASE_DAYS[phaseIndex + 1] - daysElapsed) : null;

        return {
            ...current,
            daysElapsed,
            daysUntilNext,
            nextLimit: next?.dailyLimit ?? null,
        };
    }, [getOrCreateStartDate]);

    const [warmup, setWarmup] = useState<WarmupPhase>(calculatePhase);

    // Gün değişince güncelle
    useEffect(() => {
        setWarmup(calculatePhase());
        const interval = setInterval(() => setWarmup(calculatePhase()), 60 * 60 * 1000); // saatte bir kontrol
        return () => clearInterval(interval);
    }, [calculatePhase]);

    // Başlangıç tarihini manuel sıfırla (numara değişince)
    const resetWarmup = useCallback(() => {
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(storageKey, today);
        setWarmup(calculatePhase());
    }, [storageKey, calculatePhase]);

    // Başlangıç tarihini özelleştir (eski numaralar için geriye git)
    const setStartDate = useCallback((date: string) => {
        localStorage.setItem(storageKey, date);
        setWarmup(calculatePhase());
    }, [storageKey, calculatePhase]);

    return { warmup, resetWarmup, setStartDate };
};
