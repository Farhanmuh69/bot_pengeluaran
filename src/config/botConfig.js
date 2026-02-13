/**
 * Bot Configuration
 * Centralized configuration for bot messages and settings
 */

module.exports = {
    // Website URL for registration
    websiteUrl: process.env.WEBSITE_URL || 'http://localhost:3000',

    // Bot messages
    messages: {
        // Rejection message for unregistered users
        unregisteredUser: (websiteUrl) => `
🚫 *Akses Ditolak*

Maaf, nomor Anda belum terdaftar dalam sistem.

Untuk menggunakan Bot Pengeluaran, silakan daftar terlebih dahulu di:
🌐 ${websiteUrl}/register

Setelah mendaftar, Anda dapat langsung menggunakan bot ini untuk mencatat pengeluaran.

📝 *Cara Menggunakan Bot:*
Kirim pesan dengan format:
\`keluar [jumlah] [kategori] [keterangan]\`

Contoh:
\`keluar 25000 makan siang\`
        `.trim(),

        // Help message for registered users
        help: () => `
📖 *Panduan Bot Pengeluaran*

*Format Pesan:*
\`keluar [jumlah] [kategori] [keterangan]\`

*Contoh:*
• \`keluar 25000 makan siang\`
• \`keluar 50000 transport\`
• \`keluar 100000 belanja groceries\`

*Tips:*
• Jumlah bisa pakai titik pemisah ribuan (25.000)
• Kategori dan keterangan opsional
• Semua data tersimpan otomatis

Butuh bantuan? Hubungi admin.
        `.trim(),

        // Welcome message for new registered users
        welcome: (name) => `
🎉 *Selamat Datang, ${name}!*

Pendaftaran Anda berhasil! Sekarang Anda dapat menggunakan Bot Pengeluaran.

📝 *Cara Mencatat Pengeluaran:*
Kirim pesan dengan format:
\`keluar [jumlah] [kategori] [keterangan]\`

*Contoh:*
\`keluar 25000 makan siang\`

Semua pengeluaran Anda akan tercatat otomatis dan dapat dilihat di dashboard web.

Selamat mencatat! 💰
        `.trim()
    },

    // Bot commands
    commands: {
        help: ['help', 'bantuan', '?'],
        stats: ['stats', 'statistik', 'laporan']
    }
};
