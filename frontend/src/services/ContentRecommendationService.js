import axios from 'axios';

/**
 * Implementation of matrix factorization algorithm for collaborative filtering
 * This class handles the core matrix factorization calculations
 */
class MatrixFactorization {
    /**
     * Initialize a new matrix factorization model
     * @param {number} numFactors - Number of latent factors to use
     * @param {number} learningRate - Learning rate for SGD optimization
     * @param {number} regularization - Regularization parameter to prevent overfitting
     * @param {number} epochs - Number of training epochs
     */
    constructor(numFactors = 10, learningRate = 0.01, regularization = 0.1, epochs = 20) {
        this.numFactors = numFactors;
        this.learningRate = learningRate;
        this.regularization = regularization;
        this.epochs = epochs;
        this.userFactors = {}; // userId -> factor vector
        this.itemFactors = {}; // itemId -> factor vector
        this.trained = false;
    }

    /**
     * Initialize random factor vectors for a user or item
     * @returns {Array} Random factor vector of length numFactors
     */
    _initializeFactors() {
        return Array.from({ length: this.numFactors }, 
            () => Math.random() * 0.1); // Small random values
    }

    /**
     * Create user-item interaction matrix from raw data
     * @param {Array} data - Array of user-item interactions with ratings
     * @returns {Object} Sparse interaction matrix and metadata
     */
    _createMatrix(data) {
        const matrix = {};
        const userIndices = new Set();
        const itemIndices = new Set();

        // Create sparse matrix of user-item interactions
        data.forEach(entry => {
            const { userId, itemId, rating } = entry;
            if (!matrix[userId]) matrix[userId] = {};
            matrix[userId][itemId] = rating;
            userIndices.add(userId);
            itemIndices.add(itemId);
        });

        return {
            matrix,
            userIndices: Array.from(userIndices),
            itemIndices: Array.from(itemIndices)
        };
    }

    /**
     * Predict rating for a user-item pair using dot product of factor vectors
     * @param {string} userId - User ID
     * @param {string} itemId - Item ID 
     * @returns {number} Predicted rating
     */
    predict(userId, itemId) {
        // If model not trained or missing factors, return default value
        if (!this.trained || !this.userFactors[userId] || !this.itemFactors[itemId]) {
            return 0.5; // Default middle rating
        }
        
        // Dot product of user and item factor vectors
        const userFactors = this.userFactors[userId];
        const itemFactors = this.itemFactors[itemId];
        
        // Calculate dot product
        let prediction = 0;
        for (let i = 0; i < this.numFactors; i++) {
            prediction += userFactors[i] * itemFactors[i];
        }
        
        // Bound prediction between 0 and 1
        return Math.max(0, Math.min(1, prediction));
    }

    /**
     * Train the matrix factorization model using Stochastic Gradient Descent
     * @param {Array} trainingData - Array of {userId, itemId, rating} objects
     */
    train(trainingData) {
        console.log(`Training matrix factorization model with ${trainingData.length} data points...`);
        const { matrix, userIndices, itemIndices } = this._createMatrix(trainingData);
        
        // Initialize factors for all users and items
        userIndices.forEach(userId => {
            this.userFactors[userId] = this._initializeFactors();
        });
        
        itemIndices.forEach(itemId => {
            this.itemFactors[itemId] = this._initializeFactors();
        });
        
        // Run SGD for specified number of epochs
        for (let epoch = 0; epoch < this.epochs; epoch++) {
            let totalError = 0;
            let count = 0;
            
            // Iterate through all known ratings
            for (const userId of userIndices) {
                const userRatings = matrix[userId];
                if (!userRatings) continue;
                
                for (const itemId in userRatings) {
                    const actualRating = userRatings[itemId];
                    const predictedRating = this.predict(userId, itemId);
                    
                    // Calculate error
                    const error = actualRating - predictedRating;
                    totalError += error * error;
                    count++;
                    
                    // Update user and item factors using gradient descent
                    for (let f = 0; f < this.numFactors; f++) {
                        const userFactorOld = this.userFactors[userId][f];
                        const itemFactorOld = this.itemFactors[itemId][f];
                        
                        // Update user factor
                        this.userFactors[userId][f] += this.learningRate * 
                            (error * itemFactorOld - this.regularization * userFactorOld);
                        
                        // Update item factor
                        this.itemFactors[itemId][f] += this.learningRate * 
                            (error * userFactorOld - this.regularization * itemFactorOld);
                    }
                }
            }
            
            // Calculate RMSE for this epoch
            const rmse = Math.sqrt(totalError / Math.max(1, count));
            if (epoch % 5 === 0) {
                console.log(`Epoch ${epoch}: RMSE = ${rmse.toFixed(4)}`);
            }
        }
        
        this.trained = true;
        console.log('Matrix factorization model training completed.');
    }

