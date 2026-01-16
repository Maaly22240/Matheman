const mongoose = require('mongoose');

const meetingRequestSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    requestedTime: {
        // Could be more complex (e.g., multiple options)
        type: Date,
        required: true,
    },
    message: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'cancelled'],
        default: 'pending',
    },
    // Optional: Link to a specific domain/chapter
    relatedDomain: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Domain',
    },
    // Timestamps
}, { timestamps: true });

meetingRequestSchema.index({ teacher: 1, status: 1 });
meetingRequestSchema.index({ student: 1, status: 1 });

module.exports = mongoose.model('MeetingRequest', meetingRequestSchema); 