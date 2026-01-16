const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const Chapter = require('../models/Chapter');

const studentsData = [
    {
        _id: '67877062889cfafc2011b634',
        name: "fst",
        email: "fst@example.com",
        password: "$2a$10$ECXb47sKrMqhOij4mrmdE.S02pX8kZeZ130tlwW.NN2bk4C2sQRPi",
        role: "student",
        birthday: new Date("2009-05-14")
    },
    {
        _id: '67a11d6e32b92b6628783485',
        name: "de",
        email: "de@example.com",
        password: "$2a$10$tut8prPmuXU.Bjr8.Mc9iOieEZzEGAUPS0wIT6ZEz9NcK",
        role: "student",
        birthday: new Date("2018-05-14")
    }
];

async function updateStudentStudies() {
    try {
        await mongoose.connect('mongodb://localhost:27017/DBC');
        console.log('Connected to MongoDB');

        const chapters = await Chapter.find();
        if (!chapters.length) {
            throw new Error('No chapters found');
        }
        console.log(`Found ${chapters.length} chapters`);

        // First, ensure both students exist as Student documents
        for (const studentData of studentsData) {
            // Remove any existing documents for this student
            await User.deleteOne({ _id: studentData._id });
            await Student.deleteOne({ _id: studentData._id });

            // Create new study sessions
            const studySessions = Array.from({ length: 10 }, () => ({
                chapter: chapters[Math.floor(Math.random() * chapters.length)]._id,
                session_start: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
            }));

            // Create new student document with studies
            const student = new Student({
                ...studentData,
                studies: studySessions,
                __t: 'Student'
            });

            await student.save();
            console.log(`Updated student ${student.email} with ${studySessions.length} study sessions`);
        }

        console.log('Successfully completed update process');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

updateStudentStudies();