    /**
     * Recommend items for a specific user
     * @param {string} userId - User ID
     * @param {Array} itemIds - Array of all available item IDs
     * @param {Array} excludeIds - Array of item IDs to exclude (already seen)
     * @param {number} n - Number of recommendations to return
     * @returns {Array} Array of recommended item IDs with scores
     */
    getRecommendations(userId, itemIds, excludeIds = [], n = 5) {
        if (!this.trained || !this.userFactors[userId]) {
            return []; // Cannot recommend if model not trained or user unknown
        }
        
        // Convert excludeIds to Set for faster lookup
        const excludeSet = new Set(excludeIds);
        
        // Calculate predictions for all candidate items
        const predictions = itemIds
            .filter(itemId => !excludeSet.has(itemId) && this.itemFactors[itemId])
            .map(itemId => ({
                itemId,
                score: this.predict(userId, itemId)
            }));
        
        // Sort by predicted score and take top n
        return predictions
            .sort((a, b) => b.score - a.score)
            .slice(0, n);
    }
    
    /**
     * Add a new user to the model with initialized factors
     * @param {string} userId - User ID to add
     */
    addUser(userId) {
        if (!this.userFactors[userId]) {
            this.userFactors[userId] = this._initializeFactors();
        }
    }
    
    /**
     * Add a new item to the model with initialized factors
     * @param {string} itemId - Item ID to add
     */
    addItem(itemId) {
        if (!this.itemFactors[itemId]) {
            this.itemFactors[itemId] = this._initializeFactors();
        }
    }
    
    /**
     * Update the model with new ratings (online learning)
     * @param {Array} newRatings - Array of {userId, itemId, rating} objects
     * @param {number} iterations - Number of update iterations
     */
    update(newRatings, iterations = 5) {
        if (!this.trained) {
            // If model is not trained, just train from scratch
            this.train(newRatings);
            return;
        }
        
        // Add any new users or items
        newRatings.forEach(rating => {
            const { userId, itemId } = rating;
            this.addUser(userId);
            this.addItem(itemId);
        });
        
        // Update model with mini-batch SGD
        for (let iter = 0; iter < iterations; iter++) {
            let totalError = 0;
            
            for (const { userId, itemId, rating } of newRatings) {
                const predictedRating = this.predict(userId, itemId);
                const error = rating - predictedRating;
                totalError += error * error;
                
                // Update factors for this rating
                for (let f = 0; f < this.numFactors; f++) {
                    const userFactorOld = this.userFactors[userId][f];
                    const itemFactorOld = this.itemFactors[itemId][f];
                    
                    this.userFactors[userId][f] += this.learningRate * 0.5 * 
                        (error * itemFactorOld - this.regularization * userFactorOld);
                    
                    this.itemFactors[itemId][f] += this.learningRate * 0.5 * 
                        (error * userFactorOld - this.regularization * itemFactorOld);
                }
            }
            
            const rmse = Math.sqrt(totalError / newRatings.length);
            console.log(`Update iteration ${iter}: RMSE = ${rmse.toFixed(4)}`);
        }
    }
    
