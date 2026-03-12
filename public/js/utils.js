// ===========================================
// Utility Functions
// Used across all pages for common operations
// ===========================================

/**
 * Base URL for API calls.
 * Change this if your backend runs on a different port.
 */
const API_BASE = '';

// ===========================================
// Toast Notification System
// ===========================================

/**
 * Show a toast notification.
 * @param {string} message - The message to display
 * @param {string} type - 'success', 'error', 'info', or 'warning'
 * @param {number} duration - How long to show the toast (ms)
 */
function showToast(message, type = 'info', duration = 4000) {
    // Create container if it doesn't exist
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Icon based on type
    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠',
    };

    toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${message}`;
    container.appendChild(toast);

    // Auto-remove after duration
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ===========================================
// API Helper Functions
// ===========================================

/**
 * Get the Firebase auth token for API calls.
 * @returns {Promise<string|null>} The auth token or null
 */
async function getAuthToken() {
    const user = firebase.auth().currentUser;
    if (!user) return null;
    return await user.getIdToken();
}

/**
 * Make an authenticated API request.
 * @param {string} endpoint - API endpoint (e.g., '/api/users/me')
 * @param {Object} options - Fetch options (method, body, etc.)
 * @returns {Promise<Object>} The JSON response
 */
async function apiRequest(endpoint, options = {}) {
    const token = await getAuthToken();

    const defaultHeaders = {};
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData (browser sets it with boundary)
    if (!(options.body instanceof FormData)) {
        defaultHeaders['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
    }

    return data;
}

// ===========================================
// Authentication Helpers
// ===========================================

/**
 * Check if the user is logged in and redirect if not.
 * Call this on protected pages.
 */
function requireAuth() {
    return new Promise((resolve) => {
        firebase.auth().onAuthStateChanged((user) => {
            if (!user) {
                window.location.href = '/login.html';
                return;
            }
            resolve(user);
        });
    });
}

/**
 * Check if user already logged in (for auth pages).
 * Redirects to feed if already authenticated.
 */
function redirectIfAuthenticated() {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            window.location.href = '/feed.html';
        }
    });
}

/**
 * Logout the current user.
 */
async function logout() {
    try {
        await firebase.auth().signOut();
        showToast('Logged out successfully!', 'success');
        window.location.href = '/index.html';
    } catch (error) {
        showToast('Error logging out', 'error');
    }
}

// ===========================================
// Formatting Helpers
// ===========================================

/**
 * Format a date to a relative time string (e.g., "2 hours ago").
 * @param {string} dateString - ISO date string
 * @returns {string} Relative time string
 */
function timeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);

    const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'week', seconds: 604800 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 },
    ];

    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) {
            return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
        }
    }

    return 'Just now';
}

/**
 * Get initials from a full name.
 * @param {string} name - Full name
 * @returns {string} Initials (e.g., "JD" for "John Doe")
 */
function getInitials(name) {
    if (!name) return '?';
    return name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

/**
 * Generate an avatar HTML string.
 * Shows the image if available, otherwise shows initials.
 * @param {string} imageUrl - Profile picture URL
 * @param {string} name - User's name
 * @param {string} sizeClass - CSS class for size (e.g., 'avatar-lg')
 * @returns {string} HTML string
 */
function avatarHTML(imageUrl, name, sizeClass = '') {
    if (imageUrl) {
        return `<img src="${imageUrl}" alt="${name}" class="avatar ${sizeClass}" onerror="this.outerHTML=avatarPlaceholderHTML('${name}', '${sizeClass}')">`;
    }
    return avatarPlaceholderHTML(name, sizeClass);
}

/**
 * Generate an avatar placeholder with initials.
 */
function avatarPlaceholderHTML(name, sizeClass = '') {
    return `<div class="avatar avatar-placeholder ${sizeClass}">${getInitials(name)}</div>`;
}

/**
 * Truncate text to a maximum length.
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum character count
 * @returns {string} Truncated text with ellipsis
 */
function truncateText(text, maxLength = 150) {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength) + '...';
}

/**
 * Escape HTML to prevent XSS attacks.
 * @param {string} text - Raw text
 * @returns {string} Escaped HTML string
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===========================================
// Loading State Helpers
// ===========================================

/**
 * Show a loading spinner inside a button.
 * @param {HTMLElement} button - The button element
 * @param {string} loadingText - Text to show while loading
 */
function setButtonLoading(button, loadingText = 'Loading...') {
    button.disabled = true;
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = `<span class="spinner"></span> ${loadingText}`;
}

/**
 * Remove the loading state from a button.
 * @param {HTMLElement} button - The button element
 */
function resetButton(button) {
    button.disabled = false;
    button.innerHTML = button.dataset.originalText || button.innerHTML;
}

/**
 * Show a skeleton loading state for a container.
 * @param {HTMLElement} container - The container element
 * @param {number} count - Number of skeleton items
 */
function showSkeletonLoader(container, count = 3) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="card" style="padding: 16px; margin-bottom: 16px;">
                <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px;">
                    <div class="skeleton" style="width: 48px; height: 48px; border-radius: 50%;"></div>
                    <div style="flex: 1;">
                        <div class="skeleton" style="height: 14px; width: 60%; margin-bottom: 8px;"></div>
                        <div class="skeleton" style="height: 10px; width: 40%;"></div>
                    </div>
                </div>
                <div class="skeleton" style="height: 12px; width: 100%; margin-bottom: 8px;"></div>
                <div class="skeleton" style="height: 12px; width: 80%; margin-bottom: 8px;"></div>
                <div class="skeleton" style="height: 12px; width: 60%;"></div>
            </div>
        `;
    }
    container.innerHTML = html;
}

