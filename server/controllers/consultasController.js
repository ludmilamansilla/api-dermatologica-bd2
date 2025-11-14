import Consulta from '../models/Consulta.js';
import Afeccion from '../models/Afeccion.js';
import Sintoma from '../models/Sintoma.js';
import { analizarSintomas, analizarImagenDermatologica } from '../services/geminiService.js';

// Función para calcular coincidencias
const calcularCoincidencias = (sintomasReportados, sintomasAfeccion) => {
    const reportadosSet = new Set(sintomasReportados.map(s => s.toString()));
    const coincidentes = sintomasAfeccion.filter(s => reportadosSet.has(s.toString()));
    
    const porcentaje = sintomasAfeccion.length > 0 
        ? (coincidentes.length / sintomasAfeccion.length) * 100 
        : 0;
    
    return {
        sintomasCoincidentes: coincidentes,
        porcentajeCoincidencia: Math.round(porcentaje)
    };
};

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
            // Obtener nombres de síntomas
            const sintomasNombres = await Sintoma.find({ 
                _id: { $in: sintomasArray } 
            }).select('nombre');
            
            const nombres = sintomasNombres.map(s => s.nombre);
            
            console.log('Síntomas para análisis IA:', nombres);
            console.log('Zona afectada:', zonaAfectada);
            
            // Si hay imagen, usar análisis con visión
            if (req.file) {
                console.log('📸 Imagen detectada, usando análisis con visión...');
                const rutaImagen = `./uploads/${req.file.filename}`;
                
                // Obtener todas las afecciones para contexto
                const todasAfecciones = await Afeccion.find({ activo: true }).select('nombre descripcion severidad');
                
                analisisIA = await analizarImagenDermatologica(
                    rutaImagen,
                    nombres, 
                    zonaAfectada, 
                    todasAfecciones
                );
                
                if (analisisIA) {
                    console.log('✅ Análisis con visión completado');
                    console.log('   Diagnóstico IA:', analisisIA.diagnosticoIA);
                    console.log('   Confianza:', analisisIA.confianza);
                }
            } else {
                // Sin imagen, usar análisis solo de texto
                console.log('📝 Sin imagen, usando análisis de texto...');
                analisisIA = await analizarSintomas(nombres, zonaAfectada);
            }
            
            if (analisisIA) {
                console.log('Análisis con Gemini AI completado exitosamente');
                console.log('Urgencia detectada:', analisisIA.urgencia);
                
                // Agregar análisis IA a las notas
                notasFinales += '\n\n--- Análisis IA ---\n';
                
                // Si hay análisis visual, agregarlo
                if (analisisIA.diagnosticoIA) {
                    notasFinales += '\n🔍 Análisis Visual:\n';
                    notasFinales += `${analisisIA.diagnosticoIA}\n\n`;
                    notasFinales += `Confianza del diagnóstico: ${analisisIA.confianza}\n\n`;
                }
                
                notasFinales += `${analisisIA.explicacion}\n\n`;
                notasFinales += 'Recomendaciones:\n';
                analisisIA.recomendaciones.forEach((rec, i) => {
                    notasFinales += `${i + 1}. ${rec}\n`;
                });
                notasFinales += `\nUrgencia: ${analisisIA.urgencia}\n\n`;
                notasFinales += analisisIA.advertencia;
            } else {
                console.log('No se obtuvo análisis IA - Generando análisis básico');
                
                // Análisis básico sin IA
                notasFinales += '\n\n--- Análisis Clínico ---\n';
                notasFinales += `Se han identificado los siguientes síntomas en la zona ${zonaAfectada}: ${nombres.join(', ')}.\n\n`;
                notasFinales += 'Recomendaciones generales:\n';
                notasFinales += '1. Mantener la zona limpia y seca\n';
                notasFinales += '2. Evitar rascar o irritar el área afectada\n';
                notasFinales += '3. Aplicar tratamiento según indicación médica\n';
                notasFinales += '4. Consultar con un dermatólogo si los síntomas persisten\n\n';
                
                // Determinar urgencia básica
                const urgenciaBasica = nombres.some(n => 
                    n.toLowerCase().includes('dolor') || 
                    n.toLowerCase().includes('sangr') || 
                    n.toLowerCase().includes('pus')
                ) ? 'ALTA' : 'MEDIA';
                
                notasFinales += `Urgencia estimada: ${urgenciaBasica}\n\n`;
                notasFinales += 'IMPORTANTE: Esta es una evaluación automática básica. Se recomienda consultar con un profesional de la salud para un diagnóstico preciso y tratamiento adecuado.';
            }
        } catch (error) {
            console.error('Error al obtener análisis:', error.message);
            // Agregar nota simple si hay error
            notasFinales += '\n\nIMPORTANTE: Consulte con un dermatólogo profesional para evaluación y tratamiento.';
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

        console.log(`✅ Consulta eliminada físicamente de MongoDB: Paciente "${nombrePaciente}" (ID: ${consultaId})`);

        res.json({
            success: true,
            message: 'Consulta eliminada exitosamente de la base de datos'
        });
    } catch (error) {
        console.error('❌ Error eliminando consulta:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error eliminando consulta: ' + error.message 
        });
    }
};
