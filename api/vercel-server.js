// Servidor Express para Vercel Serverless Functions
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Crear aplicación Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Importar rutas
import authRoutes from '../server/routes/auth.routes.js';
import afeccionesRoutes from '../server/routes/afecciones.routes.js';
import sintomasRoutes from '../server/routes/sintomas.routes.js';
import consultasRoutes from '../server/routes/consultas.routes.js';
import estadisticasRoutes from '../server/routes/estadisticas.routes.js';

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/afecciones', afeccionesRoutes);
app.use('/api/sintomas', sintomasRoutes);
app.use('/api/consultas', consultasRoutes);
app.use('/api/estadisticas', estadisticasRoutes);

// Ruta raíz de la API
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'API Dermatológica - Backend funcionando correctamente',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            afecciones: '/api/afecciones',
            sintomas: '/api/sintomas',
            consultas: '/api/consultas',
            estadisticas: '/api/estadisticas'
        }
    });
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
});

// Conectar a MongoDB Atlas (solo una vez)
let isConnected = false;

const connectDB = async () => {
    if (isConnected) {
        return;
    }

    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        
        if (!MONGODB_URI) {
            throw new Error('MONGODB_URI no está definida en las variables de entorno');
        }

        await mongoose.connect(MONGODB_URI);
        isConnected = true;
        console.log('Conectado a MongoDB Atlas');
        
        // Inicializar datos de ejemplo si la base está vacía (solo una vez)
        try {
            const { seedDatabase } = await import('../server/seed.js');
            await seedDatabase();
        } catch (seedError) {
            console.log('Seed ya ejecutado o error:', seedError.message);
        }
    } catch (error) {
        console.error('Error al conectar a MongoDB:', error.message);
        isConnected = false;
        throw error;
    }
};

// Handler para Vercel Serverless Functions
export default async (req, res) => {
    // Conectar a la base de datos antes de manejar la petición
    try {
        await connectDB();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error de conexión a la base de datos',
            error: error.message
        });
    }

    // Pasar la petición a Express
    return app(req, res);
};


