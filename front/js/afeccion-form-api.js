// FORMULARIO CREAR/EDITAR

let afeccionId = null;
let sintomasDisponibles = [];

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    const user = AppUtils.checkAuth();
    if (!user) return;
    
    // Obtener ID de la URL si existe (modo edición)
    const urlParams = new URLSearchParams(window.location.search);
    afeccionId = urlParams.get('id');
    
    // Configurar título
    const formTitle = document.getElementById('formTitle');
    if (formTitle) {
        formTitle.textContent = afeccionId ? 'Editar Afección' : 'Nueva Afección';
    }
    
    // Configurar usuario
    const userName = document.getElementById('userName');
    if (userName && user.username) {
        userName.textContent = user.username;
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('¿Está seguro que desea cerrar sesión?')) {
                AppUtils.logout();
            }
        });
    }
    
    // Setup de la imagen
    setupImageUpload();
    
    // Cargar síntomas disponibles
    cargarSintomas();
    
    // Si hay ID, cargar datos de la afección
    if (afeccionId) {
        cargarAfeccion();
    }
    
    // Evento submit del formulario
    const form = document.getElementById('afeccionForm');
    if (form) {
        form.addEventListener('submit', guardarAfeccion);
    }
    
    // Búsqueda de síntomas
    const searchSintomas = document.getElementById('sintomasSearch');
    if (searchSintomas) {
        searchSintomas.addEventListener('input', AppUtils.debounce(filtrarSintomas, 300));
    }
});

// ================================================
// SETUP DE IMAGEN
// ================================================

function setupImageUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const imagenInput = document.getElementById('imagen');
    const imagePreview = document.getElementById('imagePreview');
    const btnRemoveImage = document.getElementById('btnRemoveImage');
    
    if (!uploadArea || !imagenInput) return;
    
    // Click en el área de upload
    uploadArea.addEventListener('click', () => {
        imagenInput.click();
    });
    
    // Cambio de archivo
    imagenInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            previewImage(file);
        }
    });
    
    // Botón eliminar imagen
    if (btnRemoveImage) {
        btnRemoveImage.addEventListener('click', function() {
            imagenInput.value = '';
            imagePreview.style.display = 'none';
            uploadArea.style.display = 'flex';
            AppUtils.showToast('Imagen eliminada', 'info');
        });
    }
    
    // Drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.style.borderColor = 'var(--color-primary)';
            uploadArea.style.background = 'rgba(95, 212, 166, 0.05)';
        });
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.style.borderColor = '';
            uploadArea.style.background = '';
        });
    });
    
    uploadArea.addEventListener('drop', function(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            imagenInput.files = files;
            previewImage(files[0]);
        }
    });
}

function previewImage(file) {
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const uploadArea = document.getElementById('uploadArea');
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
        AppUtils.showToast('Por favor selecciona una imagen válida (PNG, JPG)', 'error');
        document.getElementById('imagen').value = '';
        return;
    }
    
    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
        AppUtils.showToast('La imagen no debe superar los 5MB', 'error');
        document.getElementById('imagen').value = '';
        return;
    }
    
    // Mostrar preview
    const reader = new FileReader();
    reader.onload = function(e) {
        previewImg.src = e.target.result;
        imagePreview.style.display = 'block';
        uploadArea.style.display = 'none';
        AppUtils.showToast('Imagen cargada correctamente', 'success');
    };
    reader.readAsDataURL(file);
}

// ================================================
// CARGAR SÍNTOMAS
// ================================================

