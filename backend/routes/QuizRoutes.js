const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth'); // Import the shared middleware
const {
    getAllQuizzes,
    getQuizById,
    getQuizzesByChapter,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    submitQuizAttempt
} = require('../controllers/QuizController');

// Import required models
const Quiz = require('../models/Quiz');
const Student = require('../models/Student');
const User = require('../models/User');

// Routes
router.get('/', authenticateToken, getAllQuizzes);
router.get('/:id', authenticateToken, getQuizById);
router.get('/chapter/:chapterId', authenticateToken, getQuizzesByChapter);
router.post('/', authenticateToken, createQuiz);
router.put('/:id', authenticateToken, updateQuiz);
router.delete('/:id', authenticateToken, deleteQuiz);
router.post('/:id/attempt', authenticateToken, async (req, res) => {
    try {
        const quizId = req.params.id;
        const { answers } = req.body;
        const userId = req.user.id;
        
        // Find the quiz
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        
        // Check if there are enough answers
        if (!answers || answers.length !== quiz.questions.length) {
            return res.status(400).json({ 
                message: 'Invalid submission: number of answers does not match number of questions' 
            });
        }
        
        // Calculate the score
        let correctCount = 0;
        const results = quiz.questions.map((question, index) => {
            const isCorrect = question.correctAnswer === answers[index];
            if (isCorrect) correctCount++;
            
            return {
                isCorrect,
                userAnswer: answers[index],
                correctAnswer: question.correctAnswer,
                explanation: question.explanation
            };
        });
        
        const scorePercentage = Math.round((correctCount / quiz.questions.length) * 100);
        
        // Record the attempt in the student's record - improved to work for all quiz types
        try {
            // Find if user exists as Student
            let student = await Student.findById(userId);
            
            if (!student) {
                // Convert user to student if needed
                const user = await User.findById(userId);
                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }
                
                if (user.role === 'student') {
                    student = new Student({
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        password: user.password,
                        role: user.role,
                        birthday: user.birthday,
                        studies: [],
                        quizAttempts: []
                    });
                    await student.save();
                } else {
                    return res.status(403).json({ message: 'Only students can submit quizzes' });
                }
            }
            
            // Calculate next review date for spaced repetition
            let nextReview = null;
            if (quiz.type === 'spaced-repetition') {
                // Simple spaced repetition algorithm
                const daysToAdd = scorePercentage >= 80 ? 7 : (scorePercentage >= 60 ? 3 : 1);
                nextReview = new Date();
                nextReview.setDate(nextReview.getDate() + daysToAdd);
            }
            
            // Record the attempt
            student.quizAttempts.push({
                quiz: quizId,
                date: new Date(),
                score: scorePercentage,
                correct: correctCount,
                total: quiz.questions.length,
                nextReview
            });
            
            await student.save();
            console.log(`Quiz attempt recorded for student ${userId}: Score ${scorePercentage}%`);
            
        } catch (err) {
            console.error('Error recording quiz attempt:', err);
            // Continue anyway to return results - non-critical error
        }
        
        res.status(200).json({
            score: scorePercentage,
            correct: correctCount,
            total: quiz.questions.length,
            results
        });
        
    } catch (error) {
        console.error('Error submitting quiz attempt:', error);
        res.status(500).json({ message: 'Error processing quiz submission', error: error.message });
    }
});

module.exports = router;
