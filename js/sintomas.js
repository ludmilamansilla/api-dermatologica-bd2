// SINTOMAS.JS
document.addEventListener('DOMContentLoaded', function() {
    const user = AppUtils.checkAuth();
    if (!user) return;
    
    document.getElementById('userName').textContent = user.username;
    document.getElementById('logoutBtn').addEventListener('click', () => {
        AppUtils.confirmAction('¿Cerrar sesión?', () => AppUtils.logout());
    });
    
    document.getElementById('searchSintomas').addEventListener('input', AppUtils.debounce(function() {
        const term = this.value.toLowerCase();
        document.querySelectorAll('#sintomasTableBody tr').forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
        });
    }, 300));
    
    document.getElementById('sintomaForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveSintoma();
    });
});

function openModal() {
    document.getElementById('sintomaModal').style.display = 'flex';
    document.getElementById('modalTitle').textContent = 'Nuevo Síntoma';
    document.getElementById('sintomaForm').reset();
}

function closeModal() {
    document.getElementById('sintomaModal').style.display = 'none';
}

function editSintoma(id) {
    openModal();
    document.getElementById('modalTitle').textContent = 'Editar Síntoma';
    // Aquí se cargarían los datos del síntoma
}

function deleteSintoma(id) {
    AppUtils.confirmAction('¿Eliminar este síntoma?', () => {
        AppUtils.showToast('Síntoma eliminado', 'success');
    });
}

function saveSintoma() {
    AppUtils.showLoading(true);
    setTimeout(() => {
        AppUtils.showLoading(false);
        AppUtils.showToast('Síntoma guardado exitosamente', 'success');
        closeModal();
    }, 1000);
}
