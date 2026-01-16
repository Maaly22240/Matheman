const mongoose = require('mongoose');
const Chapter=require('./Chapter');

const domainSchema = new mongoose.Schema({
    name: { type: String, required: true },
    chapters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' }],
});

module.exports = mongoose.model('Domain', domainSchema);
