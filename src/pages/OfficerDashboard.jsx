import React from 'react';

const OfficerDashboard = () => {
    return (
        <main className="flex-1 flex flex-col h-full overflow-y-auto">
            <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col gap-8">
                    {/* Welcome */}
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-3xl font-bold leading-tight tracking-tight">Welcome back, President</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-normal">Here is what is happening with your chapter today.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">
                                <span className="material-symbols-outlined">notifications</span>
                            </button>
                            <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                <img alt="User Profile" className="h-full w-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDT1JWePlTORSW4kwPBAs9e8ouW6thvLWoO6UVICYxus4QaM0zUPLMAYjHWKjQO5UUvfQXmwV19BualQBodoh_GdMkVI4zEOVkvjddyPZ_xbd4FV92TQ6Evwpd7ibqHdNmIw6FGkXC5E-DbSjf7ZUPxB31-m5-Ox6OysbYSbI5wbgOsxTemXDUhj8YA90QWb-vsnLjyNT0Q2UlEp34wROcn6MsNIDyOLhfayc_qM_8ASEfQo0vb3_91lA32a_ngVl5qGb6GliPyczWK" />
                            </div>
                        </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-32">
                            <div className="flex justify-between items-start">
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Active Members</p>
                                <span className="material-symbols-outlined text-slate-400 text-xl">group</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-3xl font-bold">142</h2>
                                <span className="text-green-600 dark:text-green-500 text-sm font-semibold bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">+5%</span>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-1 h-full bg-orange-500"></div>
                            <div className="flex justify-between items-start">
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Pending Approvals</p>
                                <span className="material-symbols-outlined text-orange-500 text-xl">priority_high</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-3xl font-bold">18</h2>
                                <span className="text-orange-600 dark:text-orange-400 text-sm font-medium">Needs Attention</span>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-32">
                            <div className="flex justify-between items-start">
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Budget Status</p>
                                <span className="material-symbols-outlined text-slate-400 text-xl">account_balance_wallet</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-3xl font-bold">$4,250</h2>
                                <span className="text-slate-400 text-sm font-normal">Remaining</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            {/* Quick Actions */}
                            <div className="flex flex-col gap-4">
                                <h3 className="text-lg font-bold">Quick Actions</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <button className="group relative flex flex-col items-start justify-end p-5 h-32 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white overflow-hidden shadow-md hover:shadow-lg transition-all">
                                        <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-30 transition-opacity">
                                            <span className="material-symbols-outlined text-6xl">event</span>
                                        </div>
                                        <div className="bg-white/20 p-2 rounded-lg mb-auto backdrop-blur-sm">
                                            <span className="material-symbols-outlined text-xl">add</span>
                                        </div>
                                        <span className="font-bold z-10">Create Event</span>
                                    </button>
                                    <button className="group relative flex flex-col items-start justify-end p-5 h-32 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white overflow-hidden shadow-sm hover:shadow-md transition-all">
                                        <div className="absolute top-0 right-0 p-3 opacity-5 dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity">
                                            <span className="material-symbols-outlined text-6xl">mail</span>
                                        </div>
                                        <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg mb-auto text-primary">
                                            <span className="material-symbols-outlined text-xl">send</span>
                                        </div>
                                        <span className="font-bold z-10">Email Chapter</span>
                                    </button>
                                    <button className="group relative flex flex-col items-start justify-end p-5 h-32 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white overflow-hidden shadow-sm hover:shadow-md transition-all">
                                        <div className="absolute top-0 right-0 p-3 opacity-5 dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity">
                                            <span className="material-symbols-outlined text-6xl">file_download</span>
                                        </div>
                                        <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg mb-auto text-primary">
                                            <span className="material-symbols-outlined text-xl">download</span>
                                        </div>
                                        <span className="font-bold z-10">Export Reports</span>
                                    </button>
                                </div>
                            </div>
                            {/* Chart Placeholder */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold">Chapter Engagement</h3>
                                    <select className="bg-transparent text-sm text-slate-500 border-none focus:ring-0 cursor-pointer">
                                        <option>This Semester</option>
                                        <option>Last Semester</option>
                                    </select>
                                </div>
                                <div className="flex items-end justify-between h-48 gap-2 sm:gap-4 w-full">
                                    {[40, 55, 35, 65, 80, 70, 90].map((h, i) => (
                                        <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-sm h-full flex items-end relative overflow-hidden">
                                                <div className="w-full bg-primary/80 group-hover:bg-primary transition-all duration-500 rounded-t-sm" style={{ height: `${h}%` }}></div>
                                            </div>
                                            <span className="text-xs text-slate-400">Wk {i + 1}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="flex flex-col gap-6">
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                                    <h3 className="text-base font-bold">Officer Duties</h3>
                                    <button className="text-xs text-primary font-medium hover:underline">View All</button>
                                </div>
                                <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
                                    {[
                                        { text: "Approve Budget Request", sub: "Fall Retreat Committee • Due Today", checked: false },
                                        { text: "Finalize Rush Schedule", sub: "Membership VP • Due Tomorrow", checked: false },
                                        { text: "Upload Meeting Minutes", sub: "Secretary • Due Friday", checked: false },
                                        { text: "Send Weekly Newsletter", sub: "Communications • Completed", checked: true, strike: true },
                                    ].map((item, i) => (
                                        <label key={i} className="flex items-start gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer group">
                                            <input type="checkbox" defaultChecked={item.checked} className="mt-1 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
                                            <div className="flex flex-col gap-0.5">
                                                <span className={`text-sm font-medium group-hover:text-primary transition-colors ${item.strike ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>{item.text}</span>
                                                <span className="text-xs text-slate-500">{item.sub}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col p-4 gap-4">
                                <h3 className="text-base font-bold">Recent Activity</h3>
                                <div className="flex flex-col gap-4">
                                    <div className="flex gap-3">
                                        <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-sm">schedule</span></div>
                                        <div className="flex flex-col gap-1">
                                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-tight"><span className="font-semibold text-slate-900 dark:text-white">John Doe</span> submitted 3 service hours.</p>
                                            <span className="text-xs text-slate-400">2 minutes ago</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-sm">person_add</span></div>
                                        <div className="flex flex-col gap-1">
                                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-tight"><span className="font-semibold text-slate-900 dark:text-white">Sarah Smith</span> applied for membership.</p>
                                            <span className="text-xs text-slate-400">1 hour ago</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default OfficerDashboard;
