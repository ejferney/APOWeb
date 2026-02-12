import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const MemberDashboard = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:5000/api/events?attended=true&status=completed', {
                    headers: { 'x-auth-token': token }
                });
                if (res.ok) {
                    setHistory(await res.json());
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    // Compute stats from local history to ensure consistency with table
    const stats = React.useMemo(() => {
        const acc = {
            serviceHours: 0,
            fellowshipHours: 0,
            leadershipHours: 0,
            committeeHours: 0
        };

        history.forEach(evt => {
            const userAttendee = evt.attendees?.find(a => {
                const aId = a.user?._id || a.user;
                const userId = user?._id || user?.id;
                return aId && userId && aId.toString() === userId.toString();
            });

            const override = userAttendee?.creditAmount;

            if (override !== undefined) {
                // If we have an override, we need to know WHICH category it applies to using the same logic as the backend/table
                // Backend Logic: Apply difference to FIRST category.

                let totalDefault = 0;
                if (evt.creditDistribution) {
                    evt.creditDistribution.forEach(c => totalDefault += c.amount);
                } else {
                    totalDefault = evt.creditAmount || 0;
                }

                const diff = override - totalDefault;

                if (evt.creditDistribution && evt.creditDistribution.length > 0) {
                    evt.creditDistribution.forEach((c, i) => {
                        let amount = c.amount;
                        if (i === 0) amount += diff; // Apply diff to first

                        if (c.type === 'service') acc.serviceHours += amount;
                        if (c.type === 'fellowship') acc.fellowshipHours += amount;
                        if (c.type === 'leadership') acc.leadershipHours += amount;
                        if (c.type === 'committee') acc.committeeHours += amount;
                    });
                } else if (evt.creditType && evt.creditType !== 'none') {
                    // Single type
                    // If override exists, it applies fully to this type
                    const val = override; // It is the full value
                    if (evt.creditType === 'service') acc.serviceHours += val;
                    if (evt.creditType === 'fellowship') acc.fellowshipHours += val;
                    if (evt.creditType === 'leadership') acc.leadershipHours += val;
                    if (evt.creditType === 'committee') acc.committeeHours += val;
                }
            } else {
                // No override, add defaults
                if (evt.creditDistribution && evt.creditDistribution.length > 0) {
                    evt.creditDistribution.forEach(c => {
                        if (c.type === 'service') acc.serviceHours += c.amount;
                        if (c.type === 'fellowship') acc.fellowshipHours += c.amount;
                        if (c.type === 'leadership') acc.leadershipHours += c.amount;
                        if (c.type === 'committee') acc.committeeHours += c.amount;
                    });
                } else if (evt.creditType && evt.creditType !== 'none') {
                    const val = evt.creditAmount || 0;
                    if (evt.creditType === 'service') acc.serviceHours += val;
                    if (evt.creditType === 'fellowship') acc.fellowshipHours += val;
                    if (evt.creditType === 'leadership') acc.leadershipHours += val;
                    if (evt.creditType === 'committee') acc.committeeHours += val;
                }
            }
        });
        return acc;
    }, [history, user]);

    const GOALS = {
        service: 25,
        fellowship: 10,
        leadership: 3
    };

    const getProgress = (current, goal) => Math.min(100, Math.round((current / goal) * 100));

    return (
        <main className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden relative">
            <div className="max-w-[1200px] w-full mx-auto p-6 md:p-10 flex flex-col gap-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-black tracking-tight">Welcome back, Brother {user?.firstName}</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-base font-normal">Today is {format(new Date(), 'MMMM d, yyyy')}. Track your progress below.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                            <span className="material-symbols-outlined text-[18px]">payments</span>
                            <span>Pay Dues</span>
                        </button>
                        <Link to="/service-logs" className="flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-bold shadow-md shadow-primary/20 transition-all">
                            <span className="material-symbols-outlined text-[18px]">add_circle</span>
                            <span>Log Hours</span>
                        </Link>
                    </div>
                </div>
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 bg-white dark:bg-card-dark rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-primary/50 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Service Hours</p>
                                <h3 className="text-2xl font-bold mt-1">{stats.serviceHours} / {GOALS.service}</h3>
                            </div>
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-primary"><span className="material-symbols-outlined">handshake</span></div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="relative size-24 shrink-0 rounded-full bg-[conic-gradient(var(--tw-gradient-stops))] from-primary via-primary via-[80%] to-slate-200 dark:to-slate-700 to-[80%] flex items-center justify-center" style={{ background: `conic-gradient(#3b82f6 ${getProgress(stats.serviceHours, GOALS.service)}%, #e2e8f0 0)` }}>
                                <div className="bg-white dark:bg-card-dark rounded-full size-20 flex items-center justify-center">
                                    <span className="text-lg font-bold text-primary">{getProgress(stats.serviceHours, GOALS.service)}%</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="text-sm font-medium">{stats.serviceHours >= GOALS.service ? 'Goal Met!' : 'Keep it up!'}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    {Math.max(0, GOALS.service - stats.serviceHours)} more hours needed.
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* Fellowship Credits */}
                    <div className="md:col-span-1 bg-white dark:bg-card-dark rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-yellow-500/50 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Fellowship</p>
                                <h3 className="text-2xl font-bold mt-1">{stats.fellowshipHours} / {GOALS.fellowship}</h3>
                            </div>
                            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-600 dark:text-yellow-400"><span className="material-symbols-outlined">diversity_3</span></div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="relative size-24 shrink-0 rounded-full bg-[conic-gradient(var(--tw-gradient-stops))] from-yellow-500 via-yellow-500 via-[80%] to-slate-200 dark:to-slate-700 to-[80%] flex items-center justify-center" style={{ background: `conic-gradient(#eab308 ${getProgress(stats.fellowshipHours, GOALS.fellowship)}%, #e2e8f0 0)` }}>
                                <div className="bg-white dark:bg-card-dark rounded-full size-20 flex items-center justify-center">
                                    <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{getProgress(stats.fellowshipHours, GOALS.fellowship)}%</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="text-sm font-medium">{stats.fellowshipHours >= GOALS.fellowship ? 'Goal Met!' : 'Keep it up!'}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    {Math.max(0, (GOALS.fellowship - stats.fellowshipHours)).toFixed(1)} more credits.
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* Leadership Credits */}
                    <div className="md:col-span-1 bg-white dark:bg-card-dark rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Leadership</p>
                                <h3 className="text-2xl font-bold mt-1">{stats.leadershipHours} / {GOALS.leadership}</h3>
                            </div>
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400"><span className="material-symbols-outlined">stars</span></div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="relative size-24 shrink-0 rounded-full bg-[conic-gradient(var(--tw-gradient-stops))] from-emerald-500 via-emerald-500 via-[80%] to-slate-200 dark:to-slate-700 to-[80%] flex items-center justify-center" style={{ background: `conic-gradient(#10b981 ${getProgress(stats.leadershipHours, GOALS.leadership)}%, #e2e8f0 0)` }}>
                                <div className="bg-white dark:bg-card-dark rounded-full size-20 flex items-center justify-center">
                                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{getProgress(stats.leadershipHours, GOALS.leadership)}%</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="text-sm font-medium">{stats.leadershipHours >= GOALS.leadership ? 'Goal Met!' : 'Keep it up!'}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    {Math.max(0, (GOALS.leadership - stats.leadershipHours)).toFixed(1)} more credits.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">campaign</span>
                                Chapter Announcements
                            </h2>
                        </div>
                        <div className="flex flex-col bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm divide-y divide-slate-100 dark:divide-slate-800/50">
                            {[
                                { img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAE5nW8Cr7Sszx3EgTFE3R5BJJViTjRHOaNP4qeqx-fjxJmWoSjMZJrBBI3qoGiAabSj8BhFuKVtiHKlyy7vbjw8gLjVZszu0VsYaCNNweMUpCUy71myG3Z3wFl4IfrP-iGzFonl2aeDHyzUI-6e6f-j2PoScyAHORNHdKcmmOc9wHZdEvFNOaRrkCrJmmp6_QLrZ3pXrQcS-6Px3EhKEDFtk1YKocH1QK8SoNodYqxyVI7XwqHb9TjY_3OpdWZZT5tJrSPCa1MuFju", name: "Sarah Jenkins", role: "Treasurer", time: "2 hours ago", title: "Dues Deadline Extended", body: "Due to the recent bank holiday, we are extending the deadline for semester dues by 48 hours. Please pay via the portal." },
                                { img: "https://lh3.googleusercontent.com/aida-public/AB6AXuD-jC8wf3yB2Riv--ek2eKgnEeMYXOLYyXne9wDlrScH6KG4MAZu6mZGf2-aN5ee_gve36-yapWyaLWKrqwNAltwzWFkK9p6x2NtIMjMBiYF-8A86qwV0JoUOu5RpS4B4OWz3VJU_rlbPvaIciZxMC5cjXHnkQ_HjBUdz190v627wH4oEzPgiXkH74FKAxMj2JyeHfjtXR25VvAT1cI3y5rzAooUs1GxfXSLKhLeMrDeJCQJlGg1S6o8g-VY_BT7CYY7h0n3idA0f2I", name: "Michael Chen", role: "VP Service", time: "Yesterday", title: "Signups open for Campus Cleanup", body: "We need 15 more volunteers for this Saturday's cleanup event behind the Science Center. Gloves will be provided!" }
                            ].map((item, i) => (
                                <div key={i} className="p-5 flex gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                                    <div className="size-10 rounded-full bg-slate-200 flex-shrink-0 bg-cover bg-center" style={{ backgroundImage: `url('${item.img}')` }}></div>
                                    <div className="flex flex-col flex-1 gap-1">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-bold">{item.name}</span>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-primary dark:text-blue-300 font-medium">{item.role}</span>
                                            </div>
                                            <span className="text-xs text-slate-400 whitespace-nowrap">{item.time}</span>
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{item.title}</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.body}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="lg:col-span-1 flex flex-col gap-4">
                        <h2 className="text-lg font-bold">Next Event</h2>
                        <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-xl shadow-md overflow-hidden flex flex-col h-full">
                            <div className="h-32 w-full bg-slate-200 bg-cover bg-center relative" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB6VrpuBl9AYSB1hl2EE2K6p4y0FjSk5QR3UZJbDZ9MvlnJJIDFL72fDpffWCu9rYti_ydkCtqMWrooCCS0B-ikUVN3-aZO5I3hK_2ciNzTG7e0YTNWAiRfOeSB1yXoKjvnqsTGtfH2rqzYs7Zbplx1n_wG9SfjNtbBp15fXoZGi3edDxHfB2hPW2386_iXnDOxkeK-we4TzS1AmDCLuSKPrBBxd9PdgGzVDoZfZ8MzrYWJBn-IDNVHr-tXRZw90ia28pS6k3n6A9An")' }}>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                                <div className="absolute bottom-3 left-4"><span className="px-2 py-1 rounded bg-accent text-slate-900 text-xs font-bold uppercase tracking-wide">Mandatory</span></div>
                            </div>
                            <div className="p-5 flex flex-col gap-4 flex-1">
                                <div>
                                    <h3 className="text-xl font-bold leading-tight">Weekly Chapter Meeting</h3>
                                    <div className="flex items-center gap-2 mt-2 text-slate-500 dark:text-slate-400 text-sm">
                                        <span className="material-symbols-outlined text-[18px]">location_on</span>
                                        <span>Student Union, Room 302</span>
                                    </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 flex justify-around items-center border border-slate-100 dark:border-slate-700">
                                    <div className="flex flex-col items-center"><span className="text-lg font-bold text-primary">02</span><span className="text-[10px] uppercase text-slate-500">Days</span></div>
                                    <div className="text-slate-300 text-xl">:</div>
                                    <div className="flex flex-col items-center"><span className="text-lg font-bold text-primary">14</span><span className="text-[10px] uppercase text-slate-500">Hrs</span></div>
                                    <div className="text-slate-300 text-xl">:</div>
                                    <div className="flex flex-col items-center"><span className="text-lg font-bold text-primary">30</span><span className="text-[10px] uppercase text-slate-500">Mins</span></div>
                                </div>
                                <div className="mt-auto">
                                    <button className="w-full py-2.5 rounded-lg bg-slate-900 dark:bg-primary text-white text-sm font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                                        <span>RSVP Now</span>
                                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default MemberDashboard;
