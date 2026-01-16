const mongoose = require('mongoose');

async function fixStudies() {
    try {
        await mongoose.connect('mongodb://localhost:27017/DBC');
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const chapters = await db.collection('chapters').find().toArray();
        
        if (!chapters.length) {
            throw new Error('No chapters found');
        }
        console.log(`Found ${chapters.length} chapters`);

        // Create study sessions
        const generateStudies = () => Array.from({ length: 10 }, () => ({
            chapter: chapters[Math.floor(Math.random() * chapters.length)]._id,
            session_start: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
        }));

        const studentIds = [
            '67877062889cfafc2011b634',  // fst
            '67a11d6e32b92b6628783485'   // de
        ];

        for (const id of studentIds) {
            // Generate studies for this student
            const studies = generateStudies();
            
            // Update the student
            const result = await db.collection('students').updateOne(
                { _id: new mongoose.Types.ObjectId(id) },
                { $set: { studies: studies } }
            );

            // Verify the update
            const updatedStudent = await db.collection('students').findOne(
                { _id: new mongoose.Types.ObjectId(id) }
            );

            console.log(`\nStudent ${id}:`);
            console.log('Update result:', result.modifiedCount ? 'Success' : 'Failed');
            console.log('Verification:');
            console.log('- Has studies array:', !!updatedStudent?.studies);
            console.log('- Number of studies:', updatedStudent?.studies?.length || 0);
            console.log('- Sample study:', updatedStudent?.studies?.[0] || 'None');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

fixStudies();
