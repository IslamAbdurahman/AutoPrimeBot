import { useState, useCallback } from 'react';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/themes/light.css';
import { Head, useForm, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Trash2, Edit2, Plus, Search, AlertTriangle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Pagination from '@/components/pagination';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Filter } from 'lucide-react';

interface Instructor {
    id: number;
    name: string;
    phone: string;
    telegram_id?: string;
    kpi_percentage: number;
    groups_count: number;
    students_count: number;
    total_drivings: number;
    reviewed_drivings: number;
    total_score: number;
    max_score: number;
    score_formatted: string;
    average_rating: number;
    is_low_rating?: boolean;
    needs_attention: boolean;
}

interface PageProps {
    instructors: {
        data: Instructor[];
        links?: any[];
        from?: number;
    };
    filters?: {
        search?: string;
        from?: string;
        to?: string;
        per_page?: string;
    };
}

export default function InstructorsIndex({ instructors, filters = {} }: PageProps) {
    const { t } = useTranslation();
    const [editing, setEditing] = useState<Instructor | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState(filters.search || '');
    const [from, setFrom] = useState(filters.from || '');
    const [to, setTo] = useState(filters.to || '');
    const [perPage, setPerPage] = useState(filters.per_page || '10');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/instructors', { search, from, to, per_page: perPage }, { preserveState: true, replace: true });
    };

    const { data, setData, post, put, delete: destroy, reset, errors, processing } = useForm({
        name: '',
        phone: '',
        telegram_id: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editing) {
            put('/admin/instructors/' + editing.id, {
                onSuccess: () => closeForm(),
            });
        } else {
            post('/admin/instructors', {
                onSuccess: () => closeForm(),
            });
        }
    };

    const handleEdit = (instructor: Instructor) => {
        setEditing(instructor);
        setData({
            name: instructor.name,
            phone: instructor.phone,
            telegram_id: instructor.telegram_id || '',
        });
        setShowForm(true);
    };

    const handleDelete = (id: number) => {
        if (confirm(t('common.confirm_delete', 'Rostdan ham o\'chirmoqchimisiz?'))) {
            destroy('/admin/instructors/' + id);
        }
    };

    const closeForm = () => {
        setShowForm(false);
        setTimeout(() => {
            setEditing(null);
            reset();
        }, 300);
    };

    return (
        <div className="p-6 space-y-6">
            <Head title={t('instructors.title', 'Instruktorlar')} />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{t('instructors.title', 'Instruktorlar')}</h1>
                    <p className="text-muted-foreground">{t('instructors.description', 'Barcha instruktorlar ro\'yxati va ularni boshqarish')}</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    {/* Desktop Filters */}
                    <div className="hidden md:flex flex-wrap gap-2 items-center">
                        <select
                            className="flex h-10 w-full md:w-auto items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={perPage}
                            onChange={(e) => {
                                setPerPage(e.target.value);
                                router.get('/admin/instructors', { search, from, to, per_page: e.target.value }, { preserveState: true, replace: true });
                            }}
                            title={t('common.per_page', 'Sahifada ko\'rsatish')}
                        >
                            <option value="10">10</option>
                            <option value="30">30</option>
                            <option value="50">50</option>
                            <option value="all">{t('common.all', 'Barchasi')}</option>
                        </select>
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
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <form onSubmit={handleSearch} className="flex relative flex-1 md:w-64 min-w-[200px]">
                            <Input
                                placeholder={t('common.search', 'Qidirish...')}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pr-8 bg-background w-full"
                            />
                            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                <Search className="w-4 h-4" />
                            </button>
                        </form>
                        
                        {/* Mobile Filters Trigger */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon" className="md:hidden shrink-0">
                                    <Filter className="w-4 h-4" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="bottom" className="h-[80vh] overflow-y-auto rounded-t-xl">
                                <SheetHeader>
                                    <SheetTitle>{t('common.filters', 'Filtrlar')}</SheetTitle>
                                    <SheetDescription>{t('instructors.filter_desc', 'Instruktorlarni filtrlash')}</SheetDescription>
                                </SheetHeader>
                                <div className="grid gap-4 py-4 mt-2">
                                    <div className="space-y-2">
                                        <Label>{t('common.date_from', 'Sana dan')}</Label>
                                        <Flatpickr
                                            options={{ dateFormat: 'd-m-Y', allowInput: true, disableMobile: true }}
                                            placeholder="Dan DD-MM-YYYY"
                                            value={from}
                                            onChange={(dates, dateStr) => {
                                                setFrom(dateStr);
                                                router.get('/admin/instructors', { search, from: dateStr, to, per_page: perPage }, { preserveState: true, replace: true });
                                            }}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('common.date_to', 'Sana gacha')}</Label>
                                        <Flatpickr
                                            options={{ dateFormat: 'd-m-Y', allowInput: true, disableMobile: true }}
                                            placeholder="Gacha DD-MM-YYYY"
                                            value={to}
                                            onChange={(dates, dateStr) => {
                                                setTo(dateStr);
                                                router.get('/admin/instructors', { search, from, to: dateStr, per_page: perPage }, { preserveState: true, replace: true });
                                            }}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('common.pagination', 'Sahifalash')}</Label>
                                        <select
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={perPage}
                                            onChange={(e) => {
                                                setPerPage(e.target.value);
                                                router.get('/admin/instructors', { search, from, to, per_page: e.target.value }, { preserveState: true, replace: true });
                                            }}
                                        >
                                            <option value="10">10</option>
                                            <option value="30">30</option>
                                            <option value="50">50</option>
                                            <option value="all">{t('common.all', 'Barchasi')}</option>
                                        </select>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                        
                        <Button onClick={() => setShowForm(true)} className="whitespace-nowrap shrink-0">
                            <Plus className="w-4 h-4 md:mr-2" /> 
                            <span className="hidden md:inline">{t('common.add', 'Qo\'shish')}</span>
                        </Button>
                    </div>
                </div>
            </div>

            <Dialog open={showForm} onOpenChange={(open) => !open && closeForm()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? t('common.edit', 'Tahrirlash') : t('instructors.new', 'Yangi Instruktor')}</DialogTitle>
                        <DialogDescription className="sr-only">
                            {editing ? t('common.edit', 'Tahrirlash') : t('common.add', 'Qo\'shish')}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="name">{t('instructors.name', 'F.I.SH')}</Label>
                            <Input id="name" value={data.name} onChange={e => setData('name', e.target.value)} />
                            {errors.name && <div className="text-destructive text-sm mt-1">{errors.name}</div>}
                        </div>
                        <div>
                            <Label htmlFor="phone">{t('instructors.phone', 'Telefon')} (Masalan: +998901234567)</Label>
                            <Input id="phone" value={data.phone} onChange={e => setData('phone', e.target.value)} />
                            {errors.phone && <div className="text-destructive text-sm mt-1">{errors.phone}</div>}
                        </div>
                        <div>
                            <Label htmlFor="telegram_id">{t('common.telegram_id_optional', 'Telegram ID (Ixtiyoriy)')}</Label>
                            <Input id="telegram_id" value={data.telegram_id} onChange={e => setData('telegram_id', e.target.value)} />
                            {errors.telegram_id && <div className="text-destructive text-sm mt-1">{errors.telegram_id}</div>}
                        </div>
                        <div className="flex gap-2 pt-2 justify-end">
                            <Button type="button" variant="outline" onClick={closeForm}>{t('common.cancel', 'Bekor qilish')}</Button>
                            <Button type="submit" disabled={processing}>{processing ? t('common.saving', 'Saqlanmoqda...') : t('common.save', 'Saqlash')}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                {/* Desktop Table */}
                <table className="hidden md:table w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3 font-medium">{t('common.number', '№')}</th>
                            <th className="px-4 py-3 font-medium">{t('instructors.name', 'Ismi')}</th>
                            <th className="px-4 py-3 font-medium">{t('instructors.phone', 'Telefon')}</th>
                            <th className="px-4 py-3 font-medium">{t('instructors.groups_count', 'Guruhlar')}</th>
                            <th className="px-4 py-3 font-medium">{t('instructors.students_count', 'O\'quvchilar')}</th>
                            <th className="px-4 py-3 font-medium">{t('instructors.reviewed_drivings', 'Baholangan darslar')}</th>
                            <th className="px-4 py-3 font-medium">{t('instructors.drivings_count', 'Jami darslar')}</th>
                            <th className="px-4 py-3 font-medium">{t('instructors.total_points', 'Umumiy ballar')}</th>
                            <th className="px-4 py-3 font-medium">{t('instructors.rating', 'Reyting')}</th>
                            <th className="px-4 py-3 font-medium">{t('instructors.kpi', 'KPI (%)')}</th>
                            <th className="px-4 py-3 font-medium">{t('common.status', 'Holat')}</th>
                            <th className="px-4 py-3 font-medium text-right">{t('common.actions', 'Amallar')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {instructors.data.map((item, index) => (
                            <tr key={item.id} className="hover:bg-muted/30">
                                <td className="px-4 py-3">{(instructors.from || 1) + index}</td>
                                <td className="px-4 py-3 font-medium flex items-center gap-2">
                                    {item.needs_attention && <AlertTriangle className="w-4 h-4 text-destructive" />}
                                    {item.name}
                                </td>
                                <td className="px-4 py-3">{item.phone}</td>
                                <td className="px-4 py-3">{item.groups_count}</td>
                                <td className="px-4 py-3">{item.students_count}</td>
                                <td className="px-4 py-3 font-medium text-green-600 dark:text-green-400">{item.reviewed_drivings}</td>
                                <td className="px-4 py-3">{item.total_drivings}</td>
                                <td className="px-4 py-3 font-semibold">{item.score_formatted}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1.5">
                                        <Star className={`w-4 h-4 ${item.reviewed_drivings > 0 && item.average_rating <= 3 ? 'text-red-500 fill-red-500' : 'text-yellow-500 fill-yellow-500'}`} />
                                        <span className={`font-semibold ${item.reviewed_drivings > 0 && item.average_rating <= 3 ? 'text-red-600' : ''}`}>{item.average_rating}</span>
                                        {item.reviewed_drivings > 0 && item.average_rating <= 3 && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200" title="Past reyting (≤ 3.0)">
                                                <AlertTriangle className="w-3 h-3 mr-0.5" /> Ogohlantirish
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        item.kpi_percentage >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                        item.kpi_percentage >= 50 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                        {item.kpi_percentage}%
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {item.kpi_percentage >= 80 ? (
                                        <span className="text-green-600 dark:text-green-400 font-medium">{t('instructors.excellent', 'A\'lo')}</span>
                                    ) : item.kpi_percentage >= 50 ? (
                                        <span className="text-yellow-600 dark:text-yellow-400 font-medium">{t('instructors.good', 'Yaxshi')}</span>
                                    ) : (
                                        <span className="text-red-600 dark:text-red-400 font-medium">{t('instructors.poor', 'Qoniqarsiz')}</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(item.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {/* Mobile Cards */}
                <div className="md:hidden divide-y">
                    {instructors.data.map((item) => (
                        <div key={item.id} className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    {item.needs_attention && <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />}
                                    <div className="font-semibold text-lg">{item.name}</div>
                                </div>
                                <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${
                                    item.reviewed_drivings > 0 && item.average_rating <= 3
                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border border-red-200'
                                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                                }`}>
                                    {item.reviewed_drivings > 0 && item.average_rating <= 3 ? (
                                        <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                                    ) : (
                                        <Star className="w-3.5 h-3.5 fill-current shrink-0" />
                                    )}
                                    <span>{item.average_rating}</span>
                                </div>
                            </div>
                            
                            <div className="text-sm text-muted-foreground">{item.phone}</div>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm border-y py-2">
                                <div>
                                    <span className="text-muted-foreground block text-xs">{t('instructors.groups_count', 'Guruhlar')}:</span>
                                    <span className="font-medium">{item.groups_count}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs">{t('instructors.students_count', 'O\'quvchilar')}:</span>
                                    <span className="font-medium">{item.students_count}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs">{t('instructors.reviewed_drivings', 'Baholangan darslar')}:</span>
                                    <span className="font-medium text-green-600 dark:text-green-400">{item.reviewed_drivings}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs">{t('instructors.drivings_count', 'Jami darslar')}:</span>
                                    <span className="font-medium">{item.total_drivings}</span>
                                </div>
                                <div className="col-span-2 pt-1 mt-1 border-t">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground text-xs">{t('instructors.total_points', 'Umumiy ballar')}:</span>
                                        <span className="font-semibold">{item.score_formatted}</span>
                                    </div>
                                </div>
                                <div className="col-span-2 pt-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground text-xs">{t('instructors.kpi', 'KPI (%)')}:</span>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                            item.kpi_percentage >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                            item.kpi_percentage >= 50 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                            {item.kpi_percentage}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-2 justify-end pt-1">
                                <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                                    <Edit2 className="w-4 h-4 mr-1.5" /> {t('common.edit', 'Tahrirlash')}
                                </Button>
                                <Button variant="outline" size="sm" className="text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => handleDelete(item.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Pagination links={instructors.links} />
        </div>
    );
}
