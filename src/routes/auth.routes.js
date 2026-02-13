const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

// Public routes
router.post('/login', authController.login);
router.post('/request-otp', authController.requestOTP);
router.post('/register', authController.register);

// OTP Login routes
router.post('/request-login-otp', authController.requestLoginOTP);
router.post('/login-otp', authController.loginWithOTP);

// Forgot Password routes
router.post('/request-reset-password', authController.requestResetPasswordOTP);
router.post('/reset-password', authController.resetPasswordWithOTP);

// Protected routes
router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, authController.updateProfile);

module.exports = router;
