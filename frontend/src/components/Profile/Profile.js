import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Profile.css';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                setMessage("You are not logged in. Please log in to view your profile.");
                return;
            }
            
            const response = await axios.get('http://localhost:5000/api/user/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setUser(response.data);
            setFormData({
                name: response.data.name || '',
                email: response.data.email || '',
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            console.error("Profile error:", error);
            if (error.response?.status === 403) {
                setMessage("Your session has expired. Please log in again.");
                localStorage.clear(); // Clear invalid token
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                setMessage(error.response?.data?.message || 'Error fetching profile data');
            }
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put('http://localhost:5000/api/user/profile', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Profile updated successfully');
            setIsEditing(false);
            fetchUserData();
        } catch (error) {
            setMessage(error.response?.data?.message || 'Error updating profile');
        }
    };

    if (!user) return <div>Loading...</div>;

    return (
        <div className="profile-container">
            <div className="profile-header">
                <div className="profile-avatar">
                    {user.name[0].toUpperCase()}
                </div>
                <h2>{user.name}</h2>
                <span className="role-badge">{user.role}</span>
            </div>

            <div className="profile-content">
                {!isEditing ? (
                    <div className="profile-info">
                        <div className="info-group">
                            <label>Name:</label>
                            <p>{user.name}</p>
                        </div>
                        <div className="info-group">
                            <label>Email:</label>
                            <p>{user.email}</p>
                        </div>
                        <div className="info-group">
                            <label>Role:</label>
                            <p>{user.role}</p>
                        </div>
                        <button 
                            className="edit-button"
                            onClick={() => setIsEditing(true)}
                        >
                            Edit Profile
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleUpdate} className="edit-form">
                        <div className="form-group">
                            <label>Name:</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Email:</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Current Password:</label>
                            <input
                                type="password"
                                value={formData.currentPassword}
                                onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>New Password:</label>
                            <input
                                type="password"
                                value={formData.newPassword}
                                onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Confirm Password:</label>
                            <input
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                            />
                        </div>
                        <div className="button-group">
                            <button type="submit" className="save-button">Save Changes</button>
                            <button 
                                type="button" 
                                className="cancel-button"
                                onClick={() => setIsEditing(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
                {message && <div className="message">{message}</div>}
            </div>
        </div>
    );
};

export default Profile;
