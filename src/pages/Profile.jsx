import { API_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { clanGradient, initials } from '../utils/family';

const Profile = () => {
    const { refreshUser } = useAuth();
    const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', pledgeClass: '', gradYear: '' });
    const [profileMsg, setProfileMsg] = useState(null); // { ok, text }
    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
    const [pwMsg, setPwMsg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [me, setMe] = useState(null);
    const [littles, setLittles] = useState([]);

    useEffect(() => {
        const fetchMe = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { 'x-auth-token': token };
                const [meRes, usersRes] = await Promise.all([
                    fetch(`${API_URL}/api/auth/me`, { headers }),
                    fetch(`${API_URL}/api/users`, { headers })
                ]);
                if (meRes.ok) {
                    const data = await meRes.json();
                    setMe(data);
                    setForm({
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        phone: data.phone || '',
                        pledgeClass: data.pledgeClass || '',
                        gradYear: data.gradYear || ''
                    });
                    if (usersRes.ok) {
                        const users = await usersRes.json();
                        if (Array.isArray(users)) {
                            setLittles(users.filter(u => (u.big?._id || u.big) === data._id));
                        }
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchMe();
    }, []);

    const saveProfile = async (e) => {
        e.preventDefault();
        setProfileMsg(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/users/me`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                setProfileMsg({ ok: true, text: 'Profile saved!' });
                if (refreshUser) await refreshUser();
            } else {
                const data = await res.json().catch(() => ({}));
                setProfileMsg({ ok: false, text: data.msg || 'Failed to save profile.' });
            }
        } catch (err) {
            console.error(err);
            setProfileMsg({ ok: false, text: 'Error occurred.' });
        }
    };

    const changePassword = async (e) => {
        e.preventDefault();
        setPwMsg(null);
        if (pwForm.newPassword !== pwForm.confirm) {
            setPwMsg({ ok: false, text: 'New passwords do not match.' });
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/users/me/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                setPwMsg({ ok: true, text: 'Password updated!' });
                setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
            } else {
                setPwMsg({ ok: false, text: data.msg || 'Failed to update password.' });
            }
        } catch (err) {
            console.error(err);
            setPwMsg({ ok: false, text: 'Error occurred.' });
        }
    };

    const inputClass = "w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm";

    if (loading) return <div className="p-8 text-center text-slate-500">Loading profile...</div>;

    return (
        <main className="flex-1 overflow-y-auto">
            <div className="max-w-3xl w-full mx-auto p-6 md:p-10 flex flex-col gap-8">
                {/* Banner + header (gradient uses the member's clan colors) */}
                <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="h-28 w-full relative" style={{ background: clanGradient(me?.clan) }}>
                        {me?.clan && (
                            <span className="absolute top-3 right-4 text-xs font-bold text-white bg-black/25 px-3 py-1 rounded-full backdrop-blur-sm">
                                {me.clan.name}
                            </span>
                        )}
                    </div>
                    <div className="px-6 pb-6">
                        <div
                            className="size-20 rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-white dark:border-card-dark shadow-md -mt-10 mb-3"
                            style={{ background: clanGradient(me?.clan) }}
                        >
                            {me?.firstName?.[0]}{me?.lastName?.[0]}
                        </div>
                        <h1 className="text-2xl font-black tracking-tight">{me?.firstName} {me?.lastName}</h1>
                        <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 dark:text-slate-400 flex-wrap">
                            <span className="capitalize px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-primary dark:text-blue-300 text-xs font-medium">{me?.membershipType || 'pledge'}</span>
                            {me?.position && <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">{me.position}</span>}
                            <span>{me?.email}</span>
                        </div>
                    </div>
                </div>

                {/* Family card */}
                <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">diversity_2</span>
                            My Family
                        </h2>
                        <Link to="/family-tree" className="text-sm text-primary hover:underline">View full tree</Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">My Big</p>
                            {me?.big ? (
                                <div className="flex items-center gap-2">
                                    <div className="size-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: clanGradient(me?.clan) }}>
                                        {initials(me.big)}
                                    </div>
                                    <span className="font-medium text-sm">{me.big.firstName} {me.big.lastName}</span>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400">No big assigned yet.</p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                                My {littles.length === 1 ? 'Little' : 'Littles'}{littles.length > 0 ? ` (${littles.length})` : ''}
                            </p>
                            {littles.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                    {littles.map(l => (
                                        <div key={l._id} className="flex items-center gap-2">
                                            <div className="size-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: clanGradient(l.clan) }}>
                                                {initials(l)}
                                            </div>
                                            <span className="font-medium text-sm">{l.firstName} {l.lastName}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400">No littles yet.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Profile form */}
                <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <h2 className="text-lg font-bold mb-4">Profile Details</h2>
                    {profileMsg && (
                        <div className={`p-3 rounded-lg mb-4 text-sm font-medium ${profileMsg.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {profileMsg.text}
                        </div>
                    )}
                    <form onSubmit={saveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">First name</label>
                            <input type="text" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className={inputClass} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Last name</label>
                            <input type="text" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className={inputClass} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Phone</label>
                            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(555) 555-5555" className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Graduation year</label>
                            <input type="number" min="1950" max="2100" value={form.gradYear} onChange={e => setForm({ ...form, gradYear: e.target.value })} placeholder="e.g. 2027" className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Pledge class</label>
                            <input type="text" value={form.pledgeClass} onChange={e => setForm({ ...form, pledgeClass: e.target.value })} placeholder="e.g. Alpha Beta" className={inputClass} />
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                            <button type="submit" className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 text-sm font-bold">Save Changes</button>
                        </div>
                    </form>
                </div>

                {/* Password form */}
                <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <h2 className="text-lg font-bold mb-4">Change Password</h2>
                    {pwMsg && (
                        <div className={`p-3 rounded-lg mb-4 text-sm font-medium ${pwMsg.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {pwMsg.text}
                        </div>
                    )}
                    <form onSubmit={changePassword} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Current password</label>
                            <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} className={inputClass} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">New password</label>
                            <input type="password" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} minLength={6} className={inputClass} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Confirm new password</label>
                            <input type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} minLength={6} className={inputClass} required />
                        </div>
                        <div className="md:col-span-3 flex justify-end">
                            <button type="submit" className="px-5 py-2 bg-slate-900 dark:bg-primary text-white rounded-lg hover:opacity-90 text-sm font-bold">Update Password</button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
};

export default Profile;
