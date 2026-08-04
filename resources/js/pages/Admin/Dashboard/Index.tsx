import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/themes/light.css';
import { useTranslation } from 'react-i18next';
import { Users, Star, CalendarDays, CheckCircle2 } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface PageProps {
    metrics: {
        totalStudents: number;
        todayKpi: number;
        monthlyDrivingsCount: number;
        completionRate: number;
    };
    chartData: any[];
    filters?: {
        from?: string;
        to?: string;
    };
}

export default function DashboardIndex({ metrics, chartData, filters = {} }: PageProps) {
    const { t } = useTranslation();
    const [from, setFrom] = useState(filters.from || '');
    const [to, setTo] = useState(filters.to || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/dashboard', { from, to }, { preserveState: true, replace: true });
    };

    return (
        <div className="p-6 space-y-6">
            <Head title={t('dashboard.title', 'Bosh sahifa')} />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{t('dashboard.title', 'Bosh sahifa')}</h1>
                    <p className="text-muted-foreground">{t('dashboard.description', "Maktabning umumiy holati va ko'rsatkichlari")}</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <form onSubmit={handleSearch} className="flex flex-wrap gap-2 w-full md:w-auto">
                        <Flatpickr
                            options={{ dateFormat: 'd-m-Y', allowInput: true, disableMobile: true }}
                            placeholder={t('common.from', 'Dan') + ' DD-MM-YYYY'}
                            value={from}
                            onChange={(dates, dateStr) => setFrom(dateStr)}
                            className="flex h-10 w-full md:w-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            title={t('common.from', 'Dan')}
                        />
                        <Flatpickr
                            options={{ dateFormat: 'd-m-Y', allowInput: true, disableMobile: true }}
                            placeholder={t('common.to', 'Gacha') + ' DD-MM-YYYY'}
                            value={to}
                            onChange={(dates, dateStr) => setTo(dateStr)}
                            className="flex h-10 w-full md:w-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            title={t('common.to', 'Gacha')}
                        />
                        <button type="submit" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                            {t('common.filter', 'Filtrlash')}
                        </button>
                    </form>
                </div>
            </div>

            {/* Dashboard Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border rounded-xl p-6 flex flex-col justify-between shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-muted-foreground">{t('dashboard.total_students', 'Umumiy Talabalar')}</h3>
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <span className="text-3xl font-bold">{metrics.totalStudents}</span>
                    </div>
                </div>
                <div className="bg-card border rounded-xl p-6 flex flex-col justify-between shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-muted-foreground">{t('dashboard.avg_kpi', "O'rtacha KPI (%)")}</h3>
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                            <Star className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl font-bold">{metrics.todayKpi}%</div>
                        <p className="text-xs text-muted-foreground">{t('dashboard.avg_kpi_desc', "Tanlangan davr uchun o'rtacha ko'rsatkich")}</p>
                    </div>
                </div>
                <div className="bg-card border rounded-xl p-6 flex flex-col justify-between shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-muted-foreground">{t('dashboard.monthly_drivings', "Oylik Mashg'ulotlar")}</h3>
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                            <CalendarDays className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <span className="text-3xl font-bold">{metrics.monthlyDrivingsCount}</span>
                    </div>
                </div>
                <div className="bg-card border rounded-xl p-6 flex flex-col justify-between shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-muted-foreground">{t('dashboard.completion_rate', 'Oylik Tugatish Darajasi')}</h3>
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <span className="text-3xl font-bold">{metrics.completionRate}%</span>
                    </div>
                </div>
            </div>

            {/* Daily Drivings Chart */}
            <div className="bg-card border rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">{t('dashboard.daily_chart_title', "Shu oydagi kunlik mashg'ulotlar")}</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis 
                                dataKey="date" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 12, fill: '#6b7280' }} 
                                dy={10} 
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                            />
                            <Tooltip 
                                cursor={{ fill: '#f3f4f6' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar dataKey="Tugagan" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                            <Bar dataKey="Jarayonda" stackId="a" fill="#3b82f6" />
                            <Bar dataKey="Rejada" stackId="a" fill="#f59e0b" />
                            <Bar dataKey="Bekor_qilingan" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} name="Bekor qilingan" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
