const mongoose = require('mongoose');

const mnemonicSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    content: {
        type: String, // Could be HTML/JSON for a rich text editor
        required: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // Optional: Link mnemonic to specific content
    relatedChapter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chapter',
        required: false, // Making it optional for now
    },
    relatedDomain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Domain',
        required: false,
    },
    tags: [
        { 
            type: String,
            trim: true,
        }
    ],
}, { timestamps: true });

// Index for efficient lookup by teacher
mnemonicSchema.index({ createdBy: 1 });
// Index for lookup by chapter or domain
mnemonicSchema.index({ relatedChapter: 1 });
mnemonicSchema.index({ relatedDomain: 1 });

module.exports = mongoose.model('Mnemonic', mnemonicSchema); 