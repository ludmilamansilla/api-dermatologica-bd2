// ================================================
// CONSULTA-API.JS - WIZARD DE DIAGNÓSTICO (CON API REAL)
// ================================================

let currentStep = 1;
let formData = {
    nombrePaciente: '',
    zonaAfectada: '',
    sintomasSeleccionados: [],
    imagenZona: null
};
let sintomasData = [];

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
    
    // Evento submit del formulario
    const form = document.getElementById('consultaForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            finalizarConsulta();
        });
    }
    
    // Cargar síntomas desde la API
    cargarSintomas();
    
    // Búsqueda de síntomas
    const searchSintomas = document.getElementById('searchSintomas');
    if (searchSintomas) {
        searchSintomas.addEventListener('input', filtrarSintomas);
    }
    
    // Configurar área de upload
    setupImageUpload();
    
    // Mostrar paso inicial
    mostrarPaso(1);
});

// Configurar área de upload de imagen
function setupImageUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('imagenZona');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    if (!uploadArea || !fileInput) return;
    
    // Click en el área abre el selector
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });
    
    // Cuando se selecciona un archivo
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validar tipo
        if (!file.type.startsWith('image/')) {
            AppUtils.showToast('Por favor selecciona una imagen válida', 'error');
            fileInput.value = '';
            return;
        }
        
        // Validar tamaño (5MB)
        if (file.size > 5 * 1024 * 1024) {
            AppUtils.showToast('La imagen no debe superar los 5MB', 'error');
            fileInput.value = '';
            return;
        }
        
        // Mostrar preview
        const reader = new FileReader();
        reader.onload = function(e) {
            if (previewImg && imagePreview) {
                previewImg.src = e.target.result;
                imagePreview.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
        
        AppUtils.showToast('Imagen cargada correctamente', 'success');
    });
    
    // Drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, function() {
            uploadArea.style.borderColor = 'var(--primary-color)';
            uploadArea.style.backgroundColor = 'rgba(42, 95, 124, 0.05)';
        });
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, function() {
            uploadArea.style.borderColor = '#ddd';
            uploadArea.style.backgroundColor = 'transparent';
        });
    });
    
    uploadArea.addEventListener('drop', function(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        fileInput.files = files;
        
        // Trigger change event
        const event = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(event);
    });
}

// Cargar síntomas desde la API
async function cargarSintomas() {
    try {
        const data = await fetchAPI('/sintomas');
        
        if (data && data.success) {
            sintomasData = data.data;
            renderSintomas(data.data);
        }
    } catch (error) {
        console.error('Error cargando síntomas:', error);
        AppUtils.showToast('Error al cargar síntomas', 'error');
    }
}

// Renderizar síntomas
function renderSintomas(sintomas) {
    const container = document.getElementById('sintomasContainer');
    if (!container) return;
    
    if (sintomas.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay síntomas disponibles</p>';
        return;
    }
    
    container.innerHTML = sintomas.map(sintoma => `
        <label class="sintoma-card" data-nombre="${sintoma.nombre}">
            <input type="checkbox" name="sintoma" value="${sintoma._id}">
            <div class="sintoma-content">
                <i class="fas fa-stethoscope"></i>
                <span>${sintoma.nombre}</span>
                ${sintoma.zona ? `<small class="badge badge-${sintoma.zona}">${sintoma.zona}</small>` : ''}
            </div>
        </label>
    `).join('');
    
    // Agregar eventos a checkboxes
    container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', actualizarSintomasSeleccionados);
    });
}

// Filtrar síntomas
function filtrarSintomas() {
    const search = document.getElementById('searchSintomas').value.toLowerCase();
    const cards = document.querySelectorAll('.sintoma-card');
    
    cards.forEach(card => {
        const nombre = card.dataset.nombre.toLowerCase();
        card.style.display = nombre.includes(search) ? '' : 'none';
    });
}

// Actualizar síntomas seleccionados
function actualizarSintomasSeleccionados() {
    const checkboxes = document.querySelectorAll('#sintomasContainer input[type="checkbox"]:checked');
    formData.sintomasSeleccionados = Array.from(checkboxes).map(cb => cb.value);
}

