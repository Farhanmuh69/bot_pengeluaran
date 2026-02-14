require('dotenv').config();
const connectDB = require('./src/config/database');
const { initializeClient } = require('./src/bot/whatsappClient');
const { handleMessage } = require('./src/bot/messageHandler');
const { createAdminIfNotExists } = require('./src/utils/userManager');
const { setWhatsAppClient } = require('./src/utils/otpService');

// Import Express server
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const QRCode = require('qrcode');

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const expenseRoutes = require('./src/routes/expense.routes');
const adminRoutes = require('./src/routes/admin.routes');

/**
 * Main application entry point
 * Runs both WhatsApp Bot and Web Server
 */
async function main() {
    console.log('🚀 Starting Bot Pengeluaran (WhatsApp + Web Dashboard)...\n');

    // Connect to MongoDB
    await connectDB();

    // Create admin user if not exists
    await createAdminIfNotExists();

    // ============================================
    // 1. Initialize Web Server with Socket.IO FIRST
    // ============================================
    const app = express();
    const server = http.createServer(app);
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    const PORT = process.env.PORT;

    // Store WhatsApp status globally
    global.whatsappStatus = {
        isReady: false,
        qrCode: null,
        info: null
    };

    // Socket.IO connection
    io.on('connection', (socket) => {
        console.log('👤 Admin connected to dashboard');

        // Send current status
        socket.emit('whatsapp-status', global.whatsappStatus);

        socket.on('disconnect', () => {
            console.log('👤 Admin disconnected');
        });
    });

    // ============================================
    // 2. Initialize WhatsApp Bot AFTER Socket.IO
    // ============================================
    const client = initializeClient();
    global.whatsappClient = client;

    // Setup WhatsApp event handlers with Socket.IO broadcasting
    client.on('qr', async (qr) => {
        console.log('📱 QR Code generated - broadcasting to dashboard');

        try {
            // Generate QR code as data URL
            const qrDataURL = await QRCode.toDataURL(qr);

            global.whatsappStatus.qrCode = qrDataURL;
            global.whatsappStatus.isReady = false;

            // Broadcast to all connected admin clients
            io.emit('whatsapp-qr', { qrCode: qrDataURL });
            console.log('✅ QR Code sent to dashboard');
        } catch (error) {
            console.error('❌ Error generating QR code:', error);
        }
    });

    client.on('ready', () => {
        console.log('✅ WhatsApp Bot Ready!');

        global.whatsappStatus.isReady = true;
        global.whatsappStatus.qrCode = null;
        global.whatsappStatus.info = client.info;

        // Set client for OTP service
        setWhatsAppClient(client);

        io.emit('whatsapp-ready', { info: client.info });
    });

    client.on('authenticated', () => {
        console.log('✅ WhatsApp Authenticated');
        io.emit('whatsapp-authenticated');
    });

    client.on('disconnected', (reason) => {
        console.log('⚠️ WhatsApp Disconnected:', reason);

        global.whatsappStatus.isReady = false;
        global.whatsappStatus.info = null;

        io.emit('whatsapp-disconnected', { reason });

        // Automatically try to re-initialize to show new QR code
        setTimeout(async () => {
            try {
                console.log('🔄 Attempting to re-initialize WhatsApp Bot for new connection...');
                await client.initialize();
            } catch (err) {
                console.error('❌ Error re-initializing WhatsApp Bot:', err);
            }
        }, 5000);
    });

    // Setup message handler
    client.on('message', handleMessage);

    // Initialize WhatsApp client
    await client.initialize();

    // Middleware
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Serve static files
    app.use(express.static(path.join(__dirname, 'public')));

    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/expenses', expenseRoutes);
    app.use('/api/admin', adminRoutes);

    // Health check
    app.get('/api/health', (req, res) => {
        res.json({
            success: true,
            message: 'Server is running',
            whatsappBot: client.info ? 'connected' : 'initializing',
            timestamp: new Date()
        });
    });

    // Serve frontend
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    app.get('/dashboard', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
    });

    app.get('/admin', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'admin.html'));
    });

    app.get('/register', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'register.html'));
    });

    // 404 handler
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: 'Route not found'
        });
    });

    // Error handler
    app.use((err, req, res, next) => {
        console.error('Server error:', err);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    });

    // Start web server (MUST USE server, not app for Socket.IO)
    server.listen(PORT, () => {
        console.log('\n' + '━'.repeat(60));
        console.log('✅ SISTEM LENGKAP BERJALAN!');
        console.log('━'.repeat(60));
        console.log('🤖 WhatsApp Bot: AKTIF');
        console.log('🌐 Web Dashboard: AKTIF');
        // console.log('━'.repeat(60));
        // console.log(`📡 Server: http://localhost:${PORT}`);
        // console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
        // console.log(`👨‍💼 Admin Panel: http://localhost:${PORT}/admin`);
        // console.log('━'.repeat(60));
        // console.log('\n💡 Cara menggunakan:');
        // console.log('   1. Scan QR code WhatsApp (jika belum)');
        // console.log('   2. Kirim pesan: keluar 25000 makan siang');
        // console.log('   3. Buka browser: http://localhost:3000');
        // console.log('   4. Login admin: username=admin, password=admin123');
        // console.log('━'.repeat(60) + '\n');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n\n⏹️  Shutting down...');
        await client.destroy();
        process.exit(0);
    });
}

// Run the application
main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
