import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0-23

const PaintAvailability = () => {
    const { user } = useAuth();
    const [selectedSlots, setSelectedSlots] = useState(new Set());
    const [isDragging, setIsDragging] = useState(false);
    const [isPainting, setIsPainting] = useState(true); // true=select, false=deselect
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        const fetchAvailability = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:5000/api/availability/me', {
                    headers: { 'x-auth-token': token }
                });
                const data = await res.json();
                if (data.slots) {
                    setSelectedSlots(new Set(data.slots));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAvailability();
    }, []);

    const getSlotId = (dayIndex, hour, min) => `${dayIndex}-${hour}-${min}`;

    const handleMouseDown = (dayIndex, hour, min) => {
        setIsDragging(true);
        const slotId = getSlotId(dayIndex, hour, min);
        const willSelect = !selectedSlots.has(slotId);
        setIsPainting(willSelect);
        toggleSlot(slotId, willSelect);
    };

    const handleMouseEnter = (dayIndex, hour, min) => {
        if (!isDragging) return;
        const slotId = getSlotId(dayIndex, hour, min);
        toggleSlot(slotId, isPainting);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const toggleSlot = (slotId, select) => {
        setSelectedSlots(prev => {
            const next = new Set(prev);
            if (select) next.add(slotId);
            else next.delete(slotId);
            return next;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        setMsg('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/availability', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ slots: Array.from(selectedSlots) })
            });
            if (res.ok) {
                setMsg('Availability saved successfully!');
            } else {
                setMsg('Failed to save.');
            }
        } catch (err) {
            console.error(err);
            setMsg('Error saving.');
        } finally {
            setSaving(false);
            setTimeout(() => setMsg(''), 3000);
        }
    };

    if (loading) return <div className="p-10">Loading...</div>;

    return (
        <main className="flex-1 overflow-y-auto p-6" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-black mb-2">My Availability</h1>
                    <p className="text-slate-500">Click and drag to paint your free times.</p>
                </div>

                <div className="flex gap-4 items-center">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Availability'}
                    </button>
                    {msg && <span className="text-green-600 font-medium">{msg}</span>}
                </div>

                <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-x-auto">
                    <div className="min-w-[800px] grid grid-cols-[auto_repeat(7,1fr)]">
                        {/* Header Row */}
                        <div className="p-3 border-b border-r border-slate-100 dark:border-slate-800"></div>
                        {DAYS.map((day, i) => (
                            <div key={day} className="p-3 text-center font-bold text-sm border-b border-slate-100 dark:border-slate-800">
                                {day}
                            </div>
                        ))}

                        {/* Time Rows */}
                        {HOURS.map(hour => (
                            <React.Fragment key={hour}>
                                <div className="p-2 text-xs text-right text-slate-400 border-r border-slate-100 dark:border-slate-800 -mt-2.5 bg-slate-50 dark:bg-slate-900/50 sticky left-0">
                                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                                </div>
                                {DAYS.map((_, dayIndex) => {
                                    // 30 min slots: :00 and :30
                                    const slot1 = getSlotId(dayIndex, hour, 0);
                                    const slot2 = getSlotId(dayIndex, hour, 30);
                                    return (
                                        <div key={`${dayIndex}-${hour}`} className="border-b border-slate-100 dark:border-slate-800 h-10 flex flex-col">
                                            <div
                                                onMouseDown={() => handleMouseDown(dayIndex, hour, 0)}
                                                onMouseEnter={() => handleMouseEnter(dayIndex, hour, 0)}
                                                className={`flex-1 cursor-pointer transition-colors border-b border-dotted border-slate-100 dark:border-slate-800/50 ${selectedSlots.has(slot1) ? 'bg-green-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                            ></div>
                                            <div
                                                onMouseDown={() => handleMouseDown(dayIndex, hour, 30)}
                                                onMouseEnter={() => handleMouseEnter(dayIndex, hour, 30)}
                                                className={`flex-1 cursor-pointer transition-colors ${selectedSlots.has(slot2) ? 'bg-green-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                            ></div>
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
};

export default PaintAvailability;
