const express = require('express');
const router = express.Router();
const domainController = require('../controllers/DomainController');
const { authenticateToken } = require('../middleware/auth');

// Get all domains
router.get('/', authenticateToken, domainController.getAllDomains);

// Get domain by ID
router.get('/:id', authenticateToken, domainController.getDomainById);

// Create a new domain (protected, only for admins/teachers)
router.post('/', authenticateToken, domainController.createDomain);

// Update a domain
router.put('/:id', authenticateToken, domainController.updateDomain);

// Delete a domain
router.delete('/:id', authenticateToken, domainController.deleteDomain);

module.exports = router;
