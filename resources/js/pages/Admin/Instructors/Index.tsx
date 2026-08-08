import { useState } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Trash2, Edit2, Plus, Search, AlertTriangle, Star, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import Pagination from '@/components/pagination';
import { SharedData } from '@/types/auth';
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
    negative_tags_count: number;
    is_low_rating: boolean;
    needs_attention: boolean;
}

interface PageProps {
    instructors: {
        data: Instructor[];
        links: any[];
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
    const { auth } = usePage<SharedData>().props;
    const isInstructor = auth?.user?.role === 'instructor';

    const [editing, setEditing] = useState<Instructor | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState(filters.search || '');
    const [from, setFrom] = useState(filters.from || '');
    const [to, setTo] = useState(filters.to || '');
    const [perPage, setPerPage] = useState(filters.per_page || '15');
    const [isDeleting, setIsDeleting] = useState<number | null>(null);

    const { data, setData, post, put, delete: destroy, reset, errors, processing } = useForm({
        name: '',
        phone: '',
        telegram_id: '',
        password: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/instructors', { search, from, to, per_page: perPage }, { preserveState: true, replace: true });
    };

    const handleEdit = (instructor: Instructor) => {
        setEditing(instructor);
        setData({
            name: instructor.name,
            phone: instructor.phone,
            telegram_id: instructor.telegram_id || '',
            password: '',
        });
        setShowForm(true);
    };

    const handleDelete = (id: number) => {
        if (confirm(t('common.confirm_delete', "Rostdan ham o'chirmoqchimisiz?"))) {
            setIsDeleting(id);
            destroy(`/admin/instructors/${id}`, {
                onSuccess: () => {
                    toast.success(t('instructors.deleted_success', 'Instruktor muvaffaqiyatli o\'chirildi'));
                },
                onError: (err) => {
                    toast.error(Object.values(err)[0] as string || t('instructors.error', 'Xatolik yuz berdi'));
                },
                onFinish: () => setIsDeleting(null)
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (processing) return;
        if (editing) {
            put(`/admin/instructors/${editing.id}`, {
                onSuccess: () => {
                    setShowForm(false);
                    setEditing(null);
                    reset();
                    toast.success(t('instructors.updated_success', 'Instruktor muvaffaqiyatli yangilandi'));
                },
                onError: (err) => {
                    toast.error(Object.values(err)[0] as string || t('instructors.error', 'Xatolik yuz berdi'));
                }
            });
        } else {
            post('/admin/instructors', {
                onSuccess: () => {
                    setShowForm(false);
                    reset();
                    toast.success(t('instructors.created_success', 'Instruktor muvaffaqiyatli qo\'shildi'));
                },
                onError: (err) => {
                    toast.error(Object.values(err)[0] as string || t('instructors.error', 'Xatolik yuz berdi'));
                }
            });
        }
    };

    const closeForm = () => {
        setShowForm(false);
        setEditing(null);
        reset();
    };

    return (
        <div className="space-y-6">
            <Head title={t('instructors.title', 'Instruktorlar')} />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{t('instructors.title', 'Instruktorlar')}</h1>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
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
                        <DatePicker
                            placeholder={t('common.from', 'Dan') + ' DD-MM-YYYY'}
                            value={from}
                            onChange={(val) => {
                                setFrom(val);
                                router.get('/admin/instructors', { search, from: val, to, per_page: perPage }, { preserveState: true, replace: true });
                            }}
                            className="w-36"
                            title={t('common.from', 'Dan')}
                        />
                        <DatePicker
                            placeholder={t('common.to', 'Gacha') + ' DD-MM-YYYY'}
                            value={to}
                            onChange={(val) => {
                                setTo(val);
                                router.get('/admin/instructors', { search, from, to: val, per_page: perPage }, { preserveState: true, replace: true });
                            }}
                            className="w-36"
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
                                        <DatePicker
                                            placeholder="DD-MM-YYYY"
                                            value={from}
                                            onChange={(val) => {
                                                setFrom(val);
                                                router.get('/admin/instructors', { search, from: val, to, per_page: perPage }, { preserveState: true, replace: true });
                                            }}
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('common.date_to', 'Sana gacha')}</Label>
                                        <DatePicker
                                            placeholder="DD-MM-YYYY"
                                            value={to}
                                            onChange={(val) => {
                                                setTo(val);
                                                router.get('/admin/instructors', { search, from, to: val, per_page: perPage }, { preserveState: true, replace: true });
                                            }}
                                            className="w-full"
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
                        
                        {!isInstructor && (
                            <Button onClick={() => setShowForm(true)} className="whitespace-nowrap shrink-0">
                                <Plus className="w-4 h-4 md:mr-2" /> 
                                <span className="hidden md:inline">{t('common.add', 'Qo\'shish')}</span>
                            </Button>
                        )}
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
                            <Input id="name" value={data.name} onChange={e => setData('name', e.target.value)} required />
                            {errors.name && <div className="text-destructive text-sm mt-1">{errors.name}</div>}
                        </div>
                        <div>
                            <Label htmlFor="phone">{t('instructors.phone', 'Telefon')}</Label>
                            <Input id="phone" value={data.phone} onChange={e => setData('phone', e.target.value)} placeholder="+998901234567" required />
                            {errors.phone && <div className="text-destructive text-sm mt-1">{errors.phone}</div>}
                        </div>
                        <div>
                            <Label htmlFor="telegram_id">Telegram ID</Label>
                            <Input id="telegram_id" value={data.telegram_id} onChange={e => setData('telegram_id', e.target.value)} placeholder="12345678" />
                            {errors.telegram_id && <div className="text-destructive text-sm mt-1">{errors.telegram_id}</div>}
                        </div>
                        <div>
                            <Label htmlFor="password">{editing ? t('instructors.new_password', 'Yangi Parol (ixtiyoriy)') : t('instructors.password', 'Parol')}</Label>
                            <Input id="password" type="password" value={data.password} onChange={e => setData('password', e.target.value)} placeholder="******" />
                            {errors.password && <div className="text-destructive text-sm mt-1">{errors.password}</div>}
                        </div>
                        <div className="flex gap-2 justify-end pt-4">
                            <Button type="button" variant="outline" onClick={closeForm}>{t('common.cancel', 'Bekor qilish')}</Button>
                            <Button type="submit" disabled={processing}>{processing ? t('common.saving', 'Saqlanmoqda...') : t('common.save', 'Saqlash')}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                {/* Desktop Table */}
                <table className="hidden md:table w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground border-b">
                        <tr>
                            <th className="px-4 py-3 font-medium">{t('common.number', '№')}</th>
                            <th className="px-4 py-3 font-medium">{t('instructors.name', 'F.I.SH')}</th>
                            <th className="px-4 py-3 font-medium">{t('instructors.phone', 'Telefon')}</th>
                            <th className="px-4 py-3 font-medium text-center">{t('instructors.groups_count', 'Guruhlar')}</th>
                            <th className="px-4 py-3 font-medium text-center">{t('instructors.students_count', 'O\'quvchilar')}</th>
                            <th className="px-4 py-3 font-medium text-center">{t('instructors.drivings_count', 'Darslar')}</th>
                            <th className="px-4 py-3 font-medium text-center">{t('instructors.rating', 'Reyting')}</th>
                            <th className="px-4 py-3 font-medium text-center">{t('instructors.kpi', 'KPI')}</th>
                            {!isInstructor && <th className="px-4 py-3 font-medium text-right">{t('common.actions', 'Amallar')}</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {instructors.data.map((item, index) => (
                            <tr key={item.id} className="hover:bg-muted/30">
                                <td className="px-4 py-3">{(instructors.from || 1) + index}</td>
                                <td className="px-4 py-3 font-medium">
                                    <div className="flex items-center gap-2">
                                        {item.needs_attention && <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />}
                                        <span>{item.name}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">{item.phone}</td>
                                <td className="px-4 py-3 text-center">{item.groups_count}</td>
                                <td className="px-4 py-3 text-center">{item.students_count}</td>
                                <td className="px-4 py-3 text-center">{item.total_drivings}</td>
                                <td className="px-4 py-3 text-center">
                                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
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
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                        item.kpi_percentage >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                        item.kpi_percentage >= 50 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                        {item.kpi_percentage}%
                                    </span>
                                </td>
                                {!isInstructor && (
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(item.id)} disabled={isDeleting === item.id}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {/* Mobile Cards */}
                <div className="md:hidden p-3 space-y-3 bg-muted/20">
                    {instructors.data.map((item) => (
                        <div key={item.id} className="p-4 space-y-3 bg-card border rounded-xl shadow-xs">
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
                                    <span className="text-muted-foreground block text-xs">{t('instructors.drivings_count', 'Jami darslar')}:</span>
                                    <span className="font-medium">{item.total_drivings}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs">{t('instructors.reviewed_drivings', 'Baholangan darslar')}:</span>
                                    <span className="font-medium text-green-600 dark:text-green-400">{item.reviewed_drivings}</span>
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
                            
                            {!isInstructor && (
                                <div className="flex gap-2 justify-end pt-1">
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                                        <Edit2 className="w-4 h-4 mr-1.5" /> {t('common.edit', 'Tahrirlash')}
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => handleDelete(item.id)} disabled={isDeleting === item.id}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <Pagination links={instructors.links} />
        </div>
    );
}
