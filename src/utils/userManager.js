const User = require('../models/User');

/**
 * Get or create user by phone number
 * @param {string} phoneNumber - WhatsApp phone number
 * @returns {Promise<User>} - User document
 */
async function getOrCreateUser(phoneNumber) {
    try {
        // Cari user berdasarkan phoneNumber
        let user = await User.findOne({ phoneNumber });

        // Jika belum ada, buat user baru
        if (!user) {
            // Extract nama dari nomor (atau gunakan default)
            const name = `User ${phoneNumber.substring(0, 10)}`;

            user = new User({
                phoneNumber,
                name,
                role: 'user',
                isActive: true
            });

            await user.save();
            console.log(`✅ User baru dibuat: ${phoneNumber}`);
        }

        return user;
    } catch (error) {
        console.error('❌ Error getting/creating user:', error);
        throw error;
    }
}

/**
 * Create admin user if not exists
 */
async function createAdminIfNotExists() {
    try {
        const adminExists = await User.findOne({ role: 'admin' });

        if (!adminExists) {
            const admin = new User({
                phoneNumber: 'admin',
                name: 'Administrator',
                password: process.env.ADMIN_PASSWORD || 'admin123',
                role: 'admin',
                isActive: true
            });

            await admin.save();
            console.log('✅ Admin user created');
            console.log('   Username: admin');
            console.log('   Password:', process.env.ADMIN_PASSWORD || 'admin123');
        }
    } catch (error) {
        console.error('❌ Error creating admin:', error);
    }
}

module.exports = {
    getOrCreateUser,
    createAdminIfNotExists
};
