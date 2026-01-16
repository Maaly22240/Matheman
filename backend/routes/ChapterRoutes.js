const express = require('express');
const router = express.Router();
const Chapter = require('../models/Chapter');
const { authenticateToken } = require('../middleware/auth'); // Import the shared middleware

// Get a chapter by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const chapterId = req.params.id;
        
        const chapter = await Chapter.findById(chapterId);

        if (!chapter) {
            return res.status(404).json({ message: 'Chapter not found' });
        }

        res.status(200).json(chapter);
    } catch (error) {
        console.error('Error fetching chapter:', error);
        res.status(500).json({ message: 'Error retrieving chapter data' });
    }
});

// Get content items for a chapter (videos, games, images)
router.get('/:id/content', authenticateToken, async (req, res) => {
    try {
        const chapterId = req.params.id;
        
        // Fetch the chapter to ensure it exists
        const chapter = await Chapter.findById(chapterId);
        if (!chapter) {
            return res.status(404).json({ message: 'Chapter not found' });
        }

        // Simulated content items - in a real system this would be fetched from a database
        // The content items are dummy data for demonstration
        const contentItems = [
            {
                id: `video-${chapterId}-1`,
                type: 'video',
                title: 'Introduction to Key Concepts',
                description: 'A comprehensive introduction to the main ideas covered in this chapter.',
                url: 'https://example.com/videos/intro-concepts',
                duration: 12,
                chapterId: chapterId,
                difficulty: 'beginner',
                tags: ['introduction', 'concepts']
            },
            {
                id: `game-${chapterId}-1`,
                type: 'game',
                title: 'Interactive Problem Solving',
                description: 'Practice the concepts with this interactive exercise.',
                url: 'https://example.com/games/interactive-problem',
                duration: 15,
                chapterId: chapterId,
                difficulty: 'intermediate',
                tags: ['practice', 'interactive']
            },
            {
                id: `video-${chapterId}-2`,
                type: 'video',
                title: 'Advanced Applications',
                description: 'Explore advanced applications of the concepts covered in this chapter.',
                url: 'https://example.com/videos/advanced-apps',
                duration: 18,
                chapterId: chapterId,
                difficulty: 'advanced',
                tags: ['advanced', 'applications']
            },
            {
                id: `image-${chapterId}-1`,
                type: 'image',
                title: 'Visual Representation of Concepts',
                description: 'A diagram illustrating the relationship between key ideas.',
                url: 'https://example.com/images/visual-diagram',
                chapterId: chapterId,
                tags: ['visual', 'diagram']
            },
            {
                id: `game-${chapterId}-2`,
                type: 'game',
                title: 'Concept Challenge',
                description: 'Test your understanding with this challenging interactive game.',
                url: 'https://example.com/games/challenge',
                duration: 10,
                chapterId: chapterId,
                difficulty: 'advanced',
                tags: ['challenge', 'test']
            }
        ];

        res.status(200).json(contentItems);
    } catch (error) {
        console.error('Error fetching chapter content:', error);
        res.status(500).json({ message: 'Error retrieving content data' });
    }
});

module.exports = router;
