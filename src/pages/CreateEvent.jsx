import { API_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    parseISO,
    isToday
} from 'date-fns';

const CreateEvent = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const dateParam = searchParams.get('date'); // yyyy-MM-dd
    const editId = searchParams.get('edit');

    const [currentDate, setCurrentDate] = useState(dateParam ? parseISO(dateParam) : new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // New Event Form State
    const [newEvent, setNewEvent] = useState({
        title: '',
        start: dateParam ? `${dateParam}T09:00` : format(new Date(), "yyyy-MM-dd'T'09:00"),
        end: dateParam ? `${dateParam}T10:00` : format(new Date(), "yyyy-MM-dd'T'10:00"),
        location: '',
        type: 'meeting',
        description: '',
        image: '',
        creditDistribution: [{ type: 'service', amount: 0 }]
    });

    // Fetch Data
    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'x-auth-token': token };

            // 1. Fetch All Events (for conflicts)
            const resEvents = await fetch(`${API_URL}/api/events`, { headers });
            const dataEvents = await resEvents.json();
            setEvents(dataEvents);

            // 2. If Edit Mode, fetch specific event
            if (editId) {
                const targetEvent = dataEvents.find(e => e._id === editId);
                if (targetEvent) {
                    setNewEvent({
                        title: targetEvent.title,
                        start: targetEvent.start.substring(0, 16), // Format for datetime-local
                        end: targetEvent.end.substring(0, 16),
                        location: targetEvent.location,
                        type: targetEvent.type,
                        description: targetEvent.description || '',
                        image: targetEvent.image || '',
                        creditDistribution: targetEvent.creditDistribution?.length > 0
                            ? targetEvent.creditDistribution
                            : (targetEvent.creditType && targetEvent.creditType !== 'none'
                                ? [{ type: targetEvent.creditType, amount: targetEvent.creditAmount }]
                                : [{ type: 'service', amount: 0 }])
                    });
                    setCurrentDate(parseISO(targetEvent.start));
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [editId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const url = editId
                ? `${API_URL}/api/events/${editId}`
                : `${API_URL}/api/events`;
            const method = editId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(newEvent)
            });
            if (res.ok) {
                navigate('/calendar');
            } else {
                alert(`Failed to ${editId ? 'update' : 'create'} event`);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Calendar Helpers
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const goToToday = () => setCurrentDate(new Date());

    const getTypeColor = (type) => {
        switch (type) {
            case 'fellowship': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'service': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'meeting': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-background-light dark:bg-background-dark">
            {/* Left Panel: Form */}
            <div className="w-full md:w-[400px] flex-shrink-0 border-r border-border-light dark:border-border-dark bg-white dark:bg-surface-dark overflow-y-auto p-6 flex flex-col gap-6">
                <div>
                    <button onClick={() => navigate('/calendar')} className="flex items-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-4 transition-colors">
                        <span className="material-symbols-outlined -ml-1">chevron_left</span>
                        <span className="text-sm font-bold">Back to Calendar</span>
                    </button>
                    <h1 className="text-2xl font-black tracking-tight">{editId ? 'Edit Event' : 'Create Event'}</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{editId ? 'Update event details.' : 'Schedule a new event for the chapter.'}</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-bold mb-1">Title</label>
                        <input required type="text" className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="e.g. Chapter Meeting" />
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-bold mb-1">Start Time</label>
                            <input required type="datetime-local" className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary" value={newEvent.start} onChange={e => {
                                setNewEvent({ ...newEvent, start: e.target.value });
                                setCurrentDate(parseISO(e.target.value));
                            }} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">End Time</label>
                            <input required type="datetime-local" className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary" value={newEvent.end} onChange={e => setNewEvent({ ...newEvent, end: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Type</label>
                        <select className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary" value={newEvent.type} onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}>
                            <option value="meeting">Meeting</option>
                            <option value="service">Service</option>
                            <option value="fellowship">Fellowship</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div className="space-y-3">
                        <label className="block text-sm font-bold">Credits Awarded</label>
                        {newEvent.creditDistribution.map((credit, index) => (
                            <div key={index} className="flex gap-2 items-end">
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold mb-1 text-slate-500">Type</label>
                                    <select
                                        className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                                        value={credit.type}
                                        onChange={e => {
                                            const newDist = [...newEvent.creditDistribution];
                                            newDist[index].type = e.target.value;
                                            setNewEvent({ ...newEvent, creditDistribution: newDist });
                                        }}
                                    >
                                        <option value="service">Service</option>
                                        <option value="fellowship">Fellowship</option>
                                        <option value="leadership">Leadership</option>
                                        <option value="committee">Committee</option>
                                    </select>
                                </div>
                                <div className="w-24">
                                    <label className="block text-xs font-semibold mb-1 text-slate-500">Amount</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                                        value={credit.amount}
                                        onChange={e => {
                                            const newDist = [...newEvent.creditDistribution];
                                            newDist[index].amount = parseFloat(e.target.value);
                                            setNewEvent({ ...newEvent, creditDistribution: newDist });
                                        }}
                                    />
                                </div>
                                {newEvent.creditDistribution.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newDist = newEvent.creditDistribution.filter((_, i) => i !== index);
                                            setNewEvent({ ...newEvent, creditDistribution: newDist });
                                        }}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                        title="Remove credit"
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => {
                                setNewEvent({
                                    ...newEvent,
                                    creditDistribution: [...newEvent.creditDistribution, { type: 'service', amount: 0 }]
                                });
                            }}
                            className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Add Credit Type
                        </button>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Location</label>
                        <input required type="text" className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary" value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} placeholder="e.g. Student Union Room 302" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Description</label>
                        <textarea className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary" rows="4" value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} placeholder="Details about this event..."></textarea>
                    </div>
                    <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-lg shadow-lg hover:bg-primary-hover transition-colors mt-2">
                        Create Event
                    </button>
                </form>
            </div>

            {/* Right Panel: Calendar Preview */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-900/50">
                <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-lg font-bold">Availability Check</h2>
                    <div className="flex items-center bg-white dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark p-0.5 shadow-sm">
                        <button onClick={prevMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-400"><span className="material-symbols-outlined">chevron_left</span></button>
                        <span className="px-3 py-1 text-sm font-semibold text-slate-700 dark:text-slate-200 min-w-[120px] text-center">{format(currentDate, 'MMMM yyyy')}</span>
                        <button onClick={nextMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-400"><span className="material-symbols-outlined">chevron_right</span></button>
                    </div>
                </div>

                <div className="flex-1 p-6 overflow-hidden flex flex-col">
                    <div className="grid grid-cols-7 border-b border-border-light dark:border-border-dark bg-white dark:bg-surface-dark rounded-t-xl">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">{day}</div>
                        ))}
                    </div>
                    <div className="flex-1 grid grid-cols-7 grid-rows-5 bg-slate-200 dark:bg-border-dark gap-px border border-slate-200 dark:border-border-dark rounded-b-xl overflow-hidden shadow-sm">
                        {calendarDays.map((day, i) => {
                            const isCurrentMonth = isSameMonth(day, currentDate);
                            const dayIsToday = isToday(day);
                            const dayEvents = events.filter(e => isSameDay(parseISO(e.start), day));
                            // Check if this is the selected start date
                            const isSelected = isSameDay(parseISO(newEvent.start), day);

                            return (
                                <div key={i} className={`min-h-[60px] p-1.5 transition-colors ${!isCurrentMonth ? 'bg-white dark:bg-surface-dark/40 opacity-50' : (isSelected ? 'bg-primary/10 ring-2 ring-primary ring-inset z-10' : 'bg-white dark:bg-surface-dark')}`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-xs font-medium ${dayIsToday ? 'flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white' : 'text-slate-500'}`}>{format(day, 'd')}</span>
                                    </div>
                                    <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px]">
                                        {dayEvents.map(event => (
                                            <div key={event._id} className={`px-1 rounded text-[10px] font-medium truncate leading-tight ${getTypeColor(event.type)}`} title={event.title}>
                                                {event.title}
                                            </div>
                                        ))}
                                        {isSelected && dayEvents.length === 0 && (
                                            <div className="text-[10px] text-primary font-bold text-center mt-1">New Event</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateEvent;