async function cargarSintomas() {
    try {
        const response = await fetch(`${AppUtils.API_URL}/sintomas`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AppUtils.getToken()}`
            }
        });
        
        const data = await response.json();
        
        if (data && data.success) {
            sintomasDisponibles = data.data;
            renderSintomas(data.data);
        }
    } catch (error) {
        console.error('Error cargando síntomas:', error);
        AppUtils.showToast('Error al cargar síntomas', 'error');
    }
}

function renderSintomas(sintomas, seleccionados = []) {
    const container = document.getElementById('sintomasList');
    if (!container) return;
    
    container.innerHTML = sintomas.map(sintoma => {
        const isSelected = seleccionados.includes(sintoma._id);
        return `
            <label class="sintoma-item">
                <input type="checkbox" 
                       value="${sintoma._id}"
                       ${isSelected ? 'checked' : ''}>
                <span>${AppUtils.escapeHtml(sintoma.nombre)}</span>
            </label>
        `;
    }).join('');
}

function filtrarSintomas() {
    const search = document.getElementById('sintomasSearch').value.toLowerCase();
    const items = document.querySelectorAll('.sintoma-item');
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(search) ? 'flex' : 'none';
    });
}

// ================================================
// CARGAR AFECCIÓN (MODO EDICIÓN)
// ================================================

async function cargarAfeccion() {
    try {
        const response = await fetch(`${AppUtils.API_URL}/afecciones/${afeccionId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AppUtils.getToken()}`
            }
        });
        
        const data = await response.json();
        
        if (data && data.success) {
            const afeccion = data.data;
            
            // Llenar formulario
            document.getElementById('nombre').value = afeccion.nombre || '';
            document.getElementById('descripcion').value = afeccion.descripcion || '';
            document.getElementById('severidad').value = afeccion.severidad || '';
            document.getElementById('zona').value = afeccion.zona || '';
            document.getElementById('tratamiento').value = afeccion.tratamiento || '';
            
            // Mostrar imagen actual si existe
            if (afeccion.imagen) {
                const imagePreview = document.getElementById('imagePreview');
                const previewImg = document.getElementById('previewImg');
                const uploadArea = document.getElementById('uploadArea');
                
                previewImg.src = AppUtils.getImageUrl(afeccion.imagen);
                imagePreview.style.display = 'block';
                uploadArea.style.display = 'none';
            }
            
            // Marcar síntomas seleccionados
            const sintomasIds = afeccion.sintomas?.map(s => s._id || s) || [];
            renderSintomas(sintomasDisponibles, sintomasIds);
        }
    } catch (error) {
        console.error('Error cargando afección:', error);
        AppUtils.showToast('Error al cargar la afección', 'error');
    }
}

// ================================================
// GUARDAR AFECCIÓN
// ================================================

async function guardarAfeccion(e) {
    e.preventDefault();
    
    // Obtener valores
    const nombre = document.getElementById('nombre').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    const severidad = document.getElementById('severidad').value;
    const zona = document.getElementById('zona').value;
    const tratamiento = document.getElementById('tratamiento').value.trim();
    
    // Validaciones
    if (!nombre) {
        AppUtils.showToast('El nombre es requerido', 'error');
        return;
    }
    
    if (!descripcion) {
        AppUtils.showToast('La descripción es requerida', 'error');
        return;
    }
    
    if (!severidad) {
        AppUtils.showToast('La severidad es requerida', 'error');
        return;
    }
    
    // Obtener síntomas seleccionados
    const sintomasSeleccionados = Array.from(
        document.querySelectorAll('#sintomasList input[type="checkbox"]:checked')
    ).map(cb => cb.value);
    
    if (sintomasSeleccionados.length === 0) {
        AppUtils.showToast('Debe seleccionar al menos un síntoma', 'error');
        return;
    }
    
    // Crear FormData para enviar con imagen
    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('descripcion', descripcion);
    formData.append('severidad', severidad);
    formData.append('zona', zona);
    formData.append('tratamiento', tratamiento);
    formData.append('sintomas', JSON.stringify(sintomasSeleccionados));
    
    // Agregar imagen si se seleccionó una nueva
    const imagenInput = document.getElementById('imagen');
    if (imagenInput.files.length > 0) {
        formData.append('imagen', imagenInput.files[0]);
    }
    
    // Deshabilitar botón
    const btnGuardar = document.querySelector('button[type="submit"]');
    const textoOriginal = btnGuardar.innerHTML;
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    
    try {
        const url = afeccionId 
            ? `${AppUtils.API_URL}/afecciones/${afeccionId}`
            : `${AppUtils.API_URL}/afecciones`;
        
        const method = afeccionId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${AppUtils.getToken()}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (data && data.success) {
            AppUtils.showToast(
                afeccionId ? '✅ Afección actualizada exitosamente' : '✅ Afección creada exitosamente',
                'success'
            );
            
            setTimeout(() => {
                window.location.href = 'afecciones.html';
            }, 1500);
        } else {
            throw new Error(data.message || 'Error al guardar la afección');
        }
    } catch (error) {
        console.error('Error guardando afección:', error);
        AppUtils.showToast('Error al guardar la afección: ' + error.message, 'error');
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = textoOriginal;
    }
}
