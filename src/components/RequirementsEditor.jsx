import { API_URL } from '../config';
import React, { useState, useEffect } from 'react';

const RequirementsEditor = () => {
    const [requirements, setRequirements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        fetchRequirements();
    }, []);

    const fetchRequirements = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/requirements`, {
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            setRequirements(Array.isArray(data) ? data : []);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleInputChange = (type, field, value) => {
        setHasChanges(true);
        setRequirements(prev => prev.map(req => {
            if (req.type === type) {
                return { ...req, [field]: parseFloat(value) || 0 };
            }
            return req;
        }));

        // Handle case where type might not exist in state yet (though properly seeded backend should prevent this)
        const exists = requirements.find(r => r.type === type);
        if (!exists) {
            setRequirements(prev => [...prev, { type, serviceHours: 0, fellowshipHours: 0, leadershipHours: 0, committeeHours: 0, [field]: parseFloat(value) || 0 }]);
        }
    };

    const handleSaveAll = async () => {
        setSaving(true);
        setMessage('');
        try {
            const token = localStorage.getItem('token');
            const promises = requirements.map(req =>
                fetch(`${API_URL}/api/requirements/${req.type}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token
                    },
                    body: JSON.stringify(req)
                })
            );

            await Promise.all(promises);
            setMessage('All requirements updated successfully!');
            setHasChanges(false);
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error(err);
            setMessage('Error updating requirements');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    const sections = ['active', 'associate', 'pledge', 'prospect', 'inactive', 'alumni'];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Membership Requirements</h3>
                <button
                    onClick={handleSaveAll}
                    disabled={!hasChanges || saving}
                    className={`px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-all flex items-center gap-2
                        ${hasChanges && !saving
                            ? 'bg-primary text-white hover:bg-primary-dark shadow-primary/20 transform hover:-translate-y-0.5'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'}`}
                >
                    {saving ? <span className="material-symbols-outlined animate-spin text-[18px]">sync</span> : <span className="material-symbols-outlined text-[18px]">save</span>}
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {message && <div className={`mb-6 p-3 rounded-lg text-sm font-medium ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.map(type => {
                    const req = requirements.find(r => r.type === type) || { serviceHours: 0, fellowshipHours: 0, leadershipHours: 0, committeeHours: 0 };
                    return (
                        <div key={type} className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                            <h4 className="font-bold capitalize text-primary text-lg border-b border-slate-200 dark:border-slate-700 pb-2 mb-2">{type}</h4>

                            <div className="flex flex-col gap-3">
                                <label className="text-sm font-medium flex justify-between items-center text-slate-700 dark:text-slate-300">
                                    Service Hours
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        className="w-24 px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        value={req.serviceHours}
                                        onChange={(e) => handleInputChange(type, 'serviceHours', e.target.value)}
                                    />
                                </label>
                                <label className="text-sm font-medium flex justify-between items-center text-slate-700 dark:text-slate-300">
                                    Fellowship Hours
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        className="w-24 px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        value={req.fellowshipHours}
                                        onChange={(e) => handleInputChange(type, 'fellowshipHours', e.target.value)}
                                    />
                                </label>
                                <label className="text-sm font-medium flex justify-between items-center text-slate-700 dark:text-slate-300">
                                    Leadership Hours
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        className="w-24 px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        value={req.leadershipHours}
                                        onChange={(e) => handleInputChange(type, 'leadershipHours', e.target.value)}
                                    />
                                </label>
                            </div>
                        </div>
                    );
                })}
            </div>
            <p className="text-xs text-slate-400 mt-6 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">info</span>
                <span>Adjust requirements and click "Save Changes" to apply updates globally.</span>
            </p>
        </div>
    );
};

export default RequirementsEditor;
