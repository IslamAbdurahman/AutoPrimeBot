import { Head, Link, useForm, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Users, Upload, ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRef, useState } from 'react';

interface Group {
    id: number;
    name: string;
    instructor?: {
        name: string;
    };
}

interface Student {
    id: number;
    full_name: string;
    phone: string;
    gender: 'male' | 'female';
    completed_drivings_count?: number;
}

interface PageProps {
    group: Group;
    students: Student[];
}

export default function GroupShow({ group, students }: PageProps) {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const { data, setData, post, errors, reset } = useForm({
        file: null as File | null,
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setData('file', e.target.files[0]);
        }
    };

    const submitUpload = (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        post(`/admin/groups/${group.id}/import-students`, {
            preserveScroll: true,
            onSuccess: () => {
                setUploading(false);
                reset('file');
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
            onError: () => setUploading(false),
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <Head title={`${group.name} - ${t('groups.title', 'Guruhlar')}`} />
            
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div>
                        <Link href="/admin/groups" className="text-sm text-blue-600 hover:underline flex items-center mb-2">
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Ortga
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Users className="w-8 h-8 text-blue-600 dark:text-blue-500" />
                            {group.name}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Instruktor: {group.instructor?.name || "Biriktirilmagan"} • Talabalar soni: {students.length}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Import */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                <Upload className="w-5 h-5 text-green-600" />
                                Excel orqali yuklash
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Ustunlar: <b>full_name</b>, <b>phone</b>, <b>gender</b> (majburiy emas) bo'lishi kerak.
                            </p>
                            
                            <div className="mb-6">
                                <a 
                                    href="/admin/groups/download-template" 
                                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                    target="_blank"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Shablonni yuklab olish
                                </a>
                            </div>
                            
                            <form onSubmit={submitUpload} className="space-y-4">
                                <div>
                                    <Input
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleFileChange}
                                        ref={fileInputRef}
                                        className="cursor-pointer"
                                    />
                                    {errors.file && <div className="text-red-500 text-sm mt-1">{errors.file}</div>}
                                </div>
                                <Button type="submit" disabled={!data.file || uploading} className="w-full">
                                    {uploading ? 'Yuklanmoqda...' : 'Yuklash'}
                                </Button>
                            </form>
                        </div>
                    </div>

                    {/* Right Column - Students List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Guruh Talabalari</h2>
                            </div>
                            <div className="overflow-x-auto">
                                {/* Desktop Table */}
                                <table className="hidden md:table w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700/50 dark:text-gray-300">
                                        <tr>
                                            <th className="px-6 py-4 font-medium">№</th>
                                            <th className="px-6 py-4 font-medium">F.I.SH</th>
                                            <th className="px-6 py-4 font-medium">Telefon</th>
                                            <th className="px-6 py-4 font-medium text-center">Tugagan darslar</th>
                                            <th className="px-6 py-4 font-medium">Jins</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                        {students.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                                    Guruhda hozircha talabalar yo'q. Excel orqali yuklang.
                                                </td>
                                            </tr>
                                        ) : (
                                            students.map((student, index) => (
                                                <tr key={student.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/25 transition-colors">
                                                    <td className="px-6 py-4">{index + 1}</td>
                                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                        {student.full_name}
                                                    </td>
                                                    <td className="px-6 py-4">{student.phone || '-'}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                            {student.completed_drivings_count || 0}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {student.gender === 'female' ? 'Ayol' : 'Erkak'}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>

                                {/* Mobile Cards */}
                                <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700/50">
                                    {students.length === 0 ? (
                                        <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                                            Guruhda hozircha talabalar yo'q. Excel orqali yuklang.
                                        </div>
                                    ) : (
                                        students.map((student, index) => (
                                            <div key={student.id} className="p-4 space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-semibold text-gray-900 dark:text-white">{index + 1}. {student.full_name}</div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">{student.phone || '-'}</div>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded block text-center mb-1">
                                                            {student.gender === 'female' ? 'Ayol' : 'Erkak'}
                                                        </span>
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                            {student.completed_drivings_count || 0} dars
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
