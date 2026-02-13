const Expense = require('../models/Expense');
const User = require('../models/User');
const { parseExpenseMessage } = require('../utils/messageParser');
const { validateExpense, formatErrorMessage } = require('../utils/validator');
const { getOrCreateUser } = require('../utils/userManager');
const botConfig = require('../config/botConfig');
const { normalizePhoneNumber } = require('../utils/phoneNormalizer');

/**
 * Handle incoming messages
 * @param {Message} msg - WhatsApp message object
 */
async function handleMessage(msg) {
    try {
        // Ignore group messages dan broadcast
        const chat = await msg.getChat();
        if (chat.isGroup) {
            return;
        }

        // Ignore pesan dari bot sendiri
        if (msg.fromMe) {
            return;
        }

        const messageBody = msg.body.trim();
        const phoneNumber = msg.from;

        // Normalize phone number for database lookup
        const normalizedPhone = normalizePhoneNumber(phoneNumber);

        console.log(`📨 Pesan diterima dari ${phoneNumber}`);
        console.log(`📞 Normalized: ${normalizedPhone}`);

        // Check if user is registered (using normalized phone)
        const user = await User.findOne({
            phoneNumber: normalizedPhone,
            isActive: true
        });

        if (!user) {
            console.log(`❌ User tidak terdaftar: ${normalizedPhone}`);

            // Send rejection message with registration link
            const rejectionMessage = botConfig.messages.unregisteredUser(botConfig.websiteUrl);
            await msg.reply(rejectionMessage);
            return;
        }

        // Update last active
        user.lastActive = new Date();
        await user.save();

        console.log(`✅ User terdaftar: ${user.name} (${phoneNumber})`);

        // Check for commands
        const lowerMessage = messageBody.toLowerCase();

        // Help command
        if (botConfig.commands.help.some(cmd => lowerMessage === cmd)) {
            await msg.reply(botConfig.messages.help());
            return;
        }

        // Parse pesan expense
        const parsedData = parseExpenseMessage(messageBody);

        // Jika bukan pesan expense, abaikan atau beri hint
        if (!parsedData) {
            // Optionally send a hint
            if (messageBody.length > 0 && messageBody.length < 100) {
                await msg.reply(
                    '❓ Format pesan tidak dikenali.\n\n' +
                    'Gunakan format: `keluar [jumlah] [kategori] [keterangan]`\n' +
                    'Contoh: `keluar 25000 makan siang`\n\n' +
                    'Ketik `help` untuk panduan lengkap.'
                );
            }
            return;
        }

        console.log('🔍 Data parsed:', parsedData);

        // Validasi data
        const validation = validateExpense(parsedData);

        if (!validation.valid) {
            console.log('❌ Validasi gagal:', validation.errors);
            await msg.reply(formatErrorMessage(validation.errors));
            return;
        }

        // Determine status: debt/receivable -> pending, else -> paid
        const type = parsedData.type || 'expense';
        const status = (type === 'debt' || type === 'receivable') ? 'pending' : 'paid';

        // Simpan ke database
        const expense = new Expense({
            amount: parsedData.amount,
            category: parsedData.category,
            description: parsedData.description,
            phoneNumber: phoneNumber,
            userId: user._id,
            type: type,
            status: status
        });

        await expense.save();
        console.log('✅ Data tersimpan:', expense._id);

        // Kirim konfirmasi
        const confirmationMessage = formatConfirmationMessage(expense, user);
        await msg.reply(confirmationMessage);

    } catch (error) {
        console.error('❌ Error handling message:', error);
        await msg.reply('⚠️ Maaf, terjadi kesalahan saat memproses pesan. Silakan coba lagi.');
    }
}

/**
 * Format confirmation message
 * @param {Expense} expense - Expense document
 * @param {User} user - User document
 * @returns {string} - Formatted confirmation message
 */
function formatConfirmationMessage(expense, user) {
    const formattedAmount = expense.formatAmount();
    const date = new Date(expense.timestamp).toLocaleString('id-ID', {
        dateStyle: 'full',
        timeStyle: 'short'
    });

    let title = '✅ *Pengeluaran berhasil dicatat!*';
    let typeLabel = 'Kategori';

    if (expense.type === 'debt') {
        title = '✅ *Hutang berhasil dicatat!*';
        typeLabel = 'Pemberi Hutang';
    } else if (expense.type === 'receivable') {
        title = '✅ *Piutang berhasil dicatat!*';
        typeLabel = 'Peminjam';
    } else if (expense.type === 'income') {
        title = '✅ *Pemasukan berhasil dicatat!*';
        typeLabel = 'Sumber';
    }

    let message = `${title}\n\n`;
    message += `👤 *Nama:* ${user.name}\n`;
    message += `💰 *Jumlah:* ${formattedAmount}\n`;
    message += `📁 *${typeLabel}:* ${expense.category}\n`;

    if (expense.description) {
        message += `📝 *Keterangan:* ${expense.description}\n`;
    }

    message += `📅 *Waktu:* ${date}\n`;
    message += `🆔 *ID:* ${expense._id.toString().slice(-6)}`;

    return message;
}


module.exports = {
    handleMessage
};