    /**
     * Find similar items based on their factor vectors
     * @param {string} itemId - Reference item ID
     * @param {number} n - Number of similar items to return
     * @returns {Array} Array of similar item IDs with similarity scores
     */
    getSimilarItems(itemId, n = 5) {
        if (!this.itemFactors[itemId]) return [];
        
        const referenceFactors = this.itemFactors[itemId];
        const similarities = [];
        
        // Calculate cosine similarity with all other items
        for (const otherId in this.itemFactors) {
            if (otherId === itemId) continue;
            
            const otherFactors = this.itemFactors[otherId];
            let dotProduct = 0;
            let refMagnitude = 0;
            let otherMagnitude = 0;
            
            // Calculate dot product and magnitudes
            for (let f = 0; f < this.numFactors; f++) {
                dotProduct += referenceFactors[f] * otherFactors[f];
                refMagnitude += referenceFactors[f] * referenceFactors[f];
                otherMagnitude += otherFactors[f] * otherFactors[f];
            }
            
            // Calculate cosine similarity
            const similarity = dotProduct / (Math.sqrt(refMagnitude) * Math.sqrt(otherMagnitude) || 1);
            
            similarities.push({
                itemId: otherId,
                similarity
            });
        }
        
        // Sort by similarity and return top n
        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, n);
    }
    
    /**
     * Save the model to localStorage
     */
    saveModel() {
        try {
            localStorage.setItem('mf_user_factors', JSON.stringify(this.userFactors));
            localStorage.setItem('mf_item_factors', JSON.stringify(this.itemFactors));
            localStorage.setItem('mf_metadata', JSON.stringify({
                numFactors: this.numFactors,
                trained: this.trained,
                timestamp: new Date().toISOString()
            }));
            console.log('Matrix factorization model saved to localStorage');
        } catch (e) {
            console.error('Error saving matrix factorization model:', e);
        }
    }
    
    /**
     * Load the model from localStorage
     * @returns {boolean} Whether the model was successfully loaded
     */
    loadModel() {
        try {
            const userFactors = localStorage.getItem('mf_user_factors');
            const itemFactors = localStorage.getItem('mf_item_factors');
            const metadata = localStorage.getItem('mf_metadata');
            
            if (!userFactors || !itemFactors || !metadata) {
                return false;
            }
            
            this.userFactors = JSON.parse(userFactors);
            this.itemFactors = JSON.parse(itemFactors);
            
            const { numFactors, trained } = JSON.parse(metadata);
            this.numFactors = numFactors;
            this.trained = trained;
            
            console.log('Matrix factorization model loaded from localStorage');
            return true;
        } catch (e) {
            console.error('Error loading matrix factorization model:', e);
            return false;
        }
    }
}

/**
 * ContentRecommendationService provides methods for recommending content to users
 * based on their past behavior and preferences using matrix factorization.
 */
class ContentRecommendationService {
    // Matrix factorization model parameters
    static MODEL_KEY = 'matrix_factorization_model';
    static NUM_FEATURES = 10;
    static LEARNING_RATE = 0.01;
    static REGULARIZATION = 0.1;
    static MAX_ITERATIONS = 100;
    static CONVERGENCE_THRESHOLD = 0.001;

    /**
     * Train the matrix factorization model using user interaction data
     */
    static trainMatrixFactorizationModel() {
        try {
            // Get user interactions from local storage
            const userMetrics = this.getUserMetrics();
            const interactions = this.collectUserInteractions(userMetrics);
            
            if (interactions.length < 5) {
                console.log('Not enough interaction data to train matrix factorization model');
                return;
            }
            
            // Initialize model if not exists
            let model = this.getMatrixFactorizationModel();
            if (!model) {
                model = this.initializeMatrixFactorizationModel(interactions);
            } else {
                // Update the model with new items/users if needed
                model = this.updateModelWithNewEntities(model, interactions);
            }
            
            // Train the model
            console.log('Training matrix factorization model...');
            const updatedModel = this.trainModel(model, interactions);
            
            // Save the updated model
            localStorage.setItem(this.MODEL_KEY, JSON.stringify(updatedModel));
            console.log('Matrix factorization model training complete');
            
        } catch (e) {
            console.error('Error training matrix factorization model:', e);
        }
    }
    
