const Domain = require('../models/Domain');

// Get all domains
exports.getAllDomains = async (req, res) => {
    try {
        const domains = await Domain.find().populate('chapters');
        res.status(200).json(domains);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching domains', error });
    }
};

// Get a domain by ID
exports.getDomainById = async (req, res) => {
    try {
        const domain = await Domain.findById(req.params.id).populate('chapters');
        if (!domain) return res.status(404).json({ message: 'Domain not found' });
        res.status(200).json(domain);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching domain', error });
    }
};

// Create a domain
exports.createDomain = async (req, res) => {
    try {
        const domain = new Domain(req.body);
        await domain.save();
        res.status(201).json({ message: 'Domain created successfully', domain });
    } catch (error) {
        res.status(500).json({ message: 'Error creating domain', error });
    }
};

// Update a domain
exports.updateDomain = async (req, res) => {
    try {
        const domain = await Domain.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!domain) return res.status(404).json({ message: 'Domain not found' });
        res.status(200).json({ message: 'Domain updated successfully', domain });
    } catch (error) {
        res.status(500).json({ message: 'Error updating domain', error });
    }
};

// Delete a domain
exports.deleteDomain = async (req, res) => {
    try {
        const domain = await Domain.findByIdAndDelete(req.params.id);
        if (!domain) return res.status(404).json({ message: 'Domain not found' });
        res.status(200).json({ message: 'Domain deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting domain', error });
    }
};
