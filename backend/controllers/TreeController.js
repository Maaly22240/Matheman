const Tree = require('../models/Tree');
const Domain = require('../models/Domain');

// Get all trees
exports.getTree = async (req, res) => {
    try {
        const trees = await Tree.find().populate({
            path: 'ageRanges.domains',
            populate: { path: 'chapters' },
        });
        res.status(200).json(trees);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching trees', error });
    }
};

// Add a tree node
exports.addTreeNode = async (req, res) => {
    try {
        const tree = new Tree(req.body);
        await tree.save();
        res.status(201).json({ message: 'Tree node created successfully', tree });
    } catch (error) {
        res.status(500).json({ message: 'Error creating tree node', error });
    }
};

// Update a tree node
exports.updateTreeNode = async (req, res) => {
    try {
        const tree = await Tree.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!tree) return res.status(404).json({ message: 'Tree node not found' });
        res.status(200).json({ message: 'Tree node updated successfully', tree });
    } catch (error) {
        res.status(500).json({ message: 'Error updating tree node', error });
    }
};

// Delete a tree node
exports.deleteTreeNode = async (req, res) => {
    try {
        const tree = await Tree.findByIdAndDelete(req.params.id);
        if (!tree) return res.status(404).json({ message: 'Tree node not found' });
        res.status(200).json({ message: 'Tree node deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting tree node', error });
    }
};

// Add a domain to a specific age range in a tree
exports.addDomainToAgeRange = async (req, res) => {
    try {
        const { treeId, rangeId } = req.params;
        const { domainId } = req.body; // Expect domainId in the request body

        // Validate domain exists
        const domainExists = await Domain.findById(domainId);
        if (!domainExists) {
            return res.status(404).json({ message: 'Domain not found' });
        }

        // Find the tree and the specific age range
        const tree = await Tree.findById(treeId);
        if (!tree) {
            return res.status(404).json({ message: 'Tree not found' });
        }

        const ageRange = tree.ageRanges.id(rangeId);
        if (!ageRange) {
            return res.status(404).json({ message: 'Age range not found in this tree' });
        }

        // Check if domain already exists in the age range
        if (ageRange.domains.includes(domainId)) {
            return res.status(400).json({ message: 'Domain already exists in this age range' });
        }

        // Add the domain and save
        ageRange.domains.push(domainId);
        await tree.save();

        // Populate the updated tree for the response
        const updatedTree = await Tree.findById(treeId).populate({ path: 'ageRanges.domains', populate: { path: 'chapters' } });

        res.status(200).json({ message: 'Domain added to age range successfully', tree: updatedTree });
    } catch (error) {
        console.error("Error adding domain:", error);
        res.status(500).json({ message: 'Error adding domain to age range', error: error.message });
    }
};

// Remove a domain from a specific age range in a tree
exports.removeDomainFromAgeRange = async (req, res) => {
    try {
        const { treeId, rangeId, domainId } = req.params;

        // Find the tree
        const tree = await Tree.findById(treeId);
        if (!tree) {
            return res.status(404).json({ message: 'Tree not found' });
        }

        // Find the specific age range
        const ageRange = tree.ageRanges.id(rangeId);
        if (!ageRange) {
            return res.status(404).json({ message: 'Age range not found in this tree' });
        }

        // Check if the domain exists in the age range
        const domainIndex = ageRange.domains.indexOf(domainId);
        if (domainIndex === -1) {
            return res.status(404).json({ message: 'Domain not found in this age range' });
        }

        // Remove the domain and save
        ageRange.domains.splice(domainIndex, 1);
        await tree.save();

        // Populate the updated tree for the response
        const updatedTree = await Tree.findById(treeId).populate({ path: 'ageRanges.domains', populate: { path: 'chapters' } });

        res.status(200).json({ message: 'Domain removed from age range successfully', tree: updatedTree });
    } catch (error) {
        console.error("Error removing domain:", error);
        res.status(500).json({ message: 'Error removing domain from age range', error: error.message });
    }
};

