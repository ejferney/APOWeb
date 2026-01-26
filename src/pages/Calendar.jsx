import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
// Removed unneeded router hooks
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

const Calendar = () => {
    const { user } = useAuth();
    const isOfficer = user?.role === 'officer' || user?.role === 'admin';

    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Drawer / Modal State
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [rsvpComment, setRsvpComment] = useState('');

    // Fetch Events
    const fetchEvents = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/events', {
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            setEvents(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    // Calendar Generation
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    // Handlers
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
        <div className="flex-1 flex min-w-0 bg-background-light dark:bg-background-dark h-full overflow-hidden relative">
            <main className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="flex-shrink-0 px-8 py-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-black tracking-tight">{format(currentDate, 'MMMM yyyy')}</h1>
                        <div className="flex items-center bg-white dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark p-0.5 shadow-sm ml-4">
                            <button onClick={prevMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-400"><span className="material-symbols-outlined">chevron_left</span></button>
                            <button onClick={goToToday} className="px-3 py-1 text-sm font-semibold text-slate-700 dark:text-slate-200">Today</button>
                            <button onClick={nextMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-400"><span className="material-symbols-outlined">chevron_right</span></button>
                        </div>
                    </div>
                    {isOfficer && (
                        <button onClick={() => window.location.href = '/create-event'} className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg shadow-sm shadow-primary/20 transition-all active:scale-95">
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            <span className="text-sm font-bold">Create Event</span>
                        </button>
                    )}
                </header>

                <div className="flex-1 px-8 pb-8 overflow-hidden flex flex-col">
                    <div className="grid grid-cols-7 border-b border-border-light dark:border-border-dark bg-white dark:bg-surface-dark rounded-t-xl">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="py-3 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">{day}</div>
                        ))}
                    </div>
                    <div className="flex-1 grid grid-cols-7 grid-rows-5 bg-slate-200 dark:bg-border-dark gap-px border border-slate-200 dark:border-border-dark rounded-b-xl overflow-hidden shadow-sm">
                        {calendarDays.map((day, i) => {
                            const isCurrentMonth = isSameMonth(day, currentDate);
                            const dayIsToday = isToday(day);
                            const dayEvents = events.filter(e => isSameDay(parseISO(e.start), day));

                            return (
                                <div key={i} className={`min-h-[100px] p-2 transition-colors group ${!isCurrentMonth ? 'bg-white dark:bg-surface-dark/40 opacity-50' : (dayIsToday ? 'bg-blue-50/50 dark:bg-blue-900/10 ring-2 ring-primary ring-inset z-10' : 'bg-white dark:bg-surface-dark')}`}>
                                    <div className="flex justify-between items-start">
                                        <span className={`font-medium text-sm ${dayIsToday ? 'flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white font-bold text-xs shadow-md' : 'text-slate-700 dark:text-slate-300'}`}>{format(day, 'd')}</span>
                                    </div>
                                    <div className="flex flex-col gap-1 mt-1">
                                        {dayEvents.map(event => (
                                            <div
                                                key={event._id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedEvent(event);
                                                    setDrawerOpen(true);
                                                }}
                                                className={`flex items-center justify-between gap-1.5 px-2 py-1 rounded border-l-2 text-xs font-semibold cursor-pointer transition-all hover:scale-[1.02] hover:shadow-sm ${getTypeColor(event.type)}`}
                                            >
                                                <div className="flex items-center gap-1.5 truncate">
                                                    <span>{format(parseISO(event.start), 'h:mm a')}</span>
                                                    <span className="truncate">{event.title}</span>
                                                </div>
                                                {event.attendees?.length > 0 && (
                                                    <span className="flex items-center justify-center bg-black/10 dark:bg-white/20 h-4 min-w-[16px] px-1 rounded-full text-[9px] font-bold">
                                                        {event.attendees.length}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            {/* Event Drawer */}
            {drawerOpen && (
                <div className="absolute inset-y-0 right-0 w-[420px] bg-white dark:bg-surface-dark shadow-2xl border-l border-border-light dark:border-border-dark z-50 flex flex-col">
                    <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                        <h2 className="font-bold text-lg">Event Details</h2>
                        <button onClick={() => setDrawerOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><span className="material-symbols-outlined">close</span></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {selectedEvent && (
                            <div className="flex flex-col gap-6">
                                {selectedEvent.image && (
                                    <div className="h-48 w-full bg-cover bg-center rounded-xl" style={{ backgroundImage: `url('${selectedEvent.image}')` }}></div>
                                )}
                                <div className="flex flex-col gap-2">
                                    <span className={`self-start px-2 py-1 rounded text-xs font-bold uppercase ${getTypeColor(selectedEvent.type)}`}>{selectedEvent.type}</span>
                                    <h2 className="text-2xl font-bold">{selectedEvent.title}</h2>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-gray-400">schedule</span>
                                        <div>
                                            <p className="font-bold">{format(parseISO(selectedEvent.start), 'EEEE, MMMM do')}</p>
                                            <p className="text-sm text-gray-500">{format(parseISO(selectedEvent.start), 'h:mm a')} - {format(parseISO(selectedEvent.end), 'h:mm a')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-gray-400">location_on</span>
                                        <p className="font-medium">{selectedEvent.location}</p>
                                    </div>
                                </div>
                                <hr className="dark:border-gray-800" />
                                <div>
                                    <h3 className="font-bold mb-2">About</h3>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{selectedEvent.description || 'No description provided.'}</p>
                                </div>

                                <div className="flex items-center gap-3 mt-4 flex-col items-stretch">
                                    {/* RSVP Comment Input - Only show if not already attending */}
                                    {!selectedEvent.attendees?.some(a => (a.user?._id || a.user) === (user?._id || user?.id)) && (
                                        <div className="w-full">
                                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Add a Note (Optional)</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Arriving at 7pm, Bringing snacks..."
                                                value={rsvpComment}
                                                onChange={(e) => setRsvpComment(e.target.value)}
                                                className="w-full text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            />
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 w-full">
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                try {
                                                    const token = localStorage.getItem('token');
                                                    const res = await fetch(`http://localhost:5000/api/events/${selectedEvent._id}/rsvp`, {
                                                        method: 'POST',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                            'x-auth-token': token
                                                        },
                                                        body: JSON.stringify({ comment: rsvpComment })
                                                    });

                                                    if (res.ok) {
                                                        const updatedAttendees = await res.json();
                                                        // Clear comment after successful join
                                                        setRsvpComment('');

                                                        const updatedEvent = { ...selectedEvent, attendees: updatedAttendees };
                                                        setSelectedEvent(updatedEvent);
                                                        setEvents(prev => prev.map(ev => ev._id === selectedEvent._id ? updatedEvent : ev));
                                                    }
                                                } catch (err) {
                                                    console.error("RSVP Error", err);
                                                }
                                            }}
                                            className={`flex-1 py-3 text-white font-bold rounded-lg shadow-lg transition-colors flex items-center justify-center gap-2 ${selectedEvent.attendees?.some(a => (a.user?._id || a.user) === (user?._id || user?.id))
                                                ? 'bg-emerald-500 hover:bg-emerald-600'
                                                : 'bg-primary hover:bg-primary-hover'
                                                }`}
                                        >
                                            {selectedEvent.attendees?.some(a => (a.user?._id || a.user) === (user?._id || user?.id)) ? (
                                                <>
                                                    <span className="material-symbols-outlined">check_circle</span>
                                                    <span>I'm Going</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined">event_available</span>
                                                    <span>RSVP Now</span>
                                                </>
                                            )}
                                        </button>

                                        <div className="px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-lg font-bold text-slate-600 dark:text-slate-300 min-w-[100px] text-center">
                                            {selectedEvent.attendees?.length || 0} Going
                                        </div>
                                    </div>
                                </div>

                                {/* Attendees List */}
                                {selectedEvent.attendees?.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <h4 className="text-sm font-bold mb-2 text-slate-500 dark:text-slate-400 uppercase tracking-wider">Attendees</h4>
                                        <div className="flex flex-col gap-3">
                                            {selectedEvent.attendees.map((attendee, idx) => {
                                                const attUser = attendee.user || {};
                                                return (
                                                    <div key={idx} className="flex items-start gap-2">
                                                        <div className="h-6 w-6 mt-0.5 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-primary">
                                                            {(attUser.firstName || '?')[0]}{(attUser.lastName || '?')[0]}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium leading-none mt-1">{attUser.firstName || 'Unknown'} {attUser.lastName || 'User'}</span>
                                                            {attendee.comment && (
                                                                <span className="text-xs text-slate-500 dark:text-slate-400 italic mt-0.5">"{attendee.comment}"</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calendar;
