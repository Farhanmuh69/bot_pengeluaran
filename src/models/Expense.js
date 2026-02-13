const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['expense', 'income', 'debt', 'receivable'],
        default: 'expense'
    },
    status: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'paid' // Default paid for regular expenses
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    phoneNumber: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Format currency untuk Indonesia
expenseSchema.methods.formatAmount = function () {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(this.amount);
};

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
