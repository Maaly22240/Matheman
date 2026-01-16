const Mnemonic = require('../models/Mnemonic');

// Get all mnemonics created by the logged-in teacher
exports.getMyMnemonics = async (req, res) => {
    try {
        const mnemonics = await Mnemonic.find({ createdBy: req.user.id })
                                        .populate('relatedChapter', 'name')
                                        .populate('relatedDomain', 'name')
                                        .sort({ createdAt: -1 });
        res.status(200).json(mnemonics);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching mnemonics', error: error.message });
    }
};

// Get a single mnemonic by ID (ensure it belongs to the teacher)
exports.getMnemonicById = async (req, res) => {
    try {
        const mnemonic = await Mnemonic.findOne({ _id: req.params.id, createdBy: req.user.id })
                                       .populate('relatedChapter', 'name')
                                       .populate('relatedDomain', 'name');
        if (!mnemonic) {
            return res.status(404).json({ message: 'Mnemonic not found or access denied' });
        }
        res.status(200).json(mnemonic);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching mnemonic', error: error.message });
    }
};

// Create a new mnemonic
exports.createMnemonic = async (req, res) => {
    try {
        const { title, content, relatedChapter, relatedDomain, tags } = req.body;
        
        if (!title || !content) {
             return res.status(400).json({ message: 'Title and content are required' });
        }
        
        const newMnemonic = new Mnemonic({
            title,
            content,
            relatedChapter: relatedChapter || null,
            relatedDomain: relatedDomain || null,
            tags: tags || [],
            createdBy: req.user.id, 
        });

        await newMnemonic.save();
        
        // Populate related fields for the response
        const populatedMnemonic = await Mnemonic.findById(newMnemonic._id)
                                                .populate('relatedChapter', 'name')
                                                .populate('relatedDomain', 'name');
                                                
        res.status(201).json(populatedMnemonic);
    } catch (error) {
        res.status(500).json({ message: 'Error creating mnemonic', error: error.message });
    }
};

// Update a mnemonic
exports.updateMnemonic = async (req, res) => {
    try {
        const { title, content, relatedChapter, relatedDomain, tags } = req.body;
        const updateData = { title, content, relatedChapter, relatedDomain, tags };

        // Find and update, ensuring the teacher owns it
        const mnemonic = await Mnemonic.findOneAndUpdate(
            { _id: req.params.id, createdBy: req.user.id }, 
            updateData, 
            { new: true, runValidators: true } // Return updated doc and run schema validators
        ).populate('relatedChapter', 'name').populate('relatedDomain', 'name');

        if (!mnemonic) {
            return res.status(404).json({ message: 'Mnemonic not found or access denied' });
        }
        res.status(200).json(mnemonic);
    } catch (error) {
        res.status(500).json({ message: 'Error updating mnemonic', error: error.message });
    }
};

// Delete a mnemonic
exports.deleteMnemonic = async (req, res) => {
    try {
        const mnemonic = await Mnemonic.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });

        if (!mnemonic) {
            return res.status(404).json({ message: 'Mnemonic not found or access denied' });
        }
        res.status(200).json({ message: 'Mnemonic deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting mnemonic', error: error.message });
    }
}; 