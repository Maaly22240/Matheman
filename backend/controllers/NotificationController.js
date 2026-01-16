const Notification = require('../models/Notification');
const User = require('../models/User');

// Get all notifications for the current user
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const notifications = await Notification.find({
            recipient: userId
        })
        .populate('sender', 'name email role')
        .sort({ createdAt: -1 });
        
        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ 
            message: 'Failed to fetch notifications',
            error: error.message
        });
    }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const count = await Notification.countDocuments({
            recipient: userId,
            isRead: false
        });
        
        res.status(200).json({ unreadCount: count });
    } catch (error) {
        console.error('Error fetching unread notification count:', error);
        res.status(500).json({ 
            message: 'Failed to fetch unread notification count',
            error: error.message
        });
    }
};

// Create a new notification
exports.createNotification = async (req, res) => {
    try {
        const { recipientId, title, message, type } = req.body;
        const senderId = req.user.id;
        
        // Validate recipient
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({ message: 'Recipient not found' });
        }
        
        const notification = new Notification({
            sender: senderId,
            recipient: recipientId,
            title,
            message,
            type: type || 'system', // Default to system type if not specified
            isRead: false
        });
        
        await notification.save();
        
        res.status(201).json({
            message: 'Notification created successfully',
            notification
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ 
            message: 'Failed to create notification',
            error: error.message
        });
    }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user.id;
        
        const notification = await Notification.findById(notificationId);
        
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        
        // Ensure the user owns the notification
        if (notification.recipient.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to update this notification' });
        }
        
        notification.isRead = true;
        await notification.save();
        
        res.status(200).json({
            message: 'Notification marked as read',
            notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ 
            message: 'Failed to mark notification as read',
            error: error.message
        });
    }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const result = await Notification.updateMany(
            { recipient: userId, isRead: false },
            { isRead: true }
        );
        
        res.status(200).json({
            message: 'All notifications marked as read',
            count: result.modifiedCount
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ 
            message: 'Failed to mark all notifications as read',
            error: error.message
        });
    }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user.id;
        
        const notification = await Notification.findById(notificationId);
        
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        
        // Ensure the user owns the notification
        if (notification.recipient.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this notification' });
        }
        
        await Notification.findByIdAndDelete(notificationId);
        
        res.status(200).json({
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ 
            message: 'Failed to delete notification',
            error: error.message
        });
    }
};

// Delete all read notifications
exports.deleteAllRead = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const result = await Notification.deleteMany({
            recipient: userId,
            isRead: true
        });
        
        res.status(200).json({
            message: 'All read notifications deleted',
            count: result.deletedCount
        });
    } catch (error) {
        console.error('Error deleting read notifications:', error);
        res.status(500).json({ 
            message: 'Failed to delete read notifications',
            error: error.message
        });
    }
};