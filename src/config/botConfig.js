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

Setelah mendaftar, Anda dapat langsung menggunakan bot ini untuk mencatat pengeluaran, hutang, dan piutang.

📝 *Format Pesan:*
• *Pengeluaran:* \`keluar [jumlah] [kategori] [keterangan]\`
• *Hutang:* \`hutang [jumlah] [pemberi] [keterangan]\`
• *Piutang:* \`piutang [jumlah] [peminjam] [keterangan]\`

💡 *Contoh:*
\`keluar 25000 makan siang\`
\`hutang 500000 bank pinjaman modal\`
\`piutang 100000 budi pinjam uang\`
        `.trim(),

        // Help message for registered users
        help: () => `
📖 *Panduan Bot Pengeluaran*

*Format Pesan:*
1. *Catat Pengeluaran:*
   \`keluar [jumlah] [kategori] [keterangan]\`
   Contoh: \`keluar 25000 makan siang\`

2. *Catat Hutang (Uang Orang di Kita):*
   \`hutang [jumlah] [pemberi] [keterangan]\`
   Contoh: \`hutang 50000 budi pinjam pelunasan\`

3. *Catat Piutang (Uang Kita di Orang):*
   \`piutang [jumlah] [peminjam] [keterangan]\`
   Contoh: \`piutang 100000 ani pinjam belanja\`

*Tips:*
• Jumlah bisa pakai titik pemisah ribuan (25.000)
• Semua data tersimpan otomatis dan bisa dilihat di dashboard.

Butuh bantuan? Hubungi admin.
        `.trim(),

        // Welcome message for new registered users
        welcome: (name) => `
🎉 *Selamat Datang, ${name}!*

Pendaftaran Anda berhasil! Sekarang Anda dapat menggunakan Bot Pengeluaran.

📝 *Cara Mencatat:*
• *Pengeluaran:* \`keluar [jumlah] [kategori] [keterangan]\`
• *Hutang:* \`hutang [jumlah] [pemberi] [keterangan]\`
• *Piutang:* \`piutang [jumlah] [peminjam] [keterangan]\`

*Contoh:*
\`keluar 25000 makan siang\`
\`hutang 50000 budi pinjam\`

Semua data Anda akan tercatat otomatis dan dapat dilihat di dashboard web.

Selamat mencatat! 💰
        `.trim()
    },

    // Bot commands
    commands: {
        help: ['help', 'bantuan', '?'],
        stats: ['stats', 'statistik', 'laporan']
    }
};
