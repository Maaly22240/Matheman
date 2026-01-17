/**
 * Retention Algorithm Service
 * Implements the spaced repetition algorithm based on the formula: Retention = e^(-t / S)
 * 
 * Where:
 * - t is time elapsed since last review (in days)
 * - S is the learning strength (calculated from performance)
 * - Retention is the percentage of knowledge retained (0-100)
 */

class RetentionAlgorithm {
  /**
   * Calculate retention at a given time
   * Formula: Retention = e^(-t / S) * 100
   * 
   * @param {number} t - Time elapsed in days
   * @param {number} S - Learning strength (in days)
   * @returns {number} Retention percentage (0-100)
   */
  static calculateRetention(t, S) {
    if (S <= 0) return 0;
    const retention = Math.exp(-t / S) * 100;
    return Math.max(0, Math.min(100, retention));
  }

  /**
   * Calculate learning strength (S) from performance data
   * Formula: S = (t - t_0) / ln(R_0 / R)
   * 
   * @param {number} t - Current time (in days since first attempt)
   * @param {number} t0 - Previous time (in days since first attempt)
   * @param {number} R0 - Previous retention percentage
   * @param {number} R - Current retention percentage (from score)
   * @returns {number} Learning strength S
   */
  static calculateLearningStrength(t, t0, R0, R) {
    const timeDiff = t - t0;
    if (timeDiff <= 0 || R <= 0 || R0 <= 0) return 5; // Default S value
    
    const retentionRatio = R0 / R;
    if (retentionRatio <= 0) return 5;
    
    const S = timeDiff / Math.log(retentionRatio);
    return Math.max(1, Math.min(60, S)); // Clamp between 1 and 60 days
  }

  /**
   * Convert quiz score to retention percentage
   * Higher scores indicate better retention
   * 
   * @param {number} score - Quiz score (0-100)
   * @returns {number} Retention percentage (0-100)
   */
  static scoreToRetention(score) {
    // Map score directly to retention, with slight boost for high scores
    if (score >= 90) return 95;
    if (score >= 80) return 85;
    if (score >= 70) return 75;
    if (score >= 60) return 60;
    if (score >= 50) return 45;
    return Math.max(20, score * 0.4);
  }

  /**
   * Calculate when the next review should be scheduled
   * Reviews are scheduled when retention drops below 40%
   * 
   * @param {number} S - Learning strength
   * @param {number} retentionThreshold - Target retention level (default 40%)
   * @returns {number} Days until next review
   */
  static calculateNextReviewDays(S, retentionThreshold = 40) {
    // Solve for t when Retention = retentionThreshold
    // retentionThreshold = e^(-t / S) * 100
    // t = -S * ln(retentionThreshold / 100)
    
    const ratio = retentionThreshold / 100;
    if (ratio <= 0) return 1;
    
    const daysUntilReview = -S * Math.log(ratio);
    return Math.max(1, Math.round(daysUntilReview));
  }

  /**
   * Calculate the next review date
   * 
   * @param {number} S - Learning strength
   * @param {Date} lastReviewDate - Date of last review
   * @returns {Date} Recommended next review date
   */
  static calculateNextReviewDate(S, lastReviewDate = new Date()) {
    const daysUntilReview = this.calculateNextReviewDays(S);
    const nextReviewDate = new Date(lastReviewDate);
    nextReviewDate.setDate(nextReviewDate.getDate() + daysUntilReview);
    return nextReviewDate;
  }

  /**
   * Update learning strength based on new attempt
   * Uses the formula: S_new = (t - t_0) / ln(R_0 / R)
   * 
   * @param {Object} attemptHistory - Array of previous attempts with timestamps and scores
   * @param {number} currentScore - Current quiz score
   * @returns {Object} Updated learning strength and retention data
   */
  static updateLearningStrength(attemptHistory, currentScore) {
    if (!attemptHistory || attemptHistory.length === 0) {
      // First attempt - use default learning strength
      const initialRetention = this.scoreToRetention(currentScore);
      return {
        S: 5, // Default starting value
        retention: initialRetention,
        firstAttempt: true
      };
    }

    const lastAttempt = attemptHistory[attemptHistory.length - 1];
    const currentDate = new Date();
    const lastDate = new Date(lastAttempt.date);
    
    // Calculate time difference in days
    const timeDiff = (currentDate - lastDate) / (1000 * 60 * 60 * 24);
    
    // Get retention values
    const previousRetention = this.scoreToRetention(lastAttempt.score);
    const currentRetention = this.scoreToRetention(currentScore);
    
    // Calculate new learning strength
    const S = this.calculateLearningStrength(
      timeDiff,
      0,
      previousRetention,
      currentRetention
    );

    return {
      S: S,
      retention: currentRetention,
      timeSinceLastReview: timeDiff,
      previousRetention: previousRetention
    };
  }

