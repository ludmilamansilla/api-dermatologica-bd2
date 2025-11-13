// ================================================
// AFECCION-DETALLE.JS - DETALLE DE AFECCIÓN (CON API REAL)
// ================================================

let afeccionId = null;

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    const user = AppUtils.checkAuth();
    if (!user) return;
    
    // Configurar usuario
    const userName = document.getElementById('userName');
    if (userName && user.username) {
        userName.textContent = user.username;
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            AppUtils.confirmAction('¿Está seguro que desea cerrar sesión?', () => {
                AppUtils.logout();
            });
        });
    }
    
    // Obtener ID de afección
    const urlParams = new URLSearchParams(window.location.search);
    afeccionId = urlParams.get('id');
    
    if (!afeccionId) {
        AppUtils.showToast('No se especificó una afección', 'error');
        setTimeout(() => {
            window.location.href = 'afecciones.html';
        }, 2000);
        return;
    }
    
    // Cargar detalles
    cargarAfeccion();
    
    // Configurar botones
    setupButtons();
});

// Configurar botones
function setupButtons() {
    const btnEditar = document.getElementById('btnEditar');
    const btnEliminar = document.getElementById('btnEliminar');
    const btnVolver = document.getElementById('btnVolver');
    
    if (btnEditar) {
        btnEditar.addEventListener('click', function() {
            window.location.href = `afeccion-form.html?id=${afeccionId}`;
        });
    }
    
    if (btnEliminar) {
        btnEliminar.addEventListener('click', eliminarAfeccion);
    }
    
    if (btnVolver) {
        btnVolver.addEventListener('click', function() {
            window.location.href = 'afecciones.html';
        });
    }
}

// Cargar afección
async function cargarAfeccion() {
    try {
        const data = await fetchAPI(`/afecciones/${afeccionId}`);
        
        if (data && data.success) {
            renderAfeccion(data.data);
        } else {
            throw new Error('No se encontró la afección');
        }
    } catch (error) {
        console.error('Error cargando afección:', error);
        AppUtils.showToast('Error al cargar la afección', 'error');
        
        const detalleContainer = document.querySelector('.detalle-container');
        if (detalleContainer) {
            detalleContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error al Cargar Afección</h3>
                    <p>No se pudo cargar la información de la afección.</p>
                    <button onclick="window.location.href='afecciones.html'" class="btn btn-primary">
                        <i class="fas fa-arrow-left"></i> Volver a Afecciones
                    </button>
                </div>
            `;
        }
    }
}

// Renderizar afección
function renderAfeccion(afeccion) {
    // Información principal
    renderInfoPrincipal(afeccion);
    
    // Imagen
    renderImagen(afeccion);
    
    // Descripción
    renderDescripcion(afeccion);
    
    // Síntomas asociados
    renderSintomas(afeccion);
    
    // Tratamiento
    renderTratamiento(afeccion);
    
    // Metadatos
    renderMetadatos(afeccion);
}

// Información principal
function renderInfoPrincipal(afeccion) {
    const container = document.querySelector('.afeccion-header');
    if (!container) return;
    
    container.innerHTML = `
        <div class="header-content">
            <h2>${afeccion.nombre}</h2>
            <div class="badges">
                <span class="badge badge-severidad badge-${afeccion.severidad}">
                    <i class="fas fa-exclamation-circle"></i> ${afeccion.severidad}
                </span>
                <span class="badge badge-zona badge-${afeccion.zona}">
                    <i class="fas fa-map-marker-alt"></i> ${afeccion.zona}
                </span>
                <span class="badge badge-sintomas">
                    <i class="fas fa-notes-medical"></i> ${afeccion.sintomas.length} síntomas
                </span>
            </div>
        </div>
    `;
}

// Imagen
function renderImagen(afeccion) {
    const container = document.querySelector('.afeccion-imagen');
    if (!container) return;
    
    if (afeccion.imagen) {
        container.innerHTML = `
            <img src="http://localhost:3000${afeccion.imagen}" alt="${afeccion.nombre}">
        `;
    } else {
        container.innerHTML = `
            <div class="sin-imagen">
                <i class="fas fa-image"></i>
                <p>Sin imagen</p>
            </div>
        `;
    }
}

// Descripción
function renderDescripcion(afeccion) {
    const container = document.querySelector('.afeccion-descripcion');
    if (!container) return;
    
    container.innerHTML = `
        <h3><i class="fas fa-info-circle"></i> Descripción</h3>
        <p>${afeccion.descripcion}</p>
    `;
}

// Síntomas asociados
function renderSintomas(afeccion) {
    const container = document.querySelector('.afeccion-sintomas');
    if (!container) return;
    
    const sintomas = afeccion.sintomas || [];
    
    container.innerHTML = `
        <h3><i class="fas fa-notes-medical"></i> Síntomas Asociados</h3>
        ${sintomas.length === 0 ? `
            <p class="text-muted">No hay síntomas asociados</p>
        ` : `
            <div class="sintomas-grid">
                ${sintomas.map(sintoma => `
                    <div class="sintoma-card">
                        <div class="sintoma-header">
                            <h4>${sintoma.nombre}</h4>
                            <span class="badge badge-zona badge-${sintoma.zona}">
                                ${sintoma.zona}
                            </span>
                        </div>
                        ${sintoma.descripcion ? `
                            <p class="sintoma-descripcion">${sintoma.descripcion}</p>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `}
    `;
}

// Tratamiento
function renderTratamiento(afeccion) {
    const container = document.querySelector('.afeccion-tratamiento');
    if (!container) return;
    
    if (afeccion.tratamiento) {
        container.innerHTML = `
            <h3><i class="fas fa-prescription"></i> Tratamiento Sugerido</h3>
            <div class="tratamiento-content">
                <p>${afeccion.tratamiento}</p>
                <div class="tratamiento-disclaimer">
                    <i class="fas fa-exclamation-triangle"></i>
                    <small>Esta información es referencial. Siempre consulte con un profesional de la salud.</small>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <h3><i class="fas fa-prescription"></i> Tratamiento Sugerido</h3>
            <p class="text-muted">No se ha especificado un tratamiento</p>
        `;
    }
}

// Metadatos
function renderMetadatos(afeccion) {
    const container = document.querySelector('.afeccion-metadatos');
    if (!container) return;
    
    const fechaCreacion = new Date(afeccion.createdAt);
    const fechaActualizacion = new Date(afeccion.updatedAt);
    
    const formatoFecha = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    container.innerHTML = `
        <h3><i class="fas fa-clock"></i> Información del Registro</h3>
        <div class="metadatos-grid">
            <div class="metadato-item">
                <span class="metadato-label">Fecha de Creación:</span>
                <span class="metadato-value">${fechaCreacion.toLocaleDateString('es-ES', formatoFecha)}</span>
            </div>
            <div class="metadato-item">
                <span class="metadato-label">Última Actualización:</span>
                <span class="metadato-value">${fechaActualizacion.toLocaleDateString('es-ES', formatoFecha)}</span>
            </div>
            <div class="metadato-item">
                <span class="metadato-label">ID del Registro:</span>
                <span class="metadato-value"><code>${afeccion._id}</code></span>
            </div>
        </div>
    `;
}

// Eliminar afección
async function eliminarAfeccion() {
    AppUtils.confirmAction(
        '¿Está seguro que desea eliminar esta afección? Esta acción no se puede deshacer.',
        async () => {
            try {
                const data = await fetchAPI(`/afecciones/${afeccionId}`, {
                    method: 'DELETE'
                });
                
                if (data && data.success) {
                    AppUtils.showToast('Afección eliminada exitosamente', 'success');
                    setTimeout(() => {
                        window.location.href = 'afecciones.html';
                    }, 1500);
                } else {
                    throw new Error(data.message || 'Error al eliminar la afección');
                }
            } catch (error) {
                console.error('Error eliminando afección:', error);
                AppUtils.showToast('Error al eliminar la afección', 'error');
            }
        }
    );
}
