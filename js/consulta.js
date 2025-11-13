// CONSULTA.JS
let currentStep = 1;

document.addEventListener('DOMContentLoaded', function() {
    const user = AppUtils.checkAuth();
    if (!user) return;
    
    document.getElementById('userName').textContent = user.username;
    document.getElementById('logoutBtn').addEventListener('click', () => {
        AppUtils.confirmAction('¿Cerrar sesión?', () => AppUtils.logout());
    });
    
    // Upload imagen
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('imagenZona');
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                document.getElementById('previewImg').src = ev.target.result;
                document.getElementById('imagePreview').style.display = 'block';
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });
    
    // Búsqueda de síntomas
    document.getElementById('searchSintomas').addEventListener('input', function() {
        const term = this.value.toLowerCase();
        document.querySelectorAll('.sintoma-card').forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(term) ? 'block' : 'none';
        });
    });
    
    // Submit form
    document.getElementById('consultaForm').addEventListener('submit', (e) => {
        e.preventDefault();
        realizarDiagnostico();
    });
});

function nextStep() {
    if (currentStep === 1) {
        if (!document.getElementById('nombrePaciente').value || !document.getElementById('zonaAfectada').value) {
            AppUtils.showToast('Complete todos los campos requeridos', 'error');
            return;
        }
    }
    
    if (currentStep === 2) {
        const sintomas = document.querySelectorAll('input[name="sintoma"]:checked');
        if (sintomas.length === 0) {
            AppUtils.showToast('Seleccione al menos un síntoma', 'error');
            return;
        }
        updateResumen();
    }
    
    document.getElementById(`step${currentStep}`).classList.remove('active');
    document.querySelector(`.step[data-step="${currentStep}"]`).classList.add('completed');
    currentStep++;
    document.getElementById(`step${currentStep}`).classList.add('active');
    document.querySelector(`.step[data-step="${currentStep}"]`).classList.add('active');
}

function prevStep() {
    document.getElementById(`step${currentStep}`).classList.remove('active');
    document.querySelector(`.step[data-step="${currentStep}"]`).classList.remove('active');
    currentStep--;
    document.getElementById(`step${currentStep}`).classList.add('active');
    document.querySelector(`.step[data-step="${currentStep}"]`).classList.remove('completed');
}

function updateResumen() {
    document.getElementById('resumenNombre').textContent = document.getElementById('nombrePaciente').value;
    document.getElementById('resumenZona').textContent = document.getElementById('zonaAfectada').options[document.getElementById('zonaAfectada').selectedIndex].text;
    
    const sintomas = Array.from(document.querySelectorAll('input[name="sintoma"]:checked'));
    const sintomasHTML = sintomas.map(s => {
        const label = s.parentElement.querySelector('span').textContent;
        return `<span class="badge badge-primary">${label}</span>`;
    }).join('');
    document.getElementById('resumenSintomas').innerHTML = sintomasHTML;
}

function realizarDiagnostico() {
    AppUtils.showLoading(true);
    setTimeout(() => {
        AppUtils.showLoading(false);
        window.location.href = 'resultado.html';
    }, 2000);
}
