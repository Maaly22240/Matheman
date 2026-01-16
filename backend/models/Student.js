const mongoose = require('mongoose');
const User = require('./User');

const StudentSchema = new mongoose.Schema({
    studies: [
        {
            chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
            session_start: { type: Date, required: true },
        },
    ],
    quizAttempts: [
        {
            quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
            date: { type: Date, required: true },
            score: { type: Number, required: true },
            correct: { type: Number, required: true },
            total: { type: Number, required: true },
            nextReview: { type: Date }
        }
    ]
});

module.exports = User.discriminator('Student', StudentSchema);
