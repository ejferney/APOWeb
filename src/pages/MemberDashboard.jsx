import { API_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { format, formatDistanceToNow, differenceInMinutes, parseISO } from 'date-fns';
import { computeEventStats, addServiceLogStats } from '../utils/credits';

const MemberDashboard = () => {
    const { user } = useAuth();
    const isOfficer = user?.role === 'officer' || user?.role === 'admin';
    const [goals, setGoals] = useState({ service: 0, fellowship: 0, leadership: 0 });
    const [history, setHistory] = useState([]);
    const [myLogs, setMyLogs] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [nextEvent, setNextEvent] = useState(null);
    const [membershipType, setMembershipType] = useState(user?.membershipType || 'pledge');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { 'x-auth-token': token };
                const [historyRes, reqRes, userRes, annRes, eventsRes, logsRes] = await Promise.all([
                    fetch(`${API_URL}/api/events?attended=true&status=completed&t=${Date.now()}`, { headers, cache: 'no-cache' }),
                    fetch(`${API_URL}/api/requirements?t=${Date.now()}`, { headers, cache: 'no-cache' }),
                    fetch(`${API_URL}/api/auth/me?t=${Date.now()}`, { headers, cache: 'no-cache' }),
                    fetch(`${API_URL}/api/announcements`, { headers }),
                    fetch(`${API_URL}/api/events?status=upcoming`, { headers }),
                    fetch(`${API_URL}/api/service-logs/mine`, { headers })
                ]);

                if (historyRes.ok) {
                    setHistory(await historyRes.json());
                }

                if (annRes.ok) {
                    setAnnouncements(await annRes.json());
                }

                if (logsRes.ok) {
                    setMyLogs(await logsRes.json());
                }

                if (eventsRes.ok) {
                    const events = await eventsRes.json();
                    // Events come sorted by start ascending; pick the first one still in the future
                    const upcoming = (Array.isArray(events) ? events : []).find(e => new Date(e.start) > new Date());
                    setNextEvent(upcoming || null);
                }

                let currentUserType = user?.membershipType || 'pledge';

                // If we got fresh user data, use that instead of the cached context
                if (userRes.ok) {
                    const freshUser = await userRes.json();
                    if (freshUser && freshUser.membershipType) {
                        currentUserType = freshUser.membershipType;
                    }
                }
                setMembershipType(currentUserType);

                if (reqRes.ok) {
                    const requirements = await reqRes.json();
                    const reqList = Array.isArray(requirements) ? requirements : [];

                    // Find matching requirement or fallback to pledge or hardcoded default
                    const userReq = reqList.find(r => r.type === currentUserType) ||
                        reqList.find(r => r.type === 'pledge') ||
                        { serviceHours: 25, fellowshipHours: 10, leadershipHours: 5 };

                    setGoals({
                        service: userReq.serviceHours,
                        fellowship: userReq.fellowshipHours,
                        leadership: userReq.leadershipHours,
                        type: userReq.type || currentUserType
                    });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const userId = user?._id || user?.id;
    const stats = React.useMemo(
        () => addServiceLogStats(computeEventStats(history, userId), myLogs),
        [history, myLogs, userId]
    );

    const GOALS = goals;
    const isAlumniView = ['alumni', 'inactive'].includes(membershipType);

    const getProgress = (current, goal) => goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 100;

    const deleteAnnouncement = async (id) => {
        if (!confirm('Delete this announcement?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/announcements/${id}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                setAnnouncements(prev => prev.filter(a => a._id !== id));
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Countdown parts for the next event
    const countdown = React.useMemo(() => {
        if (!nextEvent) return null;
        const mins = differenceInMinutes(parseISO(nextEvent.start), new Date());
        if (mins <= 0) return { days: 0, hours: 0, minutes: 0 };
        return {
            days: Math.floor(mins / 1440),
            hours: Math.floor((mins % 1440) / 60),
            minutes: mins % 60
        };
    }, [nextEvent]);

    const progressCards = [
        { label: 'Service Hours', value: stats.serviceHours, goal: GOALS.service, color: '#3b82f6', textClass: 'text-primary', icon: 'handshake', iconBg: 'bg-blue-50 dark:bg-blue-900/20 text-primary', hover: 'hover:border-primary/50' },
        { label: 'Fellowship', value: stats.fellowshipHours, goal: GOALS.fellowship, color: '#eab308', textClass: 'text-yellow-600 dark:text-yellow-400', icon: 'diversity_3', iconBg: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400', hover: 'hover:border-yellow-500/50' },
        { label: 'Leadership', value: stats.leadershipHours, goal: GOALS.leadership, color: '#10b981', textClass: 'text-emerald-600 dark:text-emerald-400', icon: 'stars', iconBg: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400', hover: 'hover:border-emerald-500/50' }
    ];

    return (
        <main className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden relative">
            <div className="max-w-[1200px] w-full mx-auto p-6 md:p-10 flex flex-col gap-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-black tracking-tight">Welcome back, Brother {user?.firstName}</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-base font-normal">
                            Today is {format(new Date(), 'MMMM d, yyyy')}.
                            {!isAlumniView && <> Tracking <span className="font-bold text-primary capitalize">{goals.type || membershipType}</span> goals.</>}
                        </p>
                    </div>
                    {!isAlumniView && (
                        <div className="flex gap-3">
                            <Link to="/service-logs" className="flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-bold shadow-md shadow-primary/20 transition-all">
                                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                                <span>Log Hours</span>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Alumni banner OR progress rings */}
                {isAlumniView ? (
                    <div className="bg-white dark:bg-card-dark rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full text-primary">
                            <span className="material-symbols-outlined text-3xl">school</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold capitalize">{membershipType} Brother</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                No requirements to track — you're always welcome at chapter events. Check the <Link to="/calendar" className="text-primary font-medium hover:underline">calendar</Link> for upcoming service and fellowship opportunities, or browse the <Link to="/directory" className="text-primary font-medium hover:underline">brotherhood directory</Link>.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {progressCards.map(card => (
                            <div key={card.label} className={`md:col-span-1 bg-white dark:bg-card-dark rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group ${card.hover} transition-colors`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">{card.label}</p>
                                        <h3 className="text-2xl font-bold mt-1">{parseFloat(card.value.toFixed(2))} / {card.goal}</h3>
                                    </div>
                                    <div className={`p-2 rounded-lg ${card.iconBg}`}><span className="material-symbols-outlined">{card.icon}</span></div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="relative size-24 shrink-0 rounded-full flex items-center justify-center" style={{ background: `conic-gradient(${card.color} ${getProgress(card.value, card.goal)}%, #e2e8f0 0)` }}>
                                        <div className="bg-white dark:bg-card-dark rounded-full size-20 flex items-center justify-center">
                                            <span className={`text-lg font-bold ${card.textClass}`}>{getProgress(card.value, card.goal)}%</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm font-medium">{card.value >= card.goal ? 'Goal Met!' : 'Keep it up!'}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                            {parseFloat(Math.max(0, card.goal - card.value).toFixed(2))} more needed.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Announcements */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">campaign</span>
                                Chapter Announcements
                            </h2>
                        </div>
                        <div className="flex flex-col bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm divide-y divide-slate-100 dark:divide-slate-800/50">
                            {loading ? (
                                <div className="p-8 text-center text-slate-500 text-sm">Loading announcements...</div>
                            ) : announcements.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 text-sm">
                                    No announcements yet.
                                    {isOfficer && <span> Post one from the Officer Portal.</span>}
                                </div>
                            ) : (
                                announcements.map(item => (
                                    <div key={item._id} className="p-5 flex gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="size-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary font-bold text-sm">
                                            {item.author ? `${item.author.firstName?.[0] || ''}${item.author.lastName?.[0] || ''}` : 'AΦΩ'}
                                        </div>
                                        <div className="flex flex-col flex-1 gap-1">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-sm font-bold">{item.author ? `${item.author.firstName} ${item.author.lastName}` : 'Chapter'}</span>
                                                    {item.author?.position && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-primary dark:text-blue-300 font-medium">{item.author.position}</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-400 whitespace-nowrap">{formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true })}</span>
                                                    {isOfficer && (
                                                        <button onClick={() => deleteAnnouncement(item._id)} className="text-slate-300 hover:text-red-500 transition-colors" title="Delete announcement">
                                                            <span className="material-symbols-outlined text-[16px]">delete</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{item.title}</h4>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{item.body}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Next Event */}
                    <div className="lg:col-span-1 flex flex-col gap-4">
                        <h2 className="text-lg font-bold">Next Event</h2>
                        <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-xl shadow-md overflow-hidden flex flex-col h-full">
                            {nextEvent ? (
                                <>
                                    <div className="h-24 w-full bg-gradient-to-br from-primary to-blue-800 relative">
                                        <div className="absolute bottom-3 left-4">
                                            <span className="px-2 py-1 rounded bg-white/90 text-slate-900 text-xs font-bold uppercase tracking-wide capitalize">{nextEvent.type}</span>
                                        </div>
                                    </div>
                                    <div className="p-5 flex flex-col gap-4 flex-1">
                                        <div>
                                            <h3 className="text-xl font-bold leading-tight">{nextEvent.title}</h3>
                                            <div className="flex items-center gap-2 mt-2 text-slate-500 dark:text-slate-400 text-sm">
                                                <span className="material-symbols-outlined text-[18px]">location_on</span>
                                                <span>{nextEvent.location}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 text-slate-500 dark:text-slate-400 text-sm">
                                                <span className="material-symbols-outlined text-[18px]">schedule</span>
                                                <span>{format(parseISO(nextEvent.start), 'EEE, MMM d · h:mm a')}</span>
                                            </div>
                                        </div>
                                        {countdown && (
                                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 flex justify-around items-center border border-slate-100 dark:border-slate-700">
                                                <div className="flex flex-col items-center"><span className="text-lg font-bold text-primary">{String(countdown.days).padStart(2, '0')}</span><span className="text-[10px] uppercase text-slate-500">Days</span></div>
                                                <div className="text-slate-300 text-xl">:</div>
                                                <div className="flex flex-col items-center"><span className="text-lg font-bold text-primary">{String(countdown.hours).padStart(2, '0')}</span><span className="text-[10px] uppercase text-slate-500">Hrs</span></div>
                                                <div className="text-slate-300 text-xl">:</div>
                                                <div className="flex flex-col items-center"><span className="text-lg font-bold text-primary">{String(countdown.minutes).padStart(2, '0')}</span><span className="text-[10px] uppercase text-slate-500">Mins</span></div>
                                            </div>
                                        )}
                                        <div className="mt-auto">
                                            <Link to="/calendar" className="w-full py-2.5 rounded-lg bg-slate-900 dark:bg-primary text-white text-sm font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                                                <span>RSVP on Calendar</span>
                                                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                            </Link>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="p-8 flex flex-col items-center justify-center text-center gap-3 flex-1">
                                    <span className="material-symbols-outlined text-4xl text-slate-300">event_busy</span>
                                    <p className="text-sm text-slate-500">No upcoming events scheduled.</p>
                                    {isOfficer && (
                                        <Link to="/create-event" className="text-sm font-medium text-primary hover:underline">Create one</Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default MemberDashboard;