    /**
     * Collect user interactions from various metrics
     * @param {Object} userMetrics - User metrics
     * @returns {Array} Array of interaction objects
     */
    static collectUserInteractions(userMetrics) {
        const interactions = [];
        const userId = localStorage.getItem('userId') || 'anonymous';
        
        // Process click counts
        if (userMetrics.clickCounts) {
            Object.entries(userMetrics.clickCounts).forEach(([contentId, count]) => {
                interactions.push({
                    userId,
                    contentId,
                    rating: Math.min(count / 2, 5) // Scale clicks to rating (0-5)
                });
            });
        }
        
        // Process viewed content
        if (userMetrics.viewed) {
            Object.keys(userMetrics.viewed).forEach(contentId => {
                // Only add if not already added from click counts
                if (!userMetrics.clickCounts || !userMetrics.clickCounts[contentId]) {
                    interactions.push({
                        userId,
                        contentId,
                        rating: 3 // Neutral rating for just viewing
                    });
                }
            });
        }
        
        // Process completion times
        if (userMetrics.completionTimes) {
            Object.entries(userMetrics.completionTimes).forEach(([contentId, time]) => {
                // Higher rating for faster completion
                const rating = Math.max(5 - (time / 60000), 1); // Convert ms to minutes and scale
                
                // Look for existing interaction
                const existingIndex = interactions.findIndex(
                    i => i.userId === userId && i.contentId === contentId
                );
                
                if (existingIndex >= 0) {
                    // Update existing rating (average with previous)
                    interactions[existingIndex].rating = 
                        (interactions[existingIndex].rating + rating) / 2;
                } else {
                    // Add new interaction
                    interactions.push({
                        userId,
                        contentId,
                        rating
                    });
                }
            });
        }
        
        // Process quiz performance
        if (userMetrics.performanceScores) {
            Object.entries(userMetrics.performanceScores).forEach(([contentId, score]) => {
                // Scale score to rating (0-5)
                const rating = Math.min(score * 5, 5);
                
                // Look for existing interaction
                const existingIndex = interactions.findIndex(
                    i => i.userId === userId && i.contentId === contentId
                );
                
                if (existingIndex >= 0) {
                    // Update existing rating (average with previous)
                    interactions[existingIndex].rating = 
                        (interactions[existingIndex].rating + rating) / 2;
                } else {
                    // Add new interaction
                    interactions.push({
                        userId,
                        contentId,
                        rating
                    });
                }
            });
        }
        
        return interactions;
    }
    
    /**
     * Get the stored matrix factorization model
     * @returns {Object|null} The matrix factorization model or null if not exists
     */
    static getMatrixFactorizationModel() {
        try {
            const modelJson = localStorage.getItem(this.MODEL_KEY);
            return modelJson ? JSON.parse(modelJson) : null;
        } catch (e) {
            console.error('Error getting matrix factorization model:', e);
            return null;
        }
    }
    
    /**
     * Initialize a new matrix factorization model
     * @param {Array} interactions - User-content interactions
     * @returns {Object} The initialized model
     */
    static initializeMatrixFactorizationModel(interactions) {
        // Extract unique users and content items
        const userIds = [...new Set(interactions.map(i => i.userId))];
        const contentIds = [...new Set(interactions.map(i => i.contentId))];
        
        // Initialize user and item feature matrices with small random values
        const userFeatures = {};
        userIds.forEach(userId => {
            userFeatures[userId] = Array.from(
                { length: this.NUM_FEATURES }, 
                () => Math.random() * 0.1
            );
        });
        
        const itemFeatures = {};
        contentIds.forEach(contentId => {
            itemFeatures[contentId] = Array.from(
                { length: this.NUM_FEATURES }, 
                () => Math.random() * 0.1
            );
        });
        
        return {
            userFeatures,
            itemFeatures,
            meanRating: this.calculateMeanRating(interactions)
        };
    }
    
