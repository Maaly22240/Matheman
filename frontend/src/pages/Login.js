import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Check if user is already logged in
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // Validate token format and expiration
                const payload = JSON.parse(atob(token.split('.')[1]));
                const isExpired = payload.exp < Date.now() / 1000;
                
                if (!isExpired) {
                    // If token is still valid, redirect based on role
                    if (payload.role === 'teacher') {
                        navigate('/dashboard/teacher');
                    } else {
                        navigate('/dashboard/student');
                    }
                } else {
                    // Clear expired token
                    localStorage.removeItem('token');
                }
            } catch (e) {
                // Invalid token format, clear it
                localStorage.removeItem('token');
            }
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            console.log("Attempting login with:", email);
            const response = await axios.post('http://localhost:5000/api/users/login', {
                email,
                password
            });
            
            console.log("Login response:", response.data);

            if (response.data && response.data.token) {
                // Clear any existing data first
                localStorage.clear();
                
                // Store all necessary auth info
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('userRole', response.data.userRole || response.data.user?.role);
                localStorage.setItem('userName', response.data.userName || response.data.user?.name);
                localStorage.setItem('userId', response.data.userId || response.data.user?.id);
                
                // Store email and password for compatibility with current API
                localStorage.setItem('email', email);
                localStorage.setItem('password', password);

                console.log("Stored auth data");
                
                // Use direct URL redirection
                const dashboardPath = response.data.userRole === 'teacher' || 
                                     response.data.user?.role === 'teacher' ? 
                                     '/dashboard/teacher' : '/dashboard/student';
                
                window.location.href = dashboardPath;
            } else {
                setError('Invalid response from server');
                setIsLoading(false);
            }
        } catch (err) {
            console.error('Login error:', err);
            const errorMsg = err.response?.data?.message || 'Login failed. Please try again.';
            setError(errorMsg);
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>Welcome to Mathemann</h2>
                <p className="subtitle">Mathematics Learning Platform</p>
                
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        className="login-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                
                <p className="help-text">
                    Having trouble logging in? Contact support at support@mathemann.org
                </p>
            </div>
        </div>
    );
};

export default Login;