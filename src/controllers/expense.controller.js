const Expense = require('../models/Expense');
const XLSX = require('xlsx');
const { getCycleDateRange } = require('../utils/dateUtils');

/**
 * Get user expenses with filters
 */
async function getExpenses(req, res) {
    try {
        const { startDate, endDate, category, limit = 100, skip = 0 } = req.query;
        const userId = req.user._id;

        // Build query conditions array
        const conditions = [{ userId }];

        // Filter by date range
        if (startDate || endDate) {
            const dateQuery = {};
            if (startDate) dateQuery.$gte = new Date(startDate);
            if (endDate) dateQuery.$lte = new Date(endDate);
            conditions.push({ timestamp: dateQuery });
        } else {
            // Default to current cycle based on user reset date
            const { startDate, endDate } = getCycleDateRange(req.user.resetDate || 1);
            conditions.push({ timestamp: { $gte: startDate, $lte: endDate } });
        }

        // Filter by category
        if (category) {
            conditions.push({ category: category });
        }

        // Filter by type
        if (req.query.type) {
            if (req.query.type === 'expense') {
                conditions.push({
                    $or: [
                        { type: 'expense' },
                        { type: { $exists: false } },
                        { type: null }
                    ]
                });
            } else {
                conditions.push({ type: req.query.type });
            }
        }

        // Filter by status
        if (req.query.status) {
            if (req.query.status === 'pending') {
                conditions.push({
                    $or: [
                        { status: 'pending' },
                        { status: { $exists: false } },
                        { status: null }
                    ]
                });
            } else {
                conditions.push({ status: req.query.status });
            }
        }

        // Combine all conditions with $and
        const query = conditions.length > 1 ? { $and: conditions } : conditions[0];

        // Get expenses
        const expenses = await Expense.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        // Get total count
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
        console.error('GetExpenses error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saat mengambil data expenses'
        });
    }
}

/**
 * Get expense statistics
 */
async function getStats(req, res) {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.user._id;

        // Build query conditions array
        const conditions = [{ userId }];

        if (startDate || endDate) {
            const dateQuery = {};
            if (startDate) dateQuery.$gte = new Date(startDate);
            if (endDate) dateQuery.$lte = new Date(endDate);
            conditions.push({ timestamp: dateQuery });
        } else {
            // Default to current cycle based on user reset date
            const { startDate, endDate } = getCycleDateRange(req.user.resetDate || 1);
            conditions.push({ timestamp: { $gte: startDate, $lte: endDate } });
        }

        // Filter by type
        if (req.query.type) {
            if (req.query.type === 'expense') {
                conditions.push({
                    $or: [
                        { type: 'expense' },
                        { type: { $exists: false } },
                        { type: null }
                    ]
                });
            } else {
                conditions.push({ type: req.query.type });
            }
        } else {
            // Default is expense
            conditions.push({
                $or: [
                    { type: 'expense' },
                    { type: { $exists: false } },
                    { type: null }
                ]
            });
        }

        // Filter by status
        if (req.query.status) {
            if (req.query.status === 'pending') {
                conditions.push({
                    $or: [
                        { status: 'pending' },
                        { status: { $exists: false } },
                        { status: null }
                    ]
                });
            } else {
                conditions.push({ status: req.query.status });
            }
        }

        const query = conditions.length > 1 ? { $and: conditions } : conditions[0];

        // Get total amount
        const totalResult = await Expense.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                    average: { $avg: '$amount' }
                }
            }
        ]);

        // Get by category
        const byCategory = await Expense.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { total: -1 } }
        ]);

        // Get timeline (by day)
        const timeline = await Expense.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
                    },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const stats = {
            total: totalResult[0]?.total || 0,
            count: totalResult[0]?.count || 0,
            average: totalResult[0]?.average || 0,
            byCategory: byCategory.map(item => ({
                category: item._id,
                total: item.total,
                count: item.count
            })),
            timeline: timeline.map(item => ({
                date: item._id,
                total: item.total,
                count: item.count
            }))
        };

        // If specific type wasn't requested, maybe we can fetch summary of others?
        // But for now, let's stick to simple filtering.
        // If query.type was set, these stats are for that type.

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('GetStats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saat mengambil statistik'
        });
    }
}

/**
 * Get single expense
 */
async function getExpenseById(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const expense = await Expense.findOne({ _id: id, userId });

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense tidak ditemukan'
            });
        }

        res.json({
            success: true,
            data: { expense }
        });
    } catch (error) {
        console.error('GetExpenseById error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saat mengambil expense'
        });
    }
}

/**
 * Delete expense (user can only delete their own)
 */
async function deleteExpense(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const expense = await Expense.findOne({ _id: id, userId });

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense tidak ditemukan'
            });
        }

        await expense.deleteOne();

        res.json({
            success: true,
            message: 'Expense berhasil dihapus'
        });
    } catch (error) {
        console.error('DeleteExpense error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saat menghapus expense'
        });
    }
}

/**
 * Export expenses to Excel
 */
async function exportExpenses(req, res) {
    try {
        const { startDate, endDate, category } = req.query;
        const userId = req.user._id;

        // Build query
        const query = { userId };

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) {
                query.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                query.timestamp.$lte = new Date(endDate);
            }
        } else {
            // Default to current cycle based on user reset date
            const { startDate, endDate } = getCycleDateRange(req.user.resetDate || 1);
            query.timestamp = {
                $gte: startDate,
                $lte: endDate
            };
        }

        if (category) {
            query.category = category;
        }



        // Filter by type
        if (req.query.type) {
            query.type = req.query.type;
        }
        // Default: include all types if no filter specified

        // Get all expenses matching query
        const expenses = await Expense.find(query).sort({ timestamp: -1 });

        // Prepare data for Excel
        const data = expenses.map(expense => {
            let status = '-';
            if (expense.type === 'debt' || expense.type === 'receivable') {
                status = expense.status === 'paid' ? 'Lunas' : 'Belum Lunas';
            }

            return {
                'Tanggal': new Date(expense.timestamp).toLocaleDateString('id-ID'),
                'Jumlah': expense.amount,
                'Kategori': expense.category || '-',
                'Tipe': expense.type === 'debt' ? 'Hutang' : (expense.type === 'receivable' ? 'Piutang' : 'Pengeluaran'),
                'Status': status,
                'Keterangan': expense.description || '-'
            };
        });

        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(data);

        // Customize column widths
        const wscols = [
            { wch: 15 }, // Tanggal
            { wch: 15 }, // Jumlah
            { wch: 20 }, // Kategori
            { wch: 40 }  // Keterangan
        ];
        worksheet['!cols'] = wscols;

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Pengeluaran');

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Set headers for file download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=pengeluaran_${Date.now()}.xlsx`);

        res.send(buffer);

    } catch (error) {
        console.error('ExportExpenses error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saat export expenses'
        });
    }
}

/**
 * Update expense status (e.g. mark as paid)
 */
async function updateStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user._id;

        const expense = await Expense.findOne({ _id: id, userId });

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Data tidak ditemukan'
            });
        }

        expense.status = status;
        await expense.save();

        res.json({
            success: true,
            message: 'Status berhasil diperbarui',
            data: expense
        });
    } catch (error) {
        console.error('UpdateStatus error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saat memperbarui status'
        });
    }
}

module.exports = {
    getExpenses,
    getStats,
    getExpenseById,
    deleteExpense,
    exportExpenses,
    updateStatus
};
