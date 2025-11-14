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
    
    // Event listener para confirmar eliminación
    const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');
    if (btnConfirmarEliminar) {
        btnConfirmarEliminar.addEventListener('click', confirmarEliminacionConsulta);
    }
    
    // Cerrar modal al hacer clic fuera
    const confirmModal = document.getElementById('confirmDeleteModal');
    if (confirmModal) {
        confirmModal.addEventListener('click', function(e) {
            if (e.target === confirmModal) {
                cerrarModalConfirmacion();
            }
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
    const statConsultas = document.getElementById('statConsultas');
    const statSintomas = document.getElementById('statSintomas');
    
    try {
        // Obtener estadísticas reales de la API
        const response = await fetch(`${AppUtils.API_URL}/estadisticas`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AppUtils.getToken()}`
            }
        });
        
        const data = await response.json();
        
        if (data && data.success) {
            const stats = data.data;
            
            if (statAfecciones) AppUtils.animateNumber(statAfecciones, 0, stats.totalAfecciones, 1500);
            if (statConsultas) AppUtils.animateNumber(statConsultas, 0, stats.totalConsultas, 1200);
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
        if (statConsultas) AppUtils.animateNumber(statConsultas, 0, 0, 1200);
        if (statSintomas) AppUtils.animateNumber(statSintomas, 0, 0, 1800);
    }
}

// Cargar consultas recientes
function loadConsultasRecientes(consultas) {
    const tableBody = document.getElementById('consultasTableBody');
    if (!tableBody) return;
    
    if (!consultas || consultas.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: var(--color-text-light);">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 1rem; display: block; opacity: 0.3;"></i>
                    <p>No hay consultas recientes</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = consultas.map(consulta => {
        const fecha = new Date(consulta.createdAt);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const severidadClass = {
            'leve': 'success',
            'moderada': 'warning',
            'grave': 'danger'
        };
        
        const severidad = consulta.diagnosticoPrincipal?.severidad || 'moderada';
        const nombre = consulta.diagnosticoPrincipal?.nombre || 'Pendiente';
        const nombrePaciente = consulta.nombrePaciente || 'Sin nombre';
        const usuario = consulta.usuario?.username || 'Usuario';
        
        return `
            <tr data-consulta-id="${consulta._id}">
                <td><strong>${AppUtils.escapeHtml(nombrePaciente)}</strong><br><small style="color: var(--color-text-light);">Por: ${AppUtils.escapeHtml(usuario)}</small></td>
                <td>${AppUtils.escapeHtml(nombre)}</td>
                <td><span class="badge badge-${severidadClass[severidad]}">${severidad}</span></td>
                <td>${fechaFormateada}</td>
                <td>
                    <div class="actions-cell">
                        <button class="btn-icon-sm btn-view" data-consulta-id="${consulta._id}" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon-sm btn-delete" data-consulta-id="${consulta._id}" data-paciente="${AppUtils.escapeHtml(nombrePaciente)}" title="Eliminar consulta">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    // Agregar event listeners a los botones
    agregarEventListenersConsultas();
}

// Agregar event listeners a los botones de consultas
function agregarEventListenersConsultas() {
    // Botones de ver
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-consulta-id');
            verConsulta(id);
        });
    });
    
    // Botones de eliminar
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-consulta-id');
            const paciente = this.getAttribute('data-paciente');
            eliminarConsulta(id, paciente);
        });
    });
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

// Ver detalles de una consulta
function verConsulta(id) {
    window.location.href = `resultado.html?id=${id}`;
}

// Variable para almacenar la consulta a eliminar
let consultaToDelete = null;

// Mostrar modal de confirmación para eliminar
function mostrarModalEliminar(id, nombrePaciente) {
    consultaToDelete = { id, nombrePaciente };
    
    const modal = document.getElementById('confirmDeleteModal');
    const message = document.getElementById('confirmDeleteMessage');
    
    message.innerHTML = `
        ¿Está seguro que desea eliminar la consulta del paciente <strong>"${AppUtils.escapeHtml(nombrePaciente)}"</strong>?
        <br><br>
        <span style="color: var(--color-danger); font-size: 0.9rem;">
            <i class="fas fa-info-circle"></i> Esta acción no se puede deshacer.
        </span>
    `;
    
    modal.style.display = 'flex';
}

// Cerrar modal de confirmación
function cerrarModalConfirmacion() {
    const modal = document.getElementById('confirmDeleteModal');
    modal.style.display = 'none';
    consultaToDelete = null;
}

// Eliminar consulta (ejecutar después de confirmar)
async function confirmarEliminacionConsulta() {
    if (!consultaToDelete) return;
    
    const { id, nombrePaciente } = consultaToDelete;
    
    console.log('Intentando eliminar consulta:', id, nombrePaciente);
    
    try {
        console.log('Enviando petición DELETE a:', `${AppUtils.API_URL}/consultas/${id}`);
        
        const response = await fetch(`${AppUtils.API_URL}/consultas/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AppUtils.getToken()}`
            }
        });
        
        console.log('Respuesta del servidor:', response.status);
        
        const data = await response.json();
        console.log('Datos de respuesta:', data);
        
        if (data && data.success) {
            AppUtils.showToast(`Consulta del paciente "${nombrePaciente}" eliminada exitosamente`, 'success');
            
            // Cerrar modal
            cerrarModalConfirmacion();
            
            // Eliminar la fila de la tabla
            const row = document.querySelector(`tr[data-consulta-id="${id}"]`);
            if (row) {
                row.remove();
                console.log('Fila eliminada de la tabla');
            }
            
            // Recargar las estadísticas para actualizar el contador
            await animateStats();
            console.log('Estadísticas actualizadas');
        } else {
            console.error('Error en la respuesta:', data.message);
            AppUtils.showToast(data.message || 'Error al eliminar la consulta', 'error');
            cerrarModalConfirmacion();
        }
    } catch (error) {
        console.error('Error eliminando consulta:', error);
        AppUtils.showToast('Error de conexión al eliminar la consulta', 'error');
        cerrarModalConfirmacion();
    }
}

// Función de compatibilidad (mantener por si se usa en algún lugar)
async function eliminarConsulta(id, nombrePaciente) {
    mostrarModalEliminar(id, nombrePaciente);
}
