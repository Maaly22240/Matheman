import React, { useState } from 'react';
import { FaEnvelope, FaPaperPlane, FaSearch, FaTrash, FaReply, FaStar } from 'react-icons/fa';

const TeacherInbox = ({ messages, onRead, sendEmail }) => {
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [composeMode, setComposeMode] = useState(false);
  const [replyMode, setReplyMode] = useState(false);
  const [emailForm, setEmailForm] = useState({
    recipient: '',
    subject: '',
    body: ''
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendResult, setSendResult] = useState({ success: false, message: '' });
  const [showSendResult, setShowSendResult] = useState(false);

  // Filter messages based on search query
  const filteredMessages = messages.filter(message => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (message.sender && message.sender.name && message.sender.name.toLowerCase().includes(searchLower)) ||
      (message.subject && message.subject.toLowerCase().includes(searchLower)) ||
      (message.body && message.body.toLowerCase().includes(searchLower))
    );
  });

  // Handle selecting a message
  const handleSelectMessage = (message) => {
    // Mark as read if it's not already
    if (message && !message.isRead && onRead) {
      onRead(message._id);
    }
    setSelectedMessage(message);
    setComposeMode(false);
    setReplyMode(false);
  };

  // Handle composing a new email
  const handleComposeClick = () => {
    setComposeMode(true);
    setReplyMode(false);
    setSelectedMessage(null);
    setEmailForm({
      recipient: '',
      subject: '',
      body: ''
    });
  };

  // Handle replying to a message
  const handleReplyClick = () => {
    if (selectedMessage) {
      setReplyMode(true);
      setComposeMode(false);
      setEmailForm({
        recipient: selectedMessage.sender?.email || '',
        subject: `Re: ${selectedMessage.subject}`,
        body: `\n\n------ Original Message ------\nFrom: ${selectedMessage.sender?.name || 'Unknown'}\nSubject: ${selectedMessage.subject}\n\n${selectedMessage.body}`
      });
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEmailForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle sending an email
  const handleSendEmail = async (e) => {
    e.preventDefault();
    
    if (!emailForm.recipient || !emailForm.subject || !emailForm.body) {
      setSendResult({ success: false, message: 'Please fill in all fields.' });
      setShowSendResult(true);
      setTimeout(() => setShowSendResult(false), 3000);
      return;
    }
    
    setSendingEmail(true);
    
    try {
      const result = await sendEmail(
        emailForm.recipient, 
        emailForm.subject, 
        emailForm.body
      );
      
      if (result.success) {
        setSendResult({ success: true, message: 'Message sent successfully!' });
        setComposeMode(false);
        setReplyMode(false);
      } else {
        setSendResult({ success: false, message: result.error || 'Failed to send message.' });
      }
      
    } catch (error) {
      console.error('Error sending email:', error);
      setSendResult({ success: false, message: 'An error occurred sending the message.' });
    } finally {
      setSendingEmail(false);
      setShowSendResult(true);
      setTimeout(() => setShowSendResult(false), 3000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="teacher-inbox">
      <header className="inbox-header">
        <h1>Message Inbox</h1>
        <p>Manage your communications with students</p>
      </header>
      
      <div className="inbox-container">
        <div className="inbox-sidebar">
          <div className="inbox-actions">
            <button className="compose-btn" onClick={handleComposeClick}>
              <FaPaperPlane className="btn-icon" /> Compose
            </button>
            
            <div className="inbox-search">
              <FaSearch className="search-icon" />
              <input 
                type="text" 
                placeholder="Search messages..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="message-list-container">
            {filteredMessages.length > 0 ? (
              <div className="message-list">
                {filteredMessages.map(message => (
                  <div 
                    key={message._id} 
                    className={`message-preview ${selectedMessage && selectedMessage._id === message._id ? 'selected' : ''} ${!message.isRead ? 'unread' : ''}`}
                    onClick={() => handleSelectMessage(message)}
                  >
                    <div className="message-avatar">
                      {message.sender?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="message-info">
                      <div className="message-header">
                        <h4 className="message-sender">{message.sender?.name || 'Unknown'}</h4>
                        <span className="message-date">{formatDate(message.createdAt)}</span>
                      </div>
                      <p className="message-subject">{message.subject || 'No Subject'}</p>
                      <p className="message-snippet">{message.body?.substring(0, 50)}...</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-messages">
                <FaEnvelope className="empty-icon" />
                <p>No messages found</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="message-content">
          {composeMode || replyMode ? (
            <div className="compose-email">
              <h2>{replyMode ? 'Reply to Message' : 'New Message'}</h2>
              
              <form onSubmit={handleSendEmail}>
                <div className="form-group">
                  <label htmlFor="recipient">To:</label>
                  <input 
                    type="email" 
                    id="recipient" 
                    name="recipient" 
                    value={emailForm.recipient} 
                    onChange={handleInputChange} 
                    placeholder="Email address" 
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="subject">Subject:</label>
                  <input 
                    type="text" 
                    id="subject" 
                    name="subject" 
                    value={emailForm.subject} 
                    onChange={handleInputChange} 
                    placeholder="Subject" 
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="body">Message:</label>
                  <textarea 
                    id="body" 
                    name="body" 
                    value={emailForm.body} 
                    onChange={handleInputChange} 
                    placeholder="Write your message here..."
                    required
                    rows={10}
                  />
                </div>
                
                <div className="compose-actions">
                  <button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={() => {
                      setComposeMode(false);
                      setReplyMode(false);
                      if (selectedMessage) handleSelectMessage(selectedMessage);
                    }}
                  >
                    Cancel
                  </button>
                  
                  <button 
                    type="submit" 
                    className="send-btn" 
                    disabled={sendingEmail}
                  >
                    {sendingEmail ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
              
              {showSendResult && (
                <div className={`send-result ${sendResult.success ? 'success' : 'error'}`}>
                  {sendResult.message}
                </div>
              )}
            </div>
          ) : selectedMessage ? (
            <div className="message-detail">
              <div className="message-detail-header">
                <h2>{selectedMessage.subject || 'No Subject'}</h2>
                <div className="message-actions">
                  <button className="action-btn" onClick={handleReplyClick}>
                    <FaReply /> Reply
                  </button>
                  <button className="action-btn">
                    <FaStar /> Star
                  </button>
                  <button className="action-btn">
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
              
              <div className="message-meta">
                <div className="message-detail-avatar">
                  {selectedMessage.sender?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="message-sender-info">
                  <div className="sender-name">{selectedMessage.sender?.name || 'Unknown'}</div>
                  <div className="sender-email">{selectedMessage.sender?.email || ''}</div>
                </div>
                <div className="message-date-full">
                  {new Date(selectedMessage.createdAt).toLocaleString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
              
              <div className="message-body">
                {selectedMessage.body || 'No content'}
              </div>
            </div>
          ) : (
            <div className="no-message-selected">
              <FaEnvelope className="empty-icon" />
              <h3>Select a message or compose a new one</h3>
              <button className="compose-btn" onClick={handleComposeClick}>
                <FaPaperPlane className="btn-icon" /> New Message
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherInbox;