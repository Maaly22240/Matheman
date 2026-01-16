import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCalendarAlt, FaUser, FaComment, FaBookOpen, FaBell, FaTimes } from 'react-icons/fa';
import MessagingService from '../services/MessagingService';
import WindowManager from '../services/WindowManager';
import '../styles/MeetingRequest.css';

/**
 * Enhanced component for requesting a meeting with a teacher
 * Now integrates with messaging system and window management
 */
const MeetingRequestForm = ({ teacher, domains, onRequestSent, onCancel, conversationId = null }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [domainsList, setDomainsList] = useState(domains || []);
    const [formData, setFormData] = useState({
        requestedTime: '',
        message: '',
        relatedDomain: domains?.length > 0 ? domains[0]._id : '',
        notifyInConversation: true
    });

    // If domains weren't provided, fetch them
    useEffect(() => {
        const fetchDomains = async () => {
            if (domains?.length > 0) return;
            
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                
                const response = await axios.get(
                    'http://localhost:5000/api/domains',
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
                
                setDomainsList(response.data);
                
                // Set default domain
                if (response.data.length > 0 && !formData.relatedDomain) {
                    setFormData(prev => ({
                        ...prev,
                        relatedDomain: response.data[0]._id
                    }));
                }
            } catch (err) {
                console.error('Error fetching domains:', err);
            }
        };
        
        fetchDomains();
    }, [domains, formData.relatedDomain]);

    // Ensure meeting window is active when form is mounted
    useEffect(() => {
        WindowManager.openWindow('meeting');
        
        return () => {
            // No need to close the window on unmount as this might be
            // handled by the parent based on specific transitions
        };
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Form validation
        if (!formData.requestedTime) {
            setError('Please select a meeting time');
            return;
        }
        
        try {
            setLoading(true);
            setError(null);
            
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication required. Please log in again.');
                setLoading(false);
                return;
            }
            
            const requestData = {
                teacherId: teacher._id,
                requestedTime: formData.requestedTime,
                message: formData.message,
                relatedDomain: formData.relatedDomain || undefined
            };
            
            // Use messaging service for better integration
            let meetingRequest;
            
            if (conversationId && formData.notifyInConversation) {
                // Create meeting request with conversation notification
                meetingRequest = await MessagingService.createMeetingRequestFromConversation(
                    conversationId,
                    requestData
                );
            } else {
                // Standard meeting request creation
                meetingRequest = await MessagingService.createMeetingRequest(requestData);
            }
            
            setSuccess(true);
            setFormData({
                requestedTime: '',
                message: '',
                relatedDomain: domainsList.length > 0 ? domainsList[0]._id : '',
                notifyInConversation: true
            });
            
            if (onRequestSent) {
                onRequestSent(meetingRequest);
            }
            
            // Close the meeting window
            WindowManager.closeWindow('meeting');
            
            // Reset success message after 3 seconds
            setTimeout(() => {
                setSuccess(false);
            }, 3000);
            
        } catch (err) {
            console.error('Error creating meeting request:', err);
            setError(err.response?.data?.message || 'Failed to create meeting request');
        } finally {
            setLoading(false);
        }
    };
    
    // Handle cancelling the form
    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            // Close the meeting window if no cancel handler provided
            WindowManager.closeWindow('meeting');
        }
    };
    
    // Create date options for the next 14 days, starting tomorrow
    const getDateOptions = () => {
        const options = [];
        const today = new Date();
        
        for (let i = 1; i <= 14; i++) {
            const date = new Date();
            date.setDate(today.getDate() + i);
            
            // Add time slots for this date (9AM, 11AM, 1PM, 3PM)
            [9, 11, 13, 15].forEach(hour => {
                const dateTime = new Date(date);
                dateTime.setHours(hour, 0, 0, 0);
                
                const formattedDate = dateTime.toLocaleDateString('en-US', { 
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric'
                });
                
                const formattedTime = dateTime.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                });
                
                options.push({
                    value: dateTime.toISOString(),
                    label: `${formattedDate} at ${formattedTime}`
                });
            });
        }
        
        return options;
    };
    
    const dateOptions = getDateOptions();
    
    if (!teacher) {
        return <p>Please select a teacher first.</p>;
    }
    
    return (
        <div className="meeting-request-form-container">
            <div className="meeting-form-header">
                <h3>
                    <FaCalendarAlt /> Request Meeting with {teacher.name}
                </h3>
                <button 
                    type="button" 
                    className="close-form-btn"
                    onClick={handleCancel}
                >
                    <FaTimes /> Close
                </button>
            </div>
            
            {success && (
                <div className="meeting-success-message">
                    Meeting request sent successfully! We'll notify you when the teacher responds.
                </div>
            )}
            
            {error && (
                <div className="meeting-error-message">
                    {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="meeting-form">
                <div className="form-group">
                    <label>
                        <FaCalendarAlt /> Preferred Time
                    </label>
                    <select
                        name="requestedTime"
                        value={formData.requestedTime}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className="meeting-select"
                    >
                        <option value="">Select a time</option>
                        {dateOptions.map((option, index) => (
                            <option key={index} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                
                {domainsList.length > 0 && (
                    <div className="form-group">
                        <label>
                            <FaBookOpen /> Related Topic
                        </label>
                        <select
                            name="relatedDomain"
                            value={formData.relatedDomain}
                            onChange={handleChange}
                            disabled={loading}
                            className="meeting-select"
                        >
                            {domainsList.map(domain => (
                                <option key={domain._id} value={domain._id}>
                                    {domain.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                
                <div className="form-group">
                    <label>
                        <FaComment /> Message (optional)
                    </label>
                    <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Let the teacher know what you'd like to discuss..."
                        rows={4}
                        disabled={loading}
                        className="meeting-textarea"
                    />
                </div>
                
                {conversationId && (
                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="notifyInConversation"
                                checked={formData.notifyInConversation}
                                onChange={handleChange}
                                disabled={loading}
                            />
                            <FaBell /> Notify in conversation
                        </label>
                        <p className="form-hint">
                            A notification about this meeting request will be sent in your conversation with the teacher.
                        </p>
                    </div>
                )}
                
                <div className="form-actions">
                    <button 
                        type="button" 
                        className="cancel-meeting-btn"
                        onClick={handleCancel}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="meeting-request-btn"
                        disabled={loading}
                    >
                        {loading ? 'Sending...' : 'Request Meeting'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MeetingRequestForm;