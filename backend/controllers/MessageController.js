const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// Helper function to get or create a conversation between two users
const getOrCreateConversation = async (userId1, userId2) => {
    // Ensure consistent order of participants to avoid duplicate conversations
    const participants = [userId1, userId2].sort();
    
    let conversation = await Conversation.findOne({
        participants: { $all: participants, $size: 2 } 
    });

    if (!conversation) {
        conversation = new Conversation({ participants });
        await conversation.save();
    }
    return conversation;
};

// Get all conversations for the logged-in user
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const conversations = await Conversation.find({ participants: userId })
            .populate({
                path: 'participants',
                select: 'name email role' // Select fields to return for participants
            })
            .populate({
                path: 'lastMessage',
                select: 'content sender read createdAt' // Select fields for last message
            })
            .sort({ updatedAt: -1 }); // Sort by last updated

        res.status(200).json(conversations);
    } catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({ message: 'Error fetching conversations', error: error.message });
    }
};

// Get messages for a specific conversation
exports.getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        // Verify the user is part of this conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(userId)) {
            return res.status(403).json({ message: 'Access denied to this conversation' });
        }

        const messages = await Message.find({ conversationId })
            .populate('sender', 'name role') // Populate sender info
            .sort({ createdAt: 1 }); // Sort messages chronologically

        // Mark messages as read when viewed
        await Message.updateMany(
            { conversationId, recipient: userId, read: false },
            { read: true }
        );

        res.status(200).json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: 'Error fetching messages', error: error.message });
    }
};

// Send a new message
exports.sendMessage = async (req, res) => {
    try {
        const { recipientId, content } = req.body;
        const senderId = req.user.id;
        const io = req.io; // Get io instance from request
        const userSockets = req.userSockets; // Get socket mapping

        if (!recipientId || !content) {
            return res.status(400).json({ message: 'Recipient ID and content are required' });
        }
        
        const recipientExists = await User.findById(recipientId);
        if (!recipientExists) {
            return res.status(404).json({ message: 'Recipient user not found' });
        }

        const conversation = await getOrCreateConversation(senderId, recipientId);

        const newMessage = new Message({
            conversationId: conversation._id,
            sender: senderId,
            recipient: recipientId,
            content,
            read: false
        });
        await newMessage.save();

        conversation.lastMessage = newMessage._id;
        conversation.updatedAt = Date.now(); 
        await conversation.save();
        
        // Populate sender details for the response and emission
        const populatedMessage = await Message.findById(newMessage._id)
                                            .populate('sender', 'name role');

        // Emit the message to the recipient if they are online
        const recipientSocketId = userSockets[recipientId];
        if (recipientSocketId) {
            console.log(`Emitting message to recipient ${recipientId} via socket ${recipientSocketId}`);
            io.to(recipientSocketId).emit('receiveMessage', populatedMessage.toObject());
        } else {
            console.log(`Recipient ${recipientId} is offline, message saved.`);
        }

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ message: 'Error sending message', error: error.message });
    }
};

// Get all messages in user's inbox (legacy - for compatibility)
exports.getInbox = async (req, res) => {
    try {
        const userId = req.user.id;
        const messages = await Message.find({ recipient: userId })
            .populate('sender', 'name email role')
            .sort({ createdAt: -1 });
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching inbox', error: error.message });
    }
};

// Get sent messages (legacy - for compatibility)
exports.getSentMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const messages = await Message.find({ sender: userId })
            .populate('recipient', 'name email role')
            .sort({ createdAt: -1 });
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sent messages', error: error.message });
    }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const count = await Message.countDocuments({
            recipient: userId,
            read: false
        });
        res.status(200).json({ unreadCount: count });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching unread count', error: error.message });
    }
};

// Get a specific message thread
exports.getMessageThread = async (req, res) => {
    try {
        const messageId = req.params.id;
        const userId = req.user.id;
        
        // Find the conversation containing this message
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        
        // Check if user is part of the conversation
        if (message.sender.toString() !== userId && message.recipient.toString() !== userId) {
            return res.status(403).json({ message: 'Access denied to this message' });
        }
        
        // Get all messages in the conversation
        const conversationId = message.conversationId;
        const thread = await Message.find({ conversationId })
            .populate('sender', 'name role')
            .sort({ createdAt: 1 });
            
        res.status(200).json(thread);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching message thread', error: error.message });
    }
};

// Mark a message as read
exports.markAsRead = async (req, res) => {
    try {
        const messageId = req.params.id;
        const userId = req.user.id;
        
        const message = await Message.findOneAndUpdate(
            { _id: messageId, recipient: userId },
            { read: true },
            { new: true }
        );
        
        if (!message) {
            return res.status(404).json({ message: 'Message not found or not authorized' });
        }
        
        res.status(200).json({ message: 'Message marked as read', data: message });
    } catch (error) {
        res.status(500).json({ message: 'Error marking message as read', error: error.message });
    }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
    try {
        const messageId = req.params.id;
        const userId = req.user.id;
        
        const message = await Message.findOneAndDelete({
            _id: messageId,
            $or: [{ sender: userId }, { recipient: userId }]
        });
        
        if (!message) {
            return res.status(404).json({ message: 'Message not found or not authorized to delete' });
        }
        
        res.status(200).json({ message: 'Message deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting message', error: error.message });
    }
};

// Reply to a message (legacy - use sendMessage instead)
exports.replyToMessage = async (req, res) => {
    try {
        const messageId = req.params.id;
        const { content } = req.body;
        const senderId = req.user.id;
        
        // Get original message
        const originalMessage = await Message.findById(messageId);
        if (!originalMessage) {
            return res.status(404).json({ message: 'Original message not found' });
        }
        
        // Determine recipient (the other person in the conversation)
        const recipientId = originalMessage.sender.toString() === senderId 
            ? originalMessage.recipient 
            : originalMessage.sender;
            
        // Create reply using the same conversation
        const newMessage = new Message({
            conversationId: originalMessage.conversationId,
            sender: senderId,
            recipient: recipientId,
            content,
            read: false
        });
        
        await newMessage.save();
        
        // Update conversation's last message
        await Conversation.findByIdAndUpdate(
            originalMessage.conversationId,
            { 
                lastMessage: newMessage._id,
                updatedAt: Date.now()
            }
        );
        
        // Populate sender details
        const populatedMessage = await Message.findById(newMessage._id)
            .populate('sender', 'name role');
            
        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ message: 'Error replying to message', error: error.message });
    }
};
