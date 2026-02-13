/**
 * Script to create or reset admin user
 * Run with: node scripts/createAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function createAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check if admin exists
        const existingAdmin = await User.findOne({ role: 'admin' });

        if (existingAdmin) {
            console.log('\n⚠️  Admin user already exists:');
            console.log('   Name:', existingAdmin.name);
            console.log('   Phone:', existingAdmin.phoneNumber);
            console.log('   Role:', existingAdmin.role);

            // Ask if want to reset password
            console.log('\n🔄 Resetting admin password...');
            existingAdmin.password = process.env.ADMIN_PASSWORD || 'admin123';
            await existingAdmin.save();
            console.log('✅ Admin password reset successfully!');
        } else {
            // Create new admin
            console.log('\n📝 Creating new admin user...');
            const admin = new User({
                phoneNumber: 'admin',
                name: 'Administrator',
                password: process.env.ADMIN_PASSWORD || 'admin123',
                role: 'admin',
                isActive: true
            });

            await admin.save();
            console.log('✅ Admin user created successfully!');
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 Admin Credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('   Username: admin');
        console.log('   Password:', process.env.ADMIN_PASSWORD || 'admin123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        await mongoose.connection.close();
        console.log('✅ Database connection closed');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createAdmin();
