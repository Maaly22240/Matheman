const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const Student = require('../models/Student');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/role/:email', userController.getUserRole);

// Protected routes
router.get('/', authenticateToken, userController.getUsers);
router.get('/students', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Check if the user is a teacher
        const teacher = await User.findById(userId);
        if (!teacher || teacher.role !== 'teacher') {
            return res.status(403).json({ message: 'Access denied. Only teachers can view student lists.' });
        }
        
        // Find all students
        const students = await User.find({ role: 'student' })
            .select('name email birthday _id');
            
        // Add mock progress data for frontend
        const studentsWithProgress = students.map(student => ({
            ...student.toObject(),
            progress: {
                completedChapters: Math.floor(Math.random() * 20),
                totalChapters: 20
            },
            quizAvgScore: Math.floor(Math.random() * 30) + 60,
            lastActive: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000)
        }));
        
        res.status(200).json(studentsWithProgress);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ 
            message: 'Error fetching students', 
            error: error.message 
        });
    }
});
router.get('/teachers', authenticateToken, async (req, res) => {
    try {
        // Find all teachers
        const teachers = await User.find({ role: 'teacher' })
            .select('name email subject _id');
            
        res.status(200).json(teachers);
    } catch (error) {
        console.error('Error fetching teachers:', error);
        res.status(500).json({ 
            message: 'Error fetching teachers', 
            error: error.message 
        });
    }
});
router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, userController.updateProfile);

// These routes with path parameters must come AFTER specific routes
router.get('/:id', authenticateToken, userController.getUserById);
router.put('/:id', authenticateToken, userController.updateUser);
router.delete('/:id', authenticateToken, userController.deleteUser);

module.exports = router;