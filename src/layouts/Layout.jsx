import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

import { useAuth } from '../context/AuthContext';

const Layout = () => {
    const { user } = useAuth();
    const isOfficer = user?.role === 'officer' || user?.role === 'admin';

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display">
            <Sidebar isOfficer={isOfficer} />
            <Outlet />
        </div>
    );
};

export default Layout;
