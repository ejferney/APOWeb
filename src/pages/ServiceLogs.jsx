import React from 'react';

const ServiceLogs = () => {
    return (
        <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight">Service Dashboard</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-base">Track your progress towards semester requirements.</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                    <span>Fall Semester 2023</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div className="bg-white dark:bg-[#1a2234] rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-between shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Hours</p>
                            <h3 className="mt-2 text-3xl font-bold">28.5 <span className="text-lg text-gray-400 font-medium">/ 30</span></h3>
                        </div>
                        <div className="p-2 bg-primary/10 rounded-lg text-primary"><span className="material-symbols-outlined">schedule</span></div>
                    </div>
                    <div className="mt-4 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '95%' }}></div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">1.5 hours remaining</p>
                </div>
                <div className="bg-white dark:bg-[#1a2234] rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-between shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Approval</p>
                            <h3 className="mt-2 text-3xl font-bold">4.0 <span className="text-lg text-gray-400 font-medium">hrs</span></h3>
                        </div>
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
                            <span className="material-symbols-outlined">hourglass_top</span>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs font-medium text-orange-600 dark:text-orange-400">
                        <span>2 events awaiting review</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1a2234] rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-between shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Membership Status</p>
                            <h3 className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">Active Good Standing</h3>
                        </div>
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                            <span className="material-symbols-outlined">verified</span>
                        </div>
                    </div>
                    <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">Dues paid • Attendance met</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 bg-white dark:bg-[#1a2234] p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="relative w-full sm:w-auto sm:min-w-[320px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <span className="material-symbols-outlined text-[20px]">search</span>
                    </div>
                    <input className="block w-full pl-10 pr-3 py-2 border-none bg-gray-50 dark:bg-gray-800 rounded-lg text-sm placeholder-gray-400 focus:ring-2 focus:ring-primary" placeholder="Search events..." type="text" />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">filter_list</span>
                        <span>Filter</span>
                    </button>
                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/30 transition-all">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        <span className="whitespace-nowrap">Log New Hours</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="w-full overflow-hidden bg-white dark:bg-[#1a2234] rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[140px]">Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Event Name</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[160px]">Category</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[120px]">Hours</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[140px]">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {[
                                { date: "Oct 24, 2023", name: "Campus Cleanup", cat: "Service", hrs: "2.5 hrs", status: "Approved", color: "blue", statColor: "emerald" },
                                { date: "Oct 20, 2023", name: "Chapter Meeting", cat: "Leadership", hrs: "1.0 hr", status: "Pending", color: "amber", statColor: "gray" },
                                { date: "Oct 15, 2023", name: "Food Bank Shift", cat: "Service", hrs: "3.0 hrs", status: "Approved", color: "blue", statColor: "emerald" },
                                { date: "Oct 10, 2023", name: "Board Game Night", cat: "Fellowship", hrs: "2.0 hrs", status: "Approved", color: "purple", statColor: "emerald" },
                                { date: "Oct 05, 2023", name: "Fall Pledge Induction", cat: "Leadership", hrs: "1.5 hrs", status: "Approved", color: "amber", statColor: "emerald" },
                            ].map((row, i) => (
                                <tr key={i} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{row.date}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{row.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${row.color}-100 text-${row.color}-800 dark:bg-${row.color}-900/40 dark:text-${row.color}-300`}>{row.cat}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 font-medium">{row.hrs}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-${row.statColor}-100 text-${row.statColor}-800 dark:bg-${row.statColor}-900/40 dark:text-${row.statColor}-300 border border-${row.statColor}-200 dark:border-${row.statColor}-800`}>
                                            <span className={`size-1.5 rounded-full bg-${row.statColor}-500`}></span>
                                            {row.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
};

export default ServiceLogs;
