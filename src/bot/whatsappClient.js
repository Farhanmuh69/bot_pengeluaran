const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

/**
 * Initialize WhatsApp client
 * @returns {Client} - WhatsApp client instance
 */
function initializeClient() {
    const client = new Client({
        authStrategy: new LocalAuth({
            dataPath: './.wwebjs_auth'
        }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        }
    });

    // Event: QR Code (handled in index.js for Socket.IO broadcast)
    // Event: Ready (handled in index.js for Socket.IO broadcast)
    // Event: Authenticated (handled in index.js for Socket.IO broadcast)
    // Event: Disconnected (handled in index.js for Socket.IO broadcast)

    // Event: Authentication success
    client.on('authenticated', () => {
        console.log('✅ Autentikasi berhasil!');
    });

    // Event: Client ready
    client.on('ready', () => {
        console.log('🤖 Bot WhatsApp siap digunakan!');
        console.log('📝 Kirim pesan dengan format: keluar [jumlah] [kategori] [keterangan]');
        console.log('━'.repeat(60));
    });

    // Event: Authentication failure
    client.on('auth_failure', (msg) => {
        console.error('❌ Autentikasi gagal:', msg);
    });

    // Event: Disconnected
    client.on('disconnected', (reason) => {
        console.log('⚠️  Bot terputus:', reason);
    });

    return client;
}

module.exports = {
    initializeClient
};
