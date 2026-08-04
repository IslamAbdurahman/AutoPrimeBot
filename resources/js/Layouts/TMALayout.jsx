import { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';

export default function TMALayout({ children, title }) {
    const [isReady, setIsReady] = useState(false);
    
    useEffect(() => {
        if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
            const webApp = window.Telegram.WebApp;
            webApp.ready();
            webApp.expand();
            
            // Set basic theme colors to match Telegram's theme
            document.documentElement.style.setProperty('--tg-theme-bg-color', webApp.backgroundColor);
            document.documentElement.style.setProperty('--tg-theme-text-color', webApp.textColor);
            
            setIsReady(true);
        } else {
            // For local development where TMA isn't available
            console.log("Telegram WebApp not found. Running in browser mode.");
            setIsReady(true);
        }
    }, []);

    if (!isReady) {
        return <div className="flex h-screen items-center justify-center p-4">Yuklanmoqda...</div>;
    }

    return (
        <div className="min-h-screen bg-[var(--tg-theme-bg-color,#f3f4f6)] text-[var(--tg-theme-text-color,#1f2937)] font-sans">
            <Head title={title ? `${title} - Avtomaktab KPI` : 'Avtomaktab KPI'} />
            
            <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
                <div className="px-4 py-3">
                    <h1 className="text-lg font-bold text-center truncate">{title || 'Boshqaruv Paneli'}</h1>
                </div>
            </header>

            <main className="p-4 pb-20">
                {children}
            </main>
        </div>
    );
}
