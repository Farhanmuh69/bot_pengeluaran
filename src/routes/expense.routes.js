const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expense.controller');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get expenses with filters
router.get('/', expenseController.getExpenses);

// Get statistics
router.get('/stats', expenseController.getStats);

// Export to CSV
router.get('/export', expenseController.exportExpenses);

// Get single expense
router.get('/:id', expenseController.getExpenseById);

// Delete expense
// Update expense status (e.g. mark as paid)
router.put('/:id/status', expenseController.updateStatus);

module.exports = router;
