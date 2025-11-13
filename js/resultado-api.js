// ================================================
// RESULTADO.JS - MOSTRAR DIAGNÓSTICO (CON API REAL)
// ================================================

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
    
    // Síntomas reportados
    renderSintomasReportados(consulta);
    
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
    
    const fecha = new Date(consulta.fecha);
    const fechaFormateada = fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
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

// Síntomas reportados
function renderSintomasReportados(consulta) {
    const container = document.querySelector('.sintomas-reportados');
    if (!container) return;
    
    const sintomas = consulta.sintomasReportados || [];
    
    container.innerHTML = `
        <h3><i class="fas fa-notes-medical"></i> Síntomas Reportados</h3>
        <div class="sintomas-grid">
            ${sintomas.map(sintoma => `
                <div class="sintoma-badge">
                    <i class="fas fa-check-circle"></i>
                    <span>${sintoma.nombre}</span>
                </div>
            `).join('')}
        </div>
        ${sintomas.length === 0 ? '<p class="text-muted">No se reportaron síntomas</p>' : ''}
    `;
}

// Diagnósticos posibles
function renderDiagnosticos(consulta) {
    const container = document.querySelector('.diagnosticos-posibles');
    if (!container) return;
    
    const diagnosticos = consulta.resultados || [];
    
    // Ordenar por porcentaje
    diagnosticos.sort((a, b) => b.porcentajeCoincidencia - a.porcentajeCoincidencia);
    
    // Determinar el diagnóstico principal
    const diagnosticoPrincipal = diagnosticos.length > 0 ? diagnosticos[0] : null;
    
    container.innerHTML = `
        <h3><i class="fas fa-diagnoses"></i> Diagnósticos Posibles</h3>
        ${diagnosticos.length === 0 ? `
            <p class="text-muted">No se encontraron coincidencias con afecciones registradas.</p>
        ` : `
            <div class="diagnosticos-list">
                ${diagnosticos.map((diag, index) => `
                    <div class="diagnostico-item ${index === 0 ? 'diagnostico-principal' : ''}">
                        <div class="diagnostico-header">
                            <h4>
                                ${index === 0 ? '<i class="fas fa-star"></i>' : ''}
                                ${diag.afeccion.nombre}
                                ${index === 0 ? '<span class="badge-principal">Diagnóstico Principal</span>' : ''}
                            </h4>
                            <span class="porcentaje ${getPorcentajeClass(diag.porcentajeCoincidencia)}">
                                ${diag.porcentajeCoincidencia}%
                            </span>
                        </div>
                        <div class="diagnostico-body">
                            <p>${diag.afeccion.descripcion}</p>
                            <div class="diagnostico-meta">
                                <span class="badge badge-severidad badge-${diag.afeccion.severidad}">
                                    ${diag.afeccion.severidad}
                                </span>
                                <span class="badge badge-zona badge-${diag.afeccion.zona}">
                                    ${diag.afeccion.zona}
                                </span>
                                <span class="sintomas-coincidencia">
                                    <i class="fas fa-check-double"></i>
                                    ${diag.sintomasCoincidentes} síntomas coincidentes
                                </span>
                            </div>
                            ${diag.afeccion.tratamiento ? `
                                <div class="tratamiento-info">
                                    <h5><i class="fas fa-prescription"></i> Tratamiento Sugerido:</h5>
                                    <p>${diag.afeccion.tratamiento}</p>
                                </div>
                            ` : ''}
                            ${diag.afeccion.imagen ? `
                                <div class="diagnostico-imagen">
                                    <img src="http://localhost:3000${diag.afeccion.imagen}" alt="${diag.afeccion.nombre}">
                                </div>
                            ` : ''}
                        </div>
                        <div class="diagnostico-actions">
                            <a href="afeccion-detalle.html?id=${diag.afeccion._id}" class="btn-link">
                                Ver más detalles <i class="fas fa-arrow-right"></i>
                            </a>
                        </div>
                    </div>
                `).join('')}
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
    
    // Parsear el contenido
    const lines = analisisContent.split('\n');
    let explicacion = '';
    let recomendaciones = [];
    let urgencia = '';
    let advertencia = '';
    
    let currentSection = 'explicacion';
    
    for (const line of lines) {
        if (line.includes('Recomendaciones')) {
            currentSection = 'recomendaciones';
            continue;
        } else if (line.startsWith('Urgencia')) {
            currentSection = 'urgencia';
            urgencia = line.replace('Urgencia:', '').replace('Urgencia estimada:', '').trim();
            continue;
        } else if (line.includes('IMPORTANTE:') || line.includes('profesional')) {
            advertencia = line.trim();
            continue;
        }
        
        if (currentSection === 'explicacion' && line.trim() && !line.includes('---')) {
            explicacion += line + ' ';
        } else if (currentSection === 'recomendaciones' && line.trim()) {
            const rec = line.replace(/^\d+\.\s*/, '').trim();
            if (rec && !rec.includes('Urgencia')) recomendaciones.push(rec);
        }
    }
    
    const iconoAnalisis = tipoAnalisis === 'IA' ? 'fa-robot' : 'fa-clipboard-medical';
    
    container.innerHTML = `
        <h3><i class="fas ${iconoAnalisis}"></i> Análisis ${tipoAnalisis === 'IA' ? 'con Inteligencia Artificial' : 'Clínico'}</h3>
        <div class="ia-content">
            ${explicacion ? `
                <div class="ia-section">
                    <h4><i class="fas fa-lightbulb"></i> Análisis</h4>
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
                    <p class="urgencia-badge ${urgencia.toLowerCase()}">${urgencia.toUpperCase()}</p>
                </div>
            ` : ''}
            
            ${advertencia ? `
                <div class="ia-section advertencia">
                    <p><i class="fas fa-info-circle"></i> ${advertencia}</p>
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
    
    container.innerHTML = `
        <div class="recomendacion-final ${clase}">
            <i class="fas ${icono}"></i>
            <p>${mensaje}</p>
        </div>
        <div class="acciones-finales">
            <button onclick="window.print()" class="btn btn-secondary">
                <i class="fas fa-print"></i> Imprimir Resultados
            </button>
            <button onclick="window.location.href='consulta.html'" class="btn btn-primary">
                <i class="fas fa-plus"></i> Nueva Consulta
            </button>
            <button onclick="window.location.href='dashboard.html'" class="btn btn-outline">
                <i class="fas fa-home"></i> Volver al Dashboard
            </button>
        </div>
    `;
}

// Utilidades
function getPorcentajeClass(porcentaje) {
    if (porcentaje >= 70) return 'porcentaje-alto';
    if (porcentaje >= 40) return 'porcentaje-medio';
    return 'porcentaje-bajo';
}
