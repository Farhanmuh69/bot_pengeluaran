const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { sendOTP, verifyOTP, hasValidOTP, sendWelcomeMessage } = require('../utils/otpService');
const { normalizePhoneNumber } = require('../utils/phoneNormalizer');

/**
 * Login user
 */
async function login(req, res) {
    try {
        let { phoneNumber, password } = req.body;

        // Validasi input
        if (!phoneNumber || !password) {
            return res.status(400).json({
                success: false,
                message: 'Phone number/username dan password harus diisi'
            });
        }

        let user;

        // Check if logging in as admin (username-based)
        if (phoneNumber.toLowerCase() === 'admin') {
            user = await User.findOne({ role: 'admin' });
        } else {
            // Regular user login (phone-based)
            phoneNumber = normalizePhoneNumber(phoneNumber);
            user = await User.findOne({ phoneNumber });
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Username/nomor atau password salah'
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Username/nomor atau password salah'
            });
        }

        // Generate token
        const token = generateToken({
            userId: user._id,
            role: user.role
        });

        res.json({
            success: true,
            data: {
                user: user.toJSON(),
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saat login'
        });
    }
}

/**
 * Request OTP for registration
 * Public endpoint - no authentication required
 */
async function requestOTP(req, res) {
    try {
        let { phoneNumber } = req.body;

        // Validasi input
        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Phone number harus diisi'
            });
        }

        // Normalize phone number
        phoneNumber = normalizePhoneNumber(phoneNumber);

        // Check if user already exists
        const existingUser = await User.findOne({ phoneNumber });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Nomor telepon sudah terdaftar'
            });
        }

        // Send OTP via WhatsApp
        const result = await sendOTP(phoneNumber, 'registration');

        if (!result.success) {
            return res.status(500).json(result);
        }

        res.json({
            success: true,
            message: result.message,
            expiresAt: result.expiresAt
        });
    } catch (error) {
        console.error('RequestOTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saat mengirim OTP'
        });
    }
}

/**
 * Verify OTP and complete registration
 * Public endpoint - no authentication required
 */
async function register(req, res) {
    try {
        let { phoneNumber, name, password, otpCode } = req.body;

        // Validasi input
        if (!phoneNumber || !name || !otpCode) {
            return res.status(400).json({
                success: false,
                message: 'Phone number, name, dan OTP code harus diisi'
            });
        }

        // Normalize phone number
        phoneNumber = normalizePhoneNumber(phoneNumber);

        console.log(`📝 Registering user: ${name} with phone: ${phoneNumber}`);

        // Verify OTP
        const otpResult = await verifyOTP(phoneNumber, otpCode);
        if (!otpResult.success) {
            return res.status(400).json(otpResult);
        }

        // Check if user already exists
        const existingUser = await User.findOne({ phoneNumber });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User dengan phone number ini sudah ada'
            });
        }

        // Create user
        const user = new User({
            phoneNumber,
            name,
            password: password || undefined,
            role: 'user',
            registeredVia: 'web'
        });

        await user.save();

        console.log(`✅ User registered successfully: ${user._id}`);

        // Send welcome message via WhatsApp
        // We don't await this to avoid blocking the response
        sendWelcomeMessage(user.phoneNumber, user.name);

        // Generate token for auto-login
        const token = generateToken({
            userId: user._id,
            role: user.role
        });

        res.status(201).json({
            success: true,
            message: 'Registrasi berhasil',
            data: {
                user: user.toJSON(),
                token
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saat register'
        });
    }
}

/**
 * Request OTP for login (existing users)
 */
async function requestLoginOTP(req, res) {
    try {
        let { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Nomor telepon harus diisi'
            });
        }

        // Normalize phone number
        phoneNumber = normalizePhoneNumber(phoneNumber);

        // Check if user exists and is active
        const user = await User.findOne({ phoneNumber, isActive: true });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Nomor tidak terdaftar atau tidak aktif'
            });
        }

        // Send OTP
        const result = await sendOTP(phoneNumber, 'login');

        if (result.success) {
            res.json({
                success: true,
                message: 'Kode OTP telah dikirim ke WhatsApp Anda',
                data: {
                    expiresAt: result.expiresAt
                }
            });
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('RequestLoginOTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saat mengirim OTP'
        });
    }
}

/**
 * Login with OTP
 */
async function loginWithOTP(req, res) {
    try {
        let { phoneNumber, otpCode } = req.body;

        if (!phoneNumber || !otpCode) {
            return res.status(400).json({
                success: false,
                message: 'Nomor telepon dan kode OTP harus diisi'
            });
        }

        // Normalize phone number
        phoneNumber = normalizePhoneNumber(phoneNumber);

        // Verify OTP
        const otpResult = await verifyOTP(phoneNumber, otpCode);
        if (!otpResult.success) {
            return res.status(400).json(otpResult);
        }

        // Get user
        const user = await User.findOne({ phoneNumber, isActive: true });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        // Update last active
        user.lastActive = new Date();
        await user.save();

        // Generate token
        const token = generateToken({
            userId: user._id,
            role: user.role
        });

        res.json({
            success: true,
            message: 'Login berhasil',
            data: {
                user: user.toJSON(),
                token
            }
        });
    } catch (error) {
        console.error('LoginWithOTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saat login'
        });
    }
}

/**
 * Get current user info
 */
async function getMe(req, res) {
    try {
        res.json({
            success: true,
            data: {
                user: req.user
            }
        });
    } catch (error) {
        console.error('GetMe error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saat mengambil data user'
        });
    }
}

/**
 * Update user profile
 */
async function updateProfile(req, res) {
    try {
        const { resetDate } = req.body;
        const userId = req.user._id;

        const updates = {};

        if (resetDate) {
            const date = parseInt(resetDate);
            if (date >= 1 && date <= 31) {
                updates.resetDate = date;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Tanggal reset harus antara 1-31'
                });
            }
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Profil berhasil diperbarui',
            data: {
                user
            }
        });
    } catch (error) {
        console.error('UpdateProfile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saat update profil'
        });
    }
}

/**
 * Request OTP for password reset
 */
async function requestResetPasswordOTP(req, res) {
    try {
        let { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Phone number harus diisi'
            });
        }

        phoneNumber = normalizePhoneNumber(phoneNumber);

        // Check if user exists
        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Nomor WhatsApp tidak terdaftar'
            });
        }

        // Send OTP via WhatsApp
        const result = await sendOTP(phoneNumber, 'password_reset');

        res.json(result);
    } catch (error) {
        console.error('Request reset password OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saat meminta kode OTP'
        });
    }
}

/**
 * Reset password using OTP
 */
async function resetPasswordWithOTP(req, res) {
    try {
        let { phoneNumber, otpCode, newPassword } = req.body;

        if (!phoneNumber || !otpCode || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Phone number, OTP code, dan password baru harus diisi'
            });
        }

        phoneNumber = normalizePhoneNumber(phoneNumber);

        // Verify OTP
        const otpResult = await verifyOTP(phoneNumber, otpCode);
        if (!otpResult.success) {
            return res.status(400).json(otpResult);
        }

        // Find user and update password
        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password berhasil diperbarui. Silakan login dengan password baru Anda.'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saat mereset password'
        });
    }
}

module.exports = {
    login,
    register,
    requestOTP,
    requestLoginOTP,
    loginWithOTP,
    getMe,
    updateProfile,
    requestResetPasswordOTP,
    resetPasswordWithOTP
};
