// LOGIN

document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const usernameInput = document.getElementById('username');
    const loginButton = loginForm.querySelector('.btn-login');
    
    // Toggle visibility de contraseña
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        const icon = this.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });
    
    // Animación de focus en inputs
    const inputs = document.querySelectorAll('.form-control');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });
    
    // Manejo del formulario
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        
        // Validaciones
        if (!username || !password) {
            showToast('Por favor, complete todos los campos', 'error');
            return;
        }
        
        // Mostrar loading
        loginButton.classList.add('loading');
        loginButton.disabled = true;
        
        try {
            // Llamada a la API real
            const response = await fetch(`${AppUtils.API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success && data.data) {
                showToast('¡Inicio de sesión exitoso!', 'success');
                
                // Guardar sesión con token
                sessionStorage.setItem('user', JSON.stringify({
                    id: data.data.id,
                    username: data.data.username,
                    role: data.data.role,
                    token: data.data.token,
                    loginTime: new Date().toISOString()
                }));
                
                // Redireccionar al dashboard
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                loginButton.classList.remove('loading');
                loginButton.disabled = false;
                showToast(data.message || 'Usuario o contraseña incorrectos', 'error');
                
                // Animación de error
                loginForm.classList.add('shake');
                setTimeout(() => {
                    loginForm.classList.remove('shake');
                }, 500);
            }
        } catch (error) {
            console.error('Error en login:', error);
            loginButton.classList.remove('loading');
            loginButton.disabled = false;
            showToast('Error al conectar con el servidor', 'error');
            
            // Animación de error
            loginForm.classList.add('shake');
            setTimeout(() => {
                loginForm.classList.remove('shake');
            }, 500);
        }
    });
    
    // Función para mostrar notificaciones toast
    function showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        
        // Iconos según el tipo
        const icons = {
            success: '<i class="fas fa-check-circle" style="color: var(--color-success);"></i>',
            error: '<i class="fas fa-times-circle" style="color: var(--color-danger);"></i>',
            info: '<i class="fas fa-info-circle" style="color: var(--color-info);"></i>'
        };
        
        toast.innerHTML = `
            ${icons[type] || icons.info}
            <span>${message}</span>
        `;
        
        toast.className = `toast ${type} show`;
        
        // Ocultar después de 3 segundos
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    // Animación de entrada de elementos
    const animatedElements = document.querySelectorAll('.login-card, .login-footer');
    animatedElements.forEach((el, index) => {
        el.style.animationDelay = `${index * 0.1}s`;
    });
    
    // Recordar usuario si está guardado
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
        usernameInput.value = rememberedUser;
        document.getElementById('remember').checked = true;
    }
    
    // Guardar usuario si se marca "Recordarme"
    loginForm.addEventListener('submit', function() {
        const rememberCheckbox = document.getElementById('remember');
        if (rememberCheckbox.checked) {
            localStorage.setItem('rememberedUser', usernameInput.value);
        } else {
            localStorage.removeItem('rememberedUser');
        }
    });
    
    // Easter egg: Tecla Enter desde cualquier input
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                loginForm.dispatchEvent(new Event('submit'));
            }
        });
    });
    
    // Prevenir autofill amarillo en Chrome
    setTimeout(() => {
        inputs.forEach(input => {
            if (input.value !== '') {
                input.classList.add('has-value');
            }
        });
    }, 100);
});

// Añadir clase de shake para animación de error
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    .shake {
        animation: shake 0.5s;
    }
`;
document.head.appendChild(style);
