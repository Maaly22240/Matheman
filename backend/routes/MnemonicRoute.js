const express = require('express');
const {
    getMyMnemonics,
    getMnemonicById,
    createMnemonic,
    updateMnemonic,
    deleteMnemonic
} = require('../controllers/MnemonicController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRole } = require('../middleware/roleMiddleware');
const router = express.Router();

// All mnemonic routes require teacher authentication
router.use(authenticateToken, authorizeRole('teacher'));

// GET /api/mnemonics - Get all mnemonics for the logged-in teacher
router.get('/', getMyMnemonics);

// POST /api/mnemonics - Create a new mnemonic
router.post('/', createMnemonic);

// GET /api/mnemonics/:id - Get a specific mnemonic by ID
router.get('/:id', getMnemonicById);

// PUT /api/mnemonics/:id - Update a specific mnemonic
router.put('/:id', updateMnemonic);

// DELETE /api/mnemonics/:id - Delete a specific mnemonic
router.delete('/:id', deleteMnemonic);

module.exports = router; 