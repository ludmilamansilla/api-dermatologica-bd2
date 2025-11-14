import Consulta from '../models/Consulta.js';
import Afeccion from '../models/Afeccion.js';
import Sintoma from '../models/Sintoma.js';
import { analizarImagenDermatologica } from '../services/geminiService.js';

// Función para calcular coincidencias usando similitud de Jaccard
const calcularCoincidencias = (sintomasReportados, sintomasAfeccion) => {
    const reportadosSet = new Set(sintomasReportados.map(s => s.toString()));
    const afeccionSet = new Set(sintomasAfeccion.map(s => s.toString()));
    
    // Calcular intersección
    const coincidentes = sintomasAfeccion.filter(s => reportadosSet.has(s.toString()));
    const interseccion = coincidentes.length;
    
    // Similitud de Jaccard: intersección / unión
    const union = reportadosSet.size + afeccionSet.size - interseccion;
    const porcentaje = union > 0 ? (interseccion / union) * 100 : 0;
    
    return {
        sintomasCoincidentes: coincidentes,
        porcentajeCoincidencia: Math.round(porcentaje)
    };
};

// Crear nueva consulta
export const createConsulta = async (req, res) => {
    try {
        const { nombrePaciente, zonaAfectada, sintomasReportados, notas } = req.body;

        // Validar campos requeridos
        if (!nombrePaciente || !zonaAfectada || !sintomasReportados) {
            return res.status(400).json({ 
                success: false,
                message: 'Faltan campos requeridos' 
            });
        }

        const sintomasArray = Array.isArray(sintomasReportados) 
            ? sintomasReportados 
            : JSON.parse(sintomasReportados);

        if (sintomasArray.length === 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Debe seleccionar al menos un síntoma' 
            });
        }

        // Buscar afecciones que coincidan
        const afecciones = await Afeccion.find({ activo: true }).populate('sintomas');
        
        const resultados = [];
        
        for (const afeccion of afecciones) {
            const { sintomasCoincidentes, porcentajeCoincidencia } = calcularCoincidencias(
                sintomasArray,
                afeccion.sintomas.map(s => s._id)
            );
            
            if (porcentajeCoincidencia > 0) {
                resultados.push({
                    afeccion: afeccion._id,
                    porcentajeCoincidencia,
                    sintomasCoincidentes
                });
            }
        }

        // Ordenar por porcentaje descendente
        resultados.sort((a, b) => b.porcentajeCoincidencia - a.porcentajeCoincidencia);

        // Tomar solo los top 5
        const topResultados = resultados.slice(0, 5);

        // Obtener análisis con IA (Gemini)
        let analisisIA = null;
        let notasFinales = notas || '';
        
        try {
            // Obtener nombres de síntomas para el análisis
            const sintomasNombres = await Sintoma.find({ 
                _id: { $in: sintomasArray } 
            }).select('nombre');
            
            const nombres = sintomasNombres.map(s => s.nombre);

            console.log('Iniciando análisis IA unificado...');
            
            // Llamada al servicio de IA. 
            analisisIA = await analizarImagenDermatologica({
                sintomas: nombres,
                zonaAfectada,
                rutaImagen: req.file ? `./uploads/${req.file.filename}` : null
            });

            console.log('Análisis con Gemini AI completado.');
            console.log('Diagnóstico:', analisisIA.diagnosticoIA);
            
            // Formatear notas (la estructura de analisisIA ahora es consistente)
            notasFinales += '\n\n--- Análisis IA ---\n';
            notasFinales += `Diagnóstico: ${analisisIA.diagnosticoIA}\n\n`;
            notasFinales += `Explicación: ${analisisIA.explicacion}\n\n`;
            notasFinales += 'Recomendaciones:\n';
            if (Array.isArray(analisisIA.recomendaciones)) {
                analisisIA.recomendaciones.forEach((rec, i) => {
                    notasFinales += `${i + 1}. ${rec}\n`;
                });
            }
            notasFinales += `\nUrgencia: ${analisisIA.urgencia}\n\n`;
            notasFinales += analisisIA.advertencia;

        } catch (error) {
            console.error('Error crítico durante el análisis IA:', error.message);
            notasFinales += '\n\n--- Análisis IA (Error) ---\n';
            notasFinales += 'No se pudo completar el análisis por inteligencia artificial debido a un error. Se recomienda encarecidamente la consulta con un profesional médico.';
        }

        // Crear consulta
        const consulta = await Consulta.create({
            nombrePaciente,
            zonaAfectada,
            sintomasReportados: sintomasArray,
            resultados: topResultados,
            diagnosticoPrincipal: topResultados.length > 0 ? topResultados[0].afeccion : null,
            usuario: req.usuario.id,
            imagenZona: req.file ? `/uploads/${req.file.filename}` : null,
            notas: notasFinales,
            estado: 'completado'
        });

        console.log('Consulta creada con ID:', consulta._id);
        console.log('Notas guardadas con', notasFinales.includes('Análisis IA') ? 'análisis IA' : 'sin análisis IA');

        // Poblar la consulta
        const consultaPopulada = await Consulta.findById(consulta._id)
            .populate('sintomasReportados', 'nombre')
            .populate({
                path: 'resultados.afeccion',
                select: 'nombre descripcion severidad imagen'
            })
            .populate({
                path: 'resultados.sintomasCoincidentes',
                select: 'nombre'
            })
            .populate('diagnosticoPrincipal', 'nombre descripcion tratamiento severidad imagen');

        res.status(201).json({
            success: true,
            data: consultaPopulada
        });
    } catch (error) {
        console.error('Error creando consulta:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error creando consulta' 
        });
    }
};

