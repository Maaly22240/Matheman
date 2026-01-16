import React, { useState, useEffect, useRef } from 'react';
import ConversationList from '../components/Messages/ConversationList';
import MessageWindow from '../components/Messages/MessageWindow';
import MeetingRequestForm from '../components/MeetingRequestForm';
import MeetingRequestList from '../components/MeetingRequestList';
import { useNavigate, useLocation } from 'react-router-dom';
import MessagingService from '../services/MessagingService';
import WindowManager from '../services/WindowManager';
import io from 'socket.io-client';
import { FaUsers, FaCalendarAlt, FaComments, FaPlus } from 'react-icons/fa';
import '../styles/Messages.css';

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

const MessagesPage = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [activeTab, setActiveTab] = useState('messages');
    const [availableUsers, setAvailableUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showNewMessageForm, setShowNewMessageForm] = useState(false);
    const [domains, setDomains] = useState([]);
    const socketRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Fetch current user info
    useEffect(() => {
        const fetchUserInfo = () => {
            const userId = localStorage.getItem('userId');
            const userName = localStorage.getItem('userName');
            const userRole = localStorage.getItem('userRole');
            if (userId && userName && userRole) {
                setCurrentUser({ id: userId, name: userName, role: userRole });
            } else {
                console.error("User info not found in local storage");
                navigate('/login');
            }
        };
        fetchUserInfo();
    }, [navigate]);

    // Initialize Socket.IO connection and event listeners
    useEffect(() => {
        if (!currentUser?.id) return;

        // Connect to Socket.IO server
        socketRef.current = io(SOCKET_SERVER_URL, {
            query: { userId: currentUser.id }
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            socket.emit('join', currentUser.id);
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
        });

        socket.on('connect_error', (err) => {
            console.error("Socket connection error:", err);
            setError("Cannot connect to messaging service.");
        });

        // Listen for incoming messages
        socket.on('receiveMessage', (newMessage) => {
            console.log('Received message:', newMessage);
            if (newMessage.conversationId === selectedConversationId) {
                setMessages(prevMessages => [...prevMessages, newMessage]);
            } else {
                setConversations(prevConvs => 
                    prevConvs.map(conv => 
                        conv._id === newMessage.conversationId 
                        ? { ...conv, lastMessage: newMessage, updatedAt: newMessage.createdAt }
                        : conv
                    ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                );
            }
        });

        // Listen for meeting request updates
        socket.on('meetingRequestUpdate', (updatedRequest) => {
            console.log('Meeting request updated:', updatedRequest);
            // Refresh data if on meetings tab
            if (activeTab === 'meetings') {
                setActiveTab('meetings-refresh');
                setTimeout(() => setActiveTab('meetings'), 100);
            }
        });

        // Cleanup on unmount
        return () => {
            console.log("Disconnecting socket...");
            socket.disconnect();
        };
    }, [currentUser, selectedConversationId, activeTab]);

    // Fetch conversations
    useEffect(() => {
        const fetchConversations = async () => {
            if (!currentUser) return;
            
            try {
                setLoadingConversations(true);
                const fetchedConversations = await MessagingService.getConversations();
                setConversations(fetchedConversations);
                setError(null);

                // Check if we need to pre-select a conversation based on navigation state
                const initialRecipientId = location.state?.recipientId;
                if (initialRecipientId && fetchedConversations.length > 0) {
                    const existingConv = fetchedConversations.find(conv => 
                        conv.participants.some(p => p._id === initialRecipientId)
                    );
                    if (existingConv) {
                        setSelectedConversationId(existingConv._id);
                        setActiveTab('messages');
                        // Use WindowManager to open message window
                        WindowManager.openWindow('message');
                    }
                }
                // Clear the location state after using it
                navigate(location.pathname, { replace: true, state: {} });

            } catch (err) {
                console.error('Error fetching conversations:', err);
                setError('Failed to load conversations.');
            } finally {
                setLoadingConversations(false);
            }
        };

        fetchConversations();
    }, [currentUser, navigate, location.state, location.pathname]);

    // Fetch messages when a conversation is selected
    useEffect(() => {
        const fetchMessages = async () => {
            if (!selectedConversationId) return;
            
            try {
                setLoadingMessages(true);
                const messagesData = await MessagingService.getMessages(selectedConversationId);
                setMessages(messagesData);
                setError(null);
                
                // Mark messages as read
                await MessagingService.markAsRead(selectedConversationId);
            } catch (err) {
                console.error('Error fetching messages:', err);
                setError('Failed to load messages.');
                setMessages([]);
            } finally {
                setLoadingMessages(false);
            }
        };

        if (selectedConversationId) {
            fetchMessages();
        }
    }, [selectedConversationId]);
    
    // Fetch available users to message when starting a new conversation
    useEffect(() => {
        const fetchAvailableUsers = async () => {
            if (!currentUser || !showNewMessageForm) return;
            
            try {
                const users = await MessagingService.getAvailableUsers();
                setAvailableUsers(users);
                
                // Also extract domains for meeting requests (for students)
                if (currentUser.role === 'student' && users.length > 0 && users[0].domains) {
                    const allDomains = users.reduce((acc, teacher) => {
                        if (teacher.domains) {
                            teacher.domains.forEach(domainId => {
                                if (!acc.some(d => d._id === domainId)) {
                                    acc.push({ _id: domainId, name: 'Domain ' + domainId.substr(-4) });
                                }
                            });
                        }
                        return acc;
                    }, []);
                    
                    setDomains(allDomains);
                }
            } catch (err) {
                console.error('Error fetching available users:', err);
            }
        };
        
        fetchAvailableUsers();
    }, [currentUser, showNewMessageForm]);

    const handleSelectConversation = (conversationId) => {
        setSelectedConversationId(conversationId);
        setShowNewMessageForm(false);
        // Use WindowManager to ensure only message window is open
        WindowManager.openWindow('message');
    };

    const handleSendMessage = async (recipientId, content) => {
        try {
            // If we don't have a conversation yet, create one first
            let conversationId = selectedConversationId;
            
            if (!conversationId) {
                const newConversation = await MessagingService.startOrGetConversation(recipientId);
                conversationId = newConversation._id;
                setSelectedConversationId(conversationId);
                
                // Add this new conversation to our list
                if (!conversations.some(c => c._id === conversationId)) {
                    setConversations(prevConvs => [newConversation, ...prevConvs]);
                }
            }
            
            // Now send the message
            const sentMessage = await MessagingService.sendMessage(recipientId, content);
            
            // Update local state
            setMessages(prevMessages => [...prevMessages, sentMessage]);

            // Update conversation list with the new last message
            setConversations(prevConvs => 
                prevConvs.map(conv => 
                    conv._id === sentMessage.conversationId 
                    ? { ...conv, lastMessage: sentMessage, updatedAt: sentMessage.createdAt }
                    : conv
                ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            );

        } catch (err) {
            console.error('Error sending message:', err);
            setError('Failed to send message.');
        }
    };
    
    const handleStartNewConversation = () => {
        setSelectedConversationId(null);
        setMessages([]);
        setSelectedUser(null);
        setShowNewMessageForm(true);
        // Use WindowManager to ensure only message composition window is open
        WindowManager.openWindow('message');
    };
    
    const handleSelectUserForNewMessage = (user) => {
        setSelectedUser(user);
    };
    
    const handleRequestSent = () => {
        // Switch to the meetings tab after sending a request
        setActiveTab('meetings');
        setShowNewMessageForm(false);
        // Close all windows after request is sent
        WindowManager.closeAllWindows();
    };

    // Handle tab change
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        
        if (tab === 'messages') {
            // If there's a selected conversation, open message window
            if (selectedConversationId) {
                WindowManager.openWindow('message');
            } else {
                WindowManager.closeAllWindows();
            }
        } else if (tab === 'meetings') {
            // Close all windows when switching to meetings tab
            setShowNewMessageForm(false);
            WindowManager.closeAllWindows();
        }
    };
    
    // Determine the recipient of the selected conversation
    const selectedConversation = conversations.find(c => c._id === selectedConversationId);
    const recipient = selectedConversation?.participants.find(p => p._id !== currentUser?.id);

    return (
        <div className="messages-page-container">
            <div className="messages-sidebar">
                <div className="messages-tabs">
                    <button 
                        className={`tab-button ${activeTab === 'messages' ? 'active' : ''}`}
                        onClick={() => handleTabChange('messages')}
                    >
                        <FaComments /> Messages
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'meetings' ? 'active' : ''}`}
                        onClick={() => handleTabChange('meetings')}
                    >
                        <FaCalendarAlt /> Meetings
                    </button>
                </div>
                
                {activeTab === 'messages' && (
                    <div className="sidebar-content">
                        <div className="new-message-btn-container">
                            <button 
                                className="new-message-btn"
                                onClick={handleStartNewConversation}
                            >
                                <FaPlus /> New Message
                            </button>
                        </div>
                        
                        <ConversationList 
                            conversations={conversations}
                            onSelectConversation={handleSelectConversation}
                            selectedConversationId={selectedConversationId}
                            currentUser={currentUser}
                        />
                    </div>
                )}
                
                {activeTab === 'meetings' && currentUser && (
                    <div className="sidebar-content">
                        <MeetingRequestList 
                            userRole={currentUser.role} 
                            onRequestClick={() => {
                                // When a meeting request is clicked, ensure message windows are closed
                                if (WindowManager.isWindowOpen('message')) {
                                    WindowManager.closeWindow('message');
                                }
                                WindowManager.openWindow('meeting');
                            }}
                        />
                    </div>
                )}
            </div>
            
            <div className="messages-main-content">
                {activeTab === 'messages' && !showNewMessageForm && (
                    <MessageWindow 
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        currentUser={currentUser}
                        recipient={recipient}
                    />
                )}
                
                {activeTab === 'messages' && showNewMessageForm && (
                    <div className="new-message-form">
                        <h3><FaUsers /> Start New Conversation</h3>
                        
                        {availableUsers.length === 0 ? (
                            <p>No users available to message.</p>
                        ) : (
                            <>
                                <div className="user-list">
                                    {availableUsers.map(user => (
                                        <div 
                                            key={user._id}
                                            className={`user-item ${selectedUser?._id === user._id ? 'selected' : ''}`}
                                            onClick={() => handleSelectUserForNewMessage(user)}
                                        >
                                            <div className="user-avatar">
                                                {user.name[0].toUpperCase()}
                                            </div>
                                            <div className="user-info">
                                                <span className="user-name">{user.name}</span>
                                                <span className="user-role">{user.role}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {selectedUser && (
                                    <div className="compose-message">
                                        <MessageWindow 
                                            messages={[]}
                                            onSendMessage={(_, content) => handleSendMessage(selectedUser._id, content)}
                                            currentUser={currentUser}
                                            recipient={selectedUser}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
                
                {activeTab === 'meetings' && currentUser?.role === 'student' && (
                    <div className="meeting-request-section">
                        {selectedUser ? (
                            <MeetingRequestForm 
                                teacher={selectedUser}
                                domains={domains}
                                onRequestSent={handleRequestSent}
                                onCancel={() => {
                                    setSelectedUser(null);
                                    WindowManager.closeWindow('meeting');
                                }}
                            />
                        ) : (
                            <div className="select-teacher">
                                <h3><FaCalendarAlt /> Schedule a Meeting</h3>
                                <p>Select a teacher to schedule a meeting with:</p>
                                
                                <div className="user-list">
                                    {availableUsers.length === 0 ? (
                                        <div className="loading-users">Loading available teachers...</div>
                                    ) : (
                                        availableUsers.map(user => (
                                            <div 
                                                key={user._id}
                                                className="user-item"
                                                onClick={() => {
                                                    handleSelectUserForNewMessage(user);
                                                    // Use WindowManager to ensure only meeting window is open
                                                    WindowManager.openWindow('meeting');
                                                }}
                                            >
                                                <div className="user-avatar">
                                                    {user.name[0].toUpperCase()}
                                                </div>
                                                <div className="user-info">
                                                    <span className="user-name">{user.name}</span>
                                                    <span className="user-role">{user.subject || 'Teacher'}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* Loading/Error states */}
            {loadingConversations && <div className="loading-overlay">Loading Conversations...</div>}
            {loadingMessages && <div className="loading-overlay messages-loading">Loading Messages...</div>}
            {error && <div className="error-banner">{error}</div>}
        </div>
    );
};

export default MessagesPage;