const express = require('express');
const router = express.Router();
const messageController = require('../controllers/MessageController');
const { authenticateToken } = require('../middleware/auth');
const Message = require('../models/Message');

// All routes require authentication
router.use(authenticateToken);

// Get all messages for the user (both sent and received)
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get both inbox and sent messages
        const messages = await Message.find({
            $or: [{ to: userId }, { from: userId }]
        })
        .populate('from', 'name email role')
        .populate('to', 'name email role')
        .sort({ createdAt: -1 });
        
        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({
            message: 'Failed to fetch messages',
            error: error.message
        });
    }
});

// Get all messages in user's inbox
router.get('/inbox', messageController.getInbox);

// Get sent messages
router.get('/sent', messageController.getSentMessages);

// Get unread message count
router.get('/unread-count', messageController.getUnreadCount);

// Get a specific message with its thread
router.get('/:id', messageController.getMessageThread);

// Send a new message
router.post('/', messageController.sendMessage);

// Reply to a message
router.post('/:id/reply', messageController.replyToMessage);

// Mark a message as read
router.put('/:id/read', messageController.markAsRead);

// Delete a message
router.delete('/:id', messageController.deleteMessage);

module.exports = router;