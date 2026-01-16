import axios from 'axios';

/**
 * Service class for handling quiz-related operations
 * Supports various learning techniques including spaced repetition
 */
class QuizService {
    // Fetch a quiz by ID
    static async getQuizById(quizId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');
            
            const response = await axios.get(`http://localhost:5000/api/quizzes/${quizId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            return response.data;
        } catch (error) {
            console.error(`Error fetching quiz ${quizId}:`, error);
            throw error;
        }
    }
    
    // Fetch quizzes for a specific chapter
    static async getQuizzesByChapter(chapterId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');
            
            const response = await axios.get(`http://localhost:5000/api/quizzes/chapter/${chapterId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            return response.data;
        } catch (error) {
            console.error(`Error fetching quizzes for chapter ${chapterId}:`, error);
            throw error;
        }
    }
    
    // Submit quiz answers
    static async submitQuizAttempt(quizId, answers) {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');
            
            const response = await axios.post(
                `http://localhost:5000/api/quizzes/${quizId}/attempt`,
                { answers },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            // If it's a spaced repetition quiz, update local tracking
            const quiz = await this.getQuizById(quizId);
            if (quiz.type === 'spaced-repetition') {
                this.trackSpacedRepetition(quizId, response.data.score);
            }
            
            return response.data;
        } catch (error) {
            console.error(`Error submitting quiz ${quizId}:`, error);
            throw error;
        }
    }
    
    // Calculate next review date for spaced repetition
    static calculateSpacedRepetitionInterval(score) {
        // Implement an expanded spaced repetition algorithm
        // The better the performance, the longer we can wait before the next review
        if (score >= 95) return 30;      // 1 month
        if (score >= 90) return 21;      // 3 weeks
        if (score >= 80) return 14;      // 2 weeks
        if (score >= 70) return 7;       // 1 week
        if (score >= 60) return 3;       // 3 days
        if (score >= 40) return 2;       // 2 days
        return 1;                        // 1 day - needs immediate review
    }
    
    // Track spaced repetition quiz in local storage
    static trackSpacedRepetition(quizId, score) {
        const nextReviewDays = this.calculateSpacedRepetitionInterval(score);
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + nextReviewDays);
        
        const spacedData = {
            lastAttempt: new Date().toISOString(),
            score: score,
            nextReview: nextReview.toISOString(),
            reviewCount: 1
        };
        
        // Get existing data or initialize
        const existingData = localStorage.getItem(`spaced_quiz_${quizId}`);
        if (existingData) {
            const parsed = JSON.parse(existingData);
            spacedData.reviewCount = (parsed.reviewCount || 0) + 1;
            
            // Adjust interval based on review history
            if (spacedData.reviewCount > 3 && score > 80) {
                // Extend the interval more aggressively for well-known material
                const extraDays = Math.min(spacedData.reviewCount * 2, 30);
                nextReview.setDate(nextReview.getDate() + extraDays);
                spacedData.nextReview = nextReview.toISOString();
            }
        }
        
        localStorage.setItem(`spaced_quiz_${quizId}`, JSON.stringify(spacedData));
        return nextReview;
    }
    
    // Check if a spaced repetition quiz is due for review
    static isSpacedRepetitionDue(quizId) {
        const data = localStorage.getItem(`spaced_quiz_${quizId}`);
        if (!data) return true; // If no record exists, it's due
        
        const parsed = JSON.parse(data);
        const nextReview = new Date(parsed.nextReview);
        return new Date() >= nextReview;
    }
    
    // Get all due spaced repetition quizzes
    static getDueSpacedRepetitionQuizzes() {
        const dueQuizzes = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('spaced_quiz_')) {
                const quizId = key.replace('spaced_quiz_', '');
                if (this.isSpacedRepetitionDue(quizId)) {
                    dueQuizzes.push(quizId);
                }
            }
        }
        
        return dueQuizzes;
    }
    
    // Get recommended quizzes based on learning needs
    static async getRecommendedQuizzes() {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');
            
            // Get quizzes that are due for spaced repetition
            const dueQuizIds = this.getDueSpacedRepetitionQuizzes();
            const dueQuizzes = [];
            
            for (const quizId of dueQuizIds) {
                try {
                    const quiz = await this.getQuizById(quizId);
                    dueQuizzes.push({
                        ...quiz,
                        isDue: true,
                        priority: 'high',
                        reason: 'Scheduled for review'
                    });
                } catch (error) {
                    console.log(`Could not fetch quiz ${quizId}, may have been deleted`);
                }
            }
            
            return dueQuizzes;
        } catch (error) {
            console.error('Error getting recommended quizzes:', error);
            return [];
        }
    }
    
    // Get interleaved practice quizzes that mix concepts
    static getInterleavedQuizzes(quizzes) {
        // Group quizzes by topic to create interleaved practice sets
        const topicGroups = {};
        
        quizzes.forEach(quiz => {
            // Extract topic from quiz title or tags
            const topic = (quiz.tags && quiz.tags[0]) || 
                         quiz.title.split('-')[0].trim();
                         
            if (!topicGroups[topic]) {
                topicGroups[topic] = [];
            }
            
            topicGroups[topic].push(quiz);
        });
        
        // Create interleaved sets by taking one quiz from each topic
        const interleavedSets = [];
        let hasQuizzes = true;
        let index = 0;
        
        while (hasQuizzes) {
            hasQuizzes = false;
            const currentSet = [];
            
            for (const topic in topicGroups) {
                if (topicGroups[topic].length > index) {
                    currentSet.push(topicGroups[topic][index]);
                    hasQuizzes = true;
                }
            }
            
            if (currentSet.length > 0) {
                interleavedSets.push(currentSet);
            }
            
            index++;
        }
        
        return interleavedSets;
    }
}

export default QuizService;
