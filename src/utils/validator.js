/**
 * Validasi data expense
 * @param {Object} data - Data expense yang akan divalidasi
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
function validateExpense(data) {
    const errors = [];

    // Validasi amount
    if (!data.amount || typeof data.amount !== 'number') {
        errors.push('Jumlah harus berupa angka');
    } else if (data.amount <= 0) {
        errors.push('Jumlah harus lebih dari 0');
    } else if (data.amount > 1000000000) {
        errors.push('Jumlah terlalu besar (maksimal 1 miliar)');
    }

    // Validasi kategori
    if (!data.category || typeof data.category !== 'string') {
        errors.push('Kategori harus diisi');
    } else if (data.category.trim().length === 0) {
        errors.push('Kategori tidak boleh kosong');
    } else if (data.category.length > 50) {
        errors.push('Kategori terlalu panjang (maksimal 50 karakter)');
    }

    // Validasi description (opsional, tapi jika ada harus valid)
    if (data.description && data.description.length > 200) {
        errors.push('Keterangan terlalu panjang (maksimal 200 karakter)');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Generate error message untuk user
 * @param {string[]} errors - Array error messages
 * @returns {string} - Formatted error message
 */
function formatErrorMessage(errors) {
    if (errors.length === 0) {
        return '';
    }

    let message = '❌ *Data tidak valid:*\n\n';
    errors.forEach((error, index) => {
        message += `${index + 1}. ${error}\n`;
    });

    message += '\n📝 *Format yang benar:*\n';
    message += '`[perintah] [jumlah] [kategori/nama] [keterangan]`\n\n';
    message += '*Contoh Pengeluaran:*\n';
    message += '• `keluar 25000 makan siang`\n\n';
    message += '*Contoh Hutang (Kita berhutang):*\n';
    message += '• `hutang 50000 Budi pinjam uang`\n\n';
    message += '*Contoh Piutang (Orang berhutang ke kita):*\n';
    message += '• `piutang 100000 Ani pinjam uang`\n';

    return message;
}

module.exports = {
    validateExpense,
    formatErrorMessage
};
