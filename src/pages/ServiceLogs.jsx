import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../context/AuthContext';

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

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'x-auth-token': token };

            // Fetch Event History (Stats are now computed from this)
            const histRes = await fetch('http://localhost:5000/api/events?attended=true&status=completed', { headers });
            const histData = await histRes.json();
            setHistory(histData);
        } catch (err) {
            console.error("Dashboard Fetch Error", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Helper for category colors
    const getCatColor = (type) => {
        switch (type) {
            case 'service': return 'blue';
            case 'fellowship': return 'purple';
            case 'leadership': return 'amber';
            case 'committee': return 'rose';
            default: return 'gray';
        }
    };

    // Compute stats from local history to ensure consistency with table
    const computedStats = React.useMemo(() => {
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

    if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

    return (
        <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
            {/* ...existing header and stats grid... */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight">Service Dashboard</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-base">Track your progress towards semester requirements.</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                    <span>Current Semester</span>
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
