const mongoose = require('mongoose');

const SectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: {
    type: String,
    enum: ['theory', 'example', 'mnemonic', 'chunking', 'application'],
    default: 'theory'
  },
  images: [String],
  order: { type: Number, required: true }
});

const chapterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  summary: { type: String, required: true },
  content: { type: String },
  sections: [SectionSchema],
  quizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }],
  images: [String],
  mnemonicDevices: [String],
  prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' }],
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
  estimatedDuration: { type: Number, default: 30 } // in minutes
});

module.exports = mongoose.model('Chapter', chapterSchema);
