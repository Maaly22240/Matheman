import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './SignUp.css';


const SignUp = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        birthday: '',
        role: 'student', // Default role
    });
    const [feedback, setFeedback] = useState({ success: '', error: '' });
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/users/register', formData);
            setFeedback({ success: 'You have successfully signed up!', error: '' });

            // Redirect to login after a few seconds
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setFeedback({
                success: '',
                error: err.response?.data?.message || 'An error occurred during signup.',
            });
        }
    };

    return (
        <div className="signup-container">
            <h2>Sign Up</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your name"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="birthday">Birthday</label>
                    <input
                        type="date"
                        id="birthday"
                        name="birthday"
                        value={formData.birthday}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="role">Role</label>
                    <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        required
                    >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                    </select>
                </div>
                <button type="submit" className="btn-submit">Sign Up</button>
            </form>
            {feedback.success && <p className="success-message">{feedback.success}</p>}
            {feedback.error && <p className="error-message">{feedback.error}</p>}
        </div>
    );
};

export default SignUp;
