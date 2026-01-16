import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserMetricsService from '../services/UserMetricsService';
import './ContentRecommendations.css';

/**
 * Enhanced ContentRecommendations component with real-time metrics tracking
 * Shows personalized content recommendations based on user engagement
 */
const ContentRecommendations = ({ userId, currentChapterId }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('recommended');
    const [userStats, setUserStats] = useState(null);
    const [feedbackSubmitted, setFeedbackSubmitted] = useState({});
    
    // Initialize user metrics tracking on component mount
    useEffect(() => {
        // Initialize metrics tracking session
        const session = UserMetricsService.initializeSession();
        console.log('Metrics session initialized:', session);
        
        // Track component view
        UserMetricsService.trackInteraction('recommendations_view', {
            currentChapterId,
            timestamp: new Date().toISOString()
        });
        
        // Cleanup function to end the session when component unmounts
        return () => {
            UserMetricsService.endSession();
        };
    }, []);
    
    // Fetch recommendations when component mounts or current chapter changes
    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                setLoading(true);
                
                // First, try to get personalized recommendations through UserMetricsService
                const personalizedRecommendations = await UserMetricsService.getPersonalizedRecommendations();
                
                if (personalizedRecommendations && personalizedRecommendations.length > 0) {
                    setRecommendations(personalizedRecommendations);
                    
                    // Track that recommendations were successfully loaded
                    UserMetricsService.trackInteraction('recommendations_loaded', {
                        count: personalizedRecommendations.length,
                        source: 'personalized'
                    });
                } else {
                    // Fallback to regular API call if no personalized recommendations
                    const token = localStorage.getItem('token');
                    const response = await axios.get(
                        `http://localhost:5000/api/recommendations${currentChapterId ? `?currentChapter=${currentChapterId}` : ''}`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        }
                    );
                    
                    setRecommendations(response.data);
                    
                    // Track that recommendations were loaded from fallback
                    UserMetricsService.trackInteraction('recommendations_loaded', {
                        count: response.data.length,
                        source: 'fallback'
                    });
                }
                
                // Also fetch user learning stats
                const stats = await UserMetricsService.getUserLearningStats();
                setUserStats(stats);
                
            } catch (err) {
                console.error('Error fetching recommendations:', err);
                setError('Failed to load recommendations. Please try again later.');
                
                // Track the error
                UserMetricsService.trackInteraction('recommendations_error', {
                    error: err.message || 'Unknown error'
                });
            } finally {
                setLoading(false);
            }
        };
        
        // Only fetch if we have a userId
        if (userId) {
            fetchRecommendations();
        }
    }, [userId, currentChapterId]);
    
    // Handle recommendation click
    const handleRecommendationClick = (recommendation) => {
        // Track the click
        UserMetricsService.trackInteraction('recommendation_click', {
            recommendationId: recommendation._id,
            type: recommendation.type,
            title: recommendation.title,
            reason: recommendation.reason
        });
        
        // Navigate to the recommended content
        if (recommendation.type === 'chapter') {
            window.location.href = `/learning/chapter/${recommendation._id}`;
        } else if (recommendation.type === 'quiz') {
            window.location.href = `/learning/quiz/${recommendation._id}`;
        } else if (recommendation.type === 'mnemonic') {
            window.location.href = `/learning/mnemonics/${recommendation._id}`;
        }
    };
    
    // Handle difficulty feedback for content
    const handleDifficultyFeedback = async (contentId, contentType, rating) => {
        try {
            // Track difficulty rating through UserMetricsService
            await UserMetricsService.trackDifficultyRating(contentId, contentType, rating);
            
            // Mark this content as having submitted feedback
            setFeedbackSubmitted(prev => ({
                ...prev,
                [contentId]: true
            }));
            
            // Show success message
            alert('Thank you for your feedback!');
        } catch (err) {
            console.error('Error submitting difficulty feedback:', err);
            alert('Failed to submit feedback. Please try again.');
        }
    };
    
    // Handle comprehension feedback for content
    const handleComprehensionFeedback = async (contentId, contentType, level) => {
        try {
            // Track comprehension level through UserMetricsService
            await UserMetricsService.trackComprehensionLevel(contentId, contentType, level);
            
            // Mark this content as having submitted feedback
            setFeedbackSubmitted(prev => ({
                ...prev,
                [contentId]: true
            }));
            
            // Show success message
            alert('Thank you for your feedback!');
        } catch (err) {
            console.error('Error submitting comprehension feedback:', err);
            alert('Failed to submit feedback. Please try again.');
        }
    };
    
    // Dismiss a recommendation
    const handleDismiss = (recommendationId) => {
        // Remove from UI immediately
        setRecommendations(prev => 
            prev.filter(rec => rec._id !== recommendationId)
        );
        
        // Track the dismissal
        UserMetricsService.trackInteraction('recommendation_dismiss', {
            recommendationId
        });
    };
    
    // Filter recommendations based on active tab
    const getFilteredRecommendations = () => {
        if (activeTab === 'recommended') {
            return recommendations;
        } else if (activeTab === 'chapters') {
            return recommendations.filter(rec => rec.type === 'chapter');
        } else if (activeTab === 'quizzes') {
            return recommendations.filter(rec => rec.type === 'quiz');
        } else if (activeTab === 'struggling') {
            return recommendations.filter(rec => rec.reason === 'struggling');
        }
        return recommendations;
    };
    
    // Render recommendation card
    const renderRecommendationCard = (recommendation) => {
        const iconClass = 
            recommendation.type === 'chapter' ? 'book-icon' : 
            recommendation.type === 'quiz' ? 'quiz-icon' : 'mnemonic-icon';
        
        const reasonClass = 
            recommendation.reason === 'next' ? 'next-badge' :
            recommendation.reason === 'struggling' ? 'struggling-badge' :
            recommendation.reason === 'review' ? 'review-badge' : 'suggested-badge';
        
        return (
            <div className="recommendation-card" key={recommendation._id}>
                <div className="recommendation-card-header">
                    <span className={`recommendation-type ${iconClass}`}>
                        {recommendation.type.charAt(0).toUpperCase() + recommendation.type.slice(1)}
                    </span>
                    <span className={`recommendation-reason ${reasonClass}`}>
                        {recommendation.reason === 'next' ? 'Next Up' :
                         recommendation.reason === 'struggling' ? 'Needs Work' :
                         recommendation.reason === 'review' ? 'Review' : 'Suggested'}
                    </span>
                    <button 
                        className="dismiss-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDismiss(recommendation._id);
                        }}
                    >
                        &times;
                    </button>
                </div>
                
                <div 
                    className="recommendation-content"
                    onClick={() => handleRecommendationClick(recommendation)}
                >
                    <h3 className="recommendation-title">{recommendation.title}</h3>
                    <p className="recommendation-description">{recommendation.description}</p>
                    
                    <div className="recommendation-metadata">
                        {recommendation.estimatedTime && (
                            <span className="estimated-time">
                                {recommendation.estimatedTime} min
                            </span>
                        )}
                        {recommendation.difficulty && (
                            <span className={`difficulty-level difficulty-${recommendation.difficulty.toLowerCase()}`}>
                                {recommendation.difficulty}
                            </span>
                        )}
                    </div>
                </div>
                
                {!feedbackSubmitted[recommendation._id] && (
                    <div className="recommendation-feedback">
                        <div className="feedback-section">
                            <p>How difficult was this content?</p>
                            <div className="rating-buttons">
                                {[1, 2, 3, 4, 5].map(rating => (
                                    <button
                                        key={rating}
                                        className="rating-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDifficultyFeedback(recommendation._id, recommendation.type, rating);
                                        }}
                                    >
                                        {rating}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="feedback-section">
                            <p>How well did you understand it?</p>
                            <div className="rating-buttons">
                                {[1, 2, 3, 4, 5].map(level => (
                                    <button
                                        key={level}
                                        className="rating-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleComprehensionFeedback(recommendation._id, recommendation.type, level);
                                        }}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };
    
    // Render progress stats if available
    const renderProgressStats = () => {
        if (!userStats) return null;
        
        return (
            <div className="learning-stats">
                <h3>Your Learning Progress</h3>
                <div className="stats-container">
                    <div className="stat-item">
                        <span className="stat-value">{userStats.completedContent || 0}</span>
                        <span className="stat-label">Completed Items</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{userStats.avgQuizScore || 0}%</span>
                        <span className="stat-label">Quiz Average</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{userStats.totalTimeSpent || 0} min</span>
                        <span className="stat-label">Time Spent</span>
                    </div>
                </div>
                
                {userStats.streakDays > 0 && (
                    <div className="streak-container">
                        <span className="streak-label">Current streak:</span>
                        <span className="streak-value">{userStats.streakDays} days</span>
                    </div>
                )}
                
                {userStats.areasOfFocus && userStats.areasOfFocus.length > 0 && (
                    <div className="focus-areas">
                        <h4>Areas to focus on:</h4>
                        <ul>
                            {userStats.areasOfFocus.map((area, index) => (
                                <li key={index}>{area}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };
    
    if (loading) {
        return <div className="recommendations-loading">Loading personalized recommendations...</div>;
    }
    
    if (error) {
        return <div className="recommendations-error">{error}</div>;
    }
    
    if (recommendations.length === 0) {
        return (
            <div className="no-recommendations">
                <h3>No recommendations available</h3>
                <p>As you continue learning, we'll provide personalized recommendations here.</p>
            </div>
        );
    }
    
    return (
        <div className="content-recommendations">
            <h2>Recommended for you</h2>
            
            {renderProgressStats()}
            
            <div className="recommendation-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'recommended' ? 'active' : ''}`}
                    onClick={() => setActiveTab('recommended')}
                >
                    All
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'chapters' ? 'active' : ''}`}
                    onClick={() => setActiveTab('chapters')}
                >
                    Chapters
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'quizzes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('quizzes')}
                >
                    Quizzes
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'struggling' ? 'active' : ''}`}
                    onClick={() => setActiveTab('struggling')}
                >
                    Needs Work
                </button>
            </div>
            
            <div className="recommendations-container">
                {getFilteredRecommendations().map(recommendation => renderRecommendationCard(recommendation))}
            </div>
        </div>
    );
};

export default ContentRecommendations;