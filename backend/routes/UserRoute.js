const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getUserRole,
    register
} = require('../controllers/UserController');

// Login route with better error handling
router.post('/login', async (req, res) => {
    console.log("Login request received:", req.body);
    const { email, password } = req.body;

    try {
        // First try to find user as Student
        let user = await Student.findOne({ email })
            .populate('studies.chapter');

        // If not found as Student, try regular User
        if (!user) {
            user = await User.findOne({ email });
        }

        console.log("Found user:", user);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                name: user.name
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return complete response
        return res.status(200).json({
            success: true,
            token,
            userRole: user.role,
            userName: user.name,
            userId: user._id,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred during login",
            error: error.message
        });
    }
});

// Add new profile route
router.get('/profile', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        let user = await Student.findById(userId)
            .select('-password')
            .populate('studies.chapter');

        if (!user) {
            user = await User.findById(userId).select('-password');
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// Add teachers route - get all teachers relevant to the student
router.get('/teachers', async (req, res) => {
    try {
        // Get token from request header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Find the student (could be Student or User)
            let student = await Student.findById(decoded.id).populate('studies.chapter');
            if (!student) {
                student = await User.findById(decoded.id);
            }
            if (!student || student.role !== 'student') {
                return res.status(403).json({ message: 'Access denied. Student role required.' });
            }

            // Get all unique domain IDs from the chapters the student has studied
            const chapterIds = (student.studies || []).map(s => s.chapter?._id || s.chapter).filter(Boolean);
            const chapters = await require('../models/Chapter').find({ _id: { $in: chapterIds } });
            const domainIds = [...new Set(chapters.map(ch => ch.domain?.toString()).filter(Boolean))];

            // Find teachers who teach these domains
            const teachers = await User.find({ role: 'teacher', domains: { $in: domainIds } })
                .select('-password')
                .lean();

            // Add domains and bio (for frontend compatibility)
            const teachersWithDomains = teachers.map(teacher => ({
                ...teacher,
                domains: teacher.domains ? teacher.domains.map(d => d.toString()) : [],
                bio: `Experienced educator specializing in ${teacher.subject || "Mathematics"}.`
            }));

            return res.status(200).json(teachersWithDomains);
        } catch (error) {
            console.error('JWT verification error:', error);
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
    } catch (error) {
        console.error('Error fetching teachers:', error);
        return res.status(500).json({ message: 'Error fetching teachers', error: error.message });
    }
});

// Add students route - get all students relevant to the teacher
router.get('/students', async (req, res) => {
    try {
        // Get token from request header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Ensure requester is a teacher
            const teacher = await User.findById(decoded.id);
            if (!teacher || teacher.role !== 'teacher') {
                return res.status(403).json({ message: 'Access denied. Teacher role required.' });
            }

            // Find all chapters in the teacher's domains
            const chapters = await require('../models/Chapter').find({ domain: { $in: teacher.domains || [] } });
            const chapterIds = chapters.map(ch => ch._id);

            // Find students who have studied these chapters
            let students = await Student.find({ 'studies.chapter': { $in: chapterIds } })
                .select('-password')
                .lean();

            // If no students found, fallback to all students (for empty state)
            if (students.length === 0) {
                students = await User.find({ role: 'student' })
                    .select('-password')
                    .lean();
            }

            return res.status(200).json(students);
        } catch (error) {
            console.error('JWT verification error:', error);
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
    } catch (error) {
        console.error('Error fetching students:', error);
        return res.status(500).json({ message: 'Error fetching students', error: error.message });
    }
});

// Get teachers for a student
router.get('/student/:studentId/teachers', async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const student = await Student.findById(studentId).populate('studies.chapter');
        if (!student) return res.status(404).json({ message: 'Student not found' });

        // Get all unique domain IDs from the chapters the student has studied
        const chapterIds = student.studies.map(s => s.chapter._id);
        const chapters = await Chapter.find({ _id: { $in: chapterIds } });
        const domainIds = [...new Set(chapters.map(ch => ch.domain))];

        // Find teachers who teach these domains
        const teachers = await User.find({ role: 'teacher', domains: { $in: domainIds } });
        res.json(teachers);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching teachers', error: err.message });
    }
});

// Get students for a teacher
router.get('/teacher/:teacherId/students', async (req, res) => {
    try {
        const teacherId = req.params.teacherId;
        const teacher = await User.findById(teacherId);
        if (!teacher || teacher.role !== 'teacher') return res.status(404).json({ message: 'Teacher not found' });

        // Find all students who have studied chapters in the teacher's domains
        const domains = teacher.domains;
        const chapters = await Chapter.find({ domain: { $in: domains } });
        const chapterIds = chapters.map(ch => ch._id);

        const students = await Student.find({ 'studies.chapter': { $in: chapterIds } });
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching students', error: err.message });
    }
});

// Add domain-specific students route
router.get('/students/domain/:domainId', async (req, res) => {
    try {
        const { domainId } = req.params;
        // Get token from request header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Ensure requester is a teacher
            const teacher = await User.findById(decoded.id);
            if (!teacher || teacher.role !== 'teacher') {
                return res.status(403).json({ message: 'Access denied. Teacher role required.' });
            }

            // Find all chapters in the specified domain
            const chapters = await require('../models/Chapter').find({ domain: domainId });
            const chapterIds = chapters.map(ch => ch._id);

            // Find students who have studied these chapters
            let students = await Student.find({ 'studies.chapter': { $in: chapterIds } })
                .select('-password')
                .lean();

            // If no students found, fallback to all students (for empty state)
            if (students.length === 0) {
                students = await User.find({ role: 'student' })
                    .select('-password')
                    .lean()
                    .limit(5);
            }

            return res.status(200).json(students);
        } catch (error) {
            console.error('JWT verification error:', error);
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
    } catch (error) {
        console.error('Error fetching domain students:', error);
        return res.status(500).json({ message: 'Error fetching domain students', error: error.message });
    }
});

// Protected routes
router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
// Route to fetch user role by email
router.get('/role/:email', getUserRole);

router.post('/register', register);

module.exports = router;
