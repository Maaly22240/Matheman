const mongoose = require('mongoose');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/DBC');
        console.log('MongoDB connected...');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

const generateMockData = async () => {
    try {
        await connectDB();
        
        // Find users
        const users = await User.find();
        if (users.length === 0) {
            console.log('No users found. Please create users first.');
            return;
        }

        // Group users by role
        const teachers = users.filter(user => user.role === 'teacher');
        const students = users.filter(user => user.role === 'student');
        
        if (teachers.length === 0 || students.length === 0) {
            console.log('Need at least one teacher and one student.');
            return;
        }

        console.log(`Found ${teachers.length} teachers and ${students.length} students.`);

        // Delete existing messages and notifications
        await Message.deleteMany({});
        await Notification.deleteMany({});
        console.log('Cleared existing messages and notifications');

        // Create mock messages
        const messagePromises = [];
        for (const teacher of teachers) {
            for (const student of students) {
                // Teacher to student messages
                messagePromises.push(
                    new Message({
                        from: teacher._id,
                        to: student._id,
                        subject: 'Assignment Feedback',
                        body: 'Great work on your recent assignment. Keep it up!',
                        isRead: Math.random() > 0.5
                    }).save()
                );
                
                // Student to teacher messages
                messagePromises.push(
                    new Message({
                        from: student._id,
                        to: teacher._id,
                        subject: 'Question about homework',
                        body: 'I need help understanding question #5 on the homework.',
                        isRead: Math.random() > 0.5
                    }).save()
                );
            }
        }

        await Promise.all(messagePromises);
        console.log(`Created ${messagePromises.length} messages`);

        // Create mock notifications
        const notificationPromises = [];
        const notificationTypes = ['system', 'message', 'assignment', 'progress', 'announcement'];
        
        for (const user of users) {
            for (let i = 0; i < 5; i++) {
                const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
                
                notificationPromises.push(
                    new Notification({
                        recipient: user._id,
                        sender: users[Math.floor(Math.random() * users.length)]._id,
                        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Notification`,
                        message: `This is a test ${type} notification #${i+1}.`,
                        type,
                        isRead: Math.random() > 0.5
                    }).save()
                );
            }
        }

        await Promise.all(notificationPromises);
        console.log(`Created ${notificationPromises.length} notifications`);

        console.log('Mock data generation completed successfully');
    } catch (error) {
        console.error('Error generating mock data:', error);
    } finally {
        mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

generateMockData();
