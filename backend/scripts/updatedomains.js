const mongoose = require('mongoose');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// Load domains from JSON file
const domainsPath = path.join(__dirname, '../../DBC.domains.json');
const domainsData = JSON.parse(fs.readFileSync(domainsPath, 'utf8'));

// Map domain names to their ObjectIds
const domainIdMap = {};
domainsData.forEach(d => {
    domainIdMap[d.name] = d._id.$oid;
});

async function updateTeacherDomains() {
    await mongoose.connect('mongodb://localhost:27017/DBC');
    console.log('Connected to MongoDB');

    // Find all teachers
    const teachers = await User.find({ role: 'teacher' });
    if (!teachers.length) {
        console.log('No teachers found in the users collection.');
        await mongoose.disconnect();
        return;
    }

    // Assign each teacher one or more domains (example: round-robin, or all)
    const domainIds = Object.values(domainIdMap);
    for (let i = 0; i < teachers.length; i++) {
        // Example: assign each teacher 2 domains (cycle if needed)
        const assignedDomains = [
            domainIds[i % domainIds.length],
            domainIds[(i + 1) % domainIds.length]
        ];
        teachers[i].domains = assignedDomains;
        await teachers[i].save();
        console.log(`Updated ${teachers[i].email} with domains: ${assignedDomains}`);
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
}

updateTeacherDomains();