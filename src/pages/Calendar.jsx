import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CompletionManager from './CompletionManager';
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
    const navigate = useNavigate();
    const isOfficer = user?.role === 'officer' || user?.role === 'admin';

    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Drawer / Modal State
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [rsvpComment, setRsvpComment] = useState('');
    const [isDriver, setIsDriver] = useState(false);
    const [seats, setSeats] = useState(0);
    const [rsvpModalOpen, setRsvpModalOpen] = useState(false);
    const [showCompletionModal, setShowCompletionModal] = useState(false);

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

    const handleRsvpClick = (e) => {
        e.stopPropagation();
        const userId = user?._id || user?.id;
        const attendee = selectedEvent.attendees?.find(a => {
            const aId = a.user?._id || a.user;
            return aId && userId && aId.toString() === userId.toString();
        });

        if (attendee) {
            setRsvpComment(attendee.comment || '');
            setIsDriver(attendee.isDriver || false);
            setSeats(attendee.seats || 0);
        } else {
            setRsvpComment('');
            setIsDriver(false);
            setSeats(0);
        }
        setRsvpModalOpen(true);
    };

    const handleRsvpSubmit = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/events/${selectedEvent._id}/rsvp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({
                    comment: rsvpComment,
                    isDriver,
                    seats: isDriver ? parseInt(seats) : 0
                })
            });

            if (res.ok) {
                const updatedAttendees = await res.json();
                const updatedEvent = { ...selectedEvent, attendees: updatedAttendees };
                setSelectedEvent(updatedEvent);
                setEvents(prev => prev.map(ev => ev._id === selectedEvent._id ? updatedEvent : ev));
                setRsvpModalOpen(false);
            }
        } catch (err) {
            console.error("RSVP Error", err);
        }
    };

    const handleLeaveEvent = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/events/${selectedEvent._id}/rsvp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ leaving: true })
            });

            if (res.ok) {
                const updatedAttendees = await res.json();
                const updatedEvent = { ...selectedEvent, attendees: updatedAttendees };
                setSelectedEvent(updatedEvent);
                setEvents(prev => prev.map(ev => ev._id === selectedEvent._id ? updatedEvent : ev));
                setRsvpModalOpen(false);
            }
        } catch (err) {
            console.error("Leave Error", err);
        }
    };



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
                                <div
                                    key={i}
                                    onClick={() => {
                                        if (isOfficer) {
                                            const dateStr = format(day, 'yyyy-MM-dd');
                                            navigate(`/create-event?date=${dateStr}`);
                                        }
                                    }}
                                    className={`min-h-[100px] p-2 transition-colors group ${!isCurrentMonth ? 'bg-white dark:bg-surface-dark/40 opacity-50' : (dayIsToday ? 'bg-blue-50/50 dark:bg-blue-900/10 ring-2 ring-primary ring-inset z-10' : 'bg-white dark:bg-surface-dark')} ${isOfficer ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50' : ''}`}
                                >
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
                                                    {event.status === 'completed' && (
                                                        <span className="material-symbols-outlined text-[10px] text-emerald-600 font-bold ml-1" title="Completed">check_circle</span>
                                                    )}
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

                                {isOfficer && (
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Officer Controls:</span>
                                        <div className="flex items-center gap-2 ml-auto">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/create-event?edit=${selectedEvent._id}`);
                                                }}
                                                className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs font-bold transition-colors"
                                            >
                                                Edit Event
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowCompletionModal(true);
                                                }}
                                                className="px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded text-xs font-bold transition-colors"
                                            >
                                                {selectedEvent.status === 'completed' ? 'Edit Completion' : 'Manage Completion'}
                                            </button>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    // User requested to remove alerts. 
                                                    // Ideally we'd have a UI popover "Click again to confirm", but for now executing immediately.
                                                    try {
                                                        const token = localStorage.getItem('token');
                                                        const res = await fetch(`http://localhost:5000/api/events/${selectedEvent._id}`, {
                                                            method: 'DELETE',
                                                            headers: { 'x-auth-token': token }
                                                        });
                                                        if (res.ok) {
                                                            setDrawerOpen(false);
                                                            fetchEvents();
                                                        }
                                                    } catch (err) {
                                                        console.error("Delete Error", err);
                                                    }
                                                }}
                                                className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs font-bold transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {selectedEvent.status === 'completed' ? (
                                    <div className="w-full py-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex flex-col items-center justify-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-center">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined">check_circle</span>
                                            <span>Event Completed</span>
                                        </div>
                                        {selectedEvent.completedBy && (
                                            <span className="text-xs font-normal opacity-80">
                                                Verified by {selectedEvent.completedBy.firstName} {selectedEvent.completedBy.lastName}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 mt-4 flex-col items-stretch">
                                        <div className="w-full">
                                            <button
                                                onClick={handleRsvpClick}
                                                className={`w-full py-3 text-white font-bold rounded-lg shadow-lg transition-colors flex items-center justify-center gap-2 ${selectedEvent.attendees?.some(a => {
                                                    const aId = a.user?._id || a.user;
                                                    const uId = user?._id || user?.id;
                                                    return aId && uId && aId.toString() === uId.toString();
                                                })
                                                    ? 'bg-emerald-500 hover:bg-emerald-600'
                                                    : 'bg-primary hover:bg-primary-hover'
                                                    }`}
                                            >
                                                {selectedEvent.attendees?.some(a => {
                                                    const aId = a.user?._id || a.user;
                                                    const uId = user?._id || user?.id;
                                                    return aId && uId && aId.toString() === uId.toString();
                                                }) ? (
                                                    <>
                                                        <span className="material-symbols-outlined">check_circle</span>
                                                        <span>I'm Going (Edit)</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="material-symbols-outlined">event_available</span>
                                                        <span>RSVP Now</span>
                                                    </>
                                                )}
                                            </button>

                                            <div className="mt-2 text-center text-sm font-medium text-slate-500">
                                                {selectedEvent.attendees?.length || 0} People Going
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Attendees List */}
                                <div className="mt-6">
                                    {selectedEvent.attendees?.length > 0 && (
                                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <h4 className="text-sm font-bold mb-2 text-slate-500 dark:text-slate-400 uppercase tracking-wider">Attendees</h4>
                                            <div className="flex flex-col gap-3">
                                                {selectedEvent.attendees.map((attendee, idx) => {
                                                    const attUser = attendee.user || {};
                                                    return (
                                                        <div key={idx} className="flex items-center gap-2">
                                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-primary">
                                                                {(attUser.firstName || '?')[0]}{(attUser.lastName || '?')[0]}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-medium truncate">{attUser.firstName || 'Unknown'} {attUser.lastName || 'User'}</span>
                                                                    {attendee.isDriver && (
                                                                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold border border-blue-200 flex items-center gap-0.5">
                                                                            <span className="material-symbols-outlined text-[10px]">directions_car</span>
                                                                            {attendee.seats} seats
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {attendee.comment && (
                                                                    <p className="text-xs text-slate-500 dark:text-slate-400 italic truncate">{attendee.comment}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* RSVP Modal */}
            {rsvpModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold mb-1">
                            {selectedEvent.attendees?.some(a => {
                                const aId = a.user?._id || a.user;
                                const uId = user?._id || user?.id;
                                return aId && uId && aId.toString() === uId.toString();
                            }) ? 'Update RSVP' : 'Join Event'}
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">{selectedEvent.title}</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Note / Comment</label>
                                <input
                                    type="text"
                                    placeholder="Optional note..."
                                    className="w-full text-sm px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                    value={rsvpComment}
                                    onChange={(e) => setRsvpComment(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        checked={isDriver}
                                        onChange={(e) => setIsDriver(e.target.checked)}
                                    />
                                    <span className="text-sm font-medium">I can drive others</span>
                                </label>
                            </div>

                            {isDriver && (
                                <div className="slide-down">
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Passenger Seats Available</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        className="w-full text-sm px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                        value={seats}
                                        onChange={(e) => setSeats(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex gap-2 justify-end">
                            {selectedEvent.attendees?.some(a => (a.user?._id || a.user) === (user?._id || user?.id)) && (
                                <button
                                    onClick={handleLeaveEvent}
                                    className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg mr-auto"
                                >
                                    Leave Event
                                </button>
                            )}
                            <button
                                onClick={() => setRsvpModalOpen(false)}
                                className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRsvpSubmit}
                                className="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-sm"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Completion Modal */}
            {showCompletionModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold">Manage Event Completion</h3>
                            <button onClick={() => setShowCompletionModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <CompletionManager
                                event={selectedEvent}
                                onClose={() => setShowCompletionModal(false)}
                                onComplete={(updatedEvent) => {
                                    setSelectedEvent(updatedEvent);
                                    setEvents(prev => prev.map(ev => ev._id === updatedEvent._id ? updatedEvent : ev));
                                    setShowCompletionModal(false);
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
// End of Calendar component
export default Calendar;
