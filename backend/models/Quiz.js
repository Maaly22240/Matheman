const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [String],
  correctAnswer: { type: String, required: true },
  explanation: String,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  tags: [String], // For categorizing questions (e.g., "recall", "application", "conceptual")
  imageUrl: String
});

const QuizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
  questions: [QuestionSchema],
  type: {
    type: String,
    enum: ['recall', 'spaced-repetition', 'interleaved', 'encoding', 'contextual-variation'],
    default: 'recall'
  },
  timeLimit: Number, // Time limit in minutes (optional)
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quiz', QuizSchema);
