import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Check for token
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
            setUser(JSON.parse(userData));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const res = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Login failed');

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            navigate(data.user.role === 'officer' ? '/' : '/member-dashboard');
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    const register = async (userData) => {
        try {
            const res = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Registration failed');

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            navigate('/member-dashboard');
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    const refreshUser = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await fetch('http://localhost:5000/api/auth/me', {
                headers: { 'x-auth-token': token }
            });

            if (res.ok) {
                const user = await res.json();
                localStorage.setItem('user', JSON.stringify(user));
                setUser(user);
            }
        } catch (err) {
            console.error("Failed to refresh user:", err);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, refreshUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
