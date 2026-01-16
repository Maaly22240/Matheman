const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    ],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
    },
    // Timestamps for when the conversation was created/updated
}, { timestamps: true });

// Ensure a conversation between the same two participants is unique
// Note: Order matters, so we might need application logic to ensure consistency (e.g., always store IDs in sorted order)
// Or, use a compound index after ensuring consistent order in the application layer.
// conversationSchema.index({ participants: 1 }, { unique: true }); 

module.exports = mongoose.model('Conversation', conversationSchema); 