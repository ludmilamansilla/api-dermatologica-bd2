// ================================================
// DASHBOARD.JS - API DERMATOLÓGICA
// ================================================

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    const user = AppUtils.checkAuth();
    if (!user) return;
    
    // Elementos del DOM
    const userName = document.getElementById('userName');
    const welcomeUserName = document.getElementById('welcomeUserName');
    const currentDate = document.getElementById('currentDate');
    const logoutBtn = document.getElementById('logoutBtn');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    
    // Configurar nombre de usuario
    if (userName && user.username) {
        userName.textContent = user.username;
    }
    
    if (welcomeUserName && user.username) {
        welcomeUserName.textContent = user.username;
    }
    
    // Configurar fecha actual
    if (currentDate) {
        currentDate.textContent = AppUtils.formatDate();
    }
    
    // Evento de logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            AppUtils.confirmAction('¿Está seguro que desea cerrar sesión?', () => {
                AppUtils.logout();
            });
        });
    }
    
    // Menú móvil
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            alert('Menú móvil - Funcionalidad próximamente');
        });
    }
    
    // Animar números de estadísticas
    animateStats();
    
    // Cargar datos reales del dashboard
    loadDashboardData();
    
    // Animaciones de entrada
    observeElements();
});

// Animar estadísticas con números
async function animateStats() {
    const statAfecciones = document.getElementById('statAfecciones');
    const statDiagnosticos = document.getElementById('statDiagnosticos');
    const statSintomas = document.getElementById('statSintomas');
    
    try {
        // Obtener estadísticas reales de la API
        const data = await fetchAPI('/estadisticas');
        
        if (data && data.success) {
            const stats = data.data;
            
            if (statAfecciones) AppUtils.animateNumber(statAfecciones, 0, stats.totalAfecciones, 1500);
            if (statDiagnosticos) AppUtils.animateNumber(statDiagnosticos, 0, stats.totalConsultas, 1200);
            if (statSintomas) AppUtils.animateNumber(statSintomas, 0, stats.totalSintomas, 1800);
            
            // Cargar consultas recientes
            if (stats.consultasRecientes) {
                loadConsultasRecientes(stats.consultasRecientes);
            }
        }
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
        // Valores por defecto en caso de error
        if (statAfecciones) AppUtils.animateNumber(statAfecciones, 0, 0, 1500);
        if (statDiagnosticos) AppUtils.animateNumber(statDiagnosticos, 0, 0, 1200);
        if (statSintomas) AppUtils.animateNumber(statSintomas, 0, 0, 1800);
    }
}

// Cargar consultas recientes
function loadConsultasRecientes(consultas) {
    const tableBody = document.querySelector('.recent-table tbody');
    if (!tableBody) return;
    
    if (!consultas || consultas.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 2rem; color: var(--color-text-light);">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    No hay consultas recientes
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = consultas.map(consulta => {
        const fecha = new Date(consulta.createdAt);
        const fechaFormateada = fecha.toLocaleDateString('es-ES');
        
        const severidadClass = {
            'leve': 'success',
            'moderada': 'warning',
            'grave': 'danger'
        };
        
        const severidad = consulta.diagnosticoPrincipal?.severidad || 'moderada';
        const nombre = consulta.diagnosticoPrincipal?.nombre || 'Pendiente';
        
        return `
            <tr>
                <td>${consulta.nombrePaciente}</td>
                <td>${nombre}</td>
                <td><span class="badge badge-${severidadClass[severidad]}">${severidad}</span></td>
                <td>${fechaFormateada}</td>
            </tr>
        `;
    }).join('');
}

// Cargar datos del dashboard
async function loadDashboardData() {
    // Las estadísticas ya se cargan en animateStats()
    // Esta función puede usarse para cargar datos adicionales si es necesario
    console.log('Dashboard data loaded');
}

// Observer para animaciones de entrada
function observeElements() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });
    
    // Observar elementos con animación
    const animatedElements = document.querySelectorAll('.action-card, .recent-item');
    animatedElements.forEach(el => {
        observer.observe(el);
    });
}

// Actualizar hora en tiempo real (opcional)
function updateTime() {
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        setInterval(() => {
            timeElement.textContent = AppUtils.formatTime();
        }, 1000);
    }
}
