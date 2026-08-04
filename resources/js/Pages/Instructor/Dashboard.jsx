import { Link } from '@inertiajs/react';
import TMALayout from '@/Layouts/TMALayout';

export default function Dashboard({ groups, upcomingDrivings }) {
    return (
        <TMALayout title="Instruktor Paneli">
            <div className="space-y-6">
                
                {/* Statistics / Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-center items-center">
                        <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{groups.length}</span>
                        <span className="text-xs text-gray-500 mt-1">Faol Guruhlar</span>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-center items-center">
                        <span className="text-3xl font-bold text-green-600 dark:text-green-400">{upcomingDrivings.length}</span>
                        <span className="text-xs text-gray-500 mt-1">Kelgusi Darslar</span>
                    </div>
                </div>

                <div className="flex justify-center">
                    <Link
                        href={route('instructor.driving.create')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl text-center transition-colors shadow-sm"
                    >
                        + Yangi mashg'ulot belgilash
                    </Link>
                </div>

                {/* Upcoming Drivings */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Kelgusi Mashg'ulotlar</h2>
                    
                    {upcomingDrivings.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl text-center text-gray-500 border border-gray-100 dark:border-gray-700 shadow-sm">
                            Rejalashtirilgan mashg'ulotlar yo'q
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {upcomingDrivings.map((driving) => (
                                <div key={driving.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-medium text-gray-900 dark:text-white">
                                            {driving.student?.full_name || 'Noma\'lum o\'quvchi'}
                                        </h3>
                                        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-medium rounded-lg">
                                            {driving.group?.name || 'Guruhsiz'}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 flex flex-col gap-1 mt-1">
                                        <div className="flex items-center gap-1.5">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <span>
                                                {new Date(driving.start_time).toLocaleString('uz-UZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} - {new Date(driving.end_time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </TMALayout>
    );
}
