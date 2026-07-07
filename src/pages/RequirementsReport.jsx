import { API_URL } from '../config';
import React, { useState, useEffect } from 'react';

// Chapter-wide requirement progress: every member vs. their membership type's goals.
// Hours come from User fields, which the server keeps updated on event completion
// and service log approval.

const CATEGORIES = [
    { key: 'serviceHours', label: 'Service' },
    { key: 'fellowshipHours', label: 'Fellowship' },
    { key: 'leadershipHours', label: 'Leadership' },
    { key: 'committeeHours', label: 'Committee' }
];

const RequirementsReport = () => {
    const [users, setUsers] = useState([]);
    const [requirements, setRequirements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('current'); // current | all
    const [sortBy, setSortBy] = useState('risk'); // risk | name | status

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { 'x-auth-token': token };
                const [usersRes, reqRes] = await Promise.all([
                    fetch(`${API_URL}/api/users`, { headers }),
                    fetch(`${API_URL}/api/requirements`, { headers })
                ]);
                if (usersRes.ok) {
                    const data = await usersRes.json();
                    if (Array.isArray(data)) setUsers(data);
                }
                if (reqRes.ok) {
                    const data = await reqRes.json();
                    if (Array.isArray(data)) setRequirements(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Build report rows with per-category progress and an overall risk score
    // (the weakest category percentage — 100 means all goals met).
    const rows = React.useMemo(() => {
        const getRequirement = (membershipType) =>
            requirements.find(r => r.type === (membershipType || 'pledge')) ||
            requirements.find(r => r.type === 'pledge') ||
            { serviceHours: 0, fellowshipHours: 0, leadershipHours: 0, committeeHours: 0 };

        return users.map(u => {
            const req = getRequirement(u.membershipType);
            const cats = CATEGORIES.map(({ key, label }) => {
                const goal = req[key] || 0;
                const value = u[key] || 0;
                const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 100;
                return { key, label, goal, value, pct };
            });
            const tracked = cats.filter(c => c.goal > 0);
            const risk = tracked.length > 0 ? Math.min(...tracked.map(c => c.pct)) : 100;
            const metAll = tracked.every(c => c.value >= c.goal);
            return { user: u, cats, risk, metAll };
        });
    }, [users, requirements]);

    const filtered = React.useMemo(() => {
        let list = rows;
        if (statusFilter === 'current') {
            list = list.filter(r => !['alumni', 'inactive'].includes(r.user.membershipType));
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(r =>
                `${r.user.firstName} ${r.user.lastName}`.toLowerCase().includes(q) ||
                (r.user.email || '').toLowerCase().includes(q) ||
                (r.user.pledgeClass || '').toLowerCase().includes(q)
            );
        }
        const sorted = [...list];
        if (sortBy === 'risk') sorted.sort((a, b) => a.risk - b.risk);
        if (sortBy === 'name') sorted.sort((a, b) => (a.user.lastName || '').localeCompare(b.user.lastName || ''));
        if (sortBy === 'status') sorted.sort((a, b) => (a.user.membershipType || '').localeCompare(b.user.membershipType || ''));
        return sorted;
    }, [rows, search, statusFilter, sortBy]);

    const atRiskCount = filtered.filter(r => r.risk < 50).length;
    const metAllCount = filtered.filter(r => r.metAll).length;

    const exportCSV = () => {
        const header = [
            'Last Name', 'First Name', 'Email', 'Status', 'Pledge Class',
            'Service', 'Service Goal', 'Fellowship', 'Fellowship Goal',
            'Leadership', 'Leadership Goal', 'Committee', 'Committee Goal', 'Met All Requirements'
        ];
        const escape = (v) => {
            const s = String(v ?? '');
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const lines = filtered.map(({ user: u, cats, metAll }) => [
            u.lastName, u.firstName, u.email, u.membershipType || 'pledge', u.pledgeClass || '',
            ...cats.flatMap(c => [c.value, c.goal]),
            metAll ? 'Yes' : 'No'
        ].map(escape).join(','));
        const csv = [header.join(','), ...lines].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `requirements-report-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const pctColor = (pct) =>
        pct >= 100 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600';
    const barColor = (pct) =>
        pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';

    if (loading) return <div className="p-8 text-center text-slate-500">Loading report...</div>;

    return (
        <div className="p-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Requirements Report</h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">Chapter-wide progress toward semester requirements</p>
                    </div>
                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold self-start md:self-auto"
                    >
                        <span className="material-symbols-outlined text-[20px]">download</span>
                        Export CSV
                    </button>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                        <p className="text-sm text-slate-500">Members shown</p>
                        <h3 className="text-2xl font-bold mt-1">{filtered.length}</h3>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                        <p className="text-sm text-slate-500">Met all requirements</p>
                        <h3 className="text-2xl font-bold mt-1 text-green-600">{metAllCount}</h3>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                        <p className="text-sm text-slate-500">At risk (&lt;50% in a category)</p>
                        <h3 className="text-2xl font-bold mt-1 text-red-600">{atRiskCount}</h3>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search name, email, or pledge class..."
                            className="w-full pl-10 rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                    >
                        <option value="current">Current members</option>
                        <option value="all">Everyone (incl. alumni)</option>
                    </select>
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className="rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                    >
                        <option value="risk">Most at-risk first</option>
                        <option value="name">Last name</option>
                        <option value="status">Membership status</option>
                    </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-5 py-3">Member</th>
                                <th className="px-5 py-3">Status</th>
                                {CATEGORIES.map(c => <th key={c.key} className="px-5 py-3">{c.label}</th>)}
                                <th className="px-5 py-3">Overall</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-500">No members match.</td></tr>
                            ) : filtered.map(({ user: u, cats, risk, metAll }) => (
                                <tr key={u._id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${risk < 50 ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                                    <td className="px-5 py-3">
                                        <div className="font-medium text-slate-900 dark:text-white">{u.firstName} {u.lastName}</div>
                                        <div className="text-xs text-slate-500">{u.pledgeClass ? `${u.pledgeClass} · ` : ''}{u.email}</div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${u.membershipType === 'active' ? 'bg-green-100 text-green-700' :
                                            u.membershipType === 'pledge' || !u.membershipType ? 'bg-yellow-100 text-yellow-700' :
                                                u.membershipType === 'associate' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-slate-100 text-slate-700'
                                            }`}>
                                            {u.membershipType || 'pledge'}
                                        </span>
                                    </td>
                                    {cats.map(c => (
                                        <td key={c.key} className="px-5 py-3">
                                            {c.goal > 0 ? (
                                                <div className="min-w-[90px]">
                                                    <div className={`font-medium ${pctColor(c.pct)}`}>
                                                        {parseFloat((c.value || 0).toFixed(1))} / {c.goal}
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-1">
                                                        <div className={`h-1.5 rounded-full ${barColor(c.pct)}`} style={{ width: `${c.pct}%` }}></div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-xs">—</span>
                                            )}
                                        </td>
                                    ))}
                                    <td className="px-5 py-3">
                                        {metAll ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                <span className="material-symbols-outlined text-[14px]">check_circle</span> Complete
                                            </span>
                                        ) : (
                                            <span className={`font-bold ${pctColor(risk)}`}>{risk}%</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RequirementsReport;