// Mostrar paso
function mostrarPaso(paso) {
    currentStep = paso;
    
    // Ocultar todos los pasos
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Mostrar paso actual
    const stepElement = document.getElementById(`step${paso}`);
    if (stepElement) {
        stepElement.classList.add('active');
    }
    
    // Actualizar stepper
    document.querySelectorAll('.step').forEach((item, index) => {
        const stepNum = index + 1;
        if (stepNum < paso) {
            item.classList.add('completed');
            item.classList.remove('active');
        } else if (stepNum === paso) {
            item.classList.add('active');
            item.classList.remove('completed');
        } else {
            item.classList.remove('active', 'completed');
        }
    });
    
    // Si es paso 3, mostrar resumen
    if (paso === 3) {
        mostrarResumen();
    }
}

// Validar paso
function validarPaso(paso) {
    if (paso === 1) {
        const nombre = document.getElementById('nombrePaciente').value.trim();
        const zona = document.getElementById('zonaAfectada').value;
        
        if (!nombre) {
            AppUtils.showToast('Por favor ingrese el nombre del paciente', 'error');
            return false;
        }
        
        if (!zona) {
            AppUtils.showToast('Por favor seleccione la zona afectada', 'error');
            return false;
        }
        
        // Guardar datos
        formData.nombrePaciente = nombre;
        formData.zonaAfectada = zona;
        
        return true;
    }
    
    if (paso === 2) {
        if (formData.sintomasSeleccionados.length === 0) {
            AppUtils.showToast('Por favor seleccione al menos un síntoma', 'error');
            return false;
        }
        return true;
    }
    
    return true;
}

// Mostrar resumen
function mostrarResumen() {
    // Nombre y zona
    document.getElementById('resumenNombre').textContent = formData.nombrePaciente;
    document.getElementById('resumenZona').textContent = formData.zonaAfectada;
    
    // Síntomas
    const resumenSintomas = document.getElementById('resumenSintomas');
    if (resumenSintomas) {
        const sintomasSeleccionados = sintomasData.filter(s => 
            formData.sintomasSeleccionados.includes(s._id)
        );
        
        resumenSintomas.innerHTML = sintomasSeleccionados.map(sintoma => `
            <span class="badge badge-primary" style="margin: 0.25rem;">
                <i class="fas fa-check"></i> ${sintoma.nombre}
            </span>
        `).join('');
    }
}

// Finalizar consulta
async function finalizarConsulta() {
    try {
        // Validar datos
        if (!formData.nombrePaciente || !formData.zonaAfectada) {
            AppUtils.showToast('Faltan datos del paciente', 'error');
            return;
        }
        
        if (formData.sintomasSeleccionados.length === 0) {
            AppUtils.showToast('Debe seleccionar al menos un síntoma', 'error');
            return;
        }
        
        // Deshabilitar botón
        const btnSubmit = document.querySelector('button[type="submit"]');
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        }
        
        // Crear FormData
        const data = new FormData();
        data.append('nombrePaciente', formData.nombrePaciente);
        data.append('zonaAfectada', formData.zonaAfectada);
        data.append('sintomasReportados', JSON.stringify(formData.sintomasSeleccionados));
        
        // Agregar imagen si existe
        const fileInput = document.getElementById('imagenZona');
        if (fileInput && fileInput.files.length > 0) {
            data.append('imagenZona', fileInput.files[0]);
        }
        
        // Enviar a la API
        const response = await fetchAPIFormData('/consultas', data);
        
        if (response && response.success) {
            AppUtils.showToast('✨ Diagnóstico completado exitosamente', 'success');
            
            // Redirigir a resultados
            setTimeout(() => {
                window.location.href = `resultado.html?id=${response.data._id}`;
            }, 1500);
        } else {
            throw new Error(response.message || 'Error al crear la consulta');
        }
    } catch (error) {
        console.error('Error finalizando consulta:', error);
        AppUtils.showToast('Error al procesar la consulta', 'error');
        
        // Rehabilitar botón
        const btnSubmit = document.querySelector('button[type="submit"]');
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<i class="fas fa-stethoscope"></i> Realizar Diagnóstico';
        }
    }
}

// Funciones globales para el HTML
window.nextStep = function() {
    if (validarPaso(currentStep)) {
        mostrarPaso(currentStep + 1);
    }
};

window.prevStep = function() {
    mostrarPaso(currentStep - 1);
};
