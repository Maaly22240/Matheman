const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['system', 'message', 'assignment', 'progress', 'announcement'],
        default: 'system'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    relatedItem: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'itemModel'
    },
    itemModel: {
        type: String,
        enum: ['Message', 'Chapter', 'Quiz', null]
    }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);