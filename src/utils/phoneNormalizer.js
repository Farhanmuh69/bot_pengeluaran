/**
 * Normalize phone number untuk konsistensi
 * Converts WhatsApp format ke format database
 * 6281234567890@c.us -> 6281234567890
 * 081234567890 -> 6281234567890
 */
function normalizePhoneNumber(phoneNumber) {
    // Remove @c.us suffix if exists
    let cleaned = phoneNumber.replace('@c.us', '');

    // Remove all non-digit characters
    cleaned = cleaned.replace(/\D/g, '');

    // If starts with 0, replace with 62 (Indonesia)
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.substring(1);
    }

    // If doesn't start with country code, add 62
    if (!cleaned.startsWith('62')) {
        cleaned = '62' + cleaned;
    }

    return cleaned;
}

module.exports = {
    normalizePhoneNumber
};
