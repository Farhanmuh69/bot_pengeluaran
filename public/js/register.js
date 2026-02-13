// API Base URL
const API_URL = window.location.origin + '/api';

// DOM Elements
const registerForm = document.getElementById('registerForm');
const phoneSection = document.getElementById('phoneSection');
const otpSection = document.getElementById('otpSection');
const alertBox = document.getElementById('alertBox');

const phoneInput = document.getElementById('phoneNumber');
const otpInput = document.getElementById('otpCode');
const nameInput = document.getElementById('name');
const passwordInput = document.getElementById('password');

const requestOtpBtn = document.getElementById('requestOtpBtn');
const registerBtn = document.getElementById('registerBtn');
const resendOtpBtn = document.getElementById('resendOtpBtn');
const otpTimer = document.getElementById('otpTimer');

// State
let otpExpiresAt = null;
let timerInterval = null;

/**
 * Show alert message
 */
function showAlert(message, type = 'info') {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = 'block';

    // Auto hide after 5 seconds for success messages
    if (type === 'success') {
        setTimeout(() => {
            alertBox.style.display = 'none';
        }, 5000);
    }
}

/**
 * Hide alert
 */
function hideAlert() {
    alertBox.style.display = 'none';
}

/**
 * Format phone number (remove spaces, dashes, etc)
 */
function formatPhoneNumber(phone) {
    return phone.replace(/\D/g, '');
}

/**
 * Validate phone number
 */
function validatePhoneNumber(phone) {
    const cleaned = formatPhoneNumber(phone);

    if (cleaned.length < 10 || cleaned.length > 15) {
        return {
            valid: false,
            message: 'Nomor telepon harus 10-15 digit'
        };
    }

    if (!cleaned.startsWith('0') && !cleaned.startsWith('62')) {
        return {
            valid: false,
            message: 'Nomor telepon harus diawali 0 atau 62'
        };
    }

    return { valid: true };
}

/**
 * Start OTP countdown timer
 */
function startOtpTimer(expiresAt) {
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    otpExpiresAt = new Date(expiresAt);

    timerInterval = setInterval(() => {
        const now = new Date();
        const diff = otpExpiresAt - now;

        if (diff <= 0) {
            clearInterval(timerInterval);
            otpTimer.textContent = '⏰ Kode OTP telah kadaluarsa';
            otpTimer.style.color = '#dc3545';
            resendOtpBtn.disabled = false;
            return;
        }

        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        otpTimer.textContent = `⏱️ Kode berlaku ${minutes}:${seconds.toString().padStart(2, '0')}`;
        otpTimer.style.color = '#667eea';

        // Enable resend button 30 seconds before expiry
        if (diff <= 30000) {
            resendOtpBtn.disabled = false;
        }
    }, 1000);
}

/**
 * Request OTP
 */
async function requestOTP() {
    const phoneNumber = formatPhoneNumber(phoneInput.value);

    // Validate
    const validation = validatePhoneNumber(phoneNumber);
    if (!validation.valid) {
        showAlert(validation.message, 'error');
        return;
    }

    // Disable button and show loading
    requestOtpBtn.disabled = true;
    requestOtpBtn.innerHTML = 'Mengirim OTP<span class="loading"></span>';
    hideAlert();

    try {
        const response = await fetch(`${API_URL}/auth/request-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phoneNumber })
        });

        const data = await response.json();

        if (data.success) {
            showAlert(data.message, 'success');

            // Show OTP section
            phoneSection.style.display = 'none';
            otpSection.style.display = 'block';

            // Start timer
            startOtpTimer(data.expiresAt);

            // Focus on OTP input
            otpInput.focus();
        } else {
            showAlert(data.message, 'error');
            requestOtpBtn.disabled = false;
            requestOtpBtn.textContent = 'Kirim Kode OTP';
        }
    } catch (error) {
        console.error('Request OTP error:', error);
        showAlert('Gagal mengirim OTP. Silakan coba lagi.', 'error');
        requestOtpBtn.disabled = false;
        requestOtpBtn.textContent = 'Kirim Kode OTP';
    }
}

/**
 * Register user
 */
async function register(e) {
    e.preventDefault();

    const phoneNumber = formatPhoneNumber(phoneInput.value);
    const otpCode = otpInput.value.trim();
    const name = nameInput.value.trim();
    const password = passwordInput.value.trim();

    // Validate
    if (!otpCode || otpCode.length !== 6) {
        showAlert('Kode OTP harus 6 digit', 'error');
        return;
    }

    if (!name) {
        showAlert('Nama harus diisi', 'error');
        return;
    }

    // Disable button and show loading
    registerBtn.disabled = true;
    registerBtn.innerHTML = 'Mendaftar<span class="loading"></span>';
    hideAlert();

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phoneNumber,
                otpCode,
                name,
                password: password || undefined
            })
        });

        const data = await response.json();

        if (data.success) {
            showAlert('✅ ' + data.message + ' Mengalihkan ke dashboard...', 'success');

            // Save token
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));

            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);
        } else {
            showAlert(data.message, 'error');
            registerBtn.disabled = false;
            registerBtn.textContent = 'Daftar Sekarang';
        }
    } catch (error) {
        console.error('Register error:', error);
        showAlert('Gagal mendaftar. Silakan coba lagi.', 'error');
        registerBtn.disabled = false;
        registerBtn.textContent = 'Daftar Sekarang';
    }
}

/**
 * Resend OTP
 */
async function resendOTP() {
    resendOtpBtn.disabled = true;
    resendOtpBtn.innerHTML = 'Mengirim<span class="loading"></span>';

    await requestOTP();

    resendOtpBtn.disabled = true;
    resendOtpBtn.textContent = 'Kirim Ulang OTP';
}

// Event Listeners
requestOtpBtn.addEventListener('click', requestOTP);
registerForm.addEventListener('submit', register);
resendOtpBtn.addEventListener('click', resendOTP);

// Auto-format phone number input
phoneInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '');
});

// Auto-format OTP input
otpInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
});

// Cleanup timer on page unload
window.addEventListener('beforeunload', () => {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
});
