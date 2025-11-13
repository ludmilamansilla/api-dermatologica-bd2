// ================================================
// MODELO DE SÍNTOMA
// ================================================

import mongoose from 'mongoose';

const sintomaSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre del síntoma es requerido'],
        unique: true,
        trim: true
    },
    descripcion: {
        type: String,
        trim: true
    },
    zona: {
        type: String,
        enum: ['todas', 'rostro', 'cuello', 'tronco', 'abdomen', 'brazos', 'piernas', 'manos', 'pies', 'cuero-cabelludo', 'extremidades'],
        default: 'todas'
    },
    activo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Índice para búsqueda
sintomaSchema.index({ nombre: 'text', descripcion: 'text' });

export default mongoose.model('Sintoma', sintomaSchema);
