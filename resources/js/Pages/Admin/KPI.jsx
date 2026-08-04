import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/themes/light.css';

export default function KPI({ instructors, filters }) {
    const [fromDate, setFromDate] = useState(filters?.from || '');
    const [toDate, setToDate] = useState(filters?.to || '');

    const formatAsDate = (val) => {
        let clean = val.replace(/[^\d]/g, '');
        if (clean.length > 8) clean = clean.substring(0, 8);
        if (clean.length > 0 && parseInt(clean[0]) > 3) clean = '0' + clean[0];
        if (clean.length > 1) {
            if (clean[0] === '3' && parseInt(clean[1]) > 1) clean = '31';
            if (clean[0] === '0' && clean[1] === '0') clean = '01';
        }
        if (clean.length > 2 && parseInt(clean[2]) > 1) clean = clean.substring(0,2) + '0' + clean[2];
        if (clean.length > 3) {
            if (clean[2] === '1' && parseInt(clean[3]) > 2) clean = clean.substring(0,3) + '2';
            if (clean[2] === '0' && clean[3] === '0') clean = clean.substring(0,3) + '1';
        }
        let formatted = clean;
        if (clean.length >= 5) formatted = `${clean.substring(0, 2)}-${clean.substring(2, 4)}-${clean.substring(4)}`;
        else if (clean.length >= 3) formatted = `${clean.substring(0, 2)}-${clean.substring(2)}`;
        return formatted;
    };

    const applyFilters = (newFrom, newTo) => {
        router.get('/admin/kpi', { 
            from: newFrom,
            to: newTo
        }, { preserveState: true, replace: true });
    };

    const handleFilterDateChange = (field, dates, dateStr) => {
        if (field === 'from') setFromDate(dateStr);
        else setToDate(dateStr);
        
        if (dateStr.length === 10 || dateStr.length === 0) {
            if (field === 'from') applyFilters(dateStr, toDate);
            else applyFilters(fromDate, dateStr);
        }
    };
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <Head title="Admin KPI Paneli" />

            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Avtomaktab KPI Tizimi</h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Instruktorlar reytingi va mashg'ulotlar statistikasi
                        </p>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto mt-4 md:mt-0">
                        <Flatpickr 
                            options={{ dateFormat: 'd-m-Y', allowInput: true }}
                            placeholder="Dan DD-MM-YYYY"
                            value={fromDate}
                            onChange={(dates, dateStr) => handleFilterDateChange('from', dates, dateStr)}
                            className="flex h-10 w-full md:w-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Dan"
                        />
                        
                        <Flatpickr 
                            options={{ dateFormat: 'd-m-Y', allowInput: true }}
                            placeholder="Gacha DD-MM-YYYY"
                            value={toDate}
                            onChange={(dates, dateStr) => handleFilterDateChange('to', dates, dateStr)}
                            className="flex h-10 w-full md:w-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Gacha"
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800/50">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Instruktor
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Guruh / Dars
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        O'rtacha Baho
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        KPI (%)
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Holat
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {instructors.map((instructor) => (
                                    <tr key={instructor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center rounded-full font-bold text-lg">
                                                    {instructor.name.charAt(0)}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {instructor.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {instructor.phone}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">{instructor.groups_count} ta guruh</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{instructor.total_drivings} ta mashg'ulot</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <span className="text-lg font-semibold text-gray-900 dark:text-white">{instructor.average_rating}</span>
                                                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{instructor.total_reviews} ta baho</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="relative pt-1 w-24 mx-auto">
                                                <div className="flex mb-1 items-center justify-between">
                                                    <div>
                                                        <span className="text-xs font-semibold inline-block text-blue-600 dark:text-blue-400">
                                                            {instructor.kpi_percentage}%
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                                                    <div style={{ width: `${instructor.kpi_percentage}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${instructor.kpi_percentage >= 80 ? 'bg-green-500' : (instructor.kpi_percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500')}`}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {instructor.needs_attention ? (
                                                <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                                    <svg className="-ml-0.5 mr-1.5 h-3 w-3 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    Xavotirli ({instructor.negative_tags_count} shikoyat)
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                    A'lo
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
