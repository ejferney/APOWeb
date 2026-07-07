import { API_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { computeEventStats, addServiceLogStats } from '../utils/credits';

// ...imports
import CompletionManager from './CompletionManager';

const ServiceLogs = () => {
    const { user } = useAuth();
    const isOfficer = user?.role === 'officer' || user?.role === 'admin';

    // ...existing state
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Self-reported hours state
    const [myLogs, setMyLogs] = useState([]);
    const [showLogModal, setShowLogModal] = useState(false);
    const [logForm, setLogForm] = useState({ category: 'service', hours: '', date: '', description: '', contact: '' });
    const [logMessage, setLogMessage] = useState('');

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'x-auth-token': token };

            // Fetch Event History (Stats are now computed from this)
            const [histRes, logsRes] = await Promise.all([
                fetch(`${API_URL}/api/events?attended=true&status=completed`, { headers }),
                fetch(`${API_URL}/api/service-logs/mine`, { headers })
            ]);
            const histData = await histRes.json();
            setHistory(histData);
            if (logsRes.ok) {
                setMyLogs(await logsRes.json());
            }
        } catch (err) {
            console.error("Dashboard Fetch Error", err);
        } finally {
            setLoading(false);
        }
    };

    const submitLog = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/service-logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify(logForm)
            });
            if (res.ok) {
                setLogMessage('Submitted! An officer will review it.');
                setLogForm({ category: 'service', hours: '', date: '', description: '', contact: '' });
                fetchData();
                setTimeout(() => {
                    setShowLogModal(false);
                    setLogMessage('');
                }, 1500);
            } else {
                const data = await res.json().catch(() => ({}));
                setLogMessage(data.msg || 'Failed to submit.');
            }
        } catch (err) {
            console.error(err);
            setLogMessage('Error occurred.');
        }
    };

    const withdrawLog = async (id) => {
        if (!confirm('Withdraw this submission?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/service-logs/${id}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                setMyLogs(prev => prev.filter(l => l._id !== id));
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Stats = event credits (same logic as backend) + approved self-reported hours
    const userId = user?._id || user?.id;
    const computedStats = React.useMemo(
        () => addServiceLogStats(computeEventStats(history, userId), myLogs),
        [history, myLogs, userId]
    );

    if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

    return (
        <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
            {/* ...existing header and stats grid... */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight">My Credits</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-base">Track your service, fellowship, leadership, and committee credits toward semester requirements.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                        <span>Current Semester</span>
                    </div>
                    <button
                        onClick={() => setShowLogModal(true)}
                        className="flex items-center gap-2 h-10 px-5 rounded-lg bg-primary hover:bg-blue-700 text-white text-sm font-bold shadow-md transition-all"
                    >
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        <span>Log Hours</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Service */}
                <div className="bg-white dark:bg-[#1a2234] rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-between shadow-sm">
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Service Hours</p>
                        <h3 className="mt-2 text-3xl font-bold text-blue-600">{computedStats.serviceHours?.toFixed(1) || 0}</h3>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">Target: 20.0</div>
                </div>
                {/* Fellowship */}
                <div className="bg-white dark:bg-[#1a2234] rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-between shadow-sm">
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Fellowship Hours</p>
                        <h3 className="mt-2 text-3xl font-bold text-purple-600">{computedStats.fellowshipHours?.toFixed(1) || 0}</h3>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">Target: 10.0</div>
                </div>
                {/* Leadership */}
                <div className="bg-white dark:bg-[#1a2234] rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-between shadow-sm">
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Leadership</p>
                        <h3 className="mt-2 text-3xl font-bold text-amber-600">{computedStats.leadershipHours?.toFixed(1) || 0}</h3>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">Credits</div>
                </div>
                {/* Committee */}
                <div className="bg-white dark:bg-[#1a2234] rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-between shadow-sm">
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Committee</p>
                        <h3 className="mt-2 text-3xl font-bold text-rose-600">{computedStats.committeeHours?.toFixed(1) || 0}</h3>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">Credits</div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 bg-white dark:bg-[#1a2234] p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="font-bold text-lg px-2">History</h3>
            </div>

            {/* Table */}
            <div className="w-full overflow-hidden bg-white dark:bg-[#1a2234] rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="overflow-x-auto">
                    {history.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No completed events yet.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Event Name</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Credits</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    {isOfficer && <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {history.map((evt) => {
                                    // Find user's specific record to get actual credits awarded
                                    const userAttendee = evt.attendees?.find(a => {
                                        const aId = a.user?._id || a.user;
                                        const userId = user?._id || user?.id;
                                        return aId && userId && aId.toString() === userId.toString();
                                    });

                                    // Use specific amount if found, otherwise event default
                                    const credits = userAttendee?.creditAmount !== undefined ? userAttendee.creditAmount : evt.creditAmount;

                                    return (
                                        <tr key={evt._id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                {format(parseISO(evt.start), 'MMM d, yyyy')}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{evt.title}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {evt.creditDistribution && evt.creditDistribution.length > 0 ? (
                                                    <div className="flex flex-col gap-1 items-start">
                                                        {(() => {
                                                            const currentAmount = userAttendee?.creditAmount;
                                                            const totalDefault = evt.creditDistribution.reduce((acc, c) => acc + c.amount, 0);
                                                            const diff = currentAmount !== undefined ? currentAmount - totalDefault : 0;

                                                            return evt.creditDistribution.map((c, i) => {
                                                                const adjustedAmount = i === 0 ? c.amount + diff : c.amount;
                                                                // Only bold/highlight if valid override exists and changes value
                                                                const isChanged = diff !== 0 && Math.abs(adjustedAmount - c.amount) > 0.01;

                                                                return (
                                                                    <span key={i} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${c.type === 'service' ? 'bg-blue-100 text-blue-800' :
                                                                        c.type === 'fellowship' ? 'bg-purple-100 text-purple-800' :
                                                                            c.type === 'leadership' ? 'bg-amber-100 text-amber-800' :
                                                                                c.type === 'committee' ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-800'
                                                                        } ${isChanged ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}>
                                                                        {c.type}: {parseFloat(adjustedAmount.toFixed(2))}
                                                                    </span>
                                                                );
                                                            });
                                                        })()}
                                                    </div>
                                                ) : (
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                                    ${evt.creditType === 'service' ? 'bg-blue-100 text-blue-800' :
                                                            evt.creditType === 'fellowship' ? 'bg-purple-100 text-purple-800' :
                                                                evt.creditType === 'leadership' ? 'bg-amber-100 text-amber-800' :
                                                                    evt.creditType === 'committee' ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-800'} 
                                                    capitalize`}>
                                                        {evt.creditType}{userAttendee?.creditAmount !== undefined ? `: ${userAttendee.creditAmount}` : ''}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 font-bold">
                                                {userAttendee?.creditAmount !== undefined ? (
                                                    // Show override with indicator if different from default
                                                    <span>
                                                        {userAttendee.creditAmount}
                                                        {evt.creditDistribution && Math.abs(userAttendee.creditAmount - evt.creditDistribution.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0)) > 0.01 && (
                                                            <span className="ml-1 text-[10px] text-blue-600 font-normal">(Adjusted)</span>
                                                        )}
                                                    </span>
                                                ) : (
                                                    evt.creditDistribution && evt.creditDistribution.length > 0 ? (
                                                        evt.creditDistribution.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0)
                                                    ) : credits
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200`}>
                                                    <span className={`size-1.5 rounded-full bg-emerald-500`}></span>
                                                    Completed
                                                </span>
                                            </td>
                                            {isOfficer && (
                                                <td className="px-6 py-4 text-sm font-medium">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedEvent(evt);
                                                            setShowCompletionModal(true);
                                                        }}
                                                        className="text-primary hover:text-primary-hover font-bold hover:underline"
                                                    >
                                                        Edit
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* My Submissions (self-reported hours) */}
            <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">My Submitted Hours</h3>
                    <span className="text-xs text-gray-400">Approved hours count toward your totals above</span>
                </div>
                <div className="w-full overflow-hidden bg-white dark:bg-[#1a2234] rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    {myLogs.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            Nothing submitted yet. Did service, fellowship, leadership, or committee work outside a chapter event? Click <span className="font-bold">Log Hours</span> to request credit.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hours</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {myLogs.map(log => (
                                        <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                {/* slice to date-only so UTC midnight doesn't shift a day locally */}
                                                {format(parseISO(log.date.slice(0, 10)), 'MMM d, yyyy')}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                {log.description}
                                                {log.status === 'denied' && log.reviewNote && (
                                                    <p className="text-xs text-red-500 mt-1">Reason: {log.reviewNote}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${log.category === 'service' ? 'bg-blue-100 text-blue-800' :
                                                    log.category === 'fellowship' ? 'bg-purple-100 text-purple-800' :
                                                        log.category === 'leadership' ? 'bg-amber-100 text-amber-800' :
                                                            'bg-rose-100 text-rose-800'}`}>
                                                    {log.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-gray-600 dark:text-gray-300">{log.hours}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${log.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                                    log.status === 'denied' ? 'bg-red-100 text-red-800 border-red-200' :
                                                        'bg-amber-100 text-amber-800 border-amber-200'} capitalize`}>
                                                    <span className={`size-1.5 rounded-full ${log.status === 'approved' ? 'bg-emerald-500' : log.status === 'denied' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {log.status === 'pending' && (
                                                    <button onClick={() => withdrawLog(log._id)} className="text-red-500 hover:underline font-medium">
                                                        Withdraw
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Log Hours Modal */}
            {showLogModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1a2234] rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
                        <button onClick={() => setShowLogModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <h3 className="text-xl font-bold mb-1">Request Credit</h3>
                        <p className="text-sm text-gray-500 mb-6">Request service, fellowship, leadership, or committee credit for anything done outside a chapter event. An officer will review before it counts.</p>

                        {logMessage && (
                            <div className={`p-3 rounded-lg mb-4 text-sm font-medium ${logMessage.includes('Submitted') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {logMessage}
                            </div>
                        )}

                        <form onSubmit={submitLog} className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Category</label>
                                    <select
                                        value={logForm.category}
                                        onChange={e => setLogForm({ ...logForm, category: e.target.value })}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                                    >
                                        <option value="service">Service</option>
                                        <option value="fellowship">Fellowship</option>
                                        <option value="leadership">Leadership</option>
                                        <option value="committee">Committee</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Hours</label>
                                    <input
                                        type="number" step="0.25" min="0.25"
                                        value={logForm.hours}
                                        onChange={e => setLogForm({ ...logForm, hours: e.target.value })}
                                        placeholder="e.g. 3"
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Date of service</label>
                                <input
                                    type="date"
                                    value={logForm.date}
                                    onChange={e => setLogForm({ ...logForm, date: e.target.value })}
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">What did you do?</label>
                                <textarea
                                    value={logForm.description}
                                    onChange={e => setLogForm({ ...logForm, description: e.target.value })}
                                    rows={3}
                                    placeholder="e.g. Volunteered at Habitat for Humanity build site"
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Verification contact <span className="text-gray-400 font-normal">(optional)</span></label>
                                <input
                                    type="text"
                                    value={logForm.contact}
                                    onChange={e => setLogForm({ ...logForm, contact: e.target.value })}
                                    placeholder="Name / email of someone who can confirm"
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowLogModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 font-medium">Submit for Review</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage Completion Modal */}
            {showCompletionModal && selectedEvent && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold">Manage Event Completion</h3>
                            <button onClick={() => setShowCompletionModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <CompletionManager
                                event={selectedEvent}
                                onClose={() => setShowCompletionModal(false)}
                                onComplete={(updatedEvent) => {
                                    // Update history list
                                    setHistory(prev => prev.map(ev => ev._id === updatedEvent._id ? updatedEvent : ev));
                                    // Also re-fetch stats because credits changed
                                    fetchData();
                                    setShowCompletionModal(false);
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default ServiceLogs;
