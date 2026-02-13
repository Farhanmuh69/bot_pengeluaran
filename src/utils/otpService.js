const OTP = require('../models/OTP');

/**
 * Global WhatsApp client reference
 * Will be set from index.js
 */
let whatsappClient = null;

/**
 * Set WhatsApp client instance
 */
function setWhatsAppClient(client) {
    whatsappClient = client;
    console.log('✅ WhatsApp client set for OTP service');
}

/**
 * Format phone number untuk WhatsApp
 * Converts: 081234567890 -> 6281234567890@c.us
 */
function formatPhoneForWhatsApp(phoneNumber) {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // If starts with 0, replace with 62 (Indonesia)
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.substring(1);
    }

    // If doesn't start with country code, add 62
    if (!cleaned.startsWith('62')) {
        cleaned = '62' + cleaned;
    }

    return cleaned + '@c.us';
}

/**
 * Send OTP via WhatsApp
 */
async function sendOTP(phoneNumber, purpose = 'registration') {
    try {
        // Check if WhatsApp client is ready
        if (!whatsappClient) {
            throw new Error('WhatsApp client not initialized');
        }

        if (!whatsappClient.info) {
            throw new Error('WhatsApp bot belum siap. Silakan coba lagi dalam beberapa saat.');
        }

        // Create OTP
        const otp = await OTP.createOTP(phoneNumber, purpose);

        // Format phone number for WhatsApp
        const whatsappNumber = formatPhoneForWhatsApp(phoneNumber);

        console.log(`📤 Attempting to send OTP to ${phoneNumber} (formatted: ${whatsappNumber})`);

        // Create message
        let message = '';
        if (purpose === 'registration') {
            message = `🔐 *Kode Verifikasi Pendaftaran*\n\n`;
            message += `Kode OTP Anda: *${otp.code}*\n\n`;
            message += `Kode ini berlaku selama 5 menit.\n`;
            message += `Jangan bagikan kode ini kepada siapapun.\n\n`;
            message += `Jika Anda tidak meminta kode ini, abaikan pesan ini.`;
        } else if (purpose === 'login') {
            message = `🔐 *Kode Verifikasi Login*\n\n`;
            message += `Kode OTP Anda: *${otp.code}*\n\n`;
            message += `Kode ini berlaku selama 5 menit.`;
        }

        // Check if number is registered on WhatsApp
        try {
            const isRegistered = await whatsappClient.isRegisteredUser(whatsappNumber);

            if (!isRegistered) {
                console.error(`❌ Number ${whatsappNumber} is not registered on WhatsApp`);
                throw new Error('Nomor WhatsApp tidak terdaftar. Pastikan nomor yang Anda masukkan benar dan terdaftar di WhatsApp.');
            }
        } catch (checkError) {
            console.error('❌ Error checking WhatsApp registration:', checkError);
            // Continue anyway, some versions don't support this check
        }

        // Send via WhatsApp
        await whatsappClient.sendMessage(whatsappNumber, message);

        console.log(`✅ OTP successfully sent to ${phoneNumber} (${whatsappNumber}): ${otp.code}`);

        return {
            success: true,
            message: 'Kode OTP telah dikirim ke WhatsApp Anda',
            expiresAt: otp.expiresAt
        };

    } catch (error) {
        console.error('❌ Error sending OTP:', error);

        // Provide user-friendly error message
        let errorMessage = 'Gagal mengirim kode OTP';

        if (error.message.includes('belum siap')) {
            errorMessage = error.message;
        } else if (error.message.includes('not initialized')) {
            errorMessage = 'Sistem WhatsApp belum siap. Silakan coba lagi.';
        } else if (error.message.includes('tidak terdaftar')) {
            errorMessage = error.message;
        } else if (error.message.includes('Could not send message')) {
            errorMessage = 'Gagal mengirim pesan. Pastikan nomor WhatsApp Anda benar dan aktif.';
        }

        return {
            success: false,
            message: errorMessage,
            error: error.message
        };
    }
}

/**
 * Verify OTP code
 */
async function verifyOTP(phoneNumber, code) {
    try {
        const result = await OTP.verifyOTP(phoneNumber, code);
        return result;
    } catch (error) {
        console.error('❌ Error verifying OTP:', error);
        return {
            success: false,
            message: 'Gagal memverifikasi kode OTP'
        };
    }
}

/**
 * Check if phone number has valid OTP
 */
async function hasValidOTP(phoneNumber) {
    const otp = await OTP.findOne({
        phoneNumber,
        verified: true,
        expiresAt: { $gt: new Date() }
    });

    return !!otp;
}

/**
 * Clean up expired OTPs (optional, TTL index handles this automatically)
 */
async function cleanupExpiredOTPs() {
    try {
        const result = await OTP.deleteMany({
            expiresAt: { $lt: new Date() }
        });
        console.log(`🧹 Cleaned up ${result.deletedCount} expired OTPs`);
        return result.deletedCount;
    } catch (error) {
        console.error('❌ Error cleaning up OTPs:', error);
        return 0;
    }
}

module.exports = {
    setWhatsAppClient,
    sendOTP,
    verifyOTP,
    hasValidOTP,
    cleanupExpiredOTPs,
    formatPhoneForWhatsApp
};
