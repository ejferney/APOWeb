import { API_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { clanGradient, clanIdOf } from '../utils/family';

const BLANK_CLAN = { name: '', colorPrimary: '#3b82f6', colorSecondary: '#8b5cf6' };

const FamilyManager = () => {
    const { user } = useAuth();
    const canManage = user?.role === 'admin' || user?.position === 'Pledge Educator' || user?.position === 'President';

    const [users, setUsers] = useState([]);
    const [clans, setClans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [msg, setMsg] = useState(null); // { ok, text }

    // Clan form (create or edit)
    const [clanForm, setClanForm] = useState(BLANK_CLAN);
    const [editingClanId, setEditingClanId] = useState(null);

    const token = localStorage.getItem('token');
    const authHeaders = { 'Content-Type': 'application/json', 'x-auth-token': token };

    const fetchData = async () => {
        try {
            const [uRes, cRes] = await Promise.all([
                fetch(`${API_URL}/api/users`, { headers: { 'x-auth-token': token } }),
                fetch(`${API_URL}/api/clans`, { headers: { 'x-auth-token': token } })
            ]);
            if (uRes.ok) {
                const data = await uRes.json();
                if (Array.isArray(data)) setUsers(data);
            }
            if (cRes.ok) {
                const data = await cRes.json();
                if (Array.isArray(data)) setClans(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const flash = (ok, text) => {
        setMsg({ ok, text });
        setTimeout(() => setMsg(null), 2500);
    };

    const saveClan = async (e) => {
        e.preventDefault();
        if (!clanForm.name.trim()) return;
        try {
            const url = editingClanId ? `${API_URL}/api/clans/${editingClanId}` : `${API_URL}/api/clans`;
            const method = editingClanId ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: authHeaders, body: JSON.stringify(clanForm) });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                flash(true, editingClanId ? 'Clan updated' : 'Clan created');
                setClanForm(BLANK_CLAN);
                setEditingClanId(null);
                fetchData();
            } else {
                flash(false, data.msg || 'Failed to save clan');
            }
        } catch (err) {
            console.error(err);
            flash(false, 'Error occurred');
        }
    };

    const editClan = (clan) => {
        setEditingClanId(clan._id);
        setClanForm({ name: clan.name, colorPrimary: clan.colorPrimary, colorSecondary: clan.colorSecondary });
    };

    const deleteClan = async (clan) => {
        if (!confirm(`Delete clan "${clan.name}"? Members will be unassigned from it.`)) return;
        try {
            const res = await fetch(`${API_URL}/api/clans/${clan._id}`, { method: 'DELETE', headers: { 'x-auth-token': token } });
            if (res.ok) {
                flash(true, 'Clan deleted');
                if (editingClanId === clan._id) { setEditingClanId(null); setClanForm(BLANK_CLAN); }
                fetchData();
            } else {
                flash(false, 'Failed to delete clan');
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Update a member's big or clan. Sends only the changed field.
    const updateFamily = async (userId, body) => {
        try {
            const res = await fetch(`${API_URL}/api/users/${userId}/family`, {
                method: 'PUT', headers: authHeaders, body: JSON.stringify(body)
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                setUsers(prev => prev.map(u => u._id === userId ? data : u));
                flash(true, 'Saved');
            } else {
                flash(false, data.msg || 'Failed to save');
            }
        } catch (err) {
            console.error(err);
            flash(false, 'Error occurred');
        }
    };

    const filtered = users.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase())
    );

    if (!canManage) {
        return (
            <div className="p-10 max-w-xl mx-auto text-center">
                <span className="material-symbols-outlined text-4xl text-slate-300">lock</span>
                <h2 className="text-xl font-bold mt-2">Restricted</h2>
                <p className="text-slate-500 mt-1">Only the Pledge Educator or President can manage clans and family assignments.</p>
            </div>
        );
    }

    if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;

    const inputClass = "w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm";

    return (
        <div className="p-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
            <div className="max-w-6xl mx-auto flex flex-col gap-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Manage Families</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">Create clans and assign each member a big.</p>
                </div>

                {msg && (
                    <div className={`fixed top-6 right-6 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg ${msg.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                        {msg.text}
                    </div>
                )}

                {/* Clans */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <h2 className="text-lg font-bold mb-4">Clans</h2>

                    <form onSubmit={saveClan} className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">Clan name</label>
                            <input type="text" value={clanForm.name} onChange={e => setClanForm({ ...clanForm, name: e.target.value })} placeholder="e.g. House Phoenix" className={inputClass} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Color 1</label>
                            <input type="color" value={clanForm.colorPrimary} onChange={e => setClanForm({ ...clanForm, colorPrimary: e.target.value })} className="h-10 w-16 rounded-lg border border-slate-300 dark:border-slate-700 bg-white cursor-pointer" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Color 2</label>
                            <input type="color" value={clanForm.colorSecondary} onChange={e => setClanForm({ ...clanForm, colorSecondary: e.target.value })} className="h-10 w-16 rounded-lg border border-slate-300 dark:border-slate-700 bg-white cursor-pointer" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Preview</label>
                            <div className="h-10 w-28 rounded-lg shadow-inner" style={{ background: clanGradient(clanForm) }} />
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 text-sm font-bold whitespace-nowrap">
                                {editingClanId ? 'Update' : 'Add Clan'}
                            </button>
                            {editingClanId && (
                                <button type="button" onClick={() => { setEditingClanId(null); setClanForm(BLANK_CLAN); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm">
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>

                    {clans.length === 0 ? (
                        <p className="text-sm text-slate-400">No clans yet.</p>
                    ) : (
                        <div className="flex flex-wrap gap-3">
                            {clans.map(clan => {
                                const count = users.filter(u => clanIdOf(u) === clan._id).length;
                                return (
                                    <div key={clan._id} className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 w-56">
                                        <div className="h-14 flex items-end p-2 text-white font-bold" style={{ background: clanGradient(clan) }}>
                                            <span className="drop-shadow-sm">{clan.name}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-900">
                                            <span className="text-xs text-slate-500">{count} {count === 1 ? 'member' : 'members'}</span>
                                            <div className="flex gap-1">
                                                <button onClick={() => editClan(clan)} className="p-1 text-slate-400 hover:text-primary" title="Edit">
                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                </button>
                                                <button onClick={() => deleteClan(clan)} className="p-1 text-slate-400 hover:text-red-500" title="Delete">
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Member assignments */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <h2 className="text-lg font-bold">Assign Bigs & Clans</h2>
                        <div className="relative w-full sm:w-64">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..." className="w-full pl-10 rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-4 py-3">Member</th>
                                    <th className="px-4 py-3">Big</th>
                                    <th className="px-4 py-3">Clan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filtered.map(u => (
                                    <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="size-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: clanGradient(u.clan) }}>
                                                    {(u.firstName[0] || '') + (u.lastName[0] || '')}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900 dark:text-white">{u.firstName} {u.lastName}</div>
                                                    <div className="text-xs text-slate-500 capitalize">{u.membershipType || 'pledge'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={u.big?._id || u.big || ''}
                                                onChange={e => updateFamily(u._id, { big: e.target.value })}
                                                className="rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm max-w-[180px]"
                                            >
                                                <option value="">— No big —</option>
                                                {users.filter(o => o._id !== u._id).map(o => (
                                                    <option key={o._id} value={o._id}>{o.firstName} {o.lastName}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={clanIdOf(u) || ''}
                                                onChange={e => updateFamily(u._id, { clan: e.target.value })}
                                                className="rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm max-w-[180px]"
                                            >
                                                <option value="">— No clan —</option>
                                                {clans.map(c => (
                                                    <option key={c._id} value={c._id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">No members match.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-xs text-slate-400 mt-3">Assigning a big automatically puts the member in the big's clan. Set a clan directly for clan founders (the tops).</p>
                </div>
            </div>
        </div>
    );
};

export default FamilyManager;
