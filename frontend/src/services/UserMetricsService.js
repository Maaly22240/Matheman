import axios from 'axios';

/**
 * Service for tracking user metrics in real-time to enhance content recommendations
 * Handles tracking various user interactions, learning patterns, and engagement metrics
 */
class UserMetricsService {
    constructor() {
        this.baseUrl = 'http://localhost:5000/api';
        this.sessionId = null;
        this.userId = localStorage.getItem('userId');
        this.token = localStorage.getItem('token');
        this.sessionMetrics = {
            startTime: null,
            interactions: [],
            timeSpentByContent: {},
        };
        this.isTracking = false;
    }

    /**
     * Initialize a metrics tracking session
     * @returns {string} The session ID
     */
    initializeSession() {
        this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.sessionMetrics.startTime = new Date().toISOString();
        this.isTracking = true;
        
        // Store session ID in localStorage for recovery if needed
        localStorage.setItem('currentMetricsSession', this.sessionId);
        
        // Initialize session on the server
        this._saveSessionData();
        
        return this.sessionId;
    }

    /**
     * End the current metrics tracking session
     * Calculates final session metrics and sends to server
     */
    async endSession() {
        if (!this.isTracking) return;
        
        const endTime = new Date().toISOString();
        const sessionDuration = new Date() - new Date(this.sessionMetrics.startTime);
        
        // Add session end data
        this.sessionMetrics.endTime = endTime;
        this.sessionMetrics.duration = sessionDuration;
        
        // Save final session data to server
        await this._saveSessionData();
        
        // Clear local session data
        localStorage.removeItem('currentMetricsSession');
        this.sessionId = null;
        this.isTracking = false;
        this.sessionMetrics = {
            startTime: null,
            interactions: [],
            timeSpentByContent: {},
        };
    }

