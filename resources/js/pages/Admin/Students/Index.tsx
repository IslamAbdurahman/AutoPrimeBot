import { useState, useCallback } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Trash2, Edit2, Plus, Search } from 'lucide-react';
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

interface Group {
    id: number;
    name: string;
}

interface Student {
    id: number;
    full_name: string;
    phone: string;
    telegram_id?: string;
    group_id?: number;
    group?: Group;
    completed_drivings_count?: number;
}

interface PageProps {
    students: {
        data: Student[];
        links?: any[];
        from?: number;
    };
    groups: Group[];
    filters?: {
        search?: string;
        group_id?: string;
        per_page?: string;
    };
}

export default function StudentsIndex({ students, groups, filters = {} }: PageProps) {
    const { t } = useTranslation();
    const [editing, setEditing] = useState<Student | null>(null);
    const [showForm, setShowForm] = useState(false);
    
    const [search, setSearch] = useState(filters.search || '');
    const [groupId, setGroupId] = useState(filters.group_id || '');
    const [perPage, setPerPage] = useState(filters.per_page || '15');

    const applyFilters = (newSearch: string, newGroup: string, newPerPage: string) => {
        router.get('/admin/students', { search: newSearch, group_id: newGroup, per_page: newPerPage }, { preserveState: true, replace: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters(search, groupId, perPage);
    };

    const { data, setData, post, put, delete: destroy, reset, errors, processing } = useForm({
        full_name: '',
        phone: '',
        telegram_id: '',
        group_id: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editing) {
            put('/admin/students/' + editing.id, {
                onSuccess: () => closeForm(),
            });
        } else {
            post('/admin/students', {
                onSuccess: () => closeForm(),
            });
        }
    };

    const handleEdit = (student: Student) => {
        setEditing(student);
        setData({
            full_name: student.full_name,
            phone: student.phone,
            telegram_id: student.telegram_id || '',
            group_id: student.group_id ? String(student.group_id) : '',
        });
        setShowForm(true);
    };

    const handleDelete = (id: number) => {
        if (confirm(t('common.confirm_delete', 'Rostdan ham o\'chirmoqchimisiz?'))) {
            destroy('/admin/students/' + id);
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
        <div className="p-6">
            <Head title={t('students.title', 'O\'quvchilar')} />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">{t('students.title', 'O\'quvchilar')}</h1>
                    <p className="text-muted-foreground">{t('students.description', 'Maktabdagi barcha o\'quvchilarni boshqarish')}</p>
                </div>
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    {/* Desktop Filters */}
                    <div className="hidden md:flex gap-2 items-center">
                        <select
                            className="flex h-10 w-full md:w-auto items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={perPage}
                            onChange={(e) => {
                                setPerPage(e.target.value);
                                applyFilters(search, groupId, e.target.value);
                            }}
                            title={t('common.per_page', 'Sahifada ko\'rsatish')}
                        >
                            <option value="15">15</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                            <option value="all">{t('common.all', 'Barchasi')}</option>
                        </select>
                        <select
                            className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={groupId}
                            onChange={(e) => {
                                setGroupId(e.target.value);
                                applyFilters(search, e.target.value, perPage);
                            }}
                        >
                            <option value="">{t('students.all_groups', 'Barcha guruhlar')}</option>
                            {groups.map(grp => (
                                <option key={grp.id} value={grp.id}>{grp.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <form onSubmit={handleSearch} className="flex relative flex-1 md:w-64">
                            <Input 
                                placeholder={t('students.search_placeholder', 'Qidirish...')} 
                                value={search} 
                                onChange={e => setSearch(e.target.value)} 
                                className="pr-8"
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
                                    <SheetTitle>Filtrlar</SheetTitle>
                                    <SheetDescription>O'quvchilarni filtrlash</SheetDescription>
                                </SheetHeader>
                                <div className="grid gap-4 py-4 mt-2">
                                    <div className="space-y-2">
                                        <Label>Guruh</Label>
                                        <select
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={groupId}
                                            onChange={(e) => {
                                                setGroupId(e.target.value);
                                                applyFilters(search, e.target.value, perPage);
                                            }}
                                        >
                                            <option value="">{t('students.all_groups', 'Barcha guruhlar')}</option>
                                            {groups.map(grp => (
                                                <option key={grp.id} value={grp.id}>{grp.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Sahifalash</Label>
                                        <select
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={perPage}
                                            onChange={(e) => {
                                                setPerPage(e.target.value);
                                                applyFilters(search, groupId, e.target.value);
                                            }}
                                        >
                                            <option value="15">15</option>
                                            <option value="25">25</option>
                                            <option value="50">50</option>
                                            <option value="100">100</option>
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
                        <DialogTitle>{editing ? t('common.edit', 'Tahrirlash') : t('students.new', 'Yangi O\'quvchi')}</DialogTitle>
                        <DialogDescription className="sr-only">
                            {editing ? 'O\'quvchi ma\'lumotlarini tahrirlash' : 'Yangi o\'quvchi qo\'shish'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="full_name">{t('students.full_name', 'F.I.SH')}</Label>
                            <Input id="full_name" value={data.full_name} onChange={e => setData('full_name', e.target.value)} />
                            {errors.full_name && <div className="text-destructive text-sm mt-1">{errors.full_name}</div>}
                        </div>
                        <div>
                            <Label htmlFor="phone">{t('students.phone', 'Telefon')} (Masalan: +998901234567)</Label>
                            <Input id="phone" value={data.phone} onChange={e => setData('phone', e.target.value)} />
                            {errors.phone && <div className="text-destructive text-sm mt-1">{errors.phone}</div>}
                        </div>
                        <div>
                            <Label htmlFor="telegram_id">Telegram ID (Ixtiyoriy)</Label>
                            <Input id="telegram_id" value={data.telegram_id} onChange={e => setData('telegram_id', e.target.value)} />
                            {errors.telegram_id && <div className="text-destructive text-sm mt-1">{errors.telegram_id}</div>}
                        </div>
                        <div>
                            <Label htmlFor="group_id">{t('students.group', 'Guruh')}</Label>
                            <select
                                id="group_id"
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={data.group_id}
                                onChange={e => setData('group_id', e.target.value)}
                            >
                                <option value="">{t('common.select', '-- Tanlang --')}</option>
                                {groups.map(grp => (
                                    <option key={grp.id} value={grp.id}>{grp.name}</option>
                                ))}
                            </select>
                            {errors.group_id && <div className="text-destructive text-sm mt-1">{errors.group_id}</div>}
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
                            <th className="px-4 py-3 font-medium">{t('students.full_name', 'F.I.SH')}</th>
                            <th className="px-4 py-3 font-medium">{t('students.phone', 'Telefon')}</th>
                            <th className="px-4 py-3 font-medium">{t('students.group', 'Guruh')}</th>
                            <th className="px-4 py-3 font-medium">Telegram ID</th>
                            <th className="px-4 py-3 font-medium text-center">Tugagan darslar</th>
                            <th className="px-4 py-3 font-medium text-right">{t('common.actions', 'Amallar')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {students.data.map((item, index) => (
                            <tr key={item.id} className="hover:bg-muted/30">
                                <td className="px-4 py-3">{(students.from || 1) + index}</td>
                                <td className="px-4 py-3 font-medium">{item.full_name}</td>
                                <td className="px-4 py-3">{item.phone}</td>
                                <td className="px-4 py-3 text-muted-foreground">{item.group?.name || t('students.no_group', 'Biriktirilmagan')}</td>
                                <td className="px-4 py-3 text-muted-foreground">{item.telegram_id || '-'}</td>
                                <td className="px-4 py-3 text-center">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                        {item.completed_drivings_count || 0}
                                    </span>
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
                    {students.data.map((item) => (
                        <div key={item.id} className="p-4 space-y-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-semibold">{item.full_name}</div>
                                    <div className="text-sm text-muted-foreground">{item.phone}</div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                                <div>
                                    <span className="text-muted-foreground text-xs block">Guruh:</span>
                                    <div className="font-medium">
                                        <div className="text-xs px-1.5 py-0.5 mt-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded inline-block">
                                            {item.group?.name || t('students.no_group', 'Biriktirilmagan')}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground text-xs block">Telegram ID:</span>
                                    <div className="font-medium">{item.telegram_id || '-'}</div>
                                </div>
                                <div className="col-span-2 pt-1 mt-1 border-t">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground text-xs block">Tugagan darslar:</span>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                            {item.completed_drivings_count || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-2 justify-end pt-1">
                                <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                                    <Edit2 className="w-4 h-4 mr-1.5" /> Tahrirlash
                                </Button>
                                <Button variant="outline" size="sm" className="text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => handleDelete(item.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Pagination links={students.links} />
        </div>
    );
}
