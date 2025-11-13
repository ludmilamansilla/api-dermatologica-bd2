// ================================================
// SÍNTOMAS-API.JS - GESTIÓN COMPLETA DE SÍNTOMAS
// ================================================

// Variables globales
let sintomaToDelete = null;

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
    const searchInput = document.getElementById('searchSintomas');
    if (searchInput) {
        searchInput.addEventListener('input', AppUtils.debounce(function() {
            cargarSintomas();
        }, 300));
    }
    
    // Submit del formulario
    const formSintoma = document.getElementById('sintomaForm');
    if (formSintoma) {
        formSintoma.addEventListener('submit', handleSubmitSintoma);
    }
    
    // Cerrar modales al hacer clic fuera
    window.addEventListener('click', function(e) {
        const sintomaModal = document.getElementById('sintomaModal');
        const confirmModal = document.getElementById('confirmModal');
        
        if (e.target === sintomaModal) {
            closeModal();
        }
        if (e.target === confirmModal) {
            closeConfirmModal();
        }
    });
    
    // Cargar síntomas inicialmente
    cargarSintomas();
});

// ================================================
// CARGAR Y RENDERIZAR SÍNTOMAS
// ================================================

async function cargarSintomas() {
    const searchInput = document.getElementById('searchSintomas');
    const tbody = document.getElementById('sintomasTableBody');
    
    if (!tbody) return;
    
    // Mostrar loading
    tbody.innerHTML = `
        <tr>
            <td colspan="4" style="text-align: center; padding: 2rem;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--color-primary);"></i>
                <p style="margin-top: 1rem; color: var(--color-text-light);">Cargando síntomas...</p>
            </td>
        </tr>
    `;
    
    try {
        const params = new URLSearchParams();
        if (searchInput?.value) {
            params.append('search', searchInput.value);
        }
        
        const response = await fetch(`${AppUtils.API_URL}/sintomas?${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AppUtils.getToken()}`
            }
        });
        
        const data = await response.json();
        
        if (data && data.success) {
            renderizarSintomas(data.data);
        } else {
            mostrarError(tbody, data.message || 'Error al cargar síntomas');
        }
    } catch (error) {
        console.error('Error cargando síntomas:', error);
        mostrarError(tbody, 'Error de conexión al cargar síntomas');
    }
}

