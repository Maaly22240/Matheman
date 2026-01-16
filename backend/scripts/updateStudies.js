const mongoose = require('mongoose');
const Student = require('../models/Student');
const Chapter = require('../models/Chapter');

async function addStudiesToStudents() {
    try {
        await mongoose.connect('mongodb://localhost:27017/DBC');
        console.log('Connected to MongoDB');

        // Get all chapters
        const chapters = await Chapter.find();
        if (!chapters.length) {
            throw new Error('No chapters found');
        }
        console.log(`Found ${chapters.length} chapters`);

        // Update student: fst
        const fstStudies = Array.from({ length: 10 }, () => ({
            chapter: chapters[Math.floor(Math.random() * chapters.length)]._id,
            session_start: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
        }));

        await Student.updateOne(
            { _id: '67877062889cfafc2011b634' },
            { $set: { studies: fstStudies } }
        );

        // Update student: de
        const deStudies = Array.from({ length: 10 }, () => ({
            chapter: chapters[Math.floor(Math.random() * chapters.length)]._id,
            session_start: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
        }));

        await Student.updateOne(
            { _id: '67a11d6e32b92b6628783485' },
            { $set: { studies: deStudies } }
        );

        console.log('Successfully added study sessions to both students');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

addStudiesToStudents();
