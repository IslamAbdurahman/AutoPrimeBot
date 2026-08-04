import { useState, useCallback } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
    student?: Student;
    group?: Group;
    instructor?: Instructor;
    review?: {
        rating: number;
        reason_tags?: string[];
    };
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
    filters?: {
        search?: string;
        status?: string;
        instructor_id?: string;
    };
}

export default function DrivingsIndex({ drivings, instructors, students, groups, filters = {} }: PageProps) {
    const { t } = useTranslation();
    const { auth } = usePage().props as unknown as { auth: { user: { id: number; role: string } } };
    const [editing, setEditing] = useState<Driving | null>(null);
    const [showForm, setShowForm] = useState(false);

    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [instructorId, setInstructorId] = useState(filters.instructor_id || '');
    const [studentSearch, setStudentSearch] = useState('');

    const today = new Date();
    const todayString = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

    const { data, setData, post, put, delete: destroy, reset, errors, processing, transform } = useForm({
        instructor_id: auth.user.role === 'instructor' ? String(auth.user.id) : '',
        student_id: '',
        student_ids: [] as string[],
        group_id: '',
        date: todayString,
        time_from: '',
        time_to: '',
        start_time: '',
        end_time: '',
        status: 'scheduled',
    });

    transform((data) => {
        let dateForBackend = '';
        if (data.date && data.date.length === 10) {
            const [dd, mm, yyyy] = data.date.split('-');
            dateForBackend = `${yyyy}-${mm}-${dd}`;
        }
        return {
            ...data,
            start_time: dateForBackend && data.time_from ? `${dateForBackend} ${data.time_from}:00` : '',
            end_time: dateForBackend && data.time_to ? `${dateForBackend} ${data.time_to}:00` : '',
        };
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editing) {
            put('/admin/drivings/' + editing.id, {
                onSuccess: () => closeForm(),
            });
        } else {
            post('/admin/drivings', {
                onSuccess: () => closeForm(),
            });
        }
    };

    const handleEdit = (driving: Driving) => {
        setEditing(driving);
        
        const formatTime = (dateString: string) => {
            const date = new Date(dateString);
            return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(11, 16);
        };
        const formatDate = (dateString: string) => {
            const date = new Date(dateString);
            const dd = String(date.getDate()).padStart(2, '0');
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const yyyy = date.getFullYear();
            return `${dd}-${mm}-${yyyy}`;
        };

        setData({
            instructor_id: driving.instructor_id ? String(driving.instructor_id) : (driving.instructor?.id ? String(driving.instructor.id) : ''),
            student_id: driving.student_id ? String(driving.student_id) : (driving.student?.id ? String(driving.student.id) : ''),
            student_ids: [],
            group_id: driving.group_id ? String(driving.group_id) : (driving.group?.id ? String(driving.group.id) : ''),
            date: formatDate(driving.start_time),
            time_from: formatTime(driving.start_time),
            time_to: formatTime(driving.end_time),
            status: driving.status,
        });
        setShowForm(true);
    };

    const handleDelete = (id: number) => {
        if (confirm(t('common.confirm_delete', 'Rostdan ham o\'chirmoqchimisiz?'))) {
            destroy('/admin/drivings/' + id);
        }
    };

    const closeForm = () => {
        setShowForm(false);
        setEditing(null);
        reset();
    };

    const applyFilters = (newSearch: string, newStatus: string, newInst: string) => {
        router.get('/admin/drivings', { search: newSearch, status: newStatus, instructor_id: newInst }, { preserveState: true, replace: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters(search, status, instructorId);
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

    const handleDateChange = (val: string) => {
        let clean = val.replace(/[^\d]/g, '');
        if (clean.length > 8) clean = clean.substring(0, 8);
        
        if (clean.length > 0) {
            if (parseInt(clean[0]) > 3) clean = '0' + clean[0];
        }
        if (clean.length > 1) {
            if (clean[0] === '3' && parseInt(clean[1]) > 1) clean = '31';
            if (clean[0] === '0' && clean[1] === '0') clean = '01';
        }
        if (clean.length > 2) {
            if (parseInt(clean[2]) > 1) clean = clean.substring(0,2) + '0' + clean[2];
        }
        if (clean.length > 3) {
            if (clean[2] === '1' && parseInt(clean[3]) > 2) clean = clean.substring(0,3) + '2';
            if (clean[2] === '0' && clean[3] === '0') clean = clean.substring(0,3) + '1';
        }
        
        let formatted = clean;
        if (clean.length >= 5) {
            formatted = `${clean.substring(0, 2)}-${clean.substring(2, 4)}-${clean.substring(4)}`;
        } else if (clean.length >= 3) {
            formatted = `${clean.substring(0, 2)}-${clean.substring(2)}`;
        }
        setData('date', formatted);
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
                    <select
                        className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            applyFilters(search, e.target.value, instructorId);
                        }}
                    >
                        <option value="">{t('status.all', 'Barcha holatlar')}</option>
                        <option value="scheduled">{t('status.scheduled', 'Rejada')}</option>
                        <option value="in_progress">{t('status.in_progress', 'Jarayonda')}</option>
                        <option value="completed">{t('status.completed', 'Tugagan')}</option>
                        <option value="cancelled">{t('status.cancelled', 'Bekor qilingan')}</option>
                    </select>

                    <select
                        className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={instructorId}
                        onChange={(e) => {
                            setInstructorId(e.target.value);
                            applyFilters(search, status, e.target.value);
                        }}
                    >
                        <option value="">{t('drivings.all_instructors', 'Barcha instruktorlar')}</option>
                        {instructors.map(inst => (
                            <option key={inst.id} value={inst.id}>{inst.name}</option>
                        ))}
                    </select>

                    <form onSubmit={handleSearch} className="flex relative w-full md:w-64">
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
                    <Button onClick={() => setShowForm(true)} className="whitespace-nowrap"><Plus className="w-4 h-4 mr-2" /> {t('common.add', 'Qo\'shish')}</Button>
                </div>
            </div>

            <Dialog open={showForm} onOpenChange={(open) => !open && closeForm()}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editing ? t('common.edit', 'Tahrirlash') : t('drivings.new', 'Yangi Mashg\'ulot')}</DialogTitle>
                        <DialogDescription className="sr-only">
                            {editing ? 'Mashg\'ulotni tahrirlash' : 'Yangi mashg\'ulot qo\'shish'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="group_id">{t('drivings.group_optional', 'Guruh')}</Label>
                            <select
                                id="group_id"
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={data.group_id}
                                onChange={e => {
                                    setData('group_id', e.target.value);
                                    if (!editing) setData('student_ids', []);
                                }}
                            >
                                <option value="">{t('common.select', '-- Tanlang --')}</option>
                                {groups.map(grp => (
                                    <option key={grp.id} value={grp.id}>{grp.name}</option>
                                ))}
                            </select>
                            {errors.group_id && <div className="text-destructive text-sm mt-1">{errors.group_id}</div>}
                        </div>

                        <div>
                            <Label htmlFor="student_id">{t('drivings.student', 'O\'quvchi')}</Label>
                            {editing ? (
                                <select
                                    id="student_id"
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={data.student_id}
                                    onChange={e => setData('student_id', e.target.value)}
                                >
                                    <option value="">{t('common.select', '-- Tanlang --')}</option>
                                    {filteredStudents.map(std => (
                                        <option key={std.id} value={std.id}>{std.full_name}</option>
                                    ))}
                                </select>
                            ) : (
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
                                                    <label htmlFor={`std_${std.id}`} className="text-sm cursor-pointer">{std.full_name}</label>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                            {errors.student_id && <div className="text-destructive text-sm mt-1">{errors.student_id}</div>}
                            {errors.student_ids && <div className="text-destructive text-sm mt-1">{errors.student_ids}</div>}
                        </div>

                        {auth.user.role !== 'instructor' && (
                            <div>
                                <Label htmlFor="instructor_id">{t('drivings.instructor', 'Instruktor')}</Label>
                                <select
                                    id="instructor_id"
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="date">{t('drivings.date', 'Sana')}</Label>
                                <Input 
                                    type="text" 
                                    id="date" 
                                    value={data.date} 
                                    onChange={e => handleDateChange(e.target.value)} 
                                    placeholder="DD-MM-YYYY"
                                    pattern="^(0[1-9]|[12]\d|3[01])-(0[1-9]|1[0-2])-\d{4}$"
                                    title="Sana DD-MM-YYYY formatida bo'lishi kerak (Masalan: 24-08-2026)"
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

                        {editing && (
                            <div>
                                <Label htmlFor="status">{t('common.status', 'Holati')}</Label>
                                <select
                                    id="status"
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={data.status}
                                    onChange={e => setData('status', e.target.value)}
                                >
                                    <option value="scheduled">{t('status.scheduled', 'Rejada')}</option>
                                    <option value="in_progress">{t('status.in_progress', 'Jarayonda')}</option>
                                    <option value="completed">{t('status.completed', 'Tugagan')}</option>
                                    <option value="cancelled">{t('status.cancelled', 'Bekor qilingan')}</option>
                                </select>
                                {errors.status && <div className="text-destructive text-sm mt-1">{errors.status}</div>}
                            </div>
                        )}

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
                            <th className="px-4 py-3 font-medium">{t('drivings.date_time', 'Sana/Vaqt')}</th>
                            <th className="px-4 py-3 font-medium">{t('drivings.student_group', 'O\'quvchi / Guruh')}</th>
                            <th className="px-4 py-3 font-medium">{t('drivings.instructor', 'Instruktor')}</th>
                            <th className="px-4 py-3 font-medium">{t('common.status', 'Holati')}</th>
                            <th className="px-4 py-3 font-medium text-center">{t('drivings.review', 'Baho va Fikr')}</th>
                            <th className="px-4 py-3 font-medium text-right">{t('common.actions', 'Amallar')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {drivings.data.map((driving, index) => (
                            <tr key={driving.id} className="hover:bg-muted/30">
                                <td className="px-4 py-3">{(drivings.from || 1) + index}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="font-medium">
                                        {(() => {
                                            const d = new Date(driving.start_time);
                                            const dd = String(d.getDate()).padStart(2, '0');
                                            const mm = String(d.getMonth() + 1).padStart(2, '0');
                                            const yyyy = d.getFullYear();
                                            return `${dd}-${mm}-${yyyy}`;
                                        })()}
                                    </div>
                                    <div className="text-muted-foreground">
                                        {new Date(driving.start_time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })} 
                                        {' - '} 
                                        {new Date(driving.end_time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="font-medium">{driving.student?.full_name || '-'}</div>
                                    <div className="text-xs px-2 py-0.5 mt-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded inline-block">
                                        {driving.group?.name || t('students.no_group', 'Guruhsiz')}
                                    </div>
                                </td>
                                <td className="px-4 py-3">{driving.instructor?.name || '-'}</td>
                                <td className="px-4 py-3">
                                    {driving.status === 'scheduled' && <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded">{t('status.scheduled', 'Rejada')}</span>}
                                    {driving.status === 'in_progress' && <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded">{t('status.in_progress', 'Jarayonda')}</span>}
                                    {driving.status === 'completed' && <span className="text-green-600 bg-green-50 px-2 py-1 rounded">{t('status.completed', 'Tugagan')}</span>}
                                    {driving.status === 'cancelled' && <span className="text-red-600 bg-red-50 px-2 py-1 rounded">{t('status.cancelled', 'Bekor qilingan')}</span>}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {driving.review ? (
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="flex items-center text-yellow-500 font-bold">
                                                {driving.review.rating} ⭐
                                            </div>
                                            {driving.review.reason_tags && driving.review.reason_tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 justify-center max-w-[150px]">
                                                    {driving.review.reason_tags.map((tag, i) => (
                                                        <span key={i} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground whitespace-nowrap">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(driving)}>
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(driving.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination links={drivings.links} />
        </div>
    );
}