    /**
     * Track a user interaction with content
     * @param {string} interactionType The type of interaction (view, click, etc.)
     * @param {object} data Additional data about the interaction
     */
    async trackInteraction(interactionType, data = {}) {
        if (!this.isTracking || !this.userId) return;
        
        const interaction = {
            type: interactionType,
            timestamp: new Date().toISOString(),
            data: data
        };
        
        // Add to local session metrics
        this.sessionMetrics.interactions.push(interaction);
        
        // Also send to server immediately for real-time tracking
        try {
            await axios.post(
                `${this.baseUrl}/metrics/interaction`,
                {
                    userId: this.userId,
                    sessionId: this.sessionId,
                    interaction
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
        } catch (error) {
            console.error('Error tracking interaction:', error);
            // Store failed requests for retry
            this._storeFailedRequest('interaction', interaction);
        }
    }

    /**
     * Track time spent on specific content
     * @param {string} contentId ID of the content being viewed
     * @param {string} contentType Type of content (chapter, quiz, etc.)
     * @param {number} timeSpent Time spent in milliseconds
     */
    async trackTimeSpent(contentId, contentType, timeSpent) {
        if (!this.isTracking || !this.userId) return;

        // Update local session metrics
        if (!this.sessionMetrics.timeSpentByContent[contentId]) {
            this.sessionMetrics.timeSpentByContent[contentId] = 0;
        }
        this.sessionMetrics.timeSpentByContent[contentId] += timeSpent;

        // Send to server
        try {
            await axios.post(
                `${this.baseUrl}/metrics/timeSpent`,
                {
                    userId: this.userId,
                    sessionId: this.sessionId,
                    contentId,
                    contentType,
                    timeSpent
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
        } catch (error) {
            console.error('Error tracking time spent:', error);
            this._storeFailedRequest('timeSpent', { contentId, contentType, timeSpent });
        }
    }

    /**
     * Track difficulty rating for content
     * @param {string} contentId ID of the content
     * @param {string} contentType Type of content
     * @param {number} rating Difficulty rating (1-5)
     */
    async trackDifficultyRating(contentId, contentType, rating) {
        if (!this.userId) return;

        try {
            await axios.post(
                `${this.baseUrl}/metrics/difficultyRating`,
                {
                    userId: this.userId,
                    contentId,
                    contentType,
                    rating
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            // Also track as an interaction
            this.trackInteraction('difficulty_rating', {
                contentId,
                contentType,
                rating
            });
            
            return true;
        } catch (error) {
            console.error('Error tracking difficulty rating:', error);
            return false;
        }
    }

    /**
     * Track comprehension level for content
     * @param {string} contentId ID of the content
     * @param {string} contentType Type of content
     * @param {number} level Comprehension level (1-5)
     */
    async trackComprehensionLevel(contentId, contentType, level) {
        if (!this.userId) return;

        try {
            await axios.post(
                `${this.baseUrl}/metrics/comprehensionLevel`,
                {
                    userId: this.userId,
                    contentId,
                    contentType,
                    level
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            // Also track as an interaction
            this.trackInteraction('comprehension_level', {
                contentId,
                contentType,
                level
            });
            
            return true;
        } catch (error) {
            console.error('Error tracking comprehension level:', error);
            return false;
        }
    }

    /**
     * Get personalized content recommendations based on user metrics
     * @returns {Promise<Array>} Array of recommendation objects
     */
    async getPersonalizedRecommendations() {
        if (!this.userId) return [];

        try {
            const response = await axios.get(
                `${this.baseUrl}/recommendations/personalized`,
                {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        sessionId: this.sessionId
                    }
                }
            );
            
            return response.data;
        } catch (error) {
            console.error('Error getting personalized recommendations:', error);
            return [];
        }
    }

    /**
     * Get user learning statistics
     * @returns {Promise<Object>} Object containing learning stats
     */
    async getUserLearningStats() {
        if (!this.userId) return null;

        try {
            const response = await axios.get(
                `${this.baseUrl}/metrics/learningStats`,
                {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            return response.data;
        } catch (error) {
            console.error('Error getting user learning stats:', error);
            return null;
        }
    }

    /**
     * Get learning patterns for a specific user
     * @returns {Promise<Object>} Learning patterns data
     */
    async getLearningPatterns() {
        if (!this.userId) return null;

        try {
            const response = await axios.get(
                `${this.baseUrl}/metrics/learningPatterns`,
                {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            return response.data;
        } catch (error) {
            console.error('Error getting learning patterns:', error);
            return null;
        }
    }

    /**
     * Save current session data to the server
     * @private
     */
    async _saveSessionData() {
        if (!this.userId || !this.sessionId) return;

        try {
            await axios.post(
                `${this.baseUrl}/metrics/session`,
                {
                    userId: this.userId,
                    sessionId: this.sessionId,
                    sessionData: this.sessionMetrics
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
        } catch (error) {
            console.error('Error saving session data:', error);
            // Store for retry
            this._storeFailedRequest('session', this.sessionMetrics);
        }
    }

    /**
     * Store failed requests for later retry
     * @param {string} type Request type
     * @param {object} data Request data
     * @private
     */
    _storeFailedRequest(type, data) {
        const failedRequests = JSON.parse(localStorage.getItem('failedMetricsRequests') || '[]');
        failedRequests.push({
            type,
            data,
            timestamp: new Date().toISOString(),
            userId: this.userId,
            sessionId: this.sessionId
        });
        localStorage.setItem('failedMetricsRequests', JSON.stringify(failedRequests));
    }

    /**
     * Retry sending failed requests
     * @returns {Promise<boolean>} Success status
     */
    async retryFailedRequests() {
        const failedRequests = JSON.parse(localStorage.getItem('failedMetricsRequests') || '[]');
        if (failedRequests.length === 0) return true;

        let allSuccess = true;
        const successfulRetries = [];

        for (const request of failedRequests) {
            try {
                await axios.post(
                    `${this.baseUrl}/metrics/bulkUpdate`,
                    request,
                    {
                        headers: {
                            Authorization: `Bearer ${this.token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                successfulRetries.push(request);
            } catch (error) {
                console.error('Error retrying failed request:', error);
                allSuccess = false;
            }
        }

        // Remove successful retries from failed requests
        if (successfulRetries.length > 0) {
            const remainingRequests = failedRequests.filter(
                req => !successfulRetries.some(
                    successReq => 
                        successReq.timestamp === req.timestamp && 
                        successReq.type === req.type
                )
            );
            localStorage.setItem('failedMetricsRequests', JSON.stringify(remainingRequests));
        }

        return allSuccess;
    }
}

// Create and export singleton instance
const userMetricsService = new UserMetricsService();
export default userMetricsService;