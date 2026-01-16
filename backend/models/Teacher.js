const mongoose = require('mongoose');
const User = require('./User');

const TeacherSchema = new mongoose.Schema({
    domains: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Domain' }], 
});

module.exports = User.discriminator('Teacher', TeacherSchema);
