/**
 * Parse pesan expense dari format: "keluar [amount] [kategori] [keterangan]"
 * @param {string} message - Pesan dari user
 * @returns {Object|null} - Object dengan amount, category, description atau null jika tidak valid
 */
function parseExpenseMessage(message) {
    // Trim dan lowercase untuk pengecekan keyword
    const trimmedMessage = message.trim();
    const lowerMessage = trimmedMessage.toLowerCase();

    // Check keyword
    let type = 'expense';
    let command = '';

    if (lowerMessage.startsWith('keluar')) {
        type = 'expense';
        command = 'keluar';
    } else if (lowerMessage.startsWith('hutang')) {
        type = 'debt';
        command = 'hutang';
    } else if (lowerMessage.startsWith('piutang')) {
        type = 'receivable';
        command = 'piutang';
    } else {
        return null;
    }

    // Hapus keyword dan trim
    const content = trimmedMessage.substring(command.length).trim();

    if (!content) {
        return null;
    }

    // Split berdasarkan spasi
    const parts = content.split(/\s+/);

    if (parts.length < 2) {
        // Special case for hutang/piutang: maybe only description? 
        // User asked: "hutang [jumlah] [deskripsi]" so format is same.
        return null;
    }

    // Extract amount (angka pertama, bisa dengan titik/koma sebagai pemisah ribuan)
    const amountStr = parts[0].replace(/\./g, '').replace(/,/g, '');
    const amount = parseInt(amountStr, 10);

    if (isNaN(amount)) {
        return null;
    }

    // Extract kategori (kata kedua) or description directly for debt?
    // User syntax for debt/receivable usually: "hutang 50000 pinjam budi"
    // "pinjam" could be category, "budi" description.
    // Or maybe for debt we default category to "Hutang"?
    // The user didn't specify strict syntax. Let's keep consistent: Amount -> Category -> Desc
    // But for debt, maybe the name is important. 
    // Let's assume: hutang 50000 [Nama/Kategori] [Keterangan]

    const category = parts[1];

    // Extract keterangan (sisa kata setelah kategori)
    const description = parts.slice(2).join(' ');

    return {
        amount,
        category,
        description: description || '',
        type
    };
}

module.exports = {
    parseExpenseMessage
};
