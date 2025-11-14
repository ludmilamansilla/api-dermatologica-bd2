import Sintoma from '../models/Sintoma.js';

// Obtener todos los síntomas con filtros opcionales
export const getSintomas = async (req, res) => {
    try {
        const { search, zona } = req.query;
        
        // Construir filtros
        const filtros = { activo: true };
        
        if (search) {
            filtros.$or = [
                { nombre: { $regex: search, $options: 'i' } },
                { descripcion: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (zona && zona !== 'todas') {
            filtros.$or = [
                { zona },
                { zona: 'todas' }
            ];
        }

        const sintomas = await Sintoma.find(filtros).sort({ nombre: 1 });

        res.json({
            success: true,
            data: sintomas
        });
    } catch (error) {
        console.error('Error obteniendo síntomas:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error obteniendo síntomas' 
        });
    }
};

// Obtener síntoma por ID
export const getSintomaById = async (req, res) => {
    try {
        const sintoma = await Sintoma.findById(req.params.id);

        if (!sintoma) {
            return res.status(404).json({ 
                success: false,
                message: 'Síntoma no encontrado' 
            });
        }

        res.json({
            success: true,
            data: sintoma
        });
    } catch (error) {
        console.error('Error obteniendo síntoma:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error obteniendo síntoma' 
        });
    }
};


// Crear síntoma
export const createSintoma = async (req, res) => {
    try {
        const { nombre, descripcion, zona } = req.body;

        // Validar campos requeridos
        if (!nombre) {
            return res.status(400).json({ 
                success: false,
                message: 'El nombre es requerido' 
            });
        }

        // Verificar si ya existe
        const existente = await Sintoma.findOne({ nombre });
        if (existente) {
            return res.status(400).json({ 
                success: false,
                message: 'Ya existe un síntoma con ese nombre' 
            });
        }

        // Crear síntoma
        const sintoma = await Sintoma.create({
            nombre,
            descripcion,
            zona: zona || 'todas'
        });

        res.status(201).json({
            success: true,
            data: sintoma
        });
    } catch (error) {
        console.error('Error creando síntoma:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error creando síntoma' 
        });
    }
};

// Actualizar síntoma
export const updateSintoma = async (req, res) => {
    try {
        const sintoma = await Sintoma.findById(req.params.id);

        if (!sintoma) {
            return res.status(404).json({ 
                success: false,
                message: 'Síntoma no encontrado' 
            });
        }

        const { nombre, descripcion, zona } = req.body;

        if (nombre) sintoma.nombre = nombre;
        if (descripcion !== undefined) sintoma.descripcion = descripcion;
        if (zona) sintoma.zona = zona;

        await sintoma.save();

        res.json({
            success: true,
            data: sintoma
        });
    } catch (error) {
        console.error('Error actualizando síntoma:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error actualizando síntoma' 
        });
    }
};

// Eliminar síntoma físicamente
export const deleteSintoma = async (req, res) => {
    try {
        const sintoma = await Sintoma.findById(req.params.id);

        if (!sintoma) {
            return res.status(404).json({ 
                success: false,
                message: 'Síntoma no encontrado' 
            });
        }

        // Guardar nombre para el mensaje
        const nombreSintoma = sintoma.nombre;
        const idSintoma = sintoma._id;

        // Eliminación física de la base de datos
        await Sintoma.findByIdAndDelete(req.params.id);

        console.log(`✅ Síntoma eliminado físicamente de MongoDB: ${nombreSintoma} (ID: ${idSintoma})`);

        res.json({
            success: true,
            message: 'Síntoma eliminado exitosamente de la base de datos'
        });
    } catch (error) {
        console.error('Error eliminando síntoma:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error eliminando síntoma: ' + error.message 
        });
    }
};
