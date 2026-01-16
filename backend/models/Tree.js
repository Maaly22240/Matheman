const mongoose = require('mongoose');
const Domain = require('./Domain');

const treeSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Tree name
    ageRanges: [
        {
            range: { type: String, required: true }, // e.g., "5-8"
            domains: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Domain' }],
        },
    ],
});

module.exports = mongoose.model('Tree', treeSchema);