// ===========================================
// Navigation Helpers
// ===========================================

/**
 * Render the navigation bar.
 * Call this on all authenticated pages.
 * @param {string} activePage - Current page identifier
 */
async function renderNavbar(activePage = '') {
    const navContainer = document.getElementById('navbar');
    if (!navContainer) return;

    // Get current user for notification badge
    let hasUnread = false;
    try {
        const userData = await apiRequest('/api/users/me');
        if (userData.success && userData.data) {
            hasUnread = userData.data.notifications?.some((n) => !n.read);
            // Store user data globally for other components
            window.currentUser = userData.data;
        }
    } catch (e) {
        // User might not have a profile yet
    }

    navContainer.innerHTML = `
        <nav class="navbar">
            <div class="nav-container">
                <a href="/feed.html" class="nav-logo">Mini LinkedIn</a>
                <div class="nav-links">
                    <a href="/feed.html" class="nav-link ${activePage === 'feed' ? 'active' : ''}" id="nav-feed">
                        <i class="fas fa-home"></i>
                        <span class="nav-text">Home</span>
                    </a>
                    <a href="/notifications.html" class="nav-link ${activePage === 'notifications' ? 'active' : ''}" id="nav-notifications">
                        <i class="fas fa-bell"></i>
                        <span class="nav-text">Notifications</span>
                        ${hasUnread ? '<span class="nav-badge"></span>' : ''}
                    </a>
                    <a href="/profile.html" class="nav-link ${activePage === 'profile' ? 'active' : ''}" id="nav-profile">
                        <i class="fas fa-user"></i>
                        <span class="nav-text">Me</span>
                    </a>
                    <button onclick="logout()" class="nav-link" id="nav-logout" style="border: none; background: none; cursor: pointer;">
                        <i class="fas fa-sign-out-alt"></i>
                        <span class="nav-text">Logout</span>
                    </button>
                </div>
            </div>
        </nav>
    `;
}

// ===========================================
// File Upload Preview
// ===========================================

/**
 * Setup image upload preview functionality.
 * @param {string} inputId - File input element ID
 * @param {string} previewContainerId - Preview container element ID
 */
function setupImagePreview(inputId, previewContainerId) {
    const input = document.getElementById(inputId);
    const container = document.getElementById(previewContainerId);

    if (!input || !container) return;

    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) {
            container.innerHTML = '';
            return;
        }

        if (!file.type.startsWith('image/')) {
            showToast('Please select an image file', 'error');
            input.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast('Image must be less than 5MB', 'error');
            input.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            container.innerHTML = `
                <div class="image-preview-container">
                    <img src="${e.target.result}" alt="Preview" class="image-preview">
                    <button type="button" class="remove-image-btn" onclick="removeImagePreview('${inputId}', '${previewContainerId}')">✕</button>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Remove image preview and clear the file input.
 */
function removeImagePreview(inputId, previewContainerId) {
    document.getElementById(inputId).value = '';
    document.getElementById(previewContainerId).innerHTML = '';
}
