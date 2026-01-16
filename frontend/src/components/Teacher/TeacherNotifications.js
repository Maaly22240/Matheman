import React, { useState } from 'react';
import { FaBell, FaCheck, FaTrash, FaFilter, FaEllipsisV, FaExclamationCircle } from 'react-icons/fa';

const TeacherNotifications = ({ notifications, onRead }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Filter notifications based on selected filter and search query
  const filteredNotifications = notifications.filter(notification => {
    // Filter by type
    const typeMatch = selectedFilter === 'all' || notification.type === selectedFilter;
    
    // Filter by search query
    const searchLower = searchQuery.toLowerCase();
    const contentMatch = notification.title?.toLowerCase().includes(searchLower) || 
                        notification.message?.toLowerCase().includes(searchLower);
    
    return typeMatch && (searchQuery === '' || contentMatch);
  });

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce((acc, notification) => {
    const date = new Date(notification.createdAt);
    let dateGroup = '';
    
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      dateGroup = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateGroup = 'Yesterday';
    } else {
      dateGroup = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    
    if (!acc[dateGroup]) {
      acc[dateGroup] = [];
    }
    
    acc[dateGroup].push(notification);
    return acc;
  }, {});

  // Handle marking a notification as read
  const handleMarkAsRead = (notificationId) => {
    if (onRead) {
      onRead(notificationId);
    }
  };
  
  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch(type) {
      case 'alert':
        return <FaExclamationCircle className="notification-icon alert" />;
      case 'achievement':
        return <FaCheck className="notification-icon achievement" />;
      case 'system':
        return <FaBell className="notification-icon system" />;
      default:
        return <FaBell className="notification-icon" />;
    }
  };
  
  // Get the notification type label
  const getTypeLabel = (type) => {
    switch(type) {
      case 'alert': return 'Alert';
      case 'achievement': return 'Achievement';
      case 'system': return 'System';
      case 'message': return 'Message';
      case 'student': return 'Student';
      default: return 'Notification';
    }
  };
  
  // Check if notifications are empty
  const hasNotifications = Object.keys(groupedNotifications).length > 0;

  return (
    <div className="teacher-notifications">
      <header className="notifications-header">
        <h1>Notifications</h1>
        <p>Stay updated with system alerts and student activities</p>
      </header>
      
      <div className="notifications-controls">
        <div className="search-filter-container">
          <div className="notification-search">
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="filter-container">
            <button 
              className="filter-button"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <FaFilter /> Filter
            </button>
            
            {showFilterMenu && (
              <div className="filter-menu">
                <button 
                  className={`filter-option ${selectedFilter === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedFilter('all');
                    setShowFilterMenu(false);
                  }}
                >
                  All Notifications
                </button>
                <button 
                  className={`filter-option ${selectedFilter === 'alert' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedFilter('alert');
                    setShowFilterMenu(false);
                  }}
                >
                  Alerts
                </button>
                <button 
                  className={`filter-option ${selectedFilter === 'student' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedFilter('student');
                    setShowFilterMenu(false);
                  }}
                >
                  Student Activities
                </button>
                <button 
                  className={`filter-option ${selectedFilter === 'system' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedFilter('system');
                    setShowFilterMenu(false);
                  }}
                >
                  System Updates
                </button>
                <button 
                  className={`filter-option ${selectedFilter === 'unread' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedFilter('unread');
                    setShowFilterMenu(false);
                  }}
                >
                  Unread Only
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="global-actions">
          <button className="action-button">
            <FaCheck /> Mark All as Read
          </button>
          <button className="action-button">
            <FaTrash /> Clear All
          </button>
        </div>
      </div>
      
      <div className="notifications-container">
        {hasNotifications ? (
          Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
            <div key={date} className="notification-group">
              <h3 className="notification-date">{date}</h3>
              
              <div className="notification-list">
                {dateNotifications.map(notification => (
                  <div 
                    key={notification._id} 
                    className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  >
                    {getNotificationIcon(notification.type)}
                    
                    <div className="notification-content">
                      <div className="notification-header">
                        <div className="notification-meta">
                          <span className="notification-type">{getTypeLabel(notification.type)}</span>
                          <span className="notification-time">
                            {new Date(notification.createdAt).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="notification-actions">
                          {!notification.isRead && (
                            <button 
                              className="action-btn read-btn" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification._id);
                              }}
                              title="Mark as read"
                            >
                              <FaCheck />
                            </button>
                          )}
                          <button className="action-btn more-btn" title="More options">
                            <FaEllipsisV />
                          </button>
                        </div>
                      </div>
                      
                      <div className="notification-body">
                        <h4 className="notification-title">{notification.title || 'Notification'}</h4>
                        <p className="notification-message">{notification.message}</p>
                      </div>
                      
                      {notification.actionLink && (
                        <div className="notification-action">
                          <a href={notification.actionLink} className="notification-link">
                            {notification.actionText || 'View Details'}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-notifications">
            <FaBell className="empty-icon" />
            <h3>No notifications found</h3>
            <p>Any new system alerts or student activities will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherNotifications;