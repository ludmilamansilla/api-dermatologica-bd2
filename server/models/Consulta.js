// ================================================
// MODELO DE CONSULTA/DIAGNÓSTICO
// ================================================

import mongoose from 'mongoose';

const consultaSchema = new mongoose.Schema({
    nombrePaciente: {
        type: String,
        required: [true, 'El nombre del paciente es requerido'],
        trim: true
    },
    zonaAfectada: {
        type: String,
        required: [true, 'La zona afectada es requerida'],
        enum: ['rostro', 'cuello', 'torax', 'abdomen', 'brazos', 'piernas', 'manos', 'pies']
    },
    imagenZona: {
        type: String, // URL o ruta de la imagen
        default: null
    },
    sintomasReportados: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sintoma',
        required: true
    }],
    resultados: [{
        afeccion: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Afeccion'
        },
        porcentajeCoincidencia: {
            type: Number,
            min: 0,
            max: 100
        },
        sintomasCoincidentes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Sintoma'
        }]
    }],
    diagnosticoPrincipal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Afeccion'
    },
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    notas: {
        type: String,
        trim: true
    },
    estado: {
        type: String,
        enum: ['pendiente', 'completado', 'revisado'],
        default: 'completado'
    }
}, {
    timestamps: true
});

// Índice para búsquedas
consultaSchema.index({ nombrePaciente: 'text' });
consultaSchema.index({ usuario: 1, createdAt: -1 });

// Virtual para contar síntomas
consultaSchema.virtual('cantidadSintomas').get(function() {
    return this.sintomasReportados ? this.sintomasReportados.length : 0;
});

// Incluir virtuals en JSON
consultaSchema.set('toJSON', { virtuals: true });
consultaSchema.set('toObject', { virtuals: true });

export default mongoose.model('Consulta', consultaSchema);
