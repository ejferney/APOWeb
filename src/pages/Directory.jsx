import React, { useState, useEffect } from 'react';

import { useAuth } from '../context/AuthContext';

const Directory = () => {
    const { user: currentUser, refreshUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:5000/api/users', {
                    headers: {
                        'x-auth-token': token
                    }
                });
                const data = await res.json();
                if (Array.isArray(data)) {
                    setUsers(data);
                }
            } catch (err) {
                console.error("Error fetching directory:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleUpdateStatus = async (userId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ membershipType: newStatus })
            });

            if (res.ok) {
                setUsers(users.map(u => u._id === userId ? { ...u, membershipType: newStatus } : u));
                // If updating self, refresh auth state
                if (currentUser && (currentUser._id === userId || currentUser.id === userId)) {
                    if (refreshUser) {
                        await refreshUser();
                    } else {
                        window.location.reload();
                    }
                }
            }
        } catch (err) {
            console.error("Error updating status:", err);
        }
    };

    const filteredUsers = users.filter(user =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.role && user.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.pledgeClass && user.pledgeClass.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <main className="flex-1 flex justify-center py-8 px-4 sm:px-6 lg:px-8 overflow-y-auto">
            <div className="max-w-[1280px] w-full flex flex-col gap-6">
                {/* Heading */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-black tracking-tight mb-2">Member Directory</h1>
                            <p className="text-text-secondary dark:text-gray-400 max-w-2xl">Connect with brothers, explore profiles, and build your network within the chapter.</p>
                        </div>
                        {/* Only show invite button for admin/officers if needed, hidden for now based on request */}
                    </div>
                </div>

                {/* Toolbar */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary dark:text-gray-500">search</span>
                        <input
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-lg text-text-main dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-800 transition-all"
                            placeholder="Search by name, major, pledge class..."
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-8 items-start">
                    {/* Filters Sidebar (Static for now) */}
                    <aside className="hidden md:block w-64 shrink-0 space-y-6">
                        <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary dark:text-gray-400 mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">verified_user</span> Status</h3>
                            <div className="space-y-3">
                                {["Active", "Associate", "Pledge", "Prospect", "Inactive", "Alumni"].map(status => (
                                    <label key={status} className="flex items-center gap-3 cursor-pointer group">
                                        <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary/20 dark:bg-gray-800 dark:border-gray-600" />
                                        <span className="text-sm text-text-main dark:text-gray-200 group-hover:text-primary transition-colors">{status}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* Grid */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center p-12 text-gray-500">No members found.</div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredUsers.map((member) => (
                                    <div key={member._id} className="group bg-surface-light dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col items-center shadow-sm hover:shadow-md transition-all hover:border-primary/50 relative overflow-visible">
                                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-900/10 rounded-t-xl"></div>
                                        <div className="relative mb-4 z-10">
                                            <div className="w-24 h-24 rounded-full p-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
                                                <div className="w-full h-full rounded-full bg-cover bg-center bg-gray-200 flex items-center justify-center text-gray-400 text-3xl font-bold"
                                                    style={member.avatar ? { backgroundImage: `url('${member.avatar}')` } : {}}>
                                                    {!member.avatar && (member.firstName[0] + member.lastName[0])}
                                                </div>
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold text-text-main dark:text-white mb-1 group-hover:text-primary transition-colors z-10">{member.firstName} {member.lastName}</h3>
                                        <div className="w-full space-y-2 mb-6 z-10">
                                            <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-gray-400 justify-center">
                                                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                                                <span>{member.gradYear ? `Class of ${member.gradYear}` : (member.pledgeClass || 'Member')}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-gray-400 justify-center">
                                                <span className="material-symbols-outlined text-[18px]">groups</span>
                                                <span className="capitalize">{member.role}</span>
                                            </div>

                                            {/* Membership Type Badge/Editor */}
                                            <div className="flex justify-center mt-2">
                                                {(currentUser?.role === 'officer' || currentUser?.role === 'admin') ? (
                                                    <select
                                                        value={member.membershipType || 'pledge'}
                                                        onChange={(e) => handleUpdateStatus(member._id, e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="px-2 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800 border-none focus:ring-1 focus:ring-primary cursor-pointer capitalize font-semibold text-slate-700 dark:text-slate-300"
                                                    >
                                                        <option value="active">Active</option>
                                                        <option value="associate">Associate</option>
                                                        <option value="pledge">Pledge</option>
                                                        <option value="prospect">Prospect</option>
                                                        <option value="inactive">Inactive</option>
                                                        <option value="alumni">Alumni</option>
                                                    </select>
                                                ) : (
                                                    <span className={`px-2 py-1 text-xs rounded-full capitalize font-semibold
                                                        ${member.membershipType === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                                                        ${member.membershipType === 'associate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                                                        ${member.membershipType === 'prospect' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                                                        ${member.membershipType === 'inactive' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' : ''}
                                                        ${member.membershipType === 'pledge' || !member.membershipType ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : ''}
                                                        ${member.membershipType === 'alumni' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' : ''}
                                                    `}>
                                                        {member.membershipType || 'Pledge'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button className="w-full mt-auto py-2.5 rounded-lg border border-primary text-primary hover:bg-primary hover:text-white font-medium text-sm transition-all flex items-center justify-center gap-2 z-10">View Profile</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
};

export default Directory;
