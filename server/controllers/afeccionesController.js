import Afeccion from '../models/Afeccion.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { uploadToCloudinary, deleteFromCloudinary } from '../middleware/upload-cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAfecciones = async (req, res) => {
    try {
        const { search, zona, severidad, page = 1, limit = 12 } = req.query;
        
        // Construir filtros
        const filtros = { activo: true };
        
        if (search) {
            filtros.$or = [
                { nombre: { $regex: search, $options: 'i' } },
                { descripcion: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (zona && zona !== 'todas') {
            filtros.zona = zona;
        }
        
        if (severidad && severidad !== 'todas') {
            filtros.severidad = severidad;
        }

        // Paginación
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const [afecciones, total] = await Promise.all([
            Afeccion.find(filtros)
                .populate('sintomas', 'nombre')
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ nombre: 1 }),
            Afeccion.countDocuments(filtros)
        ]);

        res.json({
            success: true,
            data: afecciones,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error obteniendo afecciones:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error obteniendo afecciones' 
        });
    }
};

export const getAfeccionById = async (req, res) => {
    try {
        const afeccion = await Afeccion.findById(req.params.id)
            .populate('sintomas', 'nombre descripcion');

        if (!afeccion) {
            return res.status(404).json({ 
                success: false,
                message: 'Afección no encontrada' 
            });
        }

        res.json({
            success: true,
            data: afeccion
        });
    } catch (error) {
        console.error('Error obteniendo afección:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error obteniendo afección' 
        });
    }
};

export const createAfeccion = async (req, res) => {
    try {
        const { nombre, descripcion, severidad, zona, sintomas, tratamiento } = req.body;

        // Validar campos requeridos
        if (!nombre || !descripcion || !severidad) {
            return res.status(400).json({ 
                success: false,
                message: 'Faltan campos requeridos' 
            });
        }

        // Verificar si ya existe
        const existente = await Afeccion.findOne({ nombre });
        if (existente) {
            return res.status(400).json({ 
                success: false,
                message: 'Ya existe una afección con ese nombre' 
            });
        }

        // Subir imagen a Cloudinary si existe
        let imagenUrl = null;
        if (req.file) {
            try {
                imagenUrl = await uploadToCloudinary(req.file.buffer, 'afecciones');
                console.log('Imagen de afección subida a Cloudinary:', imagenUrl);
            } catch (error) {
                console.error('Error subiendo imagen a Cloudinary:', error);
            }
        }

        // Crear afección
        const afeccion = await Afeccion.create({
            nombre,
            descripcion,
            severidad,
            zona: zona || 'todas',
            sintomas: sintomas ? JSON.parse(sintomas) : [],
            tratamiento,
            imagen: imagenUrl // URL de Cloudinary o null
        });

        const afeccionPopulada = await Afeccion.findById(afeccion._id)
            .populate('sintomas', 'nombre');

        res.status(201).json({
            success: true,
            data: afeccionPopulada
        });
    } catch (error) {
        console.error('Error creando afección:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error creando afección' 
        });
    }
};

export const updateAfeccion = async (req, res) => {
    try {
        const afeccion = await Afeccion.findById(req.params.id);

        if (!afeccion) {
            return res.status(404).json({ 
                success: false,
                message: 'Afección no encontrada' 
            });
        }

        const { nombre, descripcion, severidad, zona, sintomas, tratamiento } = req.body;

        // Actualizar campos
        if (nombre) afeccion.nombre = nombre;
        if (descripcion) afeccion.descripcion = descripcion;
        if (severidad) afeccion.severidad = severidad;
        if (zona) afeccion.zona = zona;
        if (sintomas) afeccion.sintomas = JSON.parse(sintomas);
        if (tratamiento) afeccion.tratamiento = tratamiento;
        
        // Si hay nueva imagen, eliminar la anterior de Cloudinary y subir la nueva
        if (req.file) {
            // Eliminar imagen anterior de Cloudinary si existe
            if (afeccion.imagen && afeccion.imagen.includes('cloudinary.com')) {
                try {
                    await deleteFromCloudinary(afeccion.imagen);
                    console.log('Imagen anterior eliminada de Cloudinary');
                } catch (err) {
                    console.log('Error eliminando imagen anterior de Cloudinary:', err);
                }
            } else if (afeccion.imagen) {
                // Si es una imagen local antigua, intentar eliminar del sistema de archivos
                const imagenPath = path.join(__dirname, '..', '..', 'front', 'public', afeccion.imagen);
                try {
                    await fs.unlink(imagenPath);
                } catch (err) {
                    console.log('Error eliminando imagen local anterior:', err);
                }
            }
            
            // Subir nueva imagen a Cloudinary
            try {
                const nuevaImagenUrl = await uploadToCloudinary(req.file.buffer, 'afecciones');
                afeccion.imagen = nuevaImagenUrl;
                console.log('Nueva imagen subida a Cloudinary:', nuevaImagenUrl);
            } catch (error) {
                console.error('Error subiendo nueva imagen a Cloudinary:', error);
                // No actualizar la imagen si falla el upload
            }
        }

        await afeccion.save();

        const afeccionPopulada = await Afeccion.findById(afeccion._id)
            .populate('sintomas', 'nombre');

        res.json({
            success: true,
            data: afeccionPopulada
        });
    } catch (error) {
        console.error('Error actualizando afección:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error actualizando afección' 
        });
    }
};

export const deleteAfeccion = async (req, res) => {
    try {
        const afeccion = await Afeccion.findById(req.params.id);

        if (!afeccion) {
            return res.status(404).json({ 
                success: false,
                message: 'Afección no encontrada' 
            });
        }

        // Eliminar permanentemente de la base de datos
        await Afeccion.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Afección eliminada exitosamente de la base de datos'
        });
    } catch (error) {
        console.error('Error eliminando afección:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error eliminando afección' 
        });
    }
};

