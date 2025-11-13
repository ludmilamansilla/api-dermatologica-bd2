// ================================================
// AFECCION-FORM.JS
// ================================================

document.addEventListener('DOMContentLoaded', function() {
    const user = AppUtils.checkAuth();
    if (!user) return;
    
    const form = document.getElementById('afeccionForm');
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const btnRemoveImage = document.getElementById('btnRemoveImage');
    const selectedSintomas = document.getElementById('selectedSintomas');
    const sintomasSearch = document.getElementById('sintomasSearch');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            AppUtils.confirmAction('¿Cerrar sesión?', () => AppUtils.logout());
        });
    }
    
    // Upload imagen
    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });
    
    btnRemoveImage.addEventListener('click', () => {
        fileInput.value = '';
        imagePreview.style.display = 'none';
        uploadArea.style.display = 'block';
    });
    
    // Manejo de síntomas
    const checkboxes = document.querySelectorAll('.sintoma-item input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectedSintomas);
    });
    
    sintomasSearch.addEventListener('input', AppUtils.debounce(function() {
        const term = this.value.toLowerCase();
        document.querySelectorAll('.sintoma-item').forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(term) ? 'flex' : 'none';
        });
    }, 200));
    
    // Submit form
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validateForm()) {
            saveAfeccion();
        }
    });
});

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        AppUtils.showToast('Por favor seleccione una imagen', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        AppUtils.showToast('La imagen no debe superar 5MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('previewImg').src = e.target.result;
        document.getElementById('uploadArea').style.display = 'none';
        document.getElementById('imagePreview').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function updateSelectedSintomas() {
    const selected = Array.from(document.querySelectorAll('.sintoma-item input:checked'));
    const container = document.getElementById('selectedSintomas');
    
    container.innerHTML = selected.map(checkbox => {
        const label = checkbox.parentElement.textContent.trim();
        return `
            <span class="sintoma-tag">
                <i class="fas fa-check"></i>
                ${label}
                <button type="button" onclick="removeS intoma('${checkbox.value}')">
                    <i class="fas fa-times"></i>
                </button>
            </span>
        `;
    }).join('');
}

function removeSintoma(value) {
    const checkbox = document.querySelector(`input[value="${value}"]`);
    if (checkbox) {
        checkbox.checked = false;
        updateSelectedSintomas();
    }
}

function validateForm() {
    const nombre = document.getElementById('nombre').value.trim();
    const severidad = document.getElementById('severidad').value;
    const descripcion = document.getElementById('descripcion').value.trim();
    
    if (!nombre) {
        AppUtils.showToast('El nombre es requerido', 'error');
        return false;
    }
    
    if (!severidad) {
        AppUtils.showToast('La severidad es requerida', 'error');
        return false;
    }
    
    if (!descripcion) {
        AppUtils.showToast('La descripción es requerida', 'error');
        return false;
    }
    
    return true;
}

function saveAfeccion() {
    AppUtils.showLoading(true);
    
    setTimeout(() => {
        AppUtils.showLoading(false);
        AppUtils.showToast('Afección guardada exitosamente', 'success');
        setTimeout(() => {
            window.location.href = 'afecciones.html';
        }, 1500);
    }, 1500);
}
