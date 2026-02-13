const User = require('../models/User');
const Expense = require('../models/Expense');

/**
 * Get all users (admin only)
 */
async function getAllUsers(req, res) {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });

        // Get expense count for each user
        const usersWithStats = await Promise.all(
            users.map(async (user) => {
                const expenseCount = await Expense.countDocuments({ userId: user._id });
                const totalAmount = await Expense.aggregate([
                    { $match: { userId: user._id } },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ]);

                return {
                    ...user.toJSON(),
                    expenseCount,
                    totalAmount: totalAmount[0]?.total || 0
                };
            })
        );

        res.json({
            success: true,
            data: {
                users: usersWithStats,
                total: users.length
            }
        });
    } catch (error) {
        console.error('GetAllUsers error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saat mengambil data users'
        });
    }
}

/**
 * Get all expenses from all users (admin only)
 */
async function getAllExpenses(req, res) {
    try {
        const { startDate, endDate, category, userId, limit = 100, skip = 0 } = req.query;

        // Build query
        const query = {};

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) {
                query.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                query.timestamp.$lte = new Date(endDate);
            }
        }

        if (category) {
            query.category = category;
        }

        if (userId) {
            query.userId = userId;
        }

        // Get expenses with user info
        const expenses = await Expense.find(query)
            .populate('userId', 'name phoneNumber')
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await Expense.countDocuments(query);

        res.json({
            success: true,
            data: {
                expenses,
                total,
                limit: parseInt(limit),
                skip: parseInt(skip)
            }
        });
    } catch (error) {
        console.error('GetAllExpenses error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saat mengambil data expenses'
        });
    }
}

/**
 * Update expense (admin only)
 */
async function updateExpense(req, res) {
    try {
        const { id } = req.params;
        const { amount, category, description } = req.body;

        const expense = await Expense.findById(id);

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense tidak ditemukan'
            });
        }

        if (amount !== undefined) expense.amount = amount;
        if (category !== undefined) expense.category = category;
        if (description !== undefined) expense.description = description;

        await expense.save();

        res.json({
            success: true,
            data: { expense }
        });
    } catch (error) {
        console.error('UpdateExpense error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saat update expense'
        });
    }
}

/**
 * Delete expense (admin only)
 */
async function deleteExpense(req, res) {
    try {
        const { id } = req.params;

        const expense = await Expense.findByIdAndDelete(id);

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense tidak ditemukan'
            });
        }

        res.json({
            success: true,
            message: 'Expense berhasil dihapus'
        });
    } catch (error) {
        console.error('DeleteExpense error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saat delete expense'
        });
    }
}

/**
 * Get global statistics (admin only)
 */
async function getGlobalStats(req, res) {
    try {
        // Total users
        const totalUsers = await User.countDocuments();

        // Total expenses
        const totalExpenses = await Expense.countDocuments();

        // Total amount
        const totalAmountResult = await Expense.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);

        // By category (global)
        const byCategory = await Expense.aggregate([
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { total: -1 } }
        ]);

        res.json({
            success: true,
            data: {
                totalUsers,
                totalExpenses,
                totalAmount: totalAmountResult[0]?.total || 0,
                byCategory: byCategory.map(item => ({
                    category: item._id,
                    total: item.total,
                    count: item.count
                }))
            }
        });
    } catch (error) {
        console.error('GetGlobalStats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saat mengambil global stats'
        });
    }
}

/**
 * Update user (admin only)
 */
async function updateUser(req, res) {
    try {
        const { id } = req.params;
        const { name, phoneNumber, role, isActive } = req.body;

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        // Update fields
        if (name !== undefined) user.name = name;
        if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
        if (role !== undefined) user.role = role;
        if (isActive !== undefined) user.isActive = isActive;

        await user.save();

        res.json({
            success: true,
            message: 'User berhasil diupdate',
            data: { user: user.toJSON() }
        });
    } catch (error) {
        console.error('UpdateUser error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saat update user'
        });
    }
}

/**
 * Delete user (admin only)
 */
async function deleteUser(req, res) {
    try {
        const { id } = req.params;

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        // Also delete user's expenses
        await Expense.deleteMany({ userId: id });

        res.json({
            success: true,
            message: 'User dan semua data terkait berhasil dihapus'
        });
    } catch (error) {
        console.error('DeleteUser error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saat delete user'
        });
    }
}

/**
 * Toggle user active status (admin only)
 */
async function toggleUserStatus(req, res) {
    try {
        const { id } = req.params;

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.json({
            success: true,
            message: `User ${user.isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
            data: { user: user.toJSON() }
        });
    } catch (error) {
        console.error('ToggleUserStatus error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saat toggle user status'
        });
    }
}

/**
 * Get bot status (admin only)
 */
async function getBotStatus(req, res) {
    try {
        const status = global.whatsappStatus || {
            isReady: false,
            qrCode: null,
            info: null
        };

        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('GetBotStatus error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saat mengambil bot status'
        });
    }
}

/**
 * Get database statistics (admin only)
 */
async function getDatabaseStats(req, res) {
    try {
        const mongoose = require('mongoose');
        const db = mongoose.connection.db;

        // Get database stats
        const stats = await db.stats();

        // Get collection stats
        const collections = await db.listCollections().toArray();
        const collectionStats = [];

        for (const collection of collections) {
            const collStats = await db.collection(collection.name).stats();
            collectionStats.push({
                name: collection.name,
                count: collStats.count,
                size: collStats.size,
                avgObjSize: collStats.avgObjSize
            });
        }

        res.json({
            success: true,
            data: {
                database: stats.db,
                dataSize: stats.dataSize,
                storageSize: stats.storageSize,
                indexSize: stats.indexSize,
                totalSize: stats.dataSize + stats.indexSize,
                collections: collectionStats,
                // MongoDB Atlas free tier limit is 512MB
                usagePercentage: ((stats.dataSize + stats.indexSize) / (512 * 1024 * 1024) * 100).toFixed(2)
            }
        });
    } catch (error) {
        console.error('GetDatabaseStats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saat mengambil database stats'
        });
    }
}

/**
 * Cleanup old data (admin only)
 */
async function cleanupOldData(req, res) {
    try {
        const { days = 90 } = req.query;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

        const result = await Expense.deleteMany({
            timestamp: { $lt: cutoffDate }
        });

        res.json({
            success: true,
            message: `Berhasil menghapus ${result.deletedCount} data lama`,
            data: {
                deletedCount: result.deletedCount,
                cutoffDate
            }
        });
    } catch (error) {
        console.error('CleanupOldData error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saat cleanup data'
        });
    }
}

module.exports = {
    getAllUsers,
    getAllExpenses,
    updateExpense,
    deleteExpense,
    getGlobalStats,
    updateUser,
    deleteUser,
    toggleUserStatus,
    getBotStatus,
    getDatabaseStats,
    cleanupOldData
};
