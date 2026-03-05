import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import RequirementsEditor from '../components/RequirementsEditor';

const OfficerDashboard = () => {
    const [showRequirements, setShowRequirements] = useState(false);
    const [memberStats, setMemberStats] = useState({
        active: 0,
        associate: 0,
        pledge: 0,
        total: 0
    });
    const [myTasks, setMyTasks] = useState([]);

    // State for Officer Transition
    const [showTransitionModal, setShowTransitionModal] = useState(false);
    // transitionData will now be a map: { 'President': 'newUserId', 'Treasurer': 'anotherUserId' }
    const [transitionData, setTransitionData] = useState({});
    const [allUsers, setAllUsers] = useState([]);
    const [transitionMessage, setTransitionMessage] = useState('');

    const officerPositions = [
        'President', 'VP Service', 'VP Membership', 'VP CoLD',
        'Treasurer', 'Marketing Head', 'Secretary',
        'Sergeant at Arms', 'Pledge Educator'
    ];

    const handleTransitionClick = async () => {
        setShowTransitionModal(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/users', {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const users = await res.json();
                setAllUsers(users);
            }
        } catch (err) {
            console.error("Failed to fetch users", err);
        }
    };

    const submitTransition = async (e) => {
        e.preventDefault();

        // Convert map to array for backend
        const transitions = Object.entries(transitionData)
            .filter(([_, newUserId]) => newUserId !== '') // Filter out empty selections
            .map(([position, newUserId]) => ({ position, newUserId }));

        if (transitions.length === 0) {
            setTransitionMessage('No changes selected to submit.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/users/transition', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ transitions })
            });

            if (res.ok) {
                const data = await res.json();
                setTransitionMessage(`Successfully updated ${data.results.length} positions!`);
                setTimeout(() => {
                    setShowTransitionModal(false);
                    setTransitionMessage('');
                    setTransitionData({});
                    window.location.reload();
                }, 1500);
            } else {
                setTransitionMessage('Failed to transfer positions.');
            }
        } catch (err) {
            console.error(err);
            setTransitionMessage('Error occurred.');
        }
    };

    const getCurrentOfficer = (position) => {
        const officer = allUsers.find(u => u.position === position);
        return officer ? `${officer.firstName} ${officer.lastName}` : 'Vacant';
    };

    const fetchMyTasks = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/tasks/my-tasks', {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                setMyTasks(await res.json());
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleTaskStatusUpdate = async (taskId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                fetchMyTasks(); // Refresh tasks
            }
        } catch (err) {
            console.error(err);
        }
    };

    React.useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:5000/api/users', {
                    headers: { 'x-auth-token': token }
                });

                if (res.ok) {
                    const users = await res.json();
                    if (Array.isArray(users)) {
                        const active = users.filter(u => u.membershipType === 'active').length;
                        const associate = users.filter(u => u.membershipType === 'associate').length;
                        const pledge = users.filter(u => !u.membershipType || u.membershipType === 'pledge').length; // Default to pledge

                        // Calculate total service hours
                        const totalServiceHours = users.reduce((acc, user) => acc + (user.serviceHours || 0), 0);

                        setMemberStats({
                            active,
                            associate,
                            pledge,
                            total: active + associate + pledge,
                            totalServiceHours
                        });
                    }
                }
            } catch (err) {
                console.error("Error fetching users:", err);
            }
        };

        fetchUsers();
        fetchMyTasks();
    }, []);

    // State for Manage Users
    const [showManageUsersModal, setShowManageUsersModal] = useState(false);
    const [manageTab, setManageTab] = useState('pledge'); // 'pledge' or 'active'
    const [selectedUsers, setSelectedUsers] = useState([]);

    const handleManageUsersClick = async () => {
        setShowManageUsersModal(true);
        // Ensure we have users
        if (allUsers.length === 0) {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:5000/api/users', {
                    headers: { 'x-auth-token': token }
                });
                if (res.ok) setAllUsers(await res.json());
            } catch (err) {
                console.error("Failed to fetch users", err);
            }
        }
    };

    const handleBulkUpdate = async (newStatus) => {
        if (!confirm(`Are you sure you want to move ${selectedUsers.length} users to ${newStatus}?`)) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/users/status-bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ userIds: selectedUsers, membershipType: newStatus })
            });

            if (res.ok) {
                alert('Users updated successfully!');
                setSelectedUsers([]);
                // Refresh users
                const userRes = await fetch('http://localhost:5000/api/users', { headers: { 'x-auth-token': token } });
                if (userRes.ok) setAllUsers(await userRes.json());
                window.location.reload();
            } else {
                alert('Failed to update users.');
            }
        } catch (err) {
            console.error(err);
            alert('Error occurred.');
        }
    };

    return (
        <div className="p-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Officer Dashboard</h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">Manage chapter operations and requirements</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowRequirements(!showRequirements)}
                            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${showRequirements ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">list_alt</span>
                            {showRequirements ? 'Hide Requirements' : 'Manage Requirements'}
                        </button>
                        <button
                            onClick={handleTransitionClick}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
                            Transition Officers
                        </button>
                    </div>
                </div>

                {showRequirements && <RequirementsEditor />}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Total Members</p>
                                <h3 className="text-2xl font-bold mt-1">
                                    {memberStats.total}
                                </h3>
                            </div>
                            <span className="p-3 bg-blue-50 text-blue-600 rounded-full">
                                <span className="material-symbols-outlined">group</span>
                            </span>
                        </div>
                        <div className="flex gap-2 text-xs text-slate-500 mt-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span>{memberStats.active} Active</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <span>{memberStats.associate} Assoc</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                <span>{memberStats.pledge} Pledge</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Service Hours</p>
                                <h3 className="text-2xl font-bold mt-1">
                                    {memberStats.totalServiceHours !== undefined ? memberStats.totalServiceHours.toLocaleString() : '0'}
                                </h3>
                            </div>
                            <span className="p-3 bg-green-50 text-green-600 rounded-full">
                                <span className="material-symbols-outlined">volunteer_activism</span>
                            </span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Pending Issues</p>
                                <h3 className="text-2xl font-bold mt-1">5</h3>
                            </div>
                            <span className="p-3 bg-orange-50 text-orange-600 rounded-full">
                                <span className="material-symbols-outlined">warning</span>
                            </span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Upcoming Events</p>
                                <h3 className="text-2xl font-bold mt-1">8</h3>
                            </div>
                            <span className="p-3 bg-purple-50 text-purple-600 rounded-full">
                                <span className="material-symbols-outlined">event</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Tasks */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* My Tasks Widget */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">assignment_ind</span>
                                    My Tasks
                                </h2>
                                <Link to="/kanban" className="text-sm text-primary hover:underline">View Board</Link>
                            </div>
                            <div className="p-6">
                                {myTasks.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500">
                                        <p>No active tasks assigned to you.</p>
                                        <Link to="/kanban" className="mt-2 inline-block text-sm font-medium text-primary">Find tasks on board</Link>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {myTasks.slice(0, 5).map(task => (
                                            <div key={task._id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${task.priority === 'Critical' ? 'bg-red-500' :
                                                        task.priority === 'High' ? 'bg-orange-500' :
                                                            'bg-blue-500'
                                                        }`} />
                                                    <div>
                                                        <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100">{task.title}</h4>
                                                        <p className="text-xs text-slate-500">{task.category?.prefix}{task.taskId?.slice(-3)} • Due {new Date(task.dueDate).toLocaleDateString()}</p>
                                                        {task.dependencies && task.dependencies.length > 0 && (
                                                            <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-[12px]">link_off</span>
                                                                Blocked by {task.dependencies.map(d => d.taskId).join(', ')}
                                                            </p>
                                                        )}
                                                        {task.blocking && task.blocking.length > 0 && (
                                                            <p className="text-xs text-orange-500 mt-0.5 flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-[12px]">link</span>
                                                                Blocks: {task.blocking.map(b => b.taskId).join(', ')}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <select
                                                    value={task.status}
                                                    onChange={(e) => handleTaskStatusUpdate(task._id, e.target.value)}
                                                    className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1"
                                                >
                                                    <option>Todo</option>
                                                    <option>In Progress</option>
                                                    <option>Completed</option>
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Service Logs */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-green-500">history</span>
                                Recent Activity
                            </h2>
                            {/* Placeholder for logs */}
                            <div className="text-slate-500 text-sm">No recent activity logs found.</div>
                        </div>
                    </div>

                    {/* Right Column - Quick Actions / Requirements */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                            <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
                            <div className="grid grid-cols-2 gap-3">
                                <Link to="/create-event" className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                    <span className="material-symbols-outlined block mb-1 text-blue-500">event</span>
                                    <span className="text-xs font-medium">Create Event</span>
                                </Link>
                                <button className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                    <span className="material-symbols-outlined block mb-1 text-green-500">campaign</span>
                                    <span className="text-xs font-medium">Announcement</span>
                                </button>
                                <button
                                    onClick={handleManageUsersClick}
                                    className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <span className="material-symbols-outlined block mb-1 text-purple-500">group_add</span>
                                    <span className="text-xs font-medium">Manage Users</span>
                                </button>
                                <button className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                    <span className="material-symbols-outlined block mb-1 text-orange-500">download</span>
                                    <span className="text-xs font-medium">Reports</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transition Modal */}
                {showTransitionModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
                            <button
                                onClick={() => setShowTransitionModal(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>

                            <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                                <span className="material-symbols-outlined text-purple-600">swap_horiz</span>
                                Transition Officer Roles
                            </h2>
                            <p className="text-sm text-slate-500 mb-6">Reassign executive positions for the next term.</p>

                            {transitionMessage && (
                                <div className={`p-3 rounded-lg mb-4 text-sm font-medium ${transitionMessage.includes('Success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {transitionMessage}
                                </div>
                            )}

                            <form onSubmit={submitTransition} className="flex flex-col gap-4">
                                <div className="space-y-4">
                                    {officerPositions.map(position => (
                                        <div key={position} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-sm">{position}</h3>
                                                <p className="text-xs text-slate-500">Current: <span className="text-slate-700 dark:text-slate-300 font-medium">{getCurrentOfficer(position)}</span></p>
                                            </div>
                                            <div className="flex-1">
                                                <select
                                                    className="w-full text-sm rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                                                    value={transitionData[position] || ''}
                                                    onChange={e => setTransitionData({ ...transitionData, [position]: e.target.value })}
                                                >
                                                    <option value="">No Change</option>
                                                    {allUsers.map(u => (
                                                        <option key={u._id} value={u._id}>
                                                            {u.firstName} {u.lastName}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                                    <p className="text-xs text-slate-500">Selecting a new officer will remove the position from the current holder.</p>
                                    <div className="flex gap-3">
                                        <button type="button" onClick={() => setShowTransitionModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
                                        <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Save All Changes</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                {/* Manage Users Modal */}
                {showManageUsersModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-xl max-w-4xl w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
                            <button
                                onClick={() => setShowManageUsersModal(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>

                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-purple-600">group_add</span>
                                Manage Membership Status
                            </h2>

                            {/* Tabs */}
                            <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                                <button
                                    onClick={() => { setManageTab('pledge'); setSelectedUsers([]); }}
                                    className={`pb-2 px-4 text-sm font-medium transition-colors ${manageTab === 'pledge' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Pledges
                                </button>
                                <button
                                    onClick={() => { setManageTab('active'); setSelectedUsers([]); }}
                                    className={`pb-2 px-4 text-sm font-medium transition-colors ${manageTab === 'active' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Actives / Associates
                                </button>
                            </div>

                            {/* Toolbar */}
                            <div className="flex justify-between items-center mb-4 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                                <div className="text-sm text-slate-600 dark:text-slate-400">
                                    {selectedUsers.length} users selected
                                </div>
                                <div className="flex gap-2">
                                    {manageTab === 'pledge' ? (
                                        <>
                                            <button
                                                onClick={() => handleBulkUpdate('active')}
                                                disabled={selectedUsers.length === 0}
                                                className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                                Promote to Active
                                            </button>
                                            <button
                                                onClick={() => handleBulkUpdate('prospect')}
                                                disabled={selectedUsers.length === 0}
                                                className="px-3 py-1.5 text-xs bg-slate-600 text-white rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Move to Prospect
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => handleBulkUpdate('alumni')}
                                                disabled={selectedUsers.length === 0}
                                                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Move to Alumni
                                            </button>
                                            <button
                                                onClick={() => handleBulkUpdate('inactive')}
                                                disabled={selectedUsers.length === 0}
                                                className="px-3 py-1.5 text-xs bg-slate-600 text-white rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Move to Inactive
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* User List Table */}
                            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                        <tr>
                                            <th className="p-4 w-4">
                                                <input
                                                    type="checkbox"
                                                    onChange={(e) => {
                                                        const currentList = allUsers.filter(u => manageTab === 'pledge' ? (!u.membershipType || u.membershipType === 'pledge') : (['active', 'associate'].includes(u.membershipType)));
                                                        if (e.target.checked) {
                                                            setSelectedUsers(currentList.map(u => u._id));
                                                        } else {
                                                            setSelectedUsers([]);
                                                        }
                                                    }}
                                                    checked={selectedUsers.length > 0 && selectedUsers.length === allUsers.filter(u => manageTab === 'pledge' ? (!u.membershipType || u.membershipType === 'pledge') : (['active', 'associate'].includes(u.membershipType))).length}
                                                />
                                            </th>
                                            <th className="px-6 py-3">Name</th>
                                            <th className="px-6 py-3">Email</th>
                                            <th className="px-6 py-3">Current Status</th>
                                            <th className="px-6 py-3">Pledge Class</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allUsers
                                            .filter(u => manageTab === 'pledge' ? (!u.membershipType || u.membershipType === 'pledge') : (['active', 'associate'].includes(u.membershipType)))
                                            .map(user => (
                                                <tr key={user._id} className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                    <td className="p-4 w-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedUsers.includes(user._id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedUsers([...selectedUsers, user._id]);
                                                                else setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                                        {user.firstName} {user.lastName}
                                                        {user.position && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{user.position}</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500">{user.email}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${user.membershipType === 'active' ? 'bg-green-100 text-green-700' :
                                                            user.membershipType === 'pledge' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-slate-100 text-slate-700'
                                                            }`}>
                                                            {user.membershipType || 'pledge'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500">{user.pledgeClass || '-'}</td>
                                                </tr>
                                            ))}
                                        {allUsers.filter(u => manageTab === 'pledge' ? (!u.membershipType || u.membershipType === 'pledge') : (['active', 'associate'].includes(u.membershipType))).length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                                    No users found in this category.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default OfficerDashboard;
