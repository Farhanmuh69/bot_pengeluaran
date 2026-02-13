const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// User management
router.get('/users', adminController.getAllUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.patch('/users/:id/toggle-status', adminController.toggleUserStatus);

// Expense management
router.get('/expenses', adminController.getAllExpenses);
router.put('/expenses/:id', adminController.updateExpense);
router.delete('/expenses/:id', adminController.deleteExpense);

// Global statistics
router.get('/stats', adminController.getGlobalStats);

// Bot monitoring
router.get('/bot/status', adminController.getBotStatus);

// Database management
router.get('/database/stats', adminController.getDatabaseStats);
router.delete('/database/cleanup', adminController.cleanupOldData);

module.exports = router;
