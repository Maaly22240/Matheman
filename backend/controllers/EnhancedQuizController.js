/**
 * Enhanced Quiz Controller
 * Integrates retention algorithm for intelligent quiz scheduling and recommendations
 */

const Quiz = require('../models/Quiz');
const Student = require('../models/Student');
const User = require('../models/User');
const RetentionAlgorithm = require('../services/RetentionAlgorithm');

class EnhancedQuizController {
  /**
   * Get recommended quizzes based on retention status
   * Prioritizes quizzes that are due for review
   */
  static async getRecommendedQuizzes(req, res) {
    try {
      const userId = req.user.id;
      
      // Get student with quiz attempts
      let student = await Student.findById(userId).populate('quizAttempts.quiz');
      
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      // Get all quizzes for the student's chapters
      const quizzes = await Quiz.find().populate('chapter');
      
      // Enrich quizzes with attempt history
      const quizzesWithHistory = quizzes.map(quiz => {
        const attempts = student.quizAttempts.filter(
          attempt => attempt.quiz._id.toString() === quiz._id.toString()
        );
        
        return {
          ...quiz.toObject(),
          attempts: attempts,
          lastAttempt: attempts.length > 0 ? attempts[attempts.length - 1] : null
        };
      });

      // Get recommendations
      const recommendations = RetentionAlgorithm.getQuizRecommendations(quizzesWithHistory);
      
      // Return top recommendations
      const topRecommendations = recommendations.slice(0, 10);
      
      res.status(200).json({
        recommendations: topRecommendations,
        totalAvailable: recommendations.length,
        dueCount: recommendations.filter(q => q.isDue).length
      });
    } catch (error) {
      console.error('Error getting recommended quizzes:', error);
      res.status(500).json({ message: 'Error fetching recommendations', error: error.message });
    }
  }

  /**
   * Submit quiz attempt with retention algorithm integration
   */
  static async submitQuizAttemptWithRetention(req, res) {
    try {
      const quizId = req.params.id;
      const { answers } = req.body;
      const userId = req.user.id;
      
      // Find the quiz
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found' });
      }
      
      // Validate answers
      if (!answers || answers.length !== quiz.questions.length) {
        return res.status(400).json({ 
          message: 'Invalid submission: number of answers does not match number of questions' 
        });
      }
      
      // Calculate score
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
      
      // Get or create student
      let student = await Student.findById(userId);
      
      if (!student) {
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

      // Get previous attempts for this quiz
      const previousAttempts = student.quizAttempts.filter(
        attempt => attempt.quiz.toString() === quizId
      );

      // Calculate learning strength using retention algorithm
      const retentionData = RetentionAlgorithm.updateLearningStrength(
        previousAttempts,
        scorePercentage
      );

      // Calculate next review date
      const nextReviewDate = RetentionAlgorithm.calculateNextReviewDate(retentionData.S);

      // Record the attempt
      const attempt = {
        quiz: quizId,
        date: new Date(),
        score: scorePercentage,
        correct: correctCount,
        total: quiz.questions.length,
        nextReview: nextReviewDate,
        S: retentionData.S, // Store learning strength
        retention: retentionData.retention,
        timeSinceLastReview: retentionData.timeSinceLastReview || 0
      };

      student.quizAttempts.push(attempt);
      await student.save();

      console.log(`Quiz attempt recorded for student ${userId}: Score ${scorePercentage}%`);
      console.log(`Learning Strength (S): ${retentionData.S.toFixed(2)} days`);
      console.log(`Next review scheduled for: ${nextReviewDate.toLocaleDateString()}`);

      res.status(200).json({
        score: scorePercentage,
        correct: correctCount,
        total: quiz.questions.length,
        results,
        retentionData: {
          S: retentionData.S,
          retention: retentionData.retention,
          nextReviewDate: nextReviewDate,
          daysUntilReview: RetentionAlgorithm.calculateNextReviewDays(retentionData.S)
        }
      });
      
    } catch (error) {
      console.error('Error submitting quiz attempt:', error);
      res.status(500).json({ message: 'Error processing quiz submission', error: error.message });
    }
  }

