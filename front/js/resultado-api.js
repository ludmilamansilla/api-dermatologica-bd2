// RESULTADO DE CONSULTA

let consultaId = null;

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
    
    // Obtener ID de consulta
    const urlParams = new URLSearchParams(window.location.search);
    consultaId = urlParams.get('id');
    
    if (!consultaId) {
        AppUtils.showToast('No se especificó una consulta', 'error');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
        return;
    }
    
    // Cargar resultados
    cargarResultados();
});

// Cargar resultados de la consulta
async function cargarResultados() {
    try {
        const data = await fetchAPI(`/consultas/${consultaId}`);
        
        if (data && data.success) {
            renderResultados(data.data);
        } else {
            throw new Error('No se encontró la consulta');
        }
    } catch (error) {
        console.error('Error cargando resultados:', error);
        AppUtils.showToast('Error al cargar los resultados', 'error');
        
        // Mostrar error en pantalla
        const resultadoContainer = document.querySelector('.resultado-container');
        if (resultadoContainer) {
            resultadoContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error al Cargar Resultados</h3>
                    <p>No se pudo cargar la información del diagnóstico.</p>
                    <button onclick="window.location.href='dashboard.html'" class="btn btn-primary">
                        <i class="fas fa-home"></i> Volver al Dashboard
                    </button>
                </div>
            `;
        }
    }
}

// Renderizar resultados
function renderResultados(consulta) {
    // Información del paciente
    renderInfoPaciente(consulta);
    
    // Imagen de la zona afectada
    renderImagenZona(consulta);
    
    // Síntomas e imagen en una sola sección
    renderSintomasEImagen(consulta);
    
    // Diagnósticos posibles
    renderDiagnosticos(consulta);
    
    // Análisis con IA
    renderAnalisisIA(consulta);
    
    // Recomendaciones finales
    renderRecomendaciones(consulta);
}

// Información del paciente
function renderInfoPaciente(consulta) {
    const container = document.querySelector('.info-paciente');
    if (!container) return;
    
    // Usar createdAt en lugar de fecha
    const fecha = new Date(consulta.createdAt || consulta.fecha);
    const fechaFormateada = fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    container.innerHTML = `
        <h3><i class="fas fa-user-injured"></i> Información del Paciente</h3>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Nombre:</span>
                <span class="info-value">${consulta.nombrePaciente}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Zona Afectada:</span>
                <span class="info-value badge badge-${consulta.zonaAfectada}">${consulta.zonaAfectada}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Fecha de Consulta:</span>
                <span class="info-value">${fechaFormateada}</span>
            </div>
        </div>
    `;
}

// Imagen de la zona
function renderImagenZona(consulta) {
    const container = document.querySelector('.imagen-zona');
    if (!container || !consulta.imagenZona) {
        if (container) container.style.display = 'none';
        return;
    }
    
    container.innerHTML = `
        <h3><i class="fas fa-camera"></i> Imagen de la Zona Afectada</h3>
        <div class="imagen-container">
            <img src="http://localhost:3000${consulta.imagenZona}" alt="Zona afectada">
        </div>
    `;
}

// Síntomas reportados e imagen en una sola sección
function renderSintomasEImagen(consulta) {
    const container = document.querySelector('.sintomas-e-imagen');
    if (!container) return;
    
    const sintomas = consulta.sintomasReportados || [];
    const tieneImagen = consulta.imagenZona;
    
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start;">
            <!-- Columna izquierda: Síntomas -->
            <div>
                <button class="btn-expandir" onclick="toggleSintomas(this)" style="background: none; border: none; padding: 0; cursor: pointer; width: 100%; text-align: left; display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2);">
                    <i class="fas fa-chevron-right" style="font-size: 0.8rem; transition: transform 0.3s;"></i>
                    <h3 style="color: var(--color-primary); margin: 0; display: flex; align-items: center; gap: var(--space-2);">
                        <i class="fas fa-notes-medical"></i> Síntomas Reportados
                    </h3>
                </button>
                <div id="contenedor-sintomas" style="display: none; padding-left: var(--space-3);">
                    <div class="sintomas-grid">
                        ${sintomas.map(sintoma => `
                            <div class="sintoma-badge">
                                <i class="fas fa-check-circle"></i>
                                <span>${sintoma.nombre}</span>
                            </div>
                        `).join('')}
                    </div>
                    ${sintomas.length === 0 ? '<p class="text-muted">No se reportaron síntomas</p>' : ''}
                </div>
            </div>
            
            <!-- Columna derecha: Imagen -->
            <div>
                <button class="btn-expandir" onclick="toggleImagen(this)" style="background: none; border: none; padding: 0; cursor: pointer; width: 100%; text-align: left; display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2);">
                    <i class="fas fa-chevron-right" style="font-size: 0.8rem; transition: transform 0.3s;"></i>
                    <h3 style="color: var(--color-primary); margin: 0; display: flex; align-items: center; gap: var(--space-2);">
                        <i class="fas fa-image"></i> Imagen Proporcionada
                    </h3>
                </button>
                <div id="contenedor-imagen" style="display: none; padding-left: var(--space-3);">
                    ${tieneImagen ? `
                        <div style="display: flex; flex-direction: column; gap: 1rem;">
                            <img src="http://localhost:3000${consulta.imagenZona}" alt="Imagen de consulta" style="max-width: 100%; height: auto; border-radius: var(--radius-lg); max-height: 300px; object-fit: contain;">
                            <button class="btn btn-accent" onclick="mostrarImagenModal('${consulta.imagenZona}')" style="display: inline-flex; align-items: center; gap: 0.5rem; width: fit-content; justify-content: center;">
                                <i class="fas fa-expand"></i> Ver
                            </button>
                        </div>
                    ` : `
                        <p style="color: var(--color-text-light); font-style: italic;">
                            <i class="fas fa-info-circle"></i> No se proporcionó ninguna imagen en esta consulta
                        </p>
                    `}
                </div>
            </div>
        </div>
    `;
}

// Diagnósticos posibles (versión compacta)
function renderDiagnosticos(consulta) {
    const container = document.querySelector('.diagnosticos-posibles');
    if (!container) return;
    
    const diagnosticos = consulta.resultados || [];
    
    // Ordenar por porcentaje
    diagnosticos.sort((a, b) => b.porcentajeCoincidencia - a.porcentajeCoincidencia);
    
    container.innerHTML = `
        <h3><i class="fas fa-diagnoses"></i> Diagnósticos Posibles</h3>
        ${diagnosticos.length === 0 ? `
            <p class="text-muted">No se encontraron coincidencias con afecciones registradas.</p>
        ` : `
            <div class="diagnosticos-compactos">
                ${diagnosticos.map((diag, index) => {
                    // Limitar descripción a 80 caracteres
                    const desc = (diag.afeccion.descripcion || '').substring(0, 100);
                    return `
                        <div class="diagnostico-compacto ${index === 0 ? 'principal' : ''}">
                            <div class="diag-header-compacto">
                                <div class="diag-nombre-pct">
                                    <h5>${diag.afeccion.nombre}</h5>
                                    <span class="pct-badge ${getPorcentajeClass(diag.porcentajeCoincidencia)}">
                                        ${diag.porcentajeCoincidencia}%
                                    </span>
                                </div>
                            </div>
                            <p class="diag-desc-compacta">${desc}${desc.length === 100 ? '...' : ''}</p>
                            <a href="afeccion-detalle.html?id=${diag.afeccion._id}" class="btn-ver-mas">
                                Ver más detalles →
                            </a>
                        </div>
                    `;
                }).join('')}
            </div>
        `}
    `;
}

// Análisis con IA o Clínico
function renderAnalisisIA(consulta) {
    const container = document.querySelector('.analisis-ia');
    if (!container) return;
    
    const notas = consulta.notas || '';
    
    // Buscar análisis IA o clínico en las notas
    const iaMarker = '--- Análisis IA ---';
    const clinicoMarker = '--- Análisis Clínico ---';
    
    let analisisContent = '';
    let tipoAnalisis = '';
    
    if (notas.includes(iaMarker)) {
        analisisContent = notas.split(iaMarker)[1].trim();
        tipoAnalisis = 'IA';
    } else if (notas.includes(clinicoMarker)) {
        analisisContent = notas.split(clinicoMarker)[1].trim();
        tipoAnalisis = 'Clínico';
    } else {
        container.style.display = 'none';
        return;
    }
    
    // Parsear el contenido (línea por línea)
    const lines = analisisContent.split('\n');
    let diagnosticoIA = '';
    let explicacion = '';
    let recomendaciones = [];
    let urgencia = '';
    let advertencia = '';
    
    let currentSection = 'inicio';
    
    for (const line of lines) {
        const trimmed = line.trim();
        
        // Detectar secciones
        if (trimmed.startsWith('Diagnóstico') || trimmed.startsWith('diagnosticoIA')) {
            currentSection = 'diagnostico';
            const valor = trimmed.split(':').slice(1).join(':').trim();
            if (valor) diagnosticoIA = valor;
            continue;
        } else if (trimmed.includes('Explicación') || trimmed.includes('explicacion')) {
            currentSection = 'explicacion';
            const valor = trimmed.split(':').slice(1).join(':').trim();
            if (valor) explicacion = valor;
            continue;
        } else if (trimmed.includes('Recomendaciones')) {
            currentSection = 'recomendaciones';
            continue;
        } else if (trimmed.startsWith('Urgencia') || trimmed.startsWith('Nivel de Urgencia')) {
            currentSection = 'urgencia';
            urgencia = trimmed.split(':').slice(1).join(':').trim().toUpperCase();
            continue;
        } else if (trimmed.includes('IMPORTANTE:') || trimmed.includes('profesional')) {
            currentSection = 'advertencia';
            advertencia = trimmed;
            continue;
        }
        
        // Agregar contenido según sección actual
        if (currentSection === 'diagnostico' && trimmed && !trimmed.includes('---')) {
            diagnosticoIA += ' ' + trimmed;
        } else if (currentSection === 'explicacion' && trimmed && !trimmed.includes('---')) {
            explicacion += ' ' + trimmed;
        } else if (currentSection === 'recomendaciones' && trimmed) {
            // Remover números y puntos al inicio
            const rec = trimmed.replace(/^\d+\.\s*/, '').trim();
            if (rec && !rec.includes('Urgencia') && !rec.includes('---') && rec.length > 0) {
                recomendaciones.push(rec);
            }
        } else if (currentSection === 'advertencia' && trimmed && !advertencia.includes(trimmed)) {
            advertencia += ' ' + trimmed;
        }
    }
    
    const iconoAnalisis = tipoAnalisis === 'IA' ? 'fa-robot' : 'fa-clipboard-medical';
    const tituloAnalisis = tipoAnalisis === 'IA' ? 'Análisis con Inteligencia Artifical' : 'Análisis Clínico';
    
    container.innerHTML = `
        <h3><i class="fas ${iconoAnalisis}"></i> ${tituloAnalisis}</h3>
        <div class="ia-content">
            ${diagnosticoIA ? `
                <div class="ia-section">
                    <h4><i class="fas fa-stethoscope"></i> Diagnóstico</h4>
                    <p><strong>${diagnosticoIA.trim()}</strong></p>
                </div>
            ` : ''}
            
            ${explicacion ? `
                <div class="ia-section">
                    <h4><i class="fas fa-lightbulb"></i> Explicación</h4>
                    <p>${explicacion.trim()}</p>
                </div>
            ` : ''}
            
            ${recomendaciones.length > 0 ? `
                <div class="ia-section">
                    <h4><i class="fas fa-list-check"></i> Recomendaciones</h4>
                    <ul class="recomendaciones-list">
                        ${recomendaciones.map(rec => `<li><i class="fas fa-check"></i> ${rec}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${urgencia ? `
                <div class="ia-section urgencia-${urgencia.toLowerCase()}">
                    <h4><i class="fas fa-exclamation-triangle"></i> Nivel de Urgencia</h4>
                    <p class="urgencia-badge ${urgencia.toLowerCase()}">${urgencia}</p>
                </div>
            ` : ''}
            
            ${advertencia ? `
                <div class="ia-section advertencia">
                    <p><i class="fas fa-info-circle"></i> ${advertencia.trim()}</p>
                </div>
            ` : ''}
        </div>
    `;
}

// Recomendaciones finales
function renderRecomendaciones(consulta) {
    const container = document.querySelector('.recomendaciones-finales');
    if (!container) return;
    
    const diagnosticoPrincipal = consulta.diagnosticoPrincipal;
    const porcentajeMax = consulta.resultados.length > 0 
        ? Math.max(...consulta.resultados.map(r => r.porcentajeCoincidencia))
        : 0;
    
    let mensaje = '';
    let icono = '';
    let clase = '';
    
    if (porcentajeMax >= 70) {
        icono = 'fa-check-circle';
        clase = 'recomendacion-alta';
        mensaje = 'Se ha identificado una posible afección con alta coincidencia. Se recomienda consultar con un profesional de la salud para confirmar el diagnóstico.';
    } else if (porcentajeMax >= 40) {
        icono = 'fa-exclamation-circle';
        clase = 'recomendacion-media';
        mensaje = 'Se han identificado algunas coincidencias. Recomendamos consultar con un dermatólogo para una evaluación más precisa.';
    } else {
        icono = 'fa-info-circle';
        clase = 'recomendacion-baja';
        mensaje = 'No se encontraron coincidencias significativas con las afecciones registradas. Consulte con un especialista para obtener un diagnóstico preciso.';
    }
    
}

// Funciones de toggle para expandir/contraer
function toggleSintomas(button) {
    const contenedor = document.getElementById('contenedor-sintomas');
    const icon = button.querySelector('i:first-child');
    
    if (contenedor.style.display === 'none') {
        contenedor.style.display = 'block';
        icon.style.transform = 'rotate(90deg)';
    } else {
        contenedor.style.display = 'none';
        icon.style.transform = 'rotate(0deg)';
    }
}

function toggleImagen(button) {
    const contenedor = document.getElementById('contenedor-imagen');
    const icon = button.querySelector('i:first-child');
    
    if (contenedor.style.display === 'none') {
        contenedor.style.display = 'block';
        icon.style.transform = 'rotate(90deg)';
    } else {
        contenedor.style.display = 'none';
        icon.style.transform = 'rotate(0deg)';
    }
}

// Mostrar imagen en modal
function mostrarImagenModal(rutaImagen) {
    const imageUrl = `http://localhost:3000${rutaImagen}`;
    
    // Crear modal dinámicamente
    let modal = document.getElementById('imagenModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'imagenModal';
        modal.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 1000; align-items: center; justify-content: center;';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 2rem; max-width: 80%; max-height: 80vh; display: flex; flex-direction: column; gap: 1rem; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin: 0; color: var(--color-primary);"><i class="fas fa-image"></i> Imagen de la Consulta</h3>
                <button onclick="cerrarImagenModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--color-text-light);">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <img src="${imageUrl}" alt="Imagen de consulta" style="max-width: 100%; max-height: 60vh; object-fit: contain; border-radius: 8px;">
            <button onclick="cerrarImagenModal()" class="btn btn-primary" style="align-self: flex-end;">
                Cerrar
            </button>
        </div>
    `;
    modal.style.display = 'flex';
    modal.addEventListener('click', function(e) {
        if (e.target === modal) cerrarImagenModal();
    });
}

// Cerrar modal de imagen
function cerrarImagenModal() {
    const modal = document.getElementById('imagenModal');
    if (modal) modal.style.display = 'none';
}

// Utilidades
function getPorcentajeClass(porcentaje) {
    if (porcentaje >= 70) return 'porcentaje-alto';
    if (porcentaje >= 40) return 'porcentaje-medio';
    return 'porcentaje-bajo';
}
