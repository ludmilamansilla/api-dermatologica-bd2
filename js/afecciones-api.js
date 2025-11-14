// AFECCIONES-API.JS - GESTIÓN DE AFECCIONES

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    const user = AppUtils.checkAuth();
    if (!user) return;
    
    // Configurar nombre de usuario
    const userName = document.getElementById('userName');
    if (userName && user.username) {
        userName.textContent = user.username;
    }
    
    // Evento de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('¿Está seguro que desea cerrar sesión?')) {
                AppUtils.logout();
            }
        });
    }
    
    // Búsqueda con debounce
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', AppUtils.debounce(function() {
            cargarAfecciones();
        }, 300));
    }
    
    // Botón limpiar filtros
    const btnResetFilters = document.getElementById('btnResetFilters');
    if (btnResetFilters) {
        btnResetFilters.addEventListener('click', function() {
            searchInput.value = '';
            cargarAfecciones();
            AppUtils.showToast('Búsqueda limpiada', 'info');
        });
    }
    
    // Cargar afecciones inicialmente
    cargarAfecciones();
});

// CARGAR Y RENDERIZAR AFECCIONES

async function cargarAfecciones() {
    const searchInput = document.getElementById('searchInput');
    const afeccionesGrid = document.getElementById('afeccionesGrid');
    
    if (!afeccionesGrid) return;
    
    // Mostrar loading
    afeccionesGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
            <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: var(--color-primary);"></i>
            <p style="margin-top: 1rem; color: var(--color-text-light); font-size: 1.1rem;">Cargando afecciones...</p>
        </div>
    `;
    
    try {
        const params = new URLSearchParams();
        if (searchInput?.value) {
            params.append('search', searchInput.value);
        }
        
        const response = await fetch(`${AppUtils.API_URL}/afecciones?${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AppUtils.getToken()}`
            }
        });
        
        const data = await response.json();
        
        if (data && data.success) {
            renderizarAfecciones(data.data);
        } else {
            mostrarError(afeccionesGrid, data.message || 'Error al cargar afecciones');
        }
    } catch (error) {
        console.error('Error cargando afecciones:', error);
        mostrarError(afeccionesGrid, 'Error de conexión al cargar afecciones');
    }
}

function renderizarAfecciones(afecciones) {
    const afeccionesGrid = document.getElementById('afeccionesGrid');
    if (!afeccionesGrid) return;
    
    if (!afecciones || afecciones.length === 0) {
        afeccionesGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem;">
                <div style="color: var(--color-text-light);">
                    <i class="fas fa-search" style="font-size: 4rem; margin-bottom: 1rem; display: block; opacity: 0.3;"></i>
                    <h3 style="margin-bottom: 0.5rem;">No se encontraron afecciones</h3>
                    <p style="font-size: 0.95rem; margin-bottom: 2rem;">Intente con otros criterios de búsqueda o cree una nueva afección</p>
                    <a href="afeccion-form.html" class="btn btn-accent">
                        <i class="fas fa-plus"></i> Nueva Afección
                    </a>
                </div>
            </div>
        `;
        return;
    }
    
    afeccionesGrid.innerHTML = afecciones.map(afeccion => {
        const cantidadSintomas = afeccion.sintomas?.length || 0;
        const descripcionCorta = afeccion.descripcion 
            ? (afeccion.descripcion.length > 120 
                ? afeccion.descripcion.substring(0, 120) + '...' 
                : afeccion.descripcion)
            : 'Sin descripción';
        
        // URL de la imagen (si existe) o placeholder
        const imagenUrl = afeccion.imagen 
            ? `http://localhost:3000${afeccion.imagen}`
            : `https://via.placeholder.com/300x200/5FD4A6/ffffff?text=${encodeURIComponent(afeccion.nombre)}`;
        
        return `
            <div class="afeccion-card">
                <div class="afeccion-image">
                    <img src="${imagenUrl}" 
                         alt="${AppUtils.escapeHtml(afeccion.nombre)}"
                         onerror="this.src='https://via.placeholder.com/300x200/CCCCCC/666666?text=Sin+Imagen'">
                </div>
                <div class="afeccion-content">
                    <h4>${AppUtils.escapeHtml(afeccion.nombre)}</h4>
                    <p class="afeccion-description">${AppUtils.escapeHtml(descripcionCorta)}</p>
                    <div class="afeccion-meta">
                        <span class="meta-item">
                            <i class="fas fa-heartbeat"></i>
                            ${cantidadSintomas} síntoma${cantidadSintomas !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
                <div class="afeccion-actions">
                    <button class="btn btn-sm btn-outline" onclick="verDetalle('${afeccion._id}')" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                        Ver
                    </button>
                    <a href="afeccion-form.html?id=${afeccion._id}" class="btn btn-sm btn-primary" title="Editar afección">
                        <i class="fas fa-edit"></i>
                        Editar
                    </a>
                    <button class="btn btn-sm btn-danger" onclick="confirmarEliminar('${afeccion._id}', '${AppUtils.escapeHtml(afeccion.nombre)}')" title="Eliminar afección">
                        <i class="fas fa-trash"></i>
                        Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function mostrarError(container, mensaje) {
    container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
            <div style="color: var(--color-danger);">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                <h3 style="margin-bottom: 0.5rem;">Error</h3>
                <p style="font-size: 1.1rem;">${mensaje}</p>
                <button class="btn btn-primary" onclick="cargarAfecciones()" style="margin-top: 1rem;">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </div>
        </div>
    `;
}

// ================================================
// VER DETALLE DE AFECCIÓN
// ================================================

async function verDetalle(id) {
    try {
        const response = await fetch(`${AppUtils.API_URL}/afecciones/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AppUtils.getToken()}`
            }
        });
        
        const data = await response.json();
        
        if (data && data.success) {
            mostrarModalDetalle(data.data);
        } else {
            AppUtils.showToast(data.message || 'Error al cargar el detalle', 'error');
        }
    } catch (error) {
        console.error('Error cargando detalle:', error);
        AppUtils.showToast('Error de conexión al cargar el detalle', 'error');
    }
}

