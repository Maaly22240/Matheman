import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import '../../styles/Messages.css';

const MessageWindow = ({ messages, onSendMessage, currentUser, recipient }) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        scrollToBottom();
        // Mark all messages as read in localStorage for this thread
        if (recipient?._id && messages.length > 0) {
            const threads = JSON.parse(localStorage.getItem('messageThreads') || '{}');
            Object.keys(threads).forEach(threadId => {
                if (threads[threadId].messages) {
                    threads[threadId].messages = threads[threadId].messages.map(msg =>
                        msg.sender._id !== currentUser?.id ? { ...msg, read: true } : msg
                    );
                }
            });
            localStorage.setItem('messageThreads', JSON.stringify(threads));
        }
    }, [messages, recipient, currentUser]); // Scroll when messages change

    const handleSend = (e) => {
        e.preventDefault();
        if (newMessage.trim() && recipient?._id) {
            onSendMessage(recipient._id, newMessage.trim());
            setNewMessage('');
        }
    };

    const formatTimestamp = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="message-window">
            <div className="message-header">
                <h4>{recipient?.name || 'Select a conversation'}</h4>
                <span className="recipient-role">{recipient?.role}</span>
            </div>
            <div className="message-list">
                {messages.map(msg => (
                    <div 
                        key={msg._id} 
                        className={`message-item ${msg.sender._id === currentUser?.id ? 'sent' : 'received'}`}
                    >
                        <div className="message-content">
                            <p>{msg.content}</p>
                        </div>
                        <span className="message-timestamp">{formatTimestamp(msg.createdAt)}</span>
                    </div>
                ))}
                <div ref={messagesEndRef} /> {/* Anchor for scrolling */} 
            </div>
            <form className="message-input-form" onSubmit={handleSend}>
                <input 
                    type="text" 
                    placeholder="Type your message..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={!recipient}
                />
                <button type="submit" disabled={!newMessage.trim() || !recipient}>
                    <FaPaperPlane /> Send
                </button>
            </form>
        </div>
    );
};

export default MessageWindow;