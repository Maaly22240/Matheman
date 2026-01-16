const mongoose = require('mongoose');
const User = require('../models/User');
const Chapter = require('../models/Chapter');

// Existing user data with their original IDs
const users = [
    {
        _id: '677da645630e1c3411ddd1cf',
        name: "bob",
        email: "bob@teacher.com",
        password: "$2a$10$i4B6GFrjsY7w260Ghay6AerE6rGudei4pzzNddX14MhOI7JZ1uceG",
        role: "teacher",
        birthday: new Date("2001-08-14")
    },
    {
        _id: '67877062889cfafc2011b634',
        name: "fst", 
        email: "fst@example.com",
        password: "$2a$10$ECXb47sKrMqhOij4mrmdE.S02pX8kZeZ130tlwW.NN2bk4C2sQRPi",
        role: "student",
        birthday: new Date("2009-05-14"),
        studies: []
    },
    {
        _id: '67a11d6e32b92b6628783485',
        name: "de",
        email: "de@example.com", 
        password: "$2a$10$tut8prPmuXU.Bjr8.Mc9iOieEZzEGAUPS0wEA5UOR8wIT6ZEz9NcK",
        role: "student",
        birthday: new Date("2018-05-14"),
        studies: []
    },
    {
        _id: '67ac735fa712bfbd143a7aa6',
        name: "Alice Smith",
        email: "alice@teacher.com",
        password: "$2a$10$cT8cpNZIERfrbVBTVoUiC.sBJtdPVdVW2ib43FlYfy0CUtehBf0VW",
        role: "teacher",
        birthday: new Date("1985-05-15")
    },
    {
        _id: '67ac735fa712bfbd143a7aa8',
        name: "John Doe",
        email: "john@teacher.com",
        password: "$2a$10$LThRi55sDzffk3mmlBb88uFqFqEvRRfVRMjMkQ3cHmvFkXC/SHQyG",
        role: "teacher",
        birthday: new Date("1980-03-20")
    }
];

async function resetAndPopulateUsers() {
    try {
        await mongoose.connect('mongodb://localhost:27017/DBC');
        console.log('Connected to MongoDB');

        // Delete all existing users
        await User.deleteMany({});
        console.log('Deleted existing users');

        // Get chapters for study sessions
        const chapters = await Chapter.find();
        console.log(`Found ${chapters.length} chapters`);

        // Create each user
        for (const userData of users) {
            if (userData.role === 'student') {
                // Generate 10 random study sessions for students
                const studySessions = [];
                for (let i = 0; i < 10; i++) {
                    studySessions.push({
                        chapter: chapters[Math.floor(Math.random() * chapters.length)]._id,
                        session_start: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
                    });
                }
                userData.studies = studySessions;
            }

            // Create user document with original _id
            const user = new User(userData);
            await User.create(user);
            console.log(`Created ${userData.role}: ${userData.email}`);
        }

        console.log('Database population completed successfully');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

resetAndPopulateUsers();