// Obtener lista de consultas con paginación y búsqueda
export const getConsultas = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        
        const filtros = { usuario: req.usuario.id };
        
        if (search) {
            filtros.nombrePaciente = { $regex: search, $options: 'i' };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [consultas, total] = await Promise.all([
            Consulta.find(filtros)
                .populate('diagnosticoPrincipal', 'nombre severidad')
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 }),
            Consulta.countDocuments(filtros)
        ]);

        res.json({
            success: true,
            data: consultas,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error obteniendo consultas:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error obteniendo consultas' 
        });
    }
};

// Obtener consulta por ID
export const getConsultaById = async (req, res) => {
    try {
        const consulta = await Consulta.findById(req.params.id)
            .populate('sintomasReportados', 'nombre descripcion')
            .populate({
                path: 'resultados.afeccion',
                select: 'nombre descripcion severidad imagen tratamiento'
            })
            .populate({
                path: 'resultados.sintomasCoincidentes',
                select: 'nombre'
            })
            .populate('diagnosticoPrincipal')
            .populate('usuario', 'username');

        if (!consulta) {
            return res.status(404).json({ 
                success: false,
                message: 'Consulta no encontrada' 
            });
        }

        // Verificar que la consulta pertenece al usuario
        if (consulta.usuario._id.toString() !== req.usuario.id && req.usuario.role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                message: 'No autorizado' 
            });
        }

        res.json({
            success: true,
            data: consulta
        });
    } catch (error) {
        console.error('Error obteniendo consulta:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error obteniendo consulta' 
        });
    }
};

// Obtener últimas consultas del usuario
export const getConsultasRecientes = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;

        const consultas = await Consulta.find({ usuario: req.usuario.id })
            .populate('diagnosticoPrincipal', 'nombre severidad')
            .sort({ createdAt: -1 })
            .limit(limit);

        res.json({
            success: true,
            data: consultas
        });
    } catch (error) {
        console.error('Error obteniendo consultas recientes:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error obteniendo consultas recientes' 
        });
    }
};

// Eliminar consulta por ID
export const deleteConsulta = async (req, res) => {
    try {
        const consulta = await Consulta.findById(req.params.id);

        if (!consulta) {
            return res.status(404).json({ 
                success: false,
                message: 'Consulta no encontrada' 
            });
        }

        // Verificar que la consulta pertenece al usuario o es admin
        if (consulta.usuario.toString() !== req.usuario.id && req.usuario.role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                message: 'No autorizado para eliminar esta consulta' 
            });
        }

        // Guardar información para el log
        const nombrePaciente = consulta.nombrePaciente;
        const consultaId = consulta._id;

        // Eliminación física de la base de datos
        await Consulta.findByIdAndDelete(req.params.id);

        console.log(`Consulta eliminada físicamente de MongoDB: Paciente "${nombrePaciente}" (ID: ${consultaId})`);

        res.json({
            success: true,
            message: 'Consulta eliminada exitosamente de la base de datos'
        });
    } catch (error) {
        console.error('Error eliminando consulta:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error eliminando consulta: ' + error.message 
        });
    }
};
