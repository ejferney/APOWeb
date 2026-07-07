import { API_URL } from '../config';

import React, { useState, useEffect } from 'react';

// Sub-component for managing completion details
const CompletionManager = ({ event, onComplete, onClose }) => {
    const [attendees, setAttendees] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initialize attendees with default credit amount
        let defaultCredit = event.creditAmount || 0;
        if (event.creditDistribution && event.creditDistribution.length > 0) {
            defaultCredit = event.creditDistribution.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
        }

        const initialAttendees = (event.attendees || []).map(a => ({
            user: a.user, // full user object
            creditAmount: a.creditAmount !== undefined ? a.creditAmount : defaultCredit,
            comment: a.comment || ''
        }));
        setAttendees(initialAttendees);

        // Fetch all users for adding missing people
        const fetchUsers = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`${API_URL}/api/users`, {
                    headers: { 'x-auth-token': token }
                });
                if (res.ok) {
                    setAllUsers(await res.json());
                }
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        fetchUsers();
    }, [event]);

    const handleCreditChange = (idx, val) => {
        const newAtt = [...attendees];
        newAtt[idx].creditAmount = parseFloat(val);
        setAttendees(newAtt);
    };

    const removeAttendee = (idx) => {
        setAttendees(attendees.filter((_, i) => i !== idx));
    };

    const addAttendee = (user) => {
        // Check duplicate
        if (attendees.some(a => (a.user._id || a.user) === user._id)) return;
        setAttendees([...attendees, { user: user, creditAmount: event.creditAmount || 0, comment: 'Added by Officer' }]);
        setSearchQuery('');
    };

    const handleSubmit = async () => {
        // Confirmation is implicit by clicking the specific "Confirm" button in the modal
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/events/${event._id}/complete`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({
                    attendees: attendees.map(a => ({
                        user: a.user._id || a.user,
                        creditAmount: a.creditAmount,
                        comment: a.comment
                    }))
                })
            });

            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                // If parsing fails, it's likely HTML (404/500 default page)
                console.error("Server returned non-JSON:", text);
                alert(`Server Error: ${res.status} ${res.statusText}\n\n${text.slice(0, 200)}...`);
                return;
            }

            if (res.ok) {
                // IMPROVED FEEDBACK
                alert(`Successfully updated completion for "${event.title}".\nUpdates applied to ${attendees.length} attendees.`);
                onComplete(data);
            } else {
                console.error("Completion Failed", data);
                alert(`Completion failed: ${data.msg || data.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error("Completion Network/Pre-parsing Error", err);
            alert(`Network/Logic error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = allUsers.filter(u =>
        !attendees.some(a => (a.user._id || a.user) === u._id) &&
        (u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || u.lastName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) return <div>Loading...</div>;

    return (
        <div className="flex flex-col gap-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300">
                {event.creditDistribution && event.creditDistribution.length > 0 ? (
                    <div>
                        <p><strong>Multi-Credit Event:</strong> Credits are fixed based on event settings.</p>
                        <div className="flex gap-2 mt-1">
                            {event.creditDistribution.map((c, i) => (
                                <span key={i} className="px-2 py-0.5 bg-white/50 rounded text-xs font-bold capitalize">
                                    {c.type}: {c.amount}
                                </span>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p><strong>Review Attendees:</strong> Adjust credit hours if necessary. Add members who attended but forgot to RSVP.</p>
                )}
            </div>

            {/* Add Person Search ... */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search member to add..."
                    className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && filteredUsers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 shadow-xl rounded-lg border dark:border-gray-700 max-h-[200px] overflow-y-auto z-10">
                        {filteredUsers.map(u => (
                            <button
                                key={u._id}
                                onClick={() => addAttendee(u)}
                                className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between"
                            >
                                <span>{u.firstName} {u.lastName}</span>
                                <span className="material-symbols-outlined text-sm">add</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* List */}
            <div className="space-y-2">
                {attendees.map((att, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {(att.user.firstName || '?')[0]}{(att.user.lastName || '?')[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{att.user.firstName || 'Unknown'} {att.user.lastName}</p>
                            <p className="text-xs text-slate-500 italic truncate">{att.comment || 'No comment'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex flex-col items-end mr-2">
                                {/* Dynamic Distribution Display */}
                                {(() => {
                                    const currentAmount = parseFloat(att.creditAmount);
                                    if (isNaN(currentAmount)) return null;

                                    let dist = event.creditDistribution || [];
                                    if (dist.length === 0 && event.creditType !== 'none') {
                                        // Handle single credit type case if stored differently, 
                                        // or just rely on 'dist' being empty -> no badges (normal behavior for single type is usually handled by backend, 
                                        // but here we are inside the 'if distribution > 0' block logic from previous code? 
                                        // Actually my previous edit removed the condition check and ALWAYS rendered the map if it existed.
                                        // Let's stick to the distribution array.
                                    }

                                    if (dist.length > 0) {
                                        const totalDefault = dist.reduce((acc, c) => acc + c.amount, 0);
                                        const diff = currentAmount - totalDefault;

                                        return dist.map((c, i) => {
                                            // Backend logic: First item gets the adjustment
                                            const adjustedAmount = i === 0 ? c.amount + diff : c.amount;
                                            const isChanged = Math.abs(adjustedAmount - c.amount) > 0.01;

                                            return (
                                                <span key={i} className={`text-[10px] px-1 rounded capitalize ${isChanged
                                                        ? 'bg-blue-100 text-blue-700 font-bold dark:bg-blue-900 dark:text-blue-200'
                                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-700'
                                                    }`}>
                                                    {c.type}: {parseFloat(adjustedAmount.toFixed(2))}
                                                </span>
                                            );
                                        });
                                    }
                                    return null;
                                })()}
                            </div>
                            <label className="text-xs font-bold text-slate-500 hidden sm:block">Credits:</label>
                            <input
                                type="number"
                                step="0.5"
                                className="w-16 p-1 text-center border rounded dark:bg-gray-700 dark:border-gray-600 text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
                                value={att.creditAmount}
                                onChange={(e) => handleCreditChange(idx, e.target.value)}
                            />
                        </div>
                        <button onClick={() => removeAttendee(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                            <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                    </div>
                ))}
                {attendees.length === 0 && <p className="text-center text-slate-400 italic">No attendees yet.</p>}
            </div>

            <div className="pt-4 border-t dark:border-slate-800 flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button onClick={handleSubmit} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg shadow-lg">
                    Confirm & Award Credits
                </button>
            </div>
        </div>
    );
};

export default CompletionManager;
