const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Middleware untuk verify JWT token
 */
async function authenticate(req, res, next) {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token tidak ditemukan'
            });
        }

        const token = authHeader.substring(7);

        // Verify token
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Token tidak valid'
            });
        }

        // Get user from database
        const user = await User.findById(decoded.userId);

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'User tidak ditemukan atau tidak aktif'
            });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({
            success: false,
            message: 'Error autentikasi'
        });
    }
}

/**
 * Middleware untuk check admin role
 */
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Akses ditolak. Admin only.'
        });
    }
    next();
}

module.exports = {
    authenticate,
    requireAdmin
};