function mostrarModalDetalle(afeccion) {
    const sintomas = afeccion.sintomas || [];
    const sintomasHTML = sintomas.length > 0 
        ? sintomas.map(s => `<li style="color: #2c3e50;">${AppUtils.escapeHtml(s.nombre || s)}</li>`).join('')
        : '<li style="color: #7f8c8d;">No hay síntomas asociados</li>';
    
    // Preparar imagen si existe
    const imagenHTML = afeccion.imagen 
        ? `<div style="margin-bottom: 1.5rem;">
               <img src="http://localhost:3000${afeccion.imagen}" 
                    alt="${AppUtils.escapeHtml(afeccion.nombre)}"
                    style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
                    onerror="this.style.display='none'">
           </div>`
        : '';
    
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px; background: #ffffff;">
            <div class="modal-header" style="background: var(--color-primary); color: white; border-radius: 12px 12px 0 0;">
                <h3 style="color: white; margin: 0;">
                    <i class="fas fa-notes-medical"></i> ${AppUtils.escapeHtml(afeccion.nombre)}
                </h3>
                <button class="btn-close" onclick="this.closest('.modal-backdrop').remove()" style="color: white;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div style="padding: 2rem; background: #ffffff;">
                ${imagenHTML}
                
                <div style="margin-bottom: 1.5rem;">
                    <h4 style="margin-bottom: 0.75rem; color: #2c3e50; font-size: 1.1rem; font-weight: 600;">
                        <i class="fas fa-info-circle" style="color: var(--color-primary);"></i> Descripción
                    </h4>
                    <p style="line-height: 1.7; color: #34495e; font-size: 0.95rem;">
                        ${AppUtils.escapeHtml(afeccion.descripcion || 'Sin descripción')}
                    </p>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <h4 style="margin-bottom: 0.75rem; color: #2c3e50; font-size: 1.1rem; font-weight: 600;">
                        <i class="fas fa-list-check" style="color: var(--color-primary);"></i> Síntomas Asociados (${sintomas.length})
                    </h4>
                    <ul style="margin-left: 1.5rem; line-height: 2; list-style-type: disc;">
                        ${sintomasHTML}
                    </ul>
                </div>
                
                ${afeccion.tratamiento ? `
                    <div style="margin-bottom: 1.5rem;">
                        <h4 style="margin-bottom: 0.75rem; color: #2c3e50; font-size: 1.1rem; font-weight: 600;">
                            <i class="fas fa-pills" style="color: var(--color-primary);"></i> Tratamiento Recomendado
                        </h4>
                        <p style="line-height: 1.7; color: #34495e; font-size: 0.95rem;">
                            ${AppUtils.escapeHtml(afeccion.tratamiento)}
                        </p>
                    </div>
                ` : ''}
            </div>
            <div class="modal-actions" style="background: #f8f9fa; border-radius: 0 0 12px 12px;">
                <button class="btn btn-outline" onclick="this.closest('.modal-backdrop').remove()">
                    <i class="fas fa-times"></i> Cerrar
                </button>
                <a href="afeccion-form.html?id=${afeccion._id}" class="btn btn-primary">
                    <i class="fas fa-edit"></i> Editar
                </a>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Cerrar al hacer clic fuera
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// ================================================
// ELIMINAR AFECCIÓN
// ================================================

// Variable global para almacenar el ID a eliminar
let afeccionIdToDelete = null;

// Confirmar eliminación
function confirmarEliminar(id, nombre) {
    afeccionIdToDelete = id;
    
    // Crear modal de confirmación
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(8px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    `;
    
    modal.innerHTML = `
        <div class="modal-content" style="
            max-width: 520px;
            width: 90%;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            overflow: hidden;
            animation: slideDown 0.3s ease;
            position: relative;
        ">
            <div class="modal-header" style="
                background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
                color: white;
                padding: 1.75rem 2rem;
                border-bottom: none;
            ">
                <h3 style="
                    margin: 0;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-size: 1.4rem;
                    font-weight: 600;
                ">
                    <i class="fas fa-exclamation-triangle" style="font-size: 1.6rem;"></i>
                    Confirmar Eliminación
                </h3>
            </div>
            <div class="modal-body" style="
                padding: 2rem;
                background: #ffffff;
            ">
                <p style="
                    font-size: 1.1rem;
                    margin-bottom: 1.25rem;
                    color: #2c3e50;
                    line-height: 1.6;
                ">
                    ¿Está seguro que desea eliminar la siguiente afección?
                </p>
                <div style="
                    background: linear-gradient(135deg, #fff3cd 0%, #ffe8a1 100%);
                    border-left: 5px solid #ffc107;
                    padding: 1.25rem;
                    border-radius: 8px;
                    margin-bottom: 1.5rem;
                    box-shadow: 0 2px 8px rgba(255, 193, 7, 0.2);
                ">
                    <strong style="
                        color: #856404;
                        font-size: 1.15rem;
                        display: block;
                        font-weight: 600;
                    ">
                        <i class="fas fa-notes-medical" style="margin-right: 0.5rem;"></i>
                        ${AppUtils.escapeHtml(nombre)}
                    </strong>
                </div>
                <div style="
                    background: linear-gradient(135deg, #ffe5e5 0%, #ffd6d6 100%);
                    border-left: 5px solid #e74c3c;
                    padding: 1rem 1.25rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(231, 76, 60, 0.15);
                ">
                    <p style="
                        color: #c0392b;
                        font-size: 1rem;
                        margin: 0;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        font-weight: 500;
                    ">
                        <i class="fas fa-exclamation-circle" style="font-size: 1.2rem;"></i>
                        Esta acción eliminará permanentemente la afección y no se puede deshacer.
                    </p>
                </div>
            </div>
            <div class="modal-actions" style="
                padding: 1.5rem 2rem;
                background: #f8f9fa;
                display: flex;
                gap: 1rem;
                justify-content: flex-end;
                border-top: 1px solid #e9ecef;
            ">
                <button class="btn btn-outline" onclick="cancelarEliminacion()" style="
                    padding: 0.75rem 1.5rem;
                    font-size: 1rem;
                    font-weight: 500;
                    border: 2px solid #6c757d;
                    color: #6c757d;
                    background: white;
                    transition: all 0.3s ease;
                ">
                    <i class="fas fa-times"></i> Cancelar
                </button>
                <button class="btn btn-danger" onclick="ejecutarEliminacion()" style="
                    padding: 0.75rem 1.5rem;
                    font-size: 1rem;
                    font-weight: 500;
                    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
                    border: none;
                    color: white;
                    box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
                    transition: all 0.3s ease;
                ">
                    <i class="fas fa-trash"></i> Eliminar Permanentemente
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            cancelarEliminacion();
        }
    });
}

// Cancelar eliminación
function cancelarEliminacion() {
    afeccionIdToDelete = null;
    const modal = document.querySelector('.modal-backdrop');
    if (modal) {
        modal.remove();
    }
}

// Ejecutar eliminación
async function ejecutarEliminacion() {
    if (!afeccionIdToDelete) return;
    
    try {
        // Cerrar modal
        const modal = document.querySelector('.modal-backdrop');
        if (modal) {
            modal.remove();
        }
        
        // Mostrar loading
        AppUtils.showToast('Eliminando afección...', 'info');
        
        const response = await fetch(`${AppUtils.API_URL}/afecciones/${afeccionIdToDelete}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AppUtils.getToken()}`
            }
        });
        
        const data = await response.json();
        
        if (data && data.success) {
            AppUtils.showToast('Afección eliminada exitosamente', 'success');
            // Recargar la lista de afecciones
            cargarAfecciones();
        } else {
            AppUtils.showToast(data.message || 'Error al eliminar la afección', 'error');
        }
    } catch (error) {
        console.error('Error eliminando afección:', error);
        AppUtils.showToast('Error de conexión al eliminar la afección', 'error');
    } finally {
        afeccionIdToDelete = null;
    }
}

// Hacer las funciones globales
window.confirmarEliminar = confirmarEliminar;
window.cancelarEliminacion = cancelarEliminacion;
window.ejecutarEliminacion = ejecutarEliminacion;
