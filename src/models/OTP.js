const mongoose = require('mongoose');

/**
 * OTP Schema for phone verification
 * OTP expires after 5 minutes
 */
const otpSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    code: {
        type: String,
        required: true,
        length: 6
    },
    purpose: {
        type: String,
        enum: ['registration', 'login', 'password_reset'],
        default: 'registration'
    },
    verified: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL index - auto delete when expired
    },
    attempts: {
        type: Number,
        default: 0,
        max: 3 // Maximum 3 verification attempts
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index untuk query cepat
otpSchema.index({ phoneNumber: 1, verified: 1 });
otpSchema.index({ expiresAt: 1 });

/**
 * Method untuk generate OTP code (6 digit)
 */
otpSchema.statics.generateCode = function () {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Method untuk create OTP baru
 */
otpSchema.statics.createOTP = async function (phoneNumber, purpose = 'registration') {
    // Delete old unverified OTPs for this phone number
    await this.deleteMany({
        phoneNumber,
        verified: false
    });

    // Generate new OTP
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const otp = await this.create({
        phoneNumber,
        code,
        purpose,
        expiresAt
    });

    return otp;
};

/**
 * Method untuk verify OTP
 */
otpSchema.statics.verifyOTP = async function (phoneNumber, code) {
    const otp = await this.findOne({
        phoneNumber,
        code,
        verified: false,
        expiresAt: { $gt: new Date() }
    });

    if (!otp) {
        return {
            success: false,
            message: 'Kode OTP tidak valid atau sudah kadaluarsa'
        };
    }

    // Check attempts
    if (otp.attempts >= 3) {
        return {
            success: false,
            message: 'Terlalu banyak percobaan. Silakan minta kode baru.'
        };
    }

    // Mark as verified
    otp.verified = true;
    await otp.save();

    return {
        success: true,
        message: 'Verifikasi berhasil',
        otp
    };
};

/**
 * Method untuk increment attempts
 */
otpSchema.methods.incrementAttempts = async function () {
    this.attempts += 1;
    await this.save();
};

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
