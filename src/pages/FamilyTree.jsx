import { API_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { buildForest, groupByClan, clanGradient, clanIdOf, initials } from '../utils/family';

// One member box and, recursively, their littles branching below.
const FTreeNode = ({ node, gradient, topMemberId, topLeaderId }) => {
    const { user, children } = node;
    const isTopMember = user._id === topMemberId;
    const isTopLeader = user._id === topLeaderId;
    return (
        <li>
            <div className="relative inline-block">
                {isTopMember && (
                    <span
                        className="absolute -top-2 -right-2 z-10 size-6 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md"
                        title="Top member (most service hours)"
                    >
                        <span className="material-symbols-outlined text-[15px] icon-filled">workspace_premium</span>
                    </span>
                )}
                {isTopLeader && (
                    <span
                        className="absolute -top-2 -left-2 z-10 size-6 rounded-full bg-amber-400 text-white flex items-center justify-center shadow-md"
                        title="Top leadership credits"
                    >
                        <span className="material-symbols-outlined text-[15px] icon-filled">military_tech</span>
                    </span>
                )}
                <div className={`rounded-lg border bg-white dark:bg-slate-900 shadow-sm w-36 overflow-hidden ${isTopMember ? 'border-blue-400 ring-2 ring-blue-300/50' : isTopLeader ? 'border-amber-400 ring-2 ring-amber-300/50' : 'border-slate-200 dark:border-slate-700'}`}>
                    <div className="h-1.5" style={{ background: gradient }} />
                    <div className="p-2 flex flex-col items-center gap-1 text-center">
                        <div className="size-9 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0" style={{ background: gradient }}>
                            {initials(user)}
                        </div>
                        <div className="font-semibold text-xs leading-tight text-slate-900 dark:text-white">
                            {user.firstName} {user.lastName}
                        </div>
                        <div className="text-[10px] text-slate-500 capitalize">
                            {user.membershipType || 'pledge'}
                            {typeof user.serviceHours === 'number' ? ` · ${user.serviceHours} svc` : ''}
                            {typeof user.leadershipHours === 'number' ? ` · ${user.leadershipHours} ldr` : ''}
                        </div>
                    </div>
                </div>
            </div>
            {children.length > 0 && (
                <ul>
                    {children.map(child => (
                        <FTreeNode key={child.user._id} node={child} gradient={gradient} topMemberId={topMemberId} />
                    ))}
                </ul>
            )}
        </li>
    );
};

const FamilyTree = () => {
    const [users, setUsers] = useState([]);
    const [clans, setClans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { 'x-auth-token': token };
                const [uRes, cRes] = await Promise.all([
                    fetch(`${API_URL}/api/users`, { headers }),
                    fetch(`${API_URL}/api/clans`, { headers })
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
        fetchData();
    }, []);

    const groups = React.useMemo(() => groupByClan(users, clans), [users, clans]);

    // Leaderboards. Top members by service and by leadership; top clans by
    // service-per-member and leadership-per-member (no fellowship ranking).
    const board = React.useMemo(() => {
        const topBy = (field) => {
            let best = null;
            users.forEach(u => { if ((u[field] || 0) > (best?.[field] || 0)) best = u; });
            return best && (best[field] || 0) > 0 ? best : null;
        };

        const topClanBy = (field) => {
            let best = null;
            clans.forEach(c => {
                const mems = users.filter(u => clanIdOf(u) === c._id.toString());
                if (mems.length === 0) return;
                const avg = mems.reduce((s, u) => s + (u[field] || 0), 0) / mems.length;
                if (!best || avg > best.avg) best = { clan: c, avg, count: mems.length };
            });
            return best && best.avg > 0 ? best : null;
        };

        return {
            topMember: topBy('serviceHours'),
            topLeader: topBy('leadershipHours'),
            topClan: topClanBy('serviceHours'),
            topLeaderClan: topClanBy('leadershipHours')
        };
    }, [users, clans]);

    const { topMember, topLeader, topClan, topLeaderClan } = board;

    if (loading) return <div className="p-8 text-center text-slate-500">Loading family tree...</div>;

    const nothingSetUp = clans.length === 0 && users.every(u => !u.big);

    return (
        <main className="flex-1 overflow-y-auto">
            <div className="max-w-[1200px] w-full mx-auto p-6 md:p-10 flex flex-col gap-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Family Tree</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Clans, bigs, and littles across the chapter.
                    </p>
                </div>

                {/* Leaderboards */}
                {(topMember || topLeader || topClan || topLeaderClan) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Top service member */}
                        <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5 flex items-center gap-4">
                            <div className="size-12 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined icon-filled">workspace_premium</span>
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Top Member · Service</p>
                                {topMember ? (
                                    <>
                                        <p className="font-bold truncate">{topMember.firstName} {topMember.lastName}</p>
                                        <p className="text-sm text-slate-500">{topMember.serviceHours} service hours</p>
                                    </>
                                ) : <p className="text-sm text-slate-400">No service hours yet</p>}
                            </div>
                        </div>
                        {/* Top leadership member */}
                        <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5 flex items-center gap-4">
                            <div className="size-12 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined icon-filled">military_tech</span>
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Top Member · Leadership</p>
                                {topLeader ? (
                                    <>
                                        <p className="font-bold truncate">{topLeader.firstName} {topLeader.lastName}</p>
                                        <p className="text-sm text-slate-500">{topLeader.leadershipHours} leadership credits</p>
                                    </>
                                ) : <p className="text-sm text-slate-400">No leadership credits yet</p>}
                            </div>
                        </div>
                        {/* Top clan by service */}
                        <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5 flex items-center gap-4">
                            <div className="size-12 rounded-full flex items-center justify-center text-white shrink-0" style={{ background: clanGradient(topClan?.clan) }}>
                                <span className="material-symbols-outlined icon-filled">emoji_events</span>
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Top Clan · Service / member</p>
                                {topClan ? (
                                    <>
                                        <p className="font-bold truncate">{topClan.clan.name}</p>
                                        <p className="text-sm text-slate-500">{topClan.avg.toFixed(1)} hrs per member ({topClan.count})</p>
                                    </>
                                ) : <p className="text-sm text-slate-400">No clan hours yet</p>}
                            </div>
                        </div>
                        {/* Top clan by leadership */}
                        <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5 flex items-center gap-4">
                            <div className="size-12 rounded-full flex items-center justify-center text-white shrink-0" style={{ background: clanGradient(topLeaderClan?.clan) }}>
                                <span className="material-symbols-outlined icon-filled">social_leaderboard</span>
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Top Clan · Leadership / member</p>
                                {topLeaderClan ? (
                                    <>
                                        <p className="font-bold truncate">{topLeaderClan.clan.name}</p>
                                        <p className="text-sm text-slate-500">{topLeaderClan.avg.toFixed(1)} credits per member ({topLeaderClan.count})</p>
                                    </>
                                ) : <p className="text-sm text-slate-400">No leadership credits yet</p>}
                            </div>
                        </div>
                    </div>
                )}

                {nothingSetUp ? (
                    <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center text-slate-500">
                        <span className="material-symbols-outlined text-4xl text-slate-300">account_tree</span>
                        <p className="mt-2">No families set up yet. The Pledge Educator can create clans and assign bigs.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {groups.map((group, gi) => {
                            const gradient = clanGradient(group.clan);
                            const accent = group.clan?.colorPrimary || '#94a3b8';
                            const isTopClan = topClan && group.clan && topClan.clan._id === group.clan._id;
                            const isTopLeaderClan = topLeaderClan && group.clan && topLeaderClan.clan._id === group.clan._id;
                            const { roots } = buildForest(group.users);
                            return (
                                <div key={group.clan?._id || `unassigned-${gi}`} className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                                    <div className="px-5 py-4 flex items-center justify-between text-white" style={{ background: gradient }}>
                                        <h2 className="font-bold text-lg drop-shadow-sm flex items-center gap-2">
                                            {isTopClan && <span className="material-symbols-outlined icon-filled text-[20px]" title="Top clan · service per member">emoji_events</span>}
                                            {isTopLeaderClan && <span className="material-symbols-outlined icon-filled text-[20px]" title="Top clan · leadership per member">social_leaderboard</span>}
                                            {group.clan ? group.clan.name : 'Unassigned'}
                                        </h2>
                                        <span className="text-xs font-medium bg-black/20 px-2 py-1 rounded-full">
                                            {group.users.length} {group.users.length === 1 ? 'member' : 'members'}
                                        </span>
                                    </div>
                                    <div className="p-5 overflow-x-auto">
                                        {roots.length === 0 ? (
                                            <p className="text-sm text-slate-400">No members.</p>
                                        ) : (
                                            <div className="flex flex-wrap justify-center gap-x-10 gap-y-6 min-w-min">
                                                {roots.map(root => (
                                                    <div key={root.user._id} className="ftree" style={{ '--ftree-line': accent }}>
                                                        <ul>
                                                            <FTreeNode node={root} gradient={gradient} topMemberId={topMember?._id} topLeaderId={topLeader?._id} />
                                                        </ul>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
};

export default FamilyTree;