  /**
   * Get quiz recommendations based on retention status
   * Prioritizes quizzes that are due for review
   * 
   * @param {Array} quizzes - Array of quiz objects with attempt history
   * @returns {Array} Sorted quizzes with priority and reason
   */
  static getQuizRecommendations(quizzes) {
    const now = new Date();
    
    return quizzes.map(quiz => {
      if (!quiz.lastAttempt) {
        return {
          ...quiz,
          priority: 'high',
          reason: 'New quiz - never attempted',
          daysUntilDue: 0,
          isDue: true
        };
      }

      const lastAttemptDate = new Date(quiz.lastAttempt.date);
      const nextReviewDate = new Date(quiz.lastAttempt.nextReviewDate);
      const daysSinceReview = (now - lastAttemptDate) / (1000 * 60 * 60 * 24);
      const daysUntilDue = (nextReviewDate - now) / (1000 * 60 * 60 * 24);
      const isDue = daysUntilDue <= 0;

      let priority = 'low';
      let reason = 'Review upcoming';

      if (isDue) {
        priority = 'high';
        reason = `Overdue by ${Math.round(Math.abs(daysUntilDue))} days`;
      } else if (daysUntilDue <= 1) {
        priority = 'medium';
        reason = 'Due soon';
      } else if (quiz.lastAttempt.score < 70) {
        priority = 'high';
        reason = 'Low score - needs reinforcement';
      }

      return {
        ...quiz,
        priority,
        reason,
        daysUntilDue: Math.max(0, daysUntilDue),
        isDue,
        retention: this.calculateRetention(daysSinceReview, quiz.lastAttempt.S || 5)
      };
    }).sort((a, b) => {
      // Sort by priority: high > medium > low, then by daysUntilDue
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.daysUntilDue - b.daysUntilDue;
    });
  }

  /**
   * Calculate statistics for a lesson
   * 
   * @param {Object} lesson - Lesson object with quiz attempts
   * @returns {Object} Statistics including average score, learning strength, retention
   */
  static calculateLessonStats(lesson) {
    if (!lesson.quizAttempts || lesson.quizAttempts.length === 0) {
      return {
        averageScore: 0,
        attemptCount: 0,
        averageLearningStrength: 5,
        currentRetention: 0,
        trend: 'neutral'
      };
    }

    const attempts = lesson.quizAttempts;
    const scores = attempts.map(a => a.score);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    // Calculate trend
    let trend = 'neutral';
    if (attempts.length >= 2) {
      const recentAvg = scores.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, scores.length);
      const olderAvg = scores.slice(0, -3).reduce((a, b) => a + b, 0) / Math.max(1, scores.length - 3);
      if (recentAvg > olderAvg + 5) trend = 'improving';
      else if (recentAvg < olderAvg - 5) trend = 'declining';
    }

    // Calculate average learning strength
    const lastAttempt = attempts[attempts.length - 1];
    const averageLearningStrength = lastAttempt.S || 5;

    // Calculate current retention
    const now = new Date();
    const lastDate = new Date(lastAttempt.date);
    const daysSinceReview = (now - lastDate) / (1000 * 60 * 60 * 24);
    const currentRetention = this.calculateRetention(daysSinceReview, averageLearningStrength);

    return {
      averageScore: Math.round(averageScore),
      attemptCount: attempts.length,
      averageLearningStrength: Math.round(averageLearningStrength * 10) / 10,
      currentRetention: Math.round(currentRetention),
      trend,
      nextReviewDate: this.calculateNextReviewDate(averageLearningStrength, lastDate)
    };
  }
}

module.exports = RetentionAlgorithm;
