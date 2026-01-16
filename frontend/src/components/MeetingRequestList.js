import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaCheck, FaTimes, FaTrash, FaClock, FaComment, FaEnvelope, FaVideo } from 'react-icons/fa';
import MessagingService from '../services/MessagingService';
import WindowManager from '../services/WindowManager';
import '../styles/MeetingRequest.css';

/**
 * Enhanced component for displaying a list of meeting requests
 * Used by both students and teachers with better messaging integration
 */
const MeetingRequestList = ({ userRole, onStartConversation, onRequestClick }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [statusUpdating, setStatusUpdating] = useState({});

    // Fetch meeting requests
    useEffect(() => {
        const fetchMeetingRequests = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Use the MessagingService for better integration
                const meetingRequests = await MessagingService.getMeetingRequests();
                setRequests(meetingRequests);
            } catch (err) {
                console.error('Error fetching meeting requests:', err);
                setError(err.response?.data?.message || 'Failed to load meeting requests');
            } finally {
                setLoading(false);
            }
        };
        
        fetchMeetingRequests();
    }, [userRole, refreshKey]);
    
    // Update request status (teacher only)
    const handleUpdateStatus = async (requestId, status) => {
        try {
            setStatusUpdating(prev => ({ ...prev, [requestId]: true }));
            
            // Use the MessagingService for status updates
            await MessagingService.updateMeetingRequestStatus(requestId, status);
            
            // Refresh the list
            setRefreshKey(prev => prev + 1);
        } catch (err) {
            console.error(`Error updating meeting request status:`, err);
            alert('Failed to update meeting request status');
        } finally {
            setStatusUpdating(prev => ({ ...prev, [requestId]: false }));
        }
    };
    
    // Cancel request (student only)
    const handleCancelRequest = async (requestId) => {
        try {
            setStatusUpdating(prev => ({ ...prev, [requestId]: true }));
            
            // Use the MessagingService for cancellations
            await MessagingService.cancelMeetingRequest(requestId);
            
            // Refresh the list
            setRefreshKey(prev => prev + 1);
        } catch (err) {
            console.error(`Error cancelling meeting request:`, err);
            alert('Failed to cancel meeting request');
        } finally {
            setStatusUpdating(prev => ({ ...prev, [requestId]: false }));
        }
    };
    
    // Message the participant
    const handleMessageParticipant = async (participantId, name) => {
        try {
            // First, ensure messaging windows are active and others are closed
            WindowManager.openWindow('message');
            
            if (!onStartConversation) {
                // Navigate to messages page with this participant
                const conversation = await MessagingService.startOrGetConversation(participantId);
                window.location.href = `/messages?conversation=${conversation._id}`;
                return;
            }
            
            // Use the callback provided by parent component
            onStartConversation(participantId, name);
        } catch (err) {
            console.error('Error starting conversation:', err);
            alert('Failed to start conversation. Please try again.');
        }
    };
    
    // Format date for display
    const formatDateTime = (dateString) => {
        if (!dateString) return 'No date provided';
        
        const date = new Date(dateString);
        const formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
        
        const formattedTime = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });
        
        return `${formattedDate} at ${formattedTime}`;
    };
    
    // Calculate days/hours until meeting
    const getTimeUntilMeeting = (dateString) => {
        if (!dateString) return '';
        
        const meetingDate = new Date(dateString);
        const now = new Date();
        const diffInMs = meetingDate - now;
        
        if (diffInMs < 0) {
            return 'Past';
        }
        
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        
        if (diffInHours < 24) {
            return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} from now`;
        }
        
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} from now`;
    };
    
    // Get status badge class and text
    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return { className: 'status-pending', text: 'Pending', icon: <FaClock /> };
            case 'accepted':
                return { className: 'status-accepted', text: 'Accepted', icon: <FaCheck /> };
            case 'rejected':
                return { className: 'status-rejected', text: 'Declined', icon: <FaTimes /> };
            case 'cancelled':
                return { className: 'status-cancelled', text: 'Cancelled', icon: <FaTrash /> };
            default:
                return { className: '', text: status, icon: null };
        }
    };
    
    // Generate a Google Meet link (placeholder functionality)
    const getVideoLink = (requestId) => {
        // In a real implementation, this would be a stored or generated link
        return `https://meet.google.com/lookup/${requestId.substring(0, 10)}`;
    };

    // Handle clicking on a meeting request card
    const handleCardClick = (request) => {
        // Notify parent component if provided
        if (onRequestClick) {
            onRequestClick(request);
        }

        // Ensure meeting window is open and other windows are closed
        WindowManager.openWindow('meeting');
    };
    
    if (loading) {
        return <div className="meeting-loading">Loading meeting requests...</div>;
    }
    
    if (error) {
        return <div className="meeting-error">{error}</div>;
    }
    
    if (requests.length === 0) {
        return (
            <div className="no-meeting-requests">
                <FaCalendarAlt size={24} />
                <p>{userRole === 'teacher' ? 'No pending meeting requests from students.' : 'You have not requested any meetings yet.'}</p>
            </div>
        );
    }
    
    return (
        <div className="meeting-request-list">
            <h3>
                <FaCalendarAlt />
                {userRole === 'teacher' ? 'Student Meeting Requests' : 'Your Meeting Requests'}
            </h3>
            
            <div className="meeting-filters">
                <button className="filter-btn active">All</button>
                <button className="filter-btn">Pending</button>
                <button className="filter-btn">Accepted</button>
                <button className="filter-btn">Past</button>
            </div>
            
            <div className="meeting-list">
                {requests.map(request => {
                    const statusBadge = getStatusBadge(request.status);
                    const isStudent = userRole === 'student';
                    const isPending = request.status === 'pending';
                    const isAccepted = request.status === 'accepted';
                    const otherPerson = isStudent ? request.teacher : request.student;
                    const domainName = request.relatedDomain?.name || 'General';
                    const timeUntilMeeting = getTimeUntilMeeting(request.requestedTime);
                    const isUpdateInProgress = statusUpdating[request._id];
                    
                    return (
                        <div 
                            key={request._id} 
                            className={`meeting-request-card ${statusBadge.className}-card`}
                            onClick={() => handleCardClick(request)}
                        >
                            <div className="meeting-header">
                                <h4>{isStudent ? `Meeting with ${otherPerson.name}` : `Request from ${otherPerson.name}`}</h4>
                                <span className={`status-badge ${statusBadge.className}`}>
                                    {statusBadge.icon} {statusBadge.text}
                                </span>
                            </div>
                            
                            <div className="meeting-details">
                                <div className="meeting-time">
                                    <FaCalendarAlt />
                                    <span>{formatDateTime(request.requestedTime)}</span>
                                    {timeUntilMeeting && (
                                        <span className="time-until">({timeUntilMeeting})</span>
                                    )}
                                </div>
                                
                                <div className="meeting-domain">
                                    <span>Topic: {domainName}</span>
                                </div>
                                
                                {request.message && (
                                    <div className="meeting-message">
                                        <FaComment className="message-icon" />
                                        <p>{request.message}</p>
                                    </div>
                                )}
                                
                                {isAccepted && (
                                    <div className="meeting-video-link">
                                        <FaVideo className="video-icon" />
                                        <a 
                                            href={getVideoLink(request._id)} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="video-link"
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent card click
                                            }}
                                        >
                                            Join Video Meeting
                                        </a>
                                        <span className="meeting-link-note">
                                            Link will be active 5 minutes before the scheduled time
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="meeting-actions">
                                {/* Message button for all statuses */}
                                <button
                                    className="message-btn"
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent card click
                                        handleMessageParticipant(otherPerson._id, otherPerson.name);
                                    }}
                                >
                                    <FaEnvelope /> Message {isStudent ? 'Teacher' : 'Student'}
                                </button>
                                
                                {isPending && isStudent && (
                                    <button 
                                        className="cancel-btn"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent card click
                                            handleCancelRequest(request._id);
                                        }}
                                        disabled={isUpdateInProgress}
                                    >
                                        {isUpdateInProgress ? 'Cancelling...' : (
                                            <><FaTrash /> Cancel Request</>
                                        )}
                                    </button>
                                )}
                                
                                {isPending && !isStudent && (
                                    <div className="teacher-action-buttons">
                                        <button 
                                            className="accept-btn"
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent card click
                                                handleUpdateStatus(request._id, 'accepted');
                                            }}
                                            disabled={isUpdateInProgress}
                                        >
                                            {isUpdateInProgress ? 'Processing...' : (
                                                <><FaCheck /> Accept</>
                                            )}
                                        </button>
                                        <button 
                                            className="reject-btn"
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent card click
                                                handleUpdateStatus(request._id, 'rejected');
                                            }}
                                            disabled={isUpdateInProgress}
                                        >
                                            {isUpdateInProgress ? 'Processing...' : (
                                                <><FaTimes /> Decline</>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MeetingRequestList;