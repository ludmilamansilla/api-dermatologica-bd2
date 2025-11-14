import mongoose from 'mongoose';

const afeccionSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre de la afección es requerido'],
        unique: true,
        trim: true
    },
    descripcion: {
        type: String,
        required: [true, 'La descripción es requerida'],
        trim: true
    },
    severidad: {
        type: String,
        required: [true, 'La severidad es requerida'],
        enum: ['leve', 'moderada', 'grave'],
        default: 'moderada'
    },
    zona: {
        type: String,
        enum: ['rostro', 'cuello', 'tronco', 'abdomen', 'brazos', 'piernas', 'manos', 'pies', 'cuero-cabelludo', 'extremidades', 'todas'],
        default: 'todas'
    },
    imagen: {
        type: String, // URL o ruta de la imagen
        default: null
    },
    sintomas: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sintoma'
    }],
    tratamiento: {
        type: String,
        trim: true
    },
    activo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Índice para búsqueda
afeccionSchema.index({ nombre: 'text', descripcion: 'text' });

// Virtual para contar síntomas
afeccionSchema.virtual('cantidadSintomas').get(function() {
    return this.sintomas ? this.sintomas.length : 0;
});

// Incluir virtuals en JSON
afeccionSchema.set('toJSON', { virtuals: true });
afeccionSchema.set('toObject', { virtuals: true });

export default mongoose.model('Afeccion', afeccionSchema);
