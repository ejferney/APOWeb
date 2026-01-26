import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOfficer }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-full overflow-y-auto flex-shrink-0">
            <div className="p-6 flex flex-col h-full justify-between">
                <div className="flex flex-col gap-6">
                    {/* Branding */}
                    <div className="flex items-center gap-3">
                        <div className="bg-center bg-no-repeat bg-cover rounded-full h-10 w-10 shrink-0" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCWn3Oq73wUwRyDU2sFk9r3e25QQOU03wspccASteklW6r5jHjY52KH7uC-NR1fDYWkVNnZVjGoKUZG6Zgd7duilcY9cKFXmkXPue2ObM9yTsTdrIoPJj8t6gHP3YREL7UGZJ9abRjOr-z60RAwFdTVuQ2IOnUavcO4wAQ0SUWGqGZEs90LbAHkfMdidjf9uWaxurOjVyfq2GS604QHGEECuBJ3P7Yfmo10u0ClG1pOsa5Dt4wZue-ApE4eA8ulj26edJxFOs6Ft5b1")' }}></div>
                        <div className="flex flex-col">
                            <h1 className="text-slate-900 dark:text-white text-base font-bold leading-tight">Alpha Phi Omega</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-normal">{isOfficer ? 'Officer Portal' : 'Member Portal'}</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex flex-col gap-1">
                        <Link to="/" className={`px-3 py-2 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${isActive('/') ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                            <span className="material-symbols-outlined text-xl" data-weight={isActive('/') ? "fill" : "400"}>dashboard</span>
                            <p className="text-sm font-medium">Dashboard</p>
                        </Link>
                        <Link to="/calendar" className={`px-3 py-2 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${isActive('/calendar') ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                            <span className="material-symbols-outlined text-xl">calendar_month</span>
                            <p className="text-sm font-medium">Calendar</p>
                        </Link>
                        <Link to="/service-logs" className={`px-3 py-2 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${isActive('/service-logs') ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                            <span className="material-symbols-outlined text-xl">history_edu</span>
                            <p className="text-sm font-medium">Service Logs</p>
                        </Link>
                        <Link to="/directory" className={`px-3 py-2 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${isActive('/directory') ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                            <span className="material-symbols-outlined text-xl">group</span>
                            <p className="text-sm font-medium">Members</p>
                        </Link>

                        {isOfficer && (
                            <>
                                <div className="pt-4 pb-2">
                                    <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Officer Tools</p>
                                </div>
                                <Link to="/officer-portal" className={`px-3 py-2 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${isActive('/officer-portal') ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                                    <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
                                    <p className="text-sm font-medium">Officer Portal</p>
                                </Link>
                                <Link to="/heatmap" className={`px-3 py-2 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${isActive('/heatmap') ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                                    <span className="material-symbols-outlined text-xl">grid_view</span>
                                    <p className="text-sm font-medium">Availability Heatmap</p>
                                </Link>
                            </>
                        )}

                        <Link to="/paint-availability" className={`px-3 py-2 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${isActive('/paint-availability') ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                            <span className="material-symbols-outlined text-xl">drag_pan</span>
                            <p className="text-sm font-medium">My Availability</p>
                        </Link>

                    </div>
                </div>

                {/* CTA / Toggle */}
                <div className="flex flex-col gap-4 mb-4">
                    {isOfficer && (
                        <button onClick={() => navigate('/create-event')} className="flex w-full items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary hover:bg-blue-700 text-white text-sm font-bold transition-colors">
                            <span className="material-symbols-outlined text-lg">add</span>
                            <span className="truncate">New Event</span>
                        </button>
                    )}
                </div>

                {/* User Profile & Logout */}
                <div className="flex flex-col gap-4 border-t border-slate-100 dark:border-slate-800 pt-4 mt-auto">
                    <div className="flex items-center gap-3 px-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold truncate">{user?.firstName} {user?.lastName}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                    </div>

                    <button onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-lg h-10 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-slate-700 text-slate-700 dark:text-white text-sm font-bold transition-colors">
                        <span className="material-symbols-outlined text-xl">logout</span>
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
