// ================================================
// CONTROLADOR DE ESTADÍSTICAS
// ================================================

import Afeccion from '../models/Afeccion.js';
import Sintoma from '../models/Sintoma.js';
import Consulta from '../models/Consulta.js';

// @desc    Obtener estadísticas para el dashboard
// @route   GET /api/estadisticas
// @access  Private
export const getEstadisticas = async (req, res) => {
    try {
        const [
            totalAfecciones,
            totalSintomas,
            totalConsultas,
            consultasRecientes
        ] = await Promise.all([
            Afeccion.countDocuments({ activo: true }),
            Sintoma.countDocuments({ activo: true }),
            Consulta.countDocuments({ usuario: req.usuario.id }),
            Consulta.find({ usuario: req.usuario.id })
                .populate('diagnosticoPrincipal', 'nombre severidad')
                .sort({ createdAt: -1 })
                .limit(5)
        ]);

        res.json({
            success: true,
            data: {
                totalAfecciones,
                totalSintomas,
                totalConsultas,
                consultasRecientes
            }
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error obteniendo estadísticas' 
        });
    }
};

// @desc    Obtener distribución de severidad
// @route   GET /api/estadisticas/severidad
// @access  Private
export const getDistribucionSeveridad = async (req, res) => {
    try {
        const distribucion = await Afeccion.aggregate([
            { $match: { activo: true } },
            { $group: { _id: '$severidad', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            data: distribucion
        });
    } catch (error) {
        console.error('Error obteniendo distribución:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error obteniendo distribución' 
        });
    }
};
