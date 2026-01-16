const Chapter = require('../models/Chapter');

// Get all chapters
exports.getAllChapters = async (req, res) => {
    try {
        const chapters = await Chapter.find();
        res.status(200).json(chapters);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching chapters', error });
    }
};

// Get a chapter by ID
const getChapterById = async (req, res) => {
    try {
        const chapterId = req.params.id;

        const chapter = await Chapter.findById(chapterId)
            .populate('quizzes')
            .exec();

        if (!chapter) {
            return res.status(404).json({ message: 'Chapter not found' });
        }

        res.status(200).json(chapter);
    } catch (error) {
        console.error('Error fetching chapter:', error);
        res.status(500).json({ message: 'Error retrieving chapter data' });
    }
};

// Create a chapter
exports.createChapter = async (req, res) => {
    try {
        const chapter = new Chapter(req.body);
        await chapter.save();
        res.status(201).json({ message: 'Chapter created successfully', chapter });
    } catch (error) {
        res.status(500).json({ message: 'Error creating chapter', error });
    }
};

// Update a chapter
exports.updateChapter = async (req, res) => {
    try {
        const chapter = await Chapter.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!chapter) return res.status(404).json({ message: 'Chapter not found' });
        res.status(200).json({ message: 'Chapter updated successfully', chapter });
    } catch (error) {
        res.status(500).json({ message: 'Error updating chapter', error });
    }
};

// Delete a chapter
exports.deleteChapter = async (req, res) => {
    try {
        const chapter = await Chapter.findByIdAndDelete(req.params.id);
        if (!chapter) return res.status(404).json({ message: 'Chapter not found' });
        res.status(200).json({ message: 'Chapter deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting chapter', error });
    }
};
