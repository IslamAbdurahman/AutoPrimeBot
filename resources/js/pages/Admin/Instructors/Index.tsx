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

interface Instructor {
    id: number;
    name: string;
    phone: string;
    telegram_id?: string;
}

interface PageProps {
    instructors: {
        data: Instructor[];
        links?: any[];
        from?: number;
    };
    filters?: {
        search?: string;
    };
}

export default function InstructorsIndex({ instructors, filters = {} }: PageProps) {
    const { t } = useTranslation();
    const [editing, setEditing] = useState<Instructor | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/instructors', { search }, { preserveState: true, replace: true });
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
        setEditing(null);
        reset();
    };

    return (
        <div className="p-6">
            <Head title={t('instructors.title', 'Instruktorlar')} />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">{t('instructors.title', 'Instruktorlar')}</h1>
                    <p className="text-muted-foreground">{t('instructors.description', 'Maktabdagi barcha instruktorlarni boshqarish')}</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <form onSubmit={handleSearch} className="flex relative w-full md:w-64">
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
                    <Button onClick={() => setShowForm(true)} className="whitespace-nowrap"><Plus className="w-4 h-4 mr-2" /> {t('common.add', 'Qo\'shish')}</Button>
                </div>
            </div>

            <Dialog open={showForm} onOpenChange={(open) => !open && closeForm()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? t('common.edit', 'Tahrirlash') : t('instructors.new', 'Yangi Instruktor')}</DialogTitle>
                        <DialogDescription className="sr-only">
                            {editing ? 'Instruktor ma\'lumotlarini tahrirlash' : 'Yangi instruktor qo\'shish'}
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
                            <Label htmlFor="telegram_id">Telegram ID (Ixtiyoriy)</Label>
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
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3 font-medium">{t('common.number', '№')}</th>
                            <th className="px-4 py-3 font-medium">{t('instructors.name', 'Ismi')}</th>
                            <th className="px-4 py-3 font-medium">{t('instructors.phone', 'Telefon')}</th>
                            <th className="px-4 py-3 font-medium">Telegram ID</th>
                            <th className="px-4 py-3 font-medium text-right">{t('common.actions', 'Amallar')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {instructors.data.map((item, index) => (
                            <tr key={item.id} className="hover:bg-muted/30">
                                <td className="px-4 py-3">{(instructors.from || 1) + index}</td>
                                <td className="px-4 py-3 font-medium">{item.name}</td>
                                <td className="px-4 py-3">{item.phone}</td>
                                <td className="px-4 py-3 text-muted-foreground">{item.telegram_id || '-'}</td>
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
            </div>

            <Pagination links={instructors.links} />
        </div>
    );
}
