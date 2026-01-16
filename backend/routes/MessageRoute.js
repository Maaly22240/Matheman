const express = require('express');
const {
    getConversations,
    getMessages,
    sendMessage,
} = require('../controllers/MessageController');
const { authenticateToken } = require('../middleware/authMiddleware');
const router = express.Router();

// All message routes require authentication
router.use(authenticateToken);

// Get all conversations for the logged-in user
router.get('/conversations', getConversations);

// Get messages for a specific conversation
router.get('/conversations/:conversationId', getMessages);

// Send a new message
router.post('/', sendMessage);

module.exports = router; 