    /**
     * Update model with new users or content items
     * @param {Object} model - The existing model
     * @param {Array} interactions - User-content interactions
     * @returns {Object} The updated model
     */
    static updateModelWithNewEntities(model, interactions) {
        // Extract unique users and content items
        const userIds = [...new Set(interactions.map(i => i.userId))];
        const contentIds = [...new Set(interactions.map(i => i.contentId))];
        
        // Add new users
        userIds.forEach(userId => {
            if (!model.userFeatures[userId]) {
                model.userFeatures[userId] = Array.from(
                    { length: this.NUM_FEATURES }, 
                    () => Math.random() * 0.1
                );
            }
        });
        
        // Add new content items
        contentIds.forEach(contentId => {
            if (!model.itemFeatures[contentId]) {
                model.itemFeatures[contentId] = Array.from(
                    { length: this.NUM_FEATURES }, 
                    () => Math.random() * 0.1
                );
            }
        });
        
        return model;
    }
    
    /**
     * Calculate the mean rating across all interactions
     * @param {Array} interactions - User-content interactions
     * @returns {number} The mean rating
     */
    static calculateMeanRating(interactions) {
        const sum = interactions.reduce((acc, i) => acc + i.rating, 0);
        return sum / interactions.length;
    }
    
    /**
     * Train the matrix factorization model
     * @param {Object} model - The model to train
     * @param {Array} interactions - User-content interactions
     * @returns {Object} The trained model
     */
    static trainModel(model, interactions) {
        const { userFeatures, itemFeatures, meanRating } = model;
        
        // Training variables
        let prevError = Number.MAX_VALUE;
        
        // Iterate until convergence or max iterations
        for (let iter = 0; iter < this.MAX_ITERATIONS; iter++) {
            let error = 0;
            
            // Process each user-item interaction
            interactions.forEach(interaction => {
                const { userId, contentId, rating } = interaction;
                
                // Skip if no features for this user or item (shouldn't happen but just in case)
                if (!userFeatures[userId] || !itemFeatures[contentId]) return;
                
                // Calculate predicted rating
                const predicted = this.predictRating(
                    userFeatures[userId], 
                    itemFeatures[contentId],
                    meanRating
                );
                
                // Calculate error
                const err = rating - predicted;
                error += err * err;
                
                // Update user and item features
                for (let f = 0; f < this.NUM_FEATURES; f++) {
                    const userValue = userFeatures[userId][f];
                    const itemValue = itemFeatures[contentId][f];
                    
                    // Update user feature
                    userFeatures[userId][f] += this.LEARNING_RATE * (
                        err * itemValue - this.REGULARIZATION * userValue
                    );
                    
                    // Update item feature
                    itemFeatures[contentId][f] += this.LEARNING_RATE * (
                        err * userValue - this.REGULARIZATION * itemValue
                    );
                }
            });
            
            // Check for convergence
            error = Math.sqrt(error / interactions.length);
            if (Math.abs(error - prevError) < this.CONVERGENCE_THRESHOLD) {
                console.log(`Matrix factorization converged after ${iter + 1} iterations`);
                break;
            }
            prevError = error;
        }
        
        return { userFeatures, itemFeatures, meanRating };
    }
    
    /**
     * Predict rating for a user-item pair
     * @param {Array} userFeatures - User feature vector
     * @param {Array} itemFeatures - Item feature vector
     * @param {number} meanRating - Mean rating across all interactions
     * @returns {number} Predicted rating
     */
    static predictRating(userFeatures, itemFeatures, meanRating) {
        let sum = meanRating;
        
        // Dot product of user and item features
        for (let f = 0; f < userFeatures.length; f++) {
            sum += userFeatures[f] * itemFeatures[f];
        }
        
        // Clamp to valid rating range (0-5)
        return Math.max(0, Math.min(5, sum));
    }
    
    /**
     * Get recommendations using matrix factorization
     * @param {Array} availableContent - Available content items
     * @param {Array} alreadyViewed - Array of already viewed content IDs
     * @param {number} limit - Maximum number of recommendations to return
     * @returns {Array} Array of recommended content items
     */
    static getMatrixFactorizationRecommendations(availableContent, alreadyViewed, limit = 3) {
        try {
            // Get current user ID
            const userId = localStorage.getItem('userId') || 'anonymous';
            
            // Get matrix factorization model
            const model = this.getMatrixFactorizationModel();
            if (!model || !model.userFeatures[userId]) {
                console.log('No matrix factorization model for current user');
                return [];
            }
            
            // Filter out already viewed content
            const unviewedContent = availableContent.filter(
                item => !alreadyViewed.includes(item.id)
            );
            
            if (unviewedContent.length === 0) return [];
            
            // Calculate predicted ratings for all unviewed content
            const predictions = unviewedContent
                .map(item => {
                    // Skip if no features for this item
                    if (!model.itemFeatures[item.id]) {
                        return {
                            ...item,
                            predictedRating: 0
                        };
                    }
                    
                    // Calculate predicted rating
                    const predictedRating = this.predictRating(
                        model.userFeatures[userId],
                        model.itemFeatures[item.id],
                        model.meanRating
                    );
                    
                    return {
                        ...item,
                        predictedRating,
                        recommendationSource: 'matrix-factorization'
                    };
                })
                .filter(item => item.predictedRating > 0) // Only consider items with positive predictions
                .sort((a, b) => b.predictedRating - a.predictedRating) // Sort by predicted rating
                .slice(0, limit); // Take top N
            
            return predictions;
        } catch (e) {
            console.error('Error getting matrix factorization recommendations:', e);
            return [];
        }
    }
    
    /**
     * Get similar content items based on latent features
     * @param {string} contentId - Content ID to find similar items for
     * @param {Array} availableContent - Available content items
     * @param {number} limit - Maximum number of similar items to return
     * @returns {Array} Array of similar content items
     */
    static getSimilarContentItems(contentId, availableContent, limit = 3) {
        try {
            // Get matrix factorization model
            const model = this.getMatrixFactorizationModel();
            if (!model || !model.itemFeatures[contentId]) {
                return [];
            }
            
            // Calculate similarity with all available content
            const similarities = availableContent
                .filter(item => item.id !== contentId) // Exclude the item itself
                .map(item => {
                    // Skip if no features for this item
                    if (!model.itemFeatures[item.id]) {
                        return {
                            ...item,
                            similarity: 0
                        };
                    }
                    
                    // Calculate cosine similarity
                    const similarity = this.calculateCosineSimilarity(
                        model.itemFeatures[contentId],
                        model.itemFeatures[item.id]
                    );
                    
                    return {
                        ...item,
                        similarity,
                        recommendationSource: 'similarity'
                    };
                })
                .filter(item => item.similarity > 0.5) // Only consider items with good similarity
                .sort((a, b) => b.similarity - a.similarity) // Sort by similarity
                .slice(0, limit); // Take top N
            
            return similarities;
        } catch (e) {
            console.error('Error getting similar content items:', e);
            return [];
        }
    }
    
    /**
     * Calculate cosine similarity between two feature vectors
     * @param {Array} v1 - First vector
     * @param {Array} v2 - Second vector
     * @returns {number} Cosine similarity (0-1)
     */
    static calculateCosineSimilarity(v1, v2) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < v1.length; i++) {
            dotProduct += v1[i] * v2[i];
            normA += v1[i] * v1[i];
            normB += v2[i] * v2[i];
        }
        
        if (normA === 0 || normB === 0) return 0;
        
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}

export default ContentRecommendationService;