function renderizarSintomas(sintomas) {
    const tbody = document.getElementById('sintomasTableBody');
    if (!tbody) return;
    
    if (!sintomas || sintomas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 3rem;">
                    <div style="color: var(--color-text-light);">
                        <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; display: block; opacity: 0.3;"></i>
                        <p style="font-size: 1.1rem;">No se encontraron síntomas</p>
                        <p style="font-size: 0.9rem; margin-top: 0.5rem;">Intente con otros criterios de búsqueda</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = sintomas.map(sintoma => {
        const zona = sintoma.zona || 'todas';
        const descripcion = sintoma.descripcion || 'Sin descripción';
        
        return `
            <tr>
                <td><strong>${AppUtils.escapeHtml(sintoma.nombre)}</strong></td>
                <td>${AppUtils.escapeHtml(descripcion)}</td>
                <td><span class="badge badge-primary">${AppUtils.escapeHtml(zona)}</span></td>
                <td class="actions-cell">
                    <button class="btn-icon-sm btn-edit" onclick="editarSintoma('${sintoma._id}')" title="Editar síntoma">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon-sm btn-delete" onclick="mostrarConfirmacionEliminar('${sintoma._id}', '${AppUtils.escapeHtml(sintoma.nombre)}')" title="Eliminar síntoma">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function mostrarError(tbody, mensaje) {
    tbody.innerHTML = `
        <tr>
            <td colspan="4" style="text-align: center; padding: 2rem;">
                <div style="color: var(--color-danger);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    <p style="font-size: 1.1rem;">${mensaje}</p>
                </div>
            </td>
        </tr>
    `;
}

// ================================================
// MODAL CREAR/EDITAR
// ================================================

function openModal(sintoma = null) {
    const modal = document.getElementById('sintomaModal');
    const modalTitle = document.getElementById('modalTitle');
    const formSintoma = document.getElementById('sintomaForm');
    const sintomaId = document.getElementById('sintomaId');
    const nombre = document.getElementById('nombreSintoma');
    const descripcion = document.getElementById('descripcionSintoma');
    const zona = document.getElementById('zonaSintoma');
    
    if (sintoma) {
        // Modo edición
        modalTitle.innerHTML = '<i class="fas fa-edit"></i> Editar Síntoma';
        sintomaId.value = sintoma._id;
        nombre.value = sintoma.nombre;
        descripcion.value = sintoma.descripcion || '';
        zona.value = sintoma.zona || 'todas';
    } else {
        // Modo creación
        modalTitle.innerHTML = '<i class="fas fa-plus"></i> Nuevo Síntoma';
        formSintoma.reset();
        sintomaId.value = '';
    }
    
    modal.style.display = 'flex';
    setTimeout(() => nombre.focus(), 100);
}

function closeModal() {
    const modal = document.getElementById('sintomaModal');
    modal.style.display = 'none';
    
    // Limpiar formulario
    const formSintoma = document.getElementById('sintomaForm');
    if (formSintoma) {
        formSintoma.reset();
    }
}

// ================================================
// EDITAR SÍNTOMA
// ================================================

async function editarSintoma(id) {
    try {
        const response = await fetch(`${AppUtils.API_URL}/sintomas/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AppUtils.getToken()}`
            }
        });
        
        const data = await response.json();
        
        if (data && data.success) {
            openModal(data.data);
        } else {
            AppUtils.showToast(data.message || 'Error al cargar el síntoma', 'error');
        }
    } catch (error) {
        console.error('Error cargando síntoma:', error);
        AppUtils.showToast('Error de conexión al cargar el síntoma', 'error');
    }
}

// ================================================
// CREAR/ACTUALIZAR SÍNTOMA
// ================================================

async function handleSubmitSintoma(e) {
    e.preventDefault();
    
    const sintomaId = document.getElementById('sintomaId').value;
    const nombre = document.getElementById('nombreSintoma').value.trim();
    const descripcion = document.getElementById('descripcionSintoma').value.trim();
    const zona = document.getElementById('zonaSintoma').value;
    const btnGuardar = document.getElementById('btnGuardarSintoma');
    
    // Validaciones
    if (!nombre) {
        AppUtils.showToast('El nombre del síntoma es requerido', 'error');
        return;
    }
    
    if (nombre.length < 3) {
        AppUtils.showToast('El nombre debe tener al menos 3 caracteres', 'error');
        return;
    }
    
    if (nombre.length > 100) {
        AppUtils.showToast('El nombre no puede exceder 100 caracteres', 'error');
        return;
    }
    
    if (descripcion && descripcion.length > 500) {
        AppUtils.showToast('La descripción no puede exceder 500 caracteres', 'error');
        return;
    }
    
    const sintomaData = {
        nombre,
        descripcion,
        zona
    };
    
    // Deshabilitar botón durante el proceso
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    
    try {
        const url = sintomaId 
            ? `${AppUtils.API_URL}/sintomas/${sintomaId}`
            : `${AppUtils.API_URL}/sintomas`;
        
        const method = sintomaId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AppUtils.getToken()}`
            },
            body: JSON.stringify(sintomaData)
        });
        
        const data = await response.json();
        
        if (data && data.success) {
            const mensaje = sintomaId 
                ? '✅ Síntoma actualizado exitosamente'
                : '✅ Síntoma creado exitosamente';
            
            AppUtils.showToast(mensaje, 'success');
            closeModal();
            cargarSintomas();
        } else {
            AppUtils.showToast(data.message || 'Error al guardar el síntoma', 'error');
        }
    } catch (error) {
        console.error('Error guardando síntoma:', error);
        AppUtils.showToast('Error de conexión al guardar el síntoma', 'error');
    } finally {
        // Rehabilitar botón
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar';
    }
}

// ================================================
// ELIMINAR SÍNTOMA
// ================================================

function mostrarConfirmacionEliminar(id, nombre) {
    sintomaToDelete = { id, nombre };
    
    const confirmModal = document.getElementById('confirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    
    confirmMessage.innerHTML = `
        ¿Está seguro que desea eliminar el síntoma <strong>"${AppUtils.escapeHtml(nombre)}"</strong>?
    `;
    
    confirmModal.style.display = 'flex';
}

function closeConfirmModal() {
    const confirmModal = document.getElementById('confirmModal');
    confirmModal.style.display = 'none';
    sintomaToDelete = null;
}

async function confirmDelete() {
    if (!sintomaToDelete) return;
    
    const { id, nombre } = sintomaToDelete;
    
    try {
        const response = await fetch(`${AppUtils.API_URL}/sintomas/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AppUtils.getToken()}`
            }
        });
        
        const data = await response.json();
        
        if (data && data.success) {
            AppUtils.showToast(`✅ Síntoma "${nombre}" eliminado exitosamente`, 'success');
            closeConfirmModal();
            cargarSintomas();
        } else {
            AppUtils.showToast(data.message || 'Error al eliminar el síntoma', 'error');
        }
    } catch (error) {
        console.error('Error eliminando síntoma:', error);
        AppUtils.showToast('Error de conexión al eliminar el síntoma', 'error');
    }
}
