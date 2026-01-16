const Quiz = require('../models/Quiz');
const Student = require('../models/Student');

// Get all quizzes
exports.getAllQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.find();
        res.status(200).json(quizzes);
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        res.status(500).json({ message: 'Error retrieving quizzes', error: error.message });
    }
};

// Get a specific quiz by ID
exports.getQuizById = async (req, res) => {
    try {
        const quizId = req.params.id;
        
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        
        res.status(200).json(quiz);
    } catch (error) {
        console.error('Error fetching quiz:', error);
        res.status(500).json({ message: 'Error retrieving quiz', error: error.message });
    }
};

// Get all quizzes for a specific chapter
exports.getQuizzesByChapter = async (req, res) => {
    try {
        const chapterId = req.params.chapterId;
        const quizzes = await Quiz.find({ chapter: chapterId });
        res.status(200).json(quizzes);
    } catch (error) {
        console.error('Error fetching chapter quizzes:', error);
        res.status(500).json({ message: 'Error retrieving chapter quizzes', error: error.message });
    }
};

// Create a new quiz
exports.createQuiz = async (req, res) => {
    try {
        const quiz = new Quiz(req.body);
        await quiz.save();
        res.status(201).json({ message: 'Quiz created successfully', quiz });
    } catch (error) {
        console.error('Error creating quiz:', error);
        res.status(500).json({ message: 'Error creating quiz', error: error.message });
    }
};

// Update a quiz
exports.updateQuiz = async (req, res) => {
    try {
        const quizId = req.params.id;
        const updates = req.body;
        
        const quiz = await Quiz.findByIdAndUpdate(quizId, updates, { new: true });
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        
        res.status(200).json({ message: 'Quiz updated successfully', quiz });
    } catch (error) {
        console.error('Error updating quiz:', error);
        res.status(500).json({ message: 'Error updating quiz', error: error.message });
    }
};

// Delete a quiz
exports.deleteQuiz = async (req, res) => {
    try {
        const quizId = req.params.id;
        
        const quiz = await Quiz.findByIdAndDelete(quizId);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        
        res.status(200).json({ message: 'Quiz deleted successfully' });
    } catch (error) {
        console.error('Error deleting quiz:', error);
        res.status(500).json({ message: 'Error deleting quiz', error: error.message });
    }
};

// Submit a quiz attempt and get results
exports.submitQuizAttempt = async (req, res) => {
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
        
        const scorePercentage = (correctCount / quiz.questions.length) * 100;
        
        // Record the attempt in the student's record for spaced repetition
        if (quiz.type === 'spaced-repetition') {
            try {
                await Student.findByIdAndUpdate(
                    userId,
                    { 
                        $push: { 
                            quizAttempts: {
                                quiz: quizId,
                                date: new Date(),
                                score: scorePercentage,
                                correct: correctCount,
                                total: quiz.questions.length
                            } 
                        } 
                    }
                );
            } catch (err) {
                console.error('Error recording quiz attempt:', err);
                // Continue anyway - non-critical error
            }
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
};