  /**
   * Get lesson statistics with retention analysis
   */
  static async getLessonStats(req, res) {
    try {
      const { lessonId } = req.params;
      const userId = req.user.id;

      const student = await Student.findById(userId).populate('quizAttempts.quiz');
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      // Get attempts for this lesson
      const lessonAttempts = student.quizAttempts.filter(attempt => {
        return attempt.quiz.chapter && attempt.quiz.chapter.toString() === lessonId;
      });

      if (lessonAttempts.length === 0) {
        return res.status(200).json({
          lessonId,
          stats: {
            averageScore: 0,
            attemptCount: 0,
            averageLearningStrength: 5,
            currentRetention: 0,
            trend: 'neutral'
          },
          attempts: []
        });
      }

      // Calculate statistics
      const stats = RetentionAlgorithm.calculateLessonStats({
        quizAttempts: lessonAttempts
      });

      res.status(200).json({
        lessonId,
        stats,
        attempts: lessonAttempts.map(attempt => ({
          date: attempt.date,
          score: attempt.score,
          S: attempt.S,
          retention: attempt.retention,
          nextReview: attempt.nextReview
        }))
      });
    } catch (error) {
      console.error('Error getting lesson stats:', error);
      res.status(500).json({ message: 'Error fetching lesson statistics', error: error.message });
    }
  }

  /**
   * Get retention curve data for visualization
   */
  static async getRetentionCurve(req, res) {
    try {
      const { quizId } = req.params;
      const userId = req.user.id;

      const student = await Student.findById(userId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      // Get all attempts for this quiz
      const attempts = student.quizAttempts.filter(
        attempt => attempt.quiz.toString() === quizId
      );

      if (attempts.length === 0) {
        return res.status(200).json({
          quizId,
          curve: [],
          message: 'No attempts found for this quiz'
        });
      }

      // Generate retention curve from last attempt
      const lastAttempt = attempts[attempts.length - 1];
      const S = lastAttempt.S || 5;
      
      const curve = [];
      for (let t = 0; t <= 30; t += 1) {
        const retention = RetentionAlgorithm.calculateRetention(t, S);
        curve.push({
          day: t,
          retention: Math.round(retention),
          isDue: retention <= 40
        });
      }

      res.status(200).json({
        quizId,
        S: S,
        lastAttemptDate: lastAttempt.date,
        curve,
        nextReviewDate: lastAttempt.nextReview,
        daysUntilReview: RetentionAlgorithm.calculateNextReviewDays(S)
      });
    } catch (error) {
      console.error('Error getting retention curve:', error);
      res.status(500).json({ message: 'Error fetching retention curve', error: error.message });
    }
  }

  /**
   * Get all quiz attempts with retention data
   */
  static async getQuizAttempts(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 20, offset = 0 } = req.query;

      const student = await Student.findById(userId).populate('quizAttempts.quiz');
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      const attempts = student.quizAttempts
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(offset, offset + limit);

      res.status(200).json({
        attempts: attempts.map(attempt => ({
          quizId: attempt.quiz._id,
          quizTitle: attempt.quiz.title,
          date: attempt.date,
          score: attempt.score,
          correct: attempt.correct,
          total: attempt.total,
          S: attempt.S,
          retention: attempt.retention,
          nextReview: attempt.nextReview,
          daysUntilReview: attempt.nextReview ? 
            Math.ceil((new Date(attempt.nextReview) - new Date()) / (1000 * 60 * 60 * 24)) : 0
        })),
        total: student.quizAttempts.length
      });
    } catch (error) {
      console.error('Error getting quiz attempts:', error);
      res.status(500).json({ message: 'Error fetching quiz attempts', error: error.message });
    }
  }
}

module.exports = EnhancedQuizController;
