const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/NotificationController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all notifications for the current user
router.get('/', notificationController.getNotifications);

// Get unread notification count
router.get('/unread-count', notificationController.getUnreadCount);

// Create a new notification
router.post('/', notificationController.createNotification);

// Mark a notification as read
router.put('/:id/read', notificationController.markAsRead);

// Mark all notifications as read
router.put('/mark-all-read', notificationController.markAllAsRead);

// Delete a notification
router.delete('/:id', notificationController.deleteNotification);

// Delete all read notifications
router.delete('/read', notificationController.deleteAllRead);

module.exports = router;