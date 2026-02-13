require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./src/config/database');
const { createAdminIfNotExists } = require('./src/utils/userManager');

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const expenseRoutes = require('./src/routes/expense.routes');
const adminRoutes = require('./src/routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Initialize server
 */
async function startServer() {
    try {
        // Connect to MongoDB
        await connectDB();

        // Create admin user if not exists
        await createAdminIfNotExists();

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

        // Start server
        app.listen(PORT, () => {
            console.log('━'.repeat(60));
            console.log('🌐 Web Server Started!');
            console.log(`📡 Server running on: http://localhost:${PORT}`);
            console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
            console.log(`👨‍💼 Admin Panel: http://localhost:${PORT}/admin`);
            console.log('━'.repeat(60));
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();
