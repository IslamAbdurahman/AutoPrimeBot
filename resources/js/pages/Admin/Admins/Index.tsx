import { useState, useCallback } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Trash2, Edit2, Plus, Search, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Pagination from '@/components/pagination';
import { toast } from 'sonner';
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
import type { SharedData } from '@/types';

interface AdminUser {
    id: number;
    name: string;
    phone: string;
    telegram_id?: string;
    created_at: string;
}

interface PageProps {
    admins: {
        data: AdminUser[];
        links?: any[];
        from?: number;
    };
    filters?: {
        search?: string;
        per_page?: string;
    };
}

export default function AdminsIndex({ admins, filters = {} }: PageProps) {
    const { t } = useTranslation();
    const { auth } = usePage<SharedData>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [perPage, setPerPage] = useState(filters.per_page || '10');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        phone: '',
        telegram_id: '',
        password: '',
    });

    const applyFilters = useCallback((newSearch: string, newPerPage: string) => {
        router.get('/admin/admins', { search: newSearch, per_page: newPerPage }, { preserveState: true, replace: true });
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearch(value);
        applyFilters(value, perPage);
    };

    const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setPerPage(value);
        applyFilters(search, value);
    };

    const openCreateForm = () => {
        setEditingAdmin(null);
        reset();
        clearErrors();
        setIsFormOpen(true);
    };

    const handleEdit = (admin: AdminUser) => {
        setEditingAdmin(admin);
        setData({
            name: admin.name,
            phone: admin.phone,
            telegram_id: admin.telegram_id || '',
            password: '',
        });
        clearErrors();
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingAdmin(null);
        reset();
        clearErrors();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (processing) return;
        if (editingAdmin) {
            put(`/admin/admins/${editingAdmin.id}`, {
                onSuccess: () => {
                    closeForm();
                    toast.success(t('common.updated_success', 'Ma\'lumot yangilandi'));
                },
                onError: () => {
                    toast.error(t('common.error', 'Xatolik yuz berdi'));
                }
            });
        } else {
            post('/admin/admins', {
                onSuccess: () => {
                    closeForm();
                    toast.success(t('common.created_success', 'Yangi admin yaratildi'));
                },
                onError: () => {
                    toast.error(t('common.error', 'Xatolik yuz berdi'));
                }
            });
        }
    };

    const handleDelete = (admin: AdminUser) => {
        if (auth.user.id === admin.id) {
            toast.error(t('admins.cannot_delete_self', 'O\'z hisobingizni o\'chira olmaysiz'));
            return;
        }
        if (isDeleting === admin.id) return;

        if (confirm(t('common.confirm_delete', 'Rostdan ham ushbu adminni o\'chirmoqchimisiz?'))) {
            setIsDeleting(admin.id);
            router.delete(`/admin/admins/${admin.id}`, {
                onSuccess: () => {
                    toast.success(t('common.deleted_success', 'Admin o\'chirildi'));
                },
                onError: () => {
                    toast.error(t('common.error', 'Xatolik yuz berdi'));
                },
                onFinish: () => {
                    setIsDeleting(null);
                }
            });
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
            <Head title={t('admins.title', 'Adminlar')} />

            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('admins.title', 'Adminlar')}</h1>
                    <p className="text-sm text-muted-foreground">
                        {t('admins.description', 'Barcha adminlar ro\'yxati va ularni boshqarish')}
                    </p>
                </div>
                <Button onClick={openCreateForm} className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('admins.new', 'Yangi Admin')}
                </Button>
            </div>

            {/* Filters section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card border p-4 rounded-xl shadow-sm">
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder={t('common.search', 'Qidirish...')}
                        value={search}
                        onChange={handleSearchChange}
                        className="pl-9"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                    {/* Desktop Filters */}
                    <div className="hidden md:flex items-center gap-2">
                        <select
                            className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={perPage}
                            onChange={handlePerPageChange}
                        >
                            <option value="10">10</option>
                            <option value="30">30</option>
                            <option value="50">50</option>
                            <option value="all">{t('common.all', 'Barchasi')}</option>
                        </select>
                    </div>

                    {/* Mobile Sheet Filter */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="md:hidden">
                                <Filter className="w-4 h-4" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[40vh] overflow-y-auto rounded-t-xl">
                            <SheetHeader>
                                <SheetTitle>{t('common.filters', 'Filtrlar')}</SheetTitle>
                                <SheetDescription>{t('common.filter', 'Filtrlash')}</SheetDescription>
                            </SheetHeader>
                            <div className="grid gap-4 py-4 mt-2">
                                <div className="space-y-2">
                                    <Label>{t('common.pagination', 'Sahifalash')}</Label>
                                    <select
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={perPage}
                                        onChange={handlePerPageChange}
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
                </div>
            </div>

            {/* Dialog Form */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingAdmin ? t('admins.edit', 'Adminni tahrirlash') : t('admins.new', 'Yangi Admin')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('admins.description', 'Admin ma\'lumotlarini kiriting')}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('admins.name', 'F.I.SH')}</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                placeholder={t('common.example', 'Masalan: Admin To\'raqulov')}
                                required
                            />
                            {errors.name && <div className="text-destructive text-sm mt-1">{errors.name}</div>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">{t('admins.phone', 'Telefon raqami')}</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={data.phone}
                                onChange={e => setData('phone', e.target.value.replace(/[^0-9+]/g, ''))}
                                placeholder="+998911157709"
                                required
                            />
                            {errors.phone && <div className="text-destructive text-sm mt-1">{errors.phone}</div>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="telegram_id">{t('common.telegram_id_optional', 'Telegram ID (Ixtiyoriy)')}</Label>
                            <Input
                                id="telegram_id"
                                value={data.telegram_id}
                                onChange={e => setData('telegram_id', e.target.value)}
                                placeholder="111111111"
                            />
                            {errors.telegram_id && <div className="text-destructive text-sm mt-1">{errors.telegram_id}</div>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">
                                {t('admins.password', 'Parol')}
                                {editingAdmin && <span className="text-xs text-muted-foreground font-normal ml-1">({t('admins.password_hint', "bo'sh qolsa o'zgarmaydi")})</span>}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                placeholder="••••••••"
                                required={!editingAdmin}
                            />
                            {errors.password && <div className="text-destructive text-sm mt-1">{errors.password}</div>}
                        </div>

                        <div className="flex gap-2 pt-4 justify-end">
                            <Button type="button" variant="outline" onClick={closeForm}>
                                {t('common.cancel', 'Bekor qilish')}
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? t('common.saving', 'Saqlanmoqda...') : t('common.save', 'Saqlash')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Admins Table / Mobile Cards */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                {/* Desktop Table */}
                <table className="hidden md:table w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3 font-medium">{t('common.number', '№')}</th>
                            <th className="px-4 py-3 font-medium">{t('admins.name', 'F.I.SH')}</th>
                            <th className="px-4 py-3 font-medium">{t('admins.phone', 'Telefon')}</th>
                            <th className="px-4 py-3 font-medium">{t('common.telegram_id', 'Telegram ID')}</th>
                            <th className="px-4 py-3 font-medium text-right">{t('common.actions', 'Amallar')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {admins.data.length > 0 ? (
                            admins.data.map((admin, index) => (
                                <tr key={admin.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3">{(admins.from || 1) + index}</td>
                                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                        <span>{admin.name}</span>
                                        {auth.user.id === admin.id && (
                                            <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">
                                                (Siz)
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">{admin.phone}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{admin.telegram_id || '-'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(admin)}>
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive"
                                                onClick={() => handleDelete(admin)}
                                                disabled={auth.user.id === admin.id || isDeleting === admin.id}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-muted-foreground">
                                    {t('common.no_data', 'Ma\'lumot topilmadi')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Mobile Cards */}
                <div className="md:hidden p-3 space-y-3 bg-muted/20">
                    {admins.data.length > 0 ? (
                        admins.data.map((admin) => (
                            <div key={admin.id} className="p-4 space-y-3 bg-card border rounded-xl shadow-xs">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-semibold flex items-center gap-1.5">
                                            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                            <span>{admin.name}</span>
                                            {auth.user.id === admin.id && (
                                                <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">
                                                    (Siz)
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-0.5">{admin.phone}</div>
                                    </div>
                                </div>

                                <div className="text-xs text-muted-foreground">
                                    Telegram ID: <span className="font-medium text-foreground">{admin.telegram_id || '-'}</span>
                                </div>

                                <div className="flex gap-2 justify-end pt-1">
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(admin)}>
                                        <Edit2 className="w-4 h-4 mr-1.5" /> {t('common.edit', 'Tahrirlash')}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-destructive border-destructive/20 hover:bg-destructive/10"
                                        onClick={() => handleDelete(admin)}
                                        disabled={auth.user.id === admin.id || isDeleting === admin.id}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            {t('common.no_data', 'Ma\'lumot topilmadi')}
                        </div>
                    )}
                </div>
            </div>

            <Pagination links={admins.links} />
        </div>
    );
}
