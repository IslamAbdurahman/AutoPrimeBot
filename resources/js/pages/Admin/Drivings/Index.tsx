import { useState, useCallback } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { Input } from '@/components/ui/input';
import { Filter } from 'lucide-react';
import Pagination from '@/components/pagination';

interface Instructor {
    id: number;
    name: string;
}

interface Group {
    id: number;
    name: string;
}

interface Student {
    id: number;
    full_name: string;
    phone?: string;
    group_id?: number;
}

interface Driving {
    id: number;
    start_time: string;
    end_time: string;
    status: string;
    instructor_id?: number;
    student_id?: number;
    group_id?: number;
    autodrome_id?: number;
    student?: Student;
    group?: Group;
    instructor?: Instructor;
    autodrome?: Autodrome;
    review?: {
        rating: number;
        reason_tags?: string[];
    };
}

interface Autodrome {
    id: number;
    name: string;
    latitude?: number;
    longitude?: number;
    radius_meters?: number;
}

interface PageProps {
    drivings: {
        data: Driving[];
        links?: { url: string | null; label: string; active: boolean }[];
        from?: number;
    };
    instructors: Instructor[];
    students: Student[];
    groups: Group[];
    autodromes: Autodrome[];
    filters?: {
        search?: string;
        status?: string;
        instructor_id?: string;
        from?: string;
        to?: string;
        per_page?: string;
    };
}

