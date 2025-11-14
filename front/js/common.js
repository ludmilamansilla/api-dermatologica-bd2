// FUNCIONES COMUNES

// URL de la API (dinámico según el entorno)
const API_URL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? 'http://localhost:3000/api'
    : '/api';

// Función helper para obtener la URL completa de una imagen
function getImageUrl(imagePath) {
    if (!imagePath) return '';
    // Si ya es una URL completa (http/https), usarla tal cual
    if (imagePath.startsWith('http')) return imagePath;
    // Si es una URL de Cloudinary, usarla tal cual
    if (imagePath.includes('cloudinary.com') || imagePath.includes('res.cloudinary.com')) return imagePath;
    // En desarrollo, usar localhost:3000
    if (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')) {
        return `http://localhost:3000${imagePath}`;
    }
    // En producción, usar ruta relativa
    return imagePath;
}

// Verificar autenticación
function checkAuth() {
    const user = sessionStorage.getItem('user');
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    return JSON.parse(user);
}

// Obtener token de autenticación
function getAuthToken() {
    const user = sessionStorage.getItem('user');
    if (!user) return null;
    const userData = JSON.parse(user);
    return userData.token;
}

// Función para hacer peticiones autenticadas a la API
async function fetchAPI(endpoint, options = {}) {
    const token = getAuthToken();
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };

    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, finalOptions);
        
        // Si no está autorizado, redirigir al login
        if (response.status === 401) {
            sessionStorage.removeItem('user');
            window.location.href = 'login.html';
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Error en petición API:', error);
        showToast('Error al conectar con el servidor', 'error');
        throw error;
    }
}

// Función para hacer peticiones con FormData (para uploads)
async function fetchAPIFormData(endpoint, formData) {
    const token = getAuthToken();
    
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: formData
        });
        
        if (response.status === 401) {
            sessionStorage.removeItem('user');
            window.location.href = 'login.html';
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Error en petición API:', error);
        showToast('Error al conectar con el servidor', 'error');
        throw error;
    }
}

// Mostrar notificación toast
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    const icons = {
        success: '<i class="fas fa-check-circle" style="color: var(--color-success);"></i>',
        error: '<i class="fas fa-times-circle" style="color: var(--color-danger);"></i>',
        warning: '<i class="fas fa-exclamation-triangle" style="color: var(--color-warning);"></i>',
        info: '<i class="fas fa-info-circle" style="color: var(--color-info);"></i>'
    };
    
    toast.innerHTML = `
        ${icons[type] || icons.info}
        <span>${message}</span>
    `;
    
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// Formatear fecha
function formatDate(date = new Date()) {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('es-ES', options);
}

// Formatear hora
function formatTime(date = new Date()) {
    return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Cerrar sesión
function logout() {
    sessionStorage.removeItem('user');
    localStorage.removeItem('rememberedUser');
    showToast('Sesión cerrada exitosamente', 'success', 2000);
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

// Animar números (contador)
function animateNumber(element, start, end, duration = 1000) {
    if (!element) return;
    
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            element.textContent = end;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// Debounce para búsquedas
function debounce(func, wait = 300) {
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

// Confirmar acción
function confirmAction(message, callback) {
    if (confirm(message)) {
        callback();
    }
}

// Generar ID único
function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// Validar email
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Scroll suave
function smoothScroll(target) {
    const element = document.querySelector(target);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Loading overlay
function showLoading(show = true) {
    let overlay = document.getElementById('loadingOverlay');
    
    if (!overlay && show) {
        overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            ">
                <div style="
                    background: white;
                    padding: 2rem;
                    border-radius: 12px;
                    text-align: center;
                ">
                    <div class="spinner" style="width: 40px; height: 40px; margin: 0 auto 1rem;"></div>
                    <p style="margin: 0; color: var(--color-text-primary);">Cargando...</p>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    } else if (overlay && !show) {
        overlay.remove();
    }
}

// Copiar al portapapeles
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copiado al portapapeles', 'success');
    } catch (err) {
        showToast('Error al copiar', 'error');
    }
}

// Descargar como archivo
function downloadFile(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Obtener token
function getToken() {
    const user = sessionStorage.getItem('user');
    if (!user) return null;
    const userData = JSON.parse(user);
    return userData.token;
}

// Exportar
window.AppUtils = {
    API_URL,
    getImageUrl,
    checkAuth,
    showToast,
    formatDate,
    formatTime,
    logout,
    animateNumber,
    debounce,
    confirmAction,
    generateId,
    isValidEmail,
    smoothScroll,
    showLoading,
    copyToClipboard,
    downloadFile,
    escapeHtml,
    getToken
};
