import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { DatePicker } from '@/components/ui/date-picker';

interface Instructor {
    id: number;
    name: string;
    phone: string;
    groups_count: number;
    total_drivings: number;
    average_rating: number;
    total_reviews: number;
    kpi_percentage: number;
    needs_attention?: boolean;
    negative_tags_count?: number;
}

interface PageProps {
    instructors: Instructor[];
    filters?: {
        from?: string;
        to?: string;
    };
}

export default function KPI({ instructors = [], filters = {} }: PageProps) {
    const [fromDate, setFromDate] = useState(filters?.from || '');
    const [toDate, setToDate] = useState(filters?.to || '');

    const applyFilters = (newFrom: string, newTo: string) => {
        router.get('/admin/kpi', { 
            from: newFrom,
            to: newTo
        }, { preserveState: true, replace: true });
    };

    const handleFilterDateChange = (field: 'from' | 'to', dateStr: string) => {
        if (field === 'from') {
            setFromDate(dateStr);
            applyFilters(dateStr, toDate);
        } else {
            setToDate(dateStr);
            applyFilters(fromDate, dateStr);
        }
    };

    return (
        <div className="p-6">
            <Head title="Admin KPI Paneli" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Avtomaktab KPI Tizimi</h1>
                    <p className="text-muted-foreground">
                        Instruktorlar reytingi va mashg'ulotlar statistikasi
                    </p>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                    <DatePicker 
                        placeholder="Dan DD-MM-YYYY"
                        value={fromDate}
                        onChange={(val) => handleFilterDateChange('from', val)}
                        className="w-full md:w-36"
                        title="Dan"
                    />
                    
                    <DatePicker 
                        placeholder="Gacha DD-MM-YYYY"
                        value={toDate}
                        onChange={(val) => handleFilterDateChange('to', val)}
                        className="w-full md:w-36"
                        title="Gacha"
                    />
                </div>
            </div>

            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                {/* Desktop Table */}
                <table className="hidden md:table w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground border-b">
                        <tr>
                            <th className="px-4 py-3 font-medium">Instruktor</th>
                            <th className="px-4 py-3 font-medium text-center">Guruh / Dars</th>
                            <th className="px-4 py-3 font-medium text-center">O'rtacha Baho</th>
                            <th className="px-4 py-3 font-medium text-center">KPI (%)</th>
                            <th className="px-4 py-3 font-medium text-center">Holat</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {instructors.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                    Ma'lumot topilmadi
                                </td>
                            </tr>
                        ) : (
                            instructors.map((instructor) => (
                                <tr key={instructor.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3 font-medium">
                                        <div className="font-semibold text-primary">{instructor.name}</div>
                                        <div className="text-xs text-muted-foreground">{instructor.phone}</div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="font-medium">{instructor.groups_count} ta guruh</div>
                                        <div className="text-xs text-muted-foreground">{instructor.total_drivings} ta mashg'ulot</div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="inline-flex items-center gap-1 font-semibold">
                                            <span>{instructor.average_rating}</span>
                                            <span className="text-yellow-500">⭐</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">{instructor.total_reviews} ta baho</div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                                            instructor.kpi_percentage >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                            instructor.kpi_percentage >= 50 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                            {instructor.kpi_percentage}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {instructor.needs_attention ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                                Xavotirli ({instructor.negative_tags_count} shikoyat)
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                A'lo
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Mobile Cards */}
                <div className="md:hidden p-3 space-y-3 bg-muted/20">
                    {instructors.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            Ma'lumot topilmadi
                        </div>
                    ) : (
                        instructors.map((instructor) => (
                            <div key={instructor.id} className="p-4 space-y-3 bg-card border rounded-xl shadow-xs">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-semibold text-lg text-primary">{instructor.name}</div>
                                        <div className="text-sm text-muted-foreground">{instructor.phone}</div>
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                                        instructor.kpi_percentage >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                        instructor.kpi_percentage >= 50 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                        {instructor.kpi_percentage}% KPI
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t">
                                    <div>
                                        <span className="text-muted-foreground text-xs block">Guruh / Darslar:</span>
                                        <div className="font-medium text-xs mt-0.5">{instructor.groups_count} guruh / {instructor.total_drivings} dars</div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground text-xs block">O'rtacha baho:</span>
                                        <div className="font-medium text-xs mt-0.5 flex items-center gap-1">
                                            <span>{instructor.average_rating}</span>
                                            <span className="text-yellow-500">⭐</span>
                                            <span className="text-muted-foreground">({instructor.total_reviews})</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2 border-t flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground">Holat:</span>
                                    {instructor.needs_attention ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                            Xavotirli ({instructor.negative_tags_count} ta)
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                            A'lo
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
