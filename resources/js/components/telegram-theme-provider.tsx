// @ts-nocheck
import React, { useEffect } from 'react';

export function TelegramThemeProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const tg = (window as any).Telegram?.WebApp;
        if (!tg || tg.platform === 'unknown') return;

        const updateTheme = () => {
            const theme = tg.themeParams;
            const root = document.documentElement;

            if (theme?.bg_color) root.style.setProperty('--tg-theme-bg-color', theme.bg_color);
            if (theme?.text_color) root.style.setProperty('--tg-theme-text-color', theme.text_color);
            if (theme?.hint_color) root.style.setProperty('--tg-theme-hint-color', theme.hint_color);
            if (theme?.link_color) root.style.setProperty('--tg-theme-link-color', theme.link_color);
            if (theme?.button_color) root.style.setProperty('--tg-theme-button-color', theme.button_color);
            if (theme?.button_text_color) root.style.setProperty('--tg-theme-button-text-color', theme.button_text_color);
            if (theme?.secondary_bg_color) root.style.setProperty('--tg-theme-secondary-bg-color', theme.secondary_bg_color);

            if (tg.colorScheme === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        };

        if (tg.onEvent) {
            tg.onEvent('themeChanged', updateTheme);
        }
        updateTheme();

        tg.ready();
        tg.expand();

        if (tg.isVersionAtLeast?.('7.7') && typeof tg.disableVerticalSwipes === 'function') {
            tg.disableVerticalSwipes();
        }

        return () => {
            if (tg.offEvent) {
                tg.offEvent('themeChanged', updateTheme);
            }
        };
    }, []);

    return <>{children}</>;
}

export const useHaptic = () => {
    const impact = (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') => {
        (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
    };

    const notification = (type: 'error' | 'success' | 'warning') => {
        (window as any).Telegram?.WebApp?.HapticFeedback?.notificationOccurred(type);
    };

    const selection = () => {
        (window as any).Telegram?.WebApp?.HapticFeedback?.selectionChanged();
    };

    return { impact, notification, selection };
};
