// Shared JavaScript utilities for Bot Pengeluaran Dashboard

/**
 * API Base URL
 */
const API_BASE = '';

/**
 * Make authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };

    const response = await fetch(API_BASE + endpoint, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    });

    return response.json();
}

/**
 * Format currency to Indonesian Rupiah
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount || 0);
}

/**
 * Format date to Indonesian locale
 */
function formatDate(dateString, options = {}) {
    const defaultOptions = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };

    return new Date(dateString).toLocaleDateString('id-ID', {
        ...defaultOptions,
        ...options
    });
}

/**
 * Check if user is authenticated
 */
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return false;
    }
    return true;
}

/**
 * Check if user is admin
 */
function checkAdminAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || user.role !== 'admin') {
        window.location.href = '/';
        return false;
    }
    return true;
}

/**
 * Logout user
 */
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    // Simple alert for now, can be enhanced with custom toast UI
    alert(message);
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
