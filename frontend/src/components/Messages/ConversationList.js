import React from 'react';
import '../../styles/Messages.css';

const ConversationList = ({ conversations, onSelectConversation, selectedConversationId, currentUser }) => {
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + date.toLocaleDateString();
    };

    return (
        <div className="conversation-list">
            <h3>Conversations</h3>
            {conversations.length === 0 && <p>No conversations yet.</p>}
            {conversations.map(conv => {
                // Find the other participant
                const otherParticipant = conv.participants.find(p => p._id !== currentUser?.id);
                const lastMsg = conv.lastMessage;
                const isSelected = conv._id === selectedConversationId;
                const isUnread = lastMsg && lastMsg.sender !== currentUser?.id && !lastMsg.read;

                return (
                    <div 
                        key={conv._id} 
                        className={`conversation-item ${isSelected ? 'selected' : ''} ${isUnread ? 'unread' : ''}`}
                        onClick={() => onSelectConversation(conv._id)}
                    >
                        <div className="participant-info">
                            <div className="avatar">
                                {otherParticipant?.name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div className="name-preview">
                                <span className="participant-name">{otherParticipant?.name || 'Unknown User'}</span>
                                <p className="message-preview">
                                    {lastMsg ? (
                                        <>
                                            {lastMsg.sender === currentUser?.id ? 'You: ' : ''}
                                            {lastMsg.content}
                                        </>
                                    ) : (
                                        <i>No messages yet</i>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="time-status">
                            {lastMsg && (
                                <span className="last-message-time">{formatDate(lastMsg.createdAt)}</span>
                            )}
                            {isUnread && <span className="unread-dot"></span>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ConversationList;