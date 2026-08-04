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
import { Link } from '@inertiajs/react';

interface Instructor {
    id: number;
    name: string;
}

interface Group {
    id: number;
    name: string;
    instructor_id?: number;
    instructor?: Instructor;
}

interface PageProps {
    groups: {
        data: Group[];
        links?: any[];
        from?: number;
    };
    instructors: Instructor[];
    filters?: {
        search?: string;
        instructor_id?: string;
        per_page?: string;
    };
}

export default function GroupsIndex({ groups, instructors, filters = {} }: PageProps) {
    const { t } = useTranslation();
    const [editing, setEditing] = useState<Group | null>(null);
    const [showForm, setShowForm] = useState(false);
    
    const [search, setSearch] = useState(filters.search || '');
    const [instructorId, setInstructorId] = useState(filters.instructor_id || '');
    const [perPage, setPerPage] = useState(filters.per_page || '15');

    const applyFilters = (newSearch: string, newInst: string, newPerPage: string) => {
        router.get('/admin/groups', { search: newSearch, instructor_id: newInst, per_page: newPerPage }, { preserveState: true, replace: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters(search, instructorId, perPage);
    };

    const { data, setData, post, put, delete: destroy, reset, errors, processing } = useForm({
        name: '',
        instructor_id: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editing) {
            put('/admin/groups/' + editing.id, {
                onSuccess: () => closeForm(),
            });
        } else {
            post('/admin/groups', {
                onSuccess: () => closeForm(),
            });
        }
    };

    const handleEdit = (group: Group) => {
        setEditing(group);
        setData({
            name: group.name,
            instructor_id: group.instructor_id ? String(group.instructor_id) : '',
        });
        setShowForm(true);
    };

    const handleDelete = (id: number) => {
        if (confirm(t('common.confirm_delete', 'Rostdan ham o\'chirmoqchimisiz?'))) {
            destroy('/admin/groups/' + id);
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
            <Head title={t('groups.title', 'Guruhlar')} />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">{t('groups.title', 'Guruhlar')}</h1>
                    <p className="text-muted-foreground">{t('groups.description', 'Maktabdagi guruhlar va ularning instruktorlari')}</p>
                </div>
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    {/* Desktop Filters */}
                    <div className="hidden md:flex gap-2 items-center">
                        <select
                            className="flex h-10 w-full md:w-auto items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={perPage}
                            onChange={(e) => {
                                setPerPage(e.target.value);
                                applyFilters(search, instructorId, e.target.value);
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
                            value={instructorId}
                            onChange={(e) => {
                                setInstructorId(e.target.value);
                                applyFilters(search, e.target.value, perPage);
                            }}
                        >
                            <option value="">{t('drivings.all_instructors', 'Barcha instruktorlar')}</option>
                            {instructors.map(inst => (
                                <option key={inst.id} value={inst.id}>{inst.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <form onSubmit={handleSearch} className="flex relative flex-1 md:w-64">
                            <Input 
                                placeholder={t('common.search', 'Qidirish...')} 
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
                                    <SheetTitle>{t('common.filters', 'Filtrlar')}</SheetTitle>
                                    <SheetDescription>{t('groups.filter_desc', 'Guruhlarni filtrlash')}</SheetDescription>
                                </SheetHeader>
                                <div className="grid gap-4 py-4 mt-2">
                                    <div className="space-y-2">
                                        <Label>{t('drivings.instructor', 'Instruktor')}</Label>
                                        <select
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={instructorId}
                                            onChange={(e) => {
                                                setInstructorId(e.target.value);
                                                applyFilters(search, e.target.value, perPage);
                                            }}
                                        >
                                            <option value="">{t('drivings.all_instructors', 'Barcha instruktorlar')}</option>
                                            {instructors.map(inst => (
                                                <option key={inst.id} value={inst.id}>{inst.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('common.pagination', 'Sahifalash')}</Label>
                                        <select
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={perPage}
                                            onChange={(e) => {
                                                setPerPage(e.target.value);
                                                applyFilters(search, instructorId, e.target.value);
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
                        <DialogTitle>{editing ? t('common.edit', 'Tahrirlash') : t('groups.new', 'Yangi Guruh')}</DialogTitle>
                        <DialogDescription className="sr-only">
                            {editing ? t('common.edit', 'Tahrirlash') : t('common.add', 'Qo\'shish')}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="name">{t('groups.name', 'Guruh nomi')}</Label>
                            <Input id="name" value={data.name} onChange={e => setData('name', e.target.value)} placeholder="Masalan: Guruh-A1" />
                            {errors.name && <div className="text-destructive text-sm mt-1">{errors.name}</div>}
                        </div>
                        <div>
                            <Label htmlFor="instructor_id">{t('drivings.instructor', 'Instruktor')}</Label>
                            <select
                                id="instructor_id"
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={data.instructor_id}
                                onChange={e => setData('instructor_id', e.target.value)}
                            >
                                <option value="">{t('common.select', '-- Tanlang --')}</option>
                                {instructors.map(inst => (
                                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                                ))}
                            </select>
                            {errors.instructor_id && <div className="text-destructive text-sm mt-1">{errors.instructor_id}</div>}
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
                            <th className="px-4 py-3 font-medium">{t('groups.name', 'Nomi')}</th>
                            <th className="px-4 py-3 font-medium">{t('drivings.instructor', 'Instruktor')}</th>
                            <th className="px-4 py-3 font-medium text-right">{t('common.actions', 'Amallar')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {groups.data.map((item, index) => (
                            <tr key={item.id} className="hover:bg-muted/30">
                                <td className="px-4 py-3">{(groups.from || 1) + index}</td>
                                <td className="px-4 py-3 font-medium">
                                    <Link href={`/admin/groups/${item.id}`} className="text-blue-600 hover:underline">
                                        {item.name}
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">{item.instructor?.name || t('common.not_assigned', 'Biriktirilmagan')}</td>
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
                    {groups.data.map((item) => (
                        <div key={item.id} className="p-4 space-y-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <Link href={`/admin/groups/${item.id}`} className="font-semibold text-blue-600 hover:underline text-lg block">
                                        {item.name}
                                    </Link>
                                </div>
                            </div>
                            
                            <div className="text-sm mt-2">
                                <span className="text-muted-foreground text-xs block">{t('drivings.instructor', 'Instruktor')}:</span>
                                <div className="font-medium">{item.instructor?.name || t('common.not_assigned', 'Biriktirilmagan')}</div>
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

            <Pagination links={groups.links} />
        </div>
    );
}
