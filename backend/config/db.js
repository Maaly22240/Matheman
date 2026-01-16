const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/DBC';
        await mongoose.connect(uri); // No need for useNewUrlParser or useUnifiedTopology
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
