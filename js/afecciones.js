// ================================================
// AFECCIONES.JS - API DERMATOLÓGICA
// ================================================

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    const user = AppUtils.checkAuth();
    if (!user) return;
    
    // Elementos del DOM
    const searchInput = document.getElementById('searchInput');
    const filterSeveridad = document.getElementById('filterSeveridad');
    const filterZona = document.getElementById('filterZona');
    const btnResetFilters = document.getElementById('btnResetFilters');
    const afeccionesGrid = document.getElementById('afeccionesGrid');
    const logoutBtn = document.getElementById('logoutBtn');
    const userName = document.getElementById('userName');
    
    // Configurar usuario
    if (userName && user.username) {
        userName.textContent = user.username;
    }
    
    // Evento de logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            AppUtils.confirmAction('¿Está seguro que desea cerrar sesión?', () => {
                AppUtils.logout();
            });
        });
    }
    
    // Búsqueda con debounce
    if (searchInput) {
        searchInput.addEventListener('input', AppUtils.debounce(function() {
            filterAfecciones();
        }, 300));
    }
    
    // Filtros
    if (filterSeveridad) {
        filterSeveridad.addEventListener('change', filterAfecciones);
    }
    
    if (filterZona) {
        filterZona.addEventListener('change', filterAfecciones);
    }
    
    // Reset filters
    if (btnResetFilters) {
        btnResetFilters.addEventListener('click', function() {
            searchInput.value = '';
            filterSeveridad.value = '';
            filterZona.value = '';
            filterAfecciones();
            AppUtils.showToast('Filtros limpiados', 'info');
        });
    }
});

// Filtrar afecciones
function filterAfecciones() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const severidad = document.getElementById('filterSeveridad').value;
    const zona = document.getElementById('filterZona').value;
    
    const cards = document.querySelectorAll('.afeccion-card');
    let visibleCount = 0;
    
    cards.forEach(card => {
        const title = card.querySelector('h4')?.textContent.toLowerCase() || '';
        const cardSeveridad = card.querySelector('.badge')?.textContent.toLowerCase() || '';
        const cardZona = card.querySelector('.meta-item')?.textContent.toLowerCase() || '';
        
        const matchSearch = title.includes(searchTerm);
        const matchSeveridad = !severidad || cardSeveridad.includes(severidad);
        const matchZona = !zona || cardZona.includes(zona);
        
        if (matchSearch && matchSeveridad && matchZona) {
            card.style.display = 'flex';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Mostrar mensaje si no hay resultados
    showEmptyState(visibleCount === 0);
}

// Mostrar estado vacío
function showEmptyState(show) {
    const grid = document.getElementById('afeccionesGrid');
    let emptyState = document.querySelector('.empty-state');
    
    if (show && !emptyState) {
        emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div class="empty-state-icon">
                <i class="fas fa-search"></i>
            </div>
            <h3>No se encontraron resultados</h3>
            <p>Intenta ajustar los filtros o términos de búsqueda</p>
            <button class="btn btn-primary" onclick="document.getElementById('btnResetFilters').click()">
                <i class="fas fa-redo"></i>
                Limpiar filtros
            </button>
        `;
        grid.appendChild(emptyState);
    } else if (!show && emptyState) {
        emptyState.remove();
    }
}

// Ver detalles de afección
function viewAfeccion(id) {
    window.location.href = `afeccion-detalle.html?id=${id}`;
}

// Editar afección
function editAfeccion(id) {
    window.location.href = `afeccion-form.html?id=${id}`;
}

// Eliminar afección
function deleteAfeccion(id) {
    AppUtils.confirmAction(
        '¿Está seguro que desea eliminar esta afección?\nEsta acción no se puede deshacer.',
        () => {
            // Simular eliminación
            AppUtils.showLoading(true);
            
            setTimeout(() => {
                AppUtils.showLoading(false);
                AppUtils.showToast('Afección eliminada exitosamente', 'success');
                
                // Aquí iría la llamada a la API
                // Por ahora solo ocultamos la card
                const card = event.target.closest('.afeccion-card');
                if (card) {
                    card.style.animation = 'fadeOut 0.3s ease-out';
                    setTimeout(() => {
                        card.remove();
                        filterAfecciones(); // Revalidar si hay resultados
                    }, 300);
                }
            }, 1000);
        }
    );
}

// Animación de fade out
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: scale(1);
        }
        to {
            opacity: 0;
            transform: scale(0.9);
        }
    }
`;
document.head.appendChild(style);
