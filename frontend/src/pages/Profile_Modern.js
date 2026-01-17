import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/ModernTheme.css';
import '../pages/Profile_Modern.css';
import { FaUser, FaEnvelope, FaEdit, FaSave, FaTimes, FaCamera, FaKey } from 'react-icons/fa';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    birthday: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You are not logged in. Please log in to view your profile.');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(response.data);
      setFormData({
        name: response.data.name || '',
        email: response.data.email || '',
        birthday: response.data.birthday || '',
      });
      setError('');
    } catch (err) {
      console.error('Profile error:', err);
      if (err.response?.status === 403) {
        setError('Your session has expired. Please log in again.');
        localStorage.clear();
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(err.response?.data?.message || 'Error loading profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.put(
        'http://localhost:5000/api/user/profile',
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setUser(response.data);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.put(
        'http://localhost:5000/api/user/change-password',
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsChangingPassword(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error changing password');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="profile-error">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-wrapper">
        {/* Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            <span className="avatar-text">{user?.name?.[0]?.toUpperCase()}</span>
            <button className="avatar-upload" title="Change avatar">
              <FaCamera />
            </button>
          </div>
          <div className="profile-info">
            <h1>{user?.name}</h1>
            <p className="role-badge">{user?.role?.toUpperCase()}</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setIsEditing(!isEditing)}
          >
            <FaEdit /> {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {/* Alerts */}
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Profile Content */}
        <div className="profile-content">
          {!isEditing ? (
            // View Mode
            <div className="profile-view">
              <div className="info-section">
                <h2>Personal Information</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Full Name</label>
                    <p>{user?.name}</p>
                  </div>
                  <div className="info-item">
                    <label>Email Address</label>
                    <p>{user?.email}</p>
                  </div>
                  <div className="info-item">
                    <label>Birthday</label>
                    <p>{user?.birthday ? new Date(user.birthday).toLocaleDateString() : 'Not set'}</p>
                  </div>
                  <div className="info-item">
                    <label>Role</label>
                    <p className="role-text">{user?.role}</p>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h2>Account Settings</h2>
                <button
                  className="btn btn-secondary"
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                >
                  <FaKey /> Change Password
                </button>
              </div>
            </div>
          ) : (
            // Edit Mode
            <form onSubmit={handleUpdateProfile} className="profile-edit">
              <div className="info-section">
                <h2>Edit Personal Information</h2>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <div className="input-wrapper">
                    <FaUser className="input-icon" />
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="input-wrapper">
                    <FaEnvelope className="input-icon" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="birthday">Birthday</label>
                  <input
                    type="date"
                    id="birthday"
                    name="birthday"
                    value={formData.birthday}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>

                <div className="button-group">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    <FaSave /> Save Changes
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsEditing(false)}
                    disabled={loading}
                  >
                    <FaTimes /> Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Change Password Section */}
          {isChangingPassword && (
            <form onSubmit={handleChangePassword} className="password-form">
              <div className="info-section">
                <h2>Change Password</h2>
                
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    disabled={loading}
                    placeholder="Enter your current password"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    disabled={loading}
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    disabled={loading}
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="button-group">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    <FaSave /> Update Password
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsChangingPassword(false)}
                    disabled={loading}
                  >
                    <FaTimes /> Cancel
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
