import { API_URL } from '../config';
import React, { useState, useEffect } from 'react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0-23

const AvailabilityHeatmap = () => {
    const [heatmap, setHeatmap] = useState({});
    const [loading, setLoading] = useState(true);
    const [maxCount, setMaxCount] = useState(0);

    useEffect(() => {
        const fetchHeatmap = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/api/availability/all`, {
                    headers: { 'x-auth-token': token }
                });
                const data = await res.json();
                setHeatmap(data);

                // Find max for scaling opacity
                const max = Math.max(...Object.values(data), 1);
                setMaxCount(max);

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHeatmap();
    }, []);

    const getSlotId = (dayIndex, hour, min) => `${dayIndex}-${hour}-${min}`;

    const getOpacity = (count) => {
        if (!count) return 0.05; // Base opacity
        return Math.min((count / maxCount) * 0.9 + 0.1, 1);
    };

    if (loading) return <div className="p-10">Loading...</div>;

    return (
        <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-black mb-2">Availability Heatmap</h1>
                    <p className="text-slate-500">Aggregate view of member availability.</p>
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
                                    const slot1 = getSlotId(dayIndex, hour, 0);
                                    const slot2 = getSlotId(dayIndex, hour, 30);
                                    const count1 = heatmap[slot1] || 0;
                                    const count2 = heatmap[slot2] || 0;

                                    return (
                                        <div key={`${dayIndex}-${hour}`} className="border-b border-slate-100 dark:border-slate-800 h-10 flex flex-col">
                                            <div
                                                title={`${count1} available`}
                                                className="flex-1 transition-colors border-b border-dotted border-slate-100 dark:border-slate-800/50 relative group"
                                                style={{ backgroundColor: `rgba(16, 185, 129, ${getOpacity(count1)})` }} // Green-500
                                            >
                                                {count1 > 0 && <span className="hidden group-hover:block absolute top-0 left-1/2 -translate-x-1/2 -mt-6 bg-black text-white text-xs px-2 py-1 rounded z-10 pointer-events-none whitespace-nowrap">{count1} Avail</span>}
                                            </div>
                                            <div
                                                title={`${count2} available`}
                                                className="flex-1 transition-colors relative group"
                                                style={{ backgroundColor: `rgba(16, 185, 129, ${getOpacity(count2)})` }}
                                            >
                                                {count2 > 0 && <span className="hidden group-hover:block absolute bottom-0 left-1/2 -translate-x-1/2 mb-6 bg-black text-white text-xs px-2 py-1 rounded z-10 pointer-events-none whitespace-nowrap">{count2} Avail</span>}
                                            </div>
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

export default AvailabilityHeatmap;
