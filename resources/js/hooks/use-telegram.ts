// @ts-nocheck
import { router } from '@inertiajs/react';
import { useEffect } from 'react';

/**
 * Telegram Mini App ichida ekanligini aniqlash
 */
export function isTelegramWebApp(): boolean {
    return !!(window as any).Telegram?.WebApp?.initData;
}

/**
 * Telegram BackButton — ichki sahifalarda orqaga tugmasini ko'rsatish
 */
export function useTelegramBackButton(backUrl?: string) {
    useEffect(() => {
        const tg = (window as any).Telegram?.WebApp;
        if (!tg || !backUrl) return;

        if (!tg.isVersionAtLeast?.('6.1')) return;

        tg.BackButton.show();
        const handler = () => router.visit(backUrl);
        tg.BackButton.onClick(handler);

        return () => {
            tg.BackButton.offClick(handler);
            tg.BackButton.hide();
        };
    }, [backUrl]);
}

/**
 * Telegram HapticFeedback
 */
export function useTelegramHaptic() {
    const tg = (window as any).Telegram?.WebApp;

    const isSupported = tg && tg.isVersionAtLeast?.('6.1');

    return {
        /** Engil tebranish (tugma bosish) */
        light: () => isSupported && tg?.HapticFeedback?.impactOccurred('light'),
        /** O'rtacha tebranish (javob tanlash) */
        medium: () => isSupported && tg?.HapticFeedback?.impactOccurred('medium'),
        /** Kuchli tebranish */
        heavy: () => isSupported && tg?.HapticFeedback?.impactOccurred('heavy'),
        /** Muvaffaqiyat (to'g'ri javob) */
        success: () => isSupported && tg?.HapticFeedback?.notificationOccurred('success'),
        /** Xatolik (noto'g'ri javob) */
        error: () => isSupported && tg?.HapticFeedback?.notificationOccurred('error'),
        /** Ogohlantirish */
        warning: () => isSupported && tg?.HapticFeedback?.notificationOccurred('warning'),
    };
}

/**
 * Initializes the Telegram Mini App by expanding it and notifying Telegram SDK.
 */
export function initTelegramWebApp() {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return;

    tg.ready();

    const isMobile =
        typeof window !== 'undefined' &&
        (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth < 768 ||
         ['android', 'ios'].includes(tg.platform));

    if (isMobile) {
        tg.expand();
        if (typeof tg.requestFullscreen === 'function') {
            try {
                tg.requestFullscreen();
            } catch (e) {
                // Ignore fullscreen errors
            }
        }
    } else {
        if (typeof tg.exitFullscreen === 'function') {
            try {
                tg.exitFullscreen();
            } catch (e) {
                // Ignore exitFullscreen errors
            }
        }
    }
}
