const express = require('express');
const {
    getTree,
    addTreeNode,
    updateTreeNode,
    deleteTreeNode,
    addDomainToAgeRange,
    removeDomainFromAgeRange
} = require('../controllers/TreeController'); // Ensure the path and function names are correct
const { authenticateToken } = require('../middleware/authMiddleware'); // Import authentication middleware
const { authorizeRole } = require('../middleware/roleMiddleware');   // Import role authorization middleware
const router = express.Router();

// Public route to get tree structure (e.g., for students)
router.get('/', getTree);

// Teacher-only routes for managing the tree structure
router.post('/', authenticateToken, authorizeRole('teacher'), addTreeNode);
router.put('/:id', authenticateToken, authorizeRole('teacher'), updateTreeNode);
router.delete('/:id', authenticateToken, authorizeRole('teacher'), deleteTreeNode);

// Routes to manage domains within a specific age range
router.post('/:treeId/agerange/:rangeId/domains', authenticateToken, authorizeRole('teacher'), addDomainToAgeRange);
router.delete('/:treeId/agerange/:rangeId/domains/:domainId', authenticateToken, authorizeRole('teacher'), removeDomainFromAgeRange);

module.exports = router;