export default function DrivingsIndex({ drivings, instructors, students, groups, autodromes = [], filters = {} }: PageProps) {
    const { t } = useTranslation();
    const { auth } = usePage().props as unknown as { auth: { user: { id: number; role: string } } };
    const [editing, setEditing] = useState<Driving | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [statusModalDriving, setStatusModalDriving] = useState<Driving | null>(null);
    const [targetStatus, setTargetStatus] = useState<'completed' | 'cancelled' | null>(null);
    const [isStatusUpdating, setIsStatusUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);

    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [instructorId, setInstructorId] = useState(filters.instructor_id || '');
    const [fromDate, setFromDate] = useState(filters.from || '');
    const [toDate, setToDate] = useState(filters.to || '');
    const [perPage, setPerPage] = useState(filters.per_page || '10');
    const [studentSearch, setStudentSearch] = useState('');

    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    const { data, setData, post, put, delete: destroy, reset, errors, processing, transform } = useForm({
        instructor_id: auth.user.role === 'instructor' ? String(auth.user.id) : '',
        student_id: '',
        student_ids: [] as string[],
        group_id: '',
        autodrome_id: '',
        date: todayString,
        time_from: '',
        time_to: '',
        start_time: '',
        end_time: '',
        status: 'scheduled',
    });

    transform((data) => {
        let dateForBackend = data.date;
        if (data.date && data.date.includes('-')) {
            const parts = data.date.split('-');
            if (parts[0].length === 2 && parts[2]?.length === 4) {
                dateForBackend = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }
        return {
            ...data,
            start_time: dateForBackend && data.time_from ? `${dateForBackend} ${data.time_from}:00` : '',
            end_time: dateForBackend && data.time_to ? `${dateForBackend} ${data.time_to}:00` : '',
        };
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (processing) return;
        if (editing) {
            put('/admin/drivings/' + editing.id, {
                onSuccess: () => {
                    closeForm();
                    toast.success(t('drivings.updated_success', 'Mashg\'ulot muvaffaqiyatli yangilandi'));
                },
                onError: (err) => {
                    toast.error(Object.values(err)[0] || t('drivings.error', 'Xatolik yuz berdi'));
                }
            });
        } else {
            post('/admin/drivings', {
                onSuccess: () => {
                    closeForm();
                    toast.success(t('drivings.created_success', 'Mashg\'ulot muvaffaqiyatli yaratildi'));
                },
                onError: (err) => {
                    toast.error(Object.values(err)[0] || t('drivings.error', 'Xatolik yuz berdi'));
                }
            });
        }
    };

    const handleEdit = (driving: Driving) => {
        if (driving.status === 'completed' || driving.status === 'cancelled') {
            toast.error(t('drivings.edit_completed_error', 'Tugallangan yoki bekor qilingan mashg\'ulotni o\'zgartirish mumkin emas'));
            return;
        }
        setEditing(driving);
        
        const formatTime = (dateString: string) => {
            const date = new Date(dateString);
            return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(11, 16);
        };
        const formatDate = (dateString: string) => {
            const date = new Date(dateString);
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        };

        setData({
            instructor_id: String(driving.instructor_id),
            student_id: String(driving.student_id),
            student_ids: [String(driving.student_id)],
            group_id: driving.group_id ? String(driving.group_id) : '',
            autodrome_id: driving.autodrome_id ? String(driving.autodrome_id) : '',
            date: formatDate(driving.start_time),
            time_from: formatTime(driving.start_time),
            time_to: formatTime(driving.end_time),
            start_time: '',
            end_time: '',
            status: driving.status,
        });
        setShowForm(true);
    };

    const handleDelete = (driving: Driving) => {
        if (driving.status === 'completed' || driving.status === 'cancelled' || driving.review) {
            toast.error(t('drivings.delete_reviewed_error', 'Tugallangan yoki bekor qilingan mashg\'ulotni o\'chirish mumkin emas'));
            return;
        }
        if (isDeleting === driving.id) return;
        if (confirm(t('common.confirm_delete', 'Rostdan ham o\'chirmoqchimisiz?'))) {
            setIsDeleting(driving.id);
            destroy('/admin/drivings/' + driving.id, {
                onSuccess: () => toast.success(t('drivings.deleted_success', 'Mashg\'ulot o\'chirildi')),
                onError: (err) => toast.error(Object.values(err)[0] || t('drivings.error', 'Xatolik yuz berdi')),
                onFinish: () => setIsDeleting(null),
            });
        }
    };

    const handleStatusChangeConfirm = () => {
        if (!statusModalDriving || !targetStatus || isStatusUpdating) return;

        const performUpdate = (lat?: number, lng?: number) => {
            setIsStatusUpdating(true);
            router.put('/admin/drivings/' + statusModalDriving.id, {
                start_time: statusModalDriving.start_time,
                end_time: statusModalDriving.end_time,
                status: targetStatus,
                latitude: lat,
                longitude: lng,
            }, {
                onSuccess: () => {
                    setStatusModalDriving(null);
                    setTargetStatus(null);
                    toast.success(targetStatus === 'completed'
                        ? t('drivings.status_completed_success', 'Mashg\'ulot yakunlandi')
                        : t('drivings.status_cancelled_success', 'Mashg\'ulot bekor qilindi')
                    );
                },
                onError: (err) => {
                    toast.error(Object.values(err)[0] || t('drivings.error', 'Xatolik yuz berdi'));
                },
                onFinish: () => {
                    setIsStatusUpdating(false);
                }
            });
        };

        if (targetStatus === 'completed') {
            if (!navigator.geolocation) {
                toast.error(t('drivings.geolocation_not_supported', 'Brauzeringiz geolokatsiyani qo\'llab-quvvatlamaydi.'));
                return;
            }

            setIsStatusUpdating(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    performUpdate(pos.coords.latitude, pos.coords.longitude);
                },
                (err) => {
                    setIsStatusUpdating(false);
                    toast.error(t('drivings.geolocation_denied', 'Joylashuvni aniqlab bo\'lmadi. Mashg\'ulotni yakunlash uchun geolokatsiyani yoqing va ruxsat bering.'));
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } else {
            performUpdate();
        }
    };

    const closeForm = () => {
        setShowForm(false);
        setTimeout(() => {
            setEditing(null);
            reset();
        }, 300);
    };

    const applyFilters = (newSearch: string, newStatus: string, newInst: string, newFrom: string, newTo: string, newPerPage: string) => {
        router.get('/admin/drivings', { 
            search: newSearch, 
            status: newStatus, 
            instructor_id: newInst,
            from: newFrom,
            to: newTo,
            per_page: newPerPage
        }, { preserveState: true, replace: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters(search, status, instructorId, fromDate, toDate, perPage);
    };

    const baseFilteredStudents = data.group_id ? students.filter(s => s.group_id === Number(data.group_id)) : students;
    const filteredStudents = studentSearch 
        ? baseFilteredStudents.filter(s => s.full_name.toLowerCase().includes(studentSearch.toLowerCase())) 
        : baseFilteredStudents;

    const handleStudentToggle = (stdId: number) => {
        const idStr = String(stdId);
        if (data.student_ids.includes(idStr)) {
            setData('student_ids', data.student_ids.filter(id => id !== idStr));
        } else {
            setData('student_ids', [...data.student_ids, idStr]);
        }
    };

    const handleFilterDateChange = (field: 'from' | 'to', val: string) => {
        if (field === 'from') {
            setFromDate(val);
            applyFilters(search, status, instructorId, val, toDate, perPage);
        } else {
            setToDate(val);
            applyFilters(search, status, instructorId, fromDate, val, perPage);
        }
    };

    const handleTimeChange = (field: 'time_from' | 'time_to', val: string) => {
        let clean = val.replace(/[^\d]/g, '');
        if (clean.length > 4) clean = clean.substring(0, 4);
        
        if (clean.length > 0) {
            if (parseInt(clean[0]) > 2) clean = '0' + clean[0];
        }
        if (clean.length > 1) {
            if (clean[0] === '2' && parseInt(clean[1]) > 3) {
                clean = '23' + clean.substring(2);
            }
        }
        if (clean.length > 2) {
            if (parseInt(clean[2]) > 5) {
                clean = clean.substring(0, 2) + '5' + clean.substring(3);
            }
        }

        let formatted = clean;
        if (clean.length >= 3) {
            formatted = `${clean.substring(0, 2)}:${clean.substring(2)}`;
        }
        setData(field, formatted);
    };

    return (
        <div className="p-6">
            <Head title={t('drivings.title', 'Mashg\'ulotlar Tarixi')} />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">{t('drivings.title', 'Mashg\'ulotlar Tarixi')}</h1>
                    <p className="text-muted-foreground">{t('drivings.description', 'O\'tkazilgan va rejalashtirilgan barcha darslar tarixi')}</p>
                </div>
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    {/* Desktop Filters */}
                    <div className="hidden md:flex gap-2 items-center">
                        <select
                            className="flex h-10 w-full md:w-auto items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                applyFilters(search, e.target.value, instructorId, fromDate, toDate, perPage);
                            }}
                        >
                            <option value="">{t('status.all', 'Barcha holatlar')}</option>
                            <option value="scheduled">{t('status.scheduled', 'Rejada')}</option>
                            <option value="completed">{t('status.completed', 'Tugagan')}</option>
                            <option value="cancelled">{t('status.cancelled', 'Bekor qilingan')}</option>
                        </select>

                        <select
                            className="flex h-10 w-full md:w-auto items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={instructorId}
                            onChange={(e) => {
                                setInstructorId(e.target.value);
                                applyFilters(search, status, e.target.value, fromDate, toDate, perPage);
                            }}
                        >
                            <option value="">{t('drivings.all_instructors', 'Barcha instruktorlar')}</option>
                            {instructors.map(inst => (
                                <option key={inst.id} value={inst.id}>{inst.name}</option>
                            ))}
                        </select>

                        <Input
                            type="date"
                            value={fromDate}
                            onChange={e => handleFilterDateChange('from', e.target.value)}
                            className="h-10 w-32"
                            title="Dan"
                        />
                        
                        <Input
                            type="date"
                            value={toDate}
                            onChange={e => handleFilterDateChange('to', e.target.value)}
                            className="h-10 w-32"
                            title="Gacha"
                        />

                        <select
                            className="flex h-10 w-full md:w-auto items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={perPage}
                            onChange={(e) => {
                                setPerPage(e.target.value);
                                applyFilters(search, status, instructorId, fromDate, toDate, e.target.value);
                            }}
                        >
                            <option value="10">10 ta</option>
                            <option value="30">30 ta</option>
                            <option value="50">50 ta</option>
                            <option value="all">Barchasi</option>
                        </select>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <form onSubmit={handleSearch} className="flex relative flex-1 md:w-64">
                            <Input 
                                placeholder={t('students.search_placeholder', 'O\'quvchi orqali qidirish...')} 
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
                                    <SheetDescription>{t('drivings.filter_desc', "Mashg'ulotlarni filtrlash")}</SheetDescription>
                                </SheetHeader>
                                <div className="grid gap-4 py-4 mt-2">
                                    <div className="space-y-2">
                                        <Label>{t('common.status', 'Holati')}</Label>
                                        <select
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={status}
                                            onChange={(e) => {
                                                setStatus(e.target.value);
                                                applyFilters(search, e.target.value, instructorId, fromDate, toDate, perPage);
                                            }}
                                        >
                                            <option value="">{t('status.all', 'Barcha holatlar')}</option>
                                            <option value="scheduled">{t('status.scheduled', 'Rejada')}</option>
                                            <option value="completed">{t('status.completed', 'Tugagan')}</option>
                                            <option value="cancelled">{t('status.cancelled', 'Bekor qilingan')}</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Instruktor</Label>
                                        <select
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={instructorId}
                                            onChange={(e) => {
                                                setInstructorId(e.target.value);
                                                applyFilters(search, status, e.target.value, fromDate, toDate, perPage);
                                            }}
                                        >
                                            <option value="">{t('drivings.all_instructors', 'Barcha instruktorlar')}</option>
                                            {instructors.map(inst => (
                                                <option key={inst.id} value={inst.id}>{inst.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-2">
                                            <Label>{t('common.from', 'Dan')}</Label>
                                            <Input
                                                type="date"
                                                value={fromDate}
                                                onChange={e => handleFilterDateChange('from', e.target.value)}
                                                className="h-10 w-full"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('common.to', 'Gacha')}</Label>
                                            <Input
                                                type="date"
                                                value={toDate}
                                                onChange={e => handleFilterDateChange('to', e.target.value)}
                                                className="h-10 w-full"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('common.pagination', 'Sahifalash')}</Label>
                                        <select
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={perPage}
                                            onChange={(e) => {
                                                setPerPage(e.target.value);
                                                applyFilters(search, status, instructorId, fromDate, toDate, e.target.value);
                                            }}
                                        >
                                            <option value="10">10 ta</option>
                                            <option value="30">30 ta</option>
                                            <option value="50">50 ta</option>
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
                <DialogContent className="max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle>{editing ? t('common.edit', 'Tahrirlash') : t('drivings.new', 'Yangi Mashg\'ulot')}</DialogTitle>
                        <DialogDescription className="sr-only">
                            {editing ? 'Mashg\'ulotni tahrirlash' : 'Yangi mashg\'ulot qo\'shish'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!editing && (
                            <div>
                                <Label htmlFor="group_id">{t('drivings.group_filter_label', 'Guruh (O\'quvchilarni filtrlash uchun)')}</Label>
                                <select
                                    id="group_id"
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                                    value={data.group_id}
                                    onChange={e => {
                                        setData('group_id', e.target.value);
                                        if (!editing) setData('student_ids', []);
                                    }}
                                    disabled={!!editing}
                                >
                                    <option value="">{t('common.all_groups', 'Barcha guruhlar')}</option>
                                    {groups.map(grp => (
                                        <option key={grp.id} value={grp.id}>{grp.name}</option>
                                    ))}
                                </select>
                                {errors.group_id && <div className="text-destructive text-sm mt-1">{errors.group_id}</div>}
                            </div>
                        )}

                        {!editing && (
                            <div>
                                <Label htmlFor="student_id">{t('drivings.student', 'O\'quvchi')}</Label>
                                <div className="border rounded-md p-3 bg-background space-y-2">
                                    <Input 
                                        type="text" 
                                        placeholder={t('students.search_placeholder', 'O\'quvchi orqali qidirish...')} 
                                        value={studentSearch} 
                                        onChange={e => setStudentSearch(e.target.value)} 
                                        className="mb-2 h-8"
                                    />
                                    <div className="max-h-48 overflow-y-auto space-y-2">
                                        {filteredStudents.length === 0 ? (
                                            <div className="text-sm text-muted-foreground text-center py-2">{t('drivings.no_students', 'O\'quvchilar topilmadi')}</div>
                                        ) : (
                                            filteredStudents.map(std => (
                                                <div key={std.id} className="flex items-center space-x-2">
                                                    <input 
                                                        type="checkbox" 
                                                        id={`std_${std.id}`}
                                                        checked={data.student_ids.includes(String(std.id))}
                                                        onChange={() => handleStudentToggle(std.id)}
                                                        className="rounded border-input text-primary focus:ring-primary"
                                                    />
                                                    <label htmlFor={`std_${std.id}`} className="text-sm cursor-pointer">{std.full_name} ({std.phone || '-'})</label>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                                {errors.student_id && <div className="text-destructive text-sm mt-1">{errors.student_id}</div>}
                                {errors.student_ids && <div className="text-destructive text-sm mt-1">{errors.student_ids}</div>}
                            </div>
                        )}

                        {!editing && auth.user.role !== 'instructor' && (
                            <div>
                                <Label htmlFor="instructor_id">{t('drivings.instructor', 'Instruktor')}</Label>
                                <select
                                    id="instructor_id"
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                                    value={data.instructor_id}
                                    onChange={e => setData('instructor_id', e.target.value)}
                                    disabled={!!editing}
                                >
                                    <option value="">{t('common.select', '-- Tanlang --')}</option>
                                    {instructors.map(inst => (
                                        <option key={inst.id} value={inst.id}>{inst.name}</option>
                                    ))}
                                </select>
                                {errors.instructor_id && <div className="text-destructive text-sm mt-1">{errors.instructor_id}</div>}
                            </div>
                        )}

                        <div>
                            <Label htmlFor="autodrome_id">{t('drivings.autodrome', 'Avtodrom')}</Label>
                            <select
                                id="autodrome_id"
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={data.autodrome_id}
                                onChange={e => setData('autodrome_id', e.target.value)}
                            >
                                <option value="">{t('drivings.autodrome_optional', 'Avtodrom (Ixtiyoriy)')}</option>
                                {autodromes.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                            {errors.autodrome_id && <div className="text-destructive text-sm mt-1">{errors.autodrome_id}</div>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="date">{t('drivings.date', 'Sana')}</Label>
                                <Input 
                                    type="date"
                                    id="date" 
                                    value={data.date} 
                                    onChange={e => setData('date', e.target.value)} 
                                    className="h-10 w-full"
                                    required 
                                />
                                {errors.start_time && <div className="text-destructive text-sm mt-1">{errors.start_time}</div>}
                            </div>
                            <div>
                                <Label htmlFor="time_from">{t('drivings.start_time', 'Boshlanish vaqti')}</Label>
                                <Input 
                                    type="text" 
                                    id="time_from" 
                                    value={data.time_from} 
                                    onChange={e => handleTimeChange('time_from', e.target.value)} 
                                    placeholder="09:00"
                                    pattern="^([01]\d|2[0-3]):([0-5]\d)$"
                                    title="Vaqt 24 soat formatida bo'lishi kerak (Masalan: 14:30)"
                                    required 
                                />
                            </div>
                            <div>
                                <Label htmlFor="time_to">{t('drivings.end_time', 'Tugash vaqti')}</Label>
                                <Input 
                                    type="text" 
                                    id="time_to" 
                                    value={data.time_to} 
                                    onChange={e => handleTimeChange('time_to', e.target.value)} 
                                    placeholder="18:30"
                                    pattern="^([01]\d|2[0-3]):([0-5]\d)$"
                                    title="Vaqt 24 soat formatida bo'lishi kerak (Masalan: 14:30)"
                                    required 
                                />
                                {errors.end_time && <div className="text-destructive text-sm mt-1">{errors.end_time}</div>}
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2 justify-end">
                            <Button type="button" variant="outline" onClick={closeForm}>{t('common.cancel', 'Bekor qilish')}</Button>
                            <Button type="submit" disabled={processing}>{processing ? t('common.saving', 'Saqlanmoqda...') : t('common.save', 'Saqlash')}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Status Confirmation Modal */}
            <Dialog open={!!statusModalDriving} onOpenChange={(open) => { if (!open) { setStatusModalDriving(null); setTargetStatus(null); } }}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>
                            {targetStatus === 'completed' ? t('drivings.finish_title', 'Mashg\'ulotni yakunlash') : t('drivings.cancel_title', 'Mashg\'ulotni bekor qilish')}
                        </DialogTitle>
                        <DialogDescription>
                            {targetStatus === 'completed'
                                ? t('drivings.confirm_finish', 'Rostdan ham ushbu mashg\'ulotni tugallamoqchimisiz?')
                                : t('drivings.confirm_cancel', 'Rostdan ham ushbu mashg\'ulotni bekor qilmoqchimisiz?')}
                        </DialogDescription>
                    </DialogHeader>

                    {targetStatus === 'completed' && statusModalDriving?.autodrome && (
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-300 space-y-1">
                            <div className="font-semibold flex items-center gap-1.5">
                                <span>📍</span>
                                <span>{statusModalDriving.autodrome.name} ({statusModalDriving.autodrome.radius_meters}m)</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Mashg'ulotni yakunlash uchun avtodrom belgilangan hududida bo'lishingiz shart. GPS joylashuvingiz tekshiriladi.
                            </p>
                        </div>
                    )}

                    <div className="flex gap-2 pt-4 justify-end">
                        <Button type="button" variant="outline" onClick={() => { setStatusModalDriving(null); setTargetStatus(null); }}>
                            {t('common.cancel', 'Bekor qilish')}
                        </Button>
                        <Button
                            type="button"
                            variant={targetStatus === 'completed' ? 'default' : 'destructive'}
                            className={targetStatus === 'completed' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                            disabled={isStatusUpdating}
                            onClick={handleStatusChangeConfirm}
                        >
                            {isStatusUpdating ? t('common.saving', 'Saqlanmoqda...') : (targetStatus === 'completed' ? t('drivings.yes_finish', 'Ha, tugatish') : t('drivings.yes_cancel', 'Ha, bekor qilish'))}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                {/* Desktop Table */}
                <table className="hidden md:table w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="p-4">{t('drivings.student', 'Talaba')}</th>
                            <th className="p-4">{t('drivings.instructor', 'Instruktor')}</th>
                            <th className="p-4">{t('students.group', 'Guruh')}</th>
                            <th className="p-4">{t('drivings.autodrome', 'Avtodrom')}</th>
                            <th className="p-4">{t('drivings.date_time', 'Sana va Vaqt')}</th>
                            <th className="p-4">{t('common.status', 'Holat')}</th>
                            <th className="p-4">{t('drivings.rating', 'Baho')}</th>
                            <th className="p-4 text-right">{t('common.actions', 'Amallar')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {drivings.data.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-4 text-center text-muted-foreground">
                                    {t('common.no_data', 'Ma\'lumot topilmadi')}
                                </td>
                            </tr>
                        ) : (
                            drivings.data.map((driving) => (
                                <tr key={driving.id} className="hover:bg-muted/50 transition-colors">
                                    <td className="p-4 font-medium">
                                        <div>{driving.student?.full_name || '-'}</div>
                                        <div className="text-xs text-muted-foreground">{driving.student?.phone || ''}</div>
                                    </td>
                                    <td className="p-4">{driving.instructor?.name || '-'}</td>
                                    <td className="p-4">
                                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded font-medium">
                                            {driving.group?.name || t('students.no_group', 'Guruhsiz')}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs font-medium">{driving.autodrome?.name || '-'}</td>
                                    <td className="p-4">
                                        <div className="font-medium">
                                            {(() => {
                                                const d = new Date(driving.start_time);
                                                const dd = String(d.getDate()).padStart(2, '0');
                                                const mm = String(d.getMonth() + 1).padStart(2, '0');
                                                return `${dd}-${mm}-${d.getFullYear()}`;
                                            })()}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(driving.start_time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })} - {new Date(driving.end_time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {driving.status === 'scheduled' && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">{t('status.scheduled', 'Rejada')}</span>}
                                        {driving.status === 'completed' && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">{t('status.completed', 'Tugagan')}</span>}
                                        {driving.status === 'cancelled' && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">{t('status.cancelled', 'Bekor qilingan')}</span>}
                                    </td>
                                    <td className="p-4">
                                        {driving.review ? (
                                            <div>
                                                <div className="flex items-center text-yellow-500 font-bold">
                                                    {driving.review.rating} ⭐
                                                </div>
                                                {driving.review.reason_tags && driving.review.reason_tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {driving.review.reason_tags.map((tag, i) => (
                                                            <span key={i} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground border">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">{t('drivings.no_review', 'Baholanmagan')}</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            {driving.status === 'scheduled' && (
                                                <>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-green-600 border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950/30"
                                                        onClick={() => { setStatusModalDriving(driving); setTargetStatus('completed'); }}
                                                        title={t('status.completed', 'Tugatish')}
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 mr-1" /> {t('status.completed', 'Tugatish')}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30"
                                                        onClick={() => { setStatusModalDriving(driving); setTargetStatus('cancelled'); }}
                                                        title={t('status.cancelled', 'Bekor qilish')}
                                                    >
                                                        <XCircle className="w-4 h-4 mr-1" /> {t('status.cancelled', 'Bekor qilish')}
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => handleEdit(driving)} title={t('common.edit', 'Tahrirlash')}>
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-destructive border-destructive/20 hover:bg-destructive/10"
                                                        onClick={() => handleDelete(driving)}
                                                        disabled={isDeleting === driving.id}
                                                        title={t('common.delete', 'O\'chirish')}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            )}
                                            {driving.status !== 'scheduled' && (
                                                <span className="text-xs text-muted-foreground">-</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                
                {/* Mobile Cards */}
                <div className="md:hidden p-3 space-y-3 bg-muted/20">
                    {drivings.data.map((driving) => (
                        <div key={driving.id} className="p-4 space-y-3 bg-card border rounded-xl shadow-xs">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-semibold">{driving.student?.full_name || '-'}</div>
                                    <div className="text-sm text-muted-foreground">{driving.student?.phone || ''}</div>
                                </div>
                                <div>
                                    {driving.status === 'scheduled' && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">{t('status.scheduled', 'Rejada')}</span>}
                                    {driving.status === 'completed' && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">{t('status.completed', 'Tugagan')}</span>}
                                    {driving.status === 'cancelled' && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">{t('status.cancelled', 'Bekor qilingan')}</span>}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-muted-foreground text-xs block">Sana / Vaqt:</span>
                                    <div className="font-medium">
                                        {(() => {
                                            const d = new Date(driving.start_time);
                                            const dd = String(d.getDate()).padStart(2, '0');
                                            const mm = String(d.getMonth() + 1).padStart(2, '0');
                                            return `${dd}-${mm}-${d.getFullYear()}`;
                                        })()}
                                    </div>
                                    <div className="text-muted-foreground text-xs">
                                        {new Date(driving.start_time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })} - {new Date(driving.end_time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground text-xs block">Instruktor / Guruh:</span>
                                    <div className="font-medium">{driving.instructor?.name || '-'}</div>
                                    <div className="text-xs px-1.5 py-0.5 mt-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded inline-block">
                                        {driving.group?.name || t('students.no_group', 'Guruhsiz')}
                                    </div>
                                </div>
                            </div>
                            
                            {driving.review && (
                                <div className="bg-muted/50 p-2 rounded text-sm flex items-center justify-between">
                                    <div className="text-yellow-500 font-bold">{driving.review.rating} ⭐</div>
                                    {driving.review.reason_tags && driving.review.reason_tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 justify-end">
                                            {driving.review.reason_tags.map((tag, i) => (
                                                <span key={i} className="text-[10px] bg-background border px-1.5 py-0.5 rounded text-muted-foreground">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            <div className="space-y-2 pt-1">
                                {driving.status === 'scheduled' && (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 text-green-600 border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950/30"
                                            onClick={() => { setStatusModalDriving(driving); setTargetStatus('completed'); }}
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-1" /> Yakunlash
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30"
                                            onClick={() => { setStatusModalDriving(driving); setTargetStatus('cancelled'); }}
                                        >
                                            <XCircle className="w-4 h-4 mr-1" /> Bekor qilish
                                        </Button>
                                    </div>
                                )}
                                {driving.status === 'scheduled' && (
                                    <div className="flex justify-end gap-2 pt-1">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-9 w-9"
                                            onClick={() => handleEdit(driving)}
                                            title={t('common.edit', 'Tahrirlash')}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-9 w-9 text-destructive border-destructive/20 hover:bg-destructive/10"
                                            onClick={() => handleDelete(driving)}
                                            disabled={isDeleting === driving.id}
                                            title={t('common.delete', 'O\'chirish')}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Pagination links={drivings.links} />
        </div>
    );
}
