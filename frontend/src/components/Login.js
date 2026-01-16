import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            console.log("Attempting login...");
            const loginResponse = await axios.post('http://localhost:5000/api/users/login', { email, password });
            console.log("Login response:", loginResponse.data);

            // Save email and password to localStorage
            localStorage.setItem("email", email);
            localStorage.setItem("password", password);

            const role = loginResponse.data.role;

            if (role === 'student') {
                navigate('/dashboard/student');
            } else if (role === 'teacher') {
                navigate('/dashboard/teacher');
            } else {
                setError("Unknown role. Please contact support.");
            }
        } catch (err) {
            console.error("Login error:", err.response?.data || err.message);
            setError(err.response?.data?.message || 'An error occurred. Please try again.');
        }
    };

    return (
        <div className="auth-container">
            <h1>Login</h1>
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="auth-input"
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-input"
                    required
                />
                <button type="submit" className="auth-button">Login</button>
            </form>
            {error && <div className="auth-feedback auth-error">{error}</div>}
        </div>
    );
};

export default Login;
