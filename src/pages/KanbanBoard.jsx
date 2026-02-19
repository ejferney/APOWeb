import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const KanbanBoard = () => {
    const [tasks, setTasks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', categoryId: '', assignedTo: [], priority: 'Medium', dueDate: '' });
    const [newCategory, setNewCategory] = useState({ name: '', prefix: '' });

    // Fetch Initial Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');

                // Helper to fetch with timeout
                const fetchWithTimeout = (url, options = {}) => {
                    const controller = new AbortController();
                    const id = setTimeout(() => controller.abort(), 8000);
                    return fetch(url, { ...options, signal: controller.signal })
                        .finally(() => clearTimeout(id));
                };

                const [taskRes, catRes, userRes, meRes] = await Promise.all([
                    fetchWithTimeout('http://localhost:5000/api/tasks', { headers: { 'x-auth-token': token } }),
                    fetchWithTimeout('http://localhost:5000/api/categories', { headers: { 'x-auth-token': token } }),
                    fetchWithTimeout('http://localhost:5000/api/users', { headers: { 'x-auth-token': token } }),
                    fetchWithTimeout('http://localhost:5000/api/users/me', { headers: { 'x-auth-token': token } })
                ]);

                if (!taskRes.ok) throw new Error('Failed to fetch tasks');
                if (!catRes.ok) throw new Error('Failed to fetch categories');
                if (!userRes.ok) throw new Error('Failed to fetch users');
                // meRes might fail if token invalid, but we handle that via auth usually

                setTasks(await taskRes.json());
                setCategories(await catRes.json());
                setUsers(await userRes.json());
                if (meRes.ok) setCurrentUser(await meRes.json());
            } catch (err) {
                console.error("Kanban load error:", err);
                setError(err.message || "Failed to load board data.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) return;

        // Optimistic UI Update
        const newStatus = destination.droppableId;
        const updatedTasks = tasks.map(t =>
            t._id === draggableId ? { ...t, status: newStatus } : t
        );
        setTasks(updatedTasks);

        // API Call
        try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:5000/api/tasks/${draggableId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ status: newStatus })
            });
        } catch (err) {
            console.error("Failed to update task status:", err);
            // Revert on failure would go here
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify(newTask)
            });
            if (res.ok) {
                const createdTask = await res.json();
                setTasks([createdTask, ...tasks]);
                setShowTaskModal(false);
                setNewTask({ title: '', description: '', categoryId: '', assignedTo: [], priority: 'Medium', dueDate: '' });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateCategory = async (e) => {
        // ... (existing code)
    };

    const handleSignUp = async (taskId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ assignedTo: [currentUser._id] })
            });
            if (res.ok) {
                const updatedTask = await res.json();
                setTasks(tasks.map(t => t._id === taskId ? updatedTask : t));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const getColumns = () => {
        return {
            'Todo': tasks.filter(t => t.status === 'Todo'),
            'In Progress': tasks.filter(t => t.status === 'In Progress'),
            'Completed': tasks.filter(t => t.status === 'Completed')
        };
    };

    const columns = getColumns();

    if (loading) return (
        <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-950">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-950">
            <div className="text-center p-6 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-red-200">
                <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                >
                    Retry Connection
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <h1 className="text-2xl font-bold">Officer Kanban Board</h1>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowTaskModal(true)}
                        className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
                    >
                        + New Task
                    </button>
                    <button
                        onClick={() => setShowCategoryModal(true)}
                        className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        Manage Categories
                    </button>
                </div>
            </div>

            {/* Modals */}
            {showTaskModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 shadow-xl">
                        <h2 className="text-xl font-bold mb-4">Create New Task</h2>
                        <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                                    value={newTask.title}
                                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Category</label>
                                    <select
                                        required
                                        className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                                        value={newTask.categoryId}
                                        onChange={e => setNewTask({ ...newTask, categoryId: e.target.value })}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(c => <option key={c._id} value={c._id}>{c.name} ({c.prefix})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Priority</label>
                                    <select
                                        className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                                        value={newTask.priority}
                                        onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                                    >
                                        <option>Low</option>
                                        <option>Medium</option>
                                        <option>High</option>
                                        <option>Critical</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Assign To</label>
                                <select
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                                    value={newTask.assignedTo[0] || ''}
                                    onChange={e => setNewTask({ ...newTask, assignedTo: [e.target.value] })}
                                >
                                    <option value="">Unassigned</option>
                                    {users
                                        .filter(u => [
                                            'President', 'VP Service', 'VP Membership', 'VP CoLD',
                                            'Treasurer', 'Marketing Head', 'Secretary',
                                            'Sergeant at Arms', 'Pledge Educator'
                                        ].includes(u.position))
                                        .map(u => (
                                            <option key={u._id} value={u._id}>
                                                {u.firstName} {u.lastName} ({u.position})
                                            </option>
                                        ))
                                    }
                                </select>
                                <p className="text-xs text-slate-500 mt-1">Only Exec members can be assigned.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                                    rows="3"
                                    value={newTask.description}
                                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Due Date</label>
                                <input
                                    type="date"
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                                    value={newTask.dueDate}
                                    onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-2">
                                <button type="button" onClick={() => setShowTaskModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">Create Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showCategoryModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-xl">
                        <h2 className="text-xl font-bold mb-4">New Category</h2>
                        <form onSubmit={handleCreateCategory} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Category Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                                    placeholder="e.g. Social"
                                    value={newCategory.name}
                                    onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Prefix (2-3 Chars)</label>
                                <input
                                    type="text"
                                    required
                                    maxLength="3"
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 uppercase"
                                    placeholder="e.g. SOC"
                                    value={newCategory.prefix}
                                    onChange={e => setNewCategory({ ...newCategory, prefix: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-2">
                                <button type="button" onClick={() => setShowCategoryModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">Create Category</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Board */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex-1 overflow-x-auto p-6">
                    <div className="flex gap-6 h-full min-w-max">
                        {Object.entries(columns).map(([columnId, columnTasks]) => (
                            <div key={columnId} className="w-80 flex flex-col bg-slate-100 dark:bg-slate-900/50 rounded-xl p-3 h-full max-h-full">
                                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-2 flex justify-between">
                                    {columnId}
                                    <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 rounded-full text-xs flex items-center">{columnTasks.length}</span>
                                </h2>
                                <Droppable droppableId={columnId}>
                                    {(provided) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className="flex-1 overflow-y-auto flex flex-col gap-3 min-h-[100px]"
                                        >
                                            {columnTasks.map((task, index) => (
                                                <Draggable key={task._id} draggableId={task._id} index={index}>
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow group cursor-grab active:cursor-grabbing"
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">
                                                                    {task.taskId}
                                                                </span>
                                                                {task.priority === 'Critical' && <span className="w-2 h-2 rounded-full bg-red-500" title="Critical"></span>}
                                                                {task.priority === 'High' && <span className="w-2 h-2 rounded-full bg-orange-500" title="High"></span>}
                                                                {task.priority === 'Medium' && <span className="w-2 h-2 rounded-full bg-blue-500" title="Medium"></span>}
                                                                {task.priority === 'Low' && <span className="w-2 h-2 rounded-full bg-slate-400" title="Low"></span>}
                                                            </div>
                                                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1 leading-snug">{task.title}</h3>
                                                            {task.description && <p className="text-xs text-slate-500 line-clamp-2 mb-3">{task.description}</p>}

                                                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/50 mt-2">
                                                                <div className="flex -space-x-1.5 overflow-hidden">
                                                                    {task.assignedTo.map(u => (
                                                                        <div key={u._id} className="h-6 w-6 rounded-full bg-slate-200 ring-2 ring-white dark:ring-slate-800 flex items-center justify-center text-xs font-bold" title={`${u.firstName} ${u.lastName}`}>
                                                                            {u.firstName?.[0]}{u.lastName?.[0]}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                {task.category && (
                                                                    <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-900 rounded">
                                                                        {task.category.name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {task.dependencies && task.dependencies.length > 0 && (
                                                                <div className="mt-2 text-xs text-red-500 flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-[14px]">link_off</span>
                                                                    Blocked by {task.dependencies.map(d => d.taskId).join(', ')}
                                                                </div>
                                                            )}

                                                            {/* Sign Up Button */}
                                                            {task.assignedTo.length === 0 && currentUser && [
                                                                'President', 'VP Service', 'VP Membership', 'VP CoLD',
                                                                'Treasurer', 'Marketing Head', 'Secretary',
                                                                'Sergeant at Arms', 'Pledge Educator'
                                                            ].includes(currentUser.position) && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation(); // Prevent drag start if possible, though strict mode might intervene
                                                                            handleSignUp(task._id);
                                                                        }}
                                                                        className="mt-3 w-full py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded flex items-center justify-center gap-1 transition-colors"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[14px]">add_circle</span>
                                                                        Sign Up for Task
                                                                    </button>
                                                                )}
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        ))}
                    </div>
                </div>
            </DragDropContext>
        </div>
    );
}

export default KanbanBoard;
