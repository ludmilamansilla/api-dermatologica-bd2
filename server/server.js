// ================================================
// SERVER.JS - Servidor Principal con ES Modules
// ================================================

import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

// Configuración para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config();

// Crear aplicación Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '..')));

// Importar rutas
import authRoutes from './routes/auth.routes.js';
import afeccionesRoutes from './routes/afecciones.routes.js';
import sintomasRoutes from './routes/sintomas.routes.js';
import consultasRoutes from './routes/consultas.routes.js';
import estadisticasRoutes from './routes/estadisticas.routes.js';

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
    console.error('❌ Error:', err.message);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
});

// Conectar a MongoDB Atlas
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ Error: MONGODB_URI no está definida en .env');
    console.log('📝 Crea un archivo .env basado en .env.example');
    process.exit(1);
}

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('✅ Conectado a MongoDB Atlas');
        console.log(`📊 Base de datos: ${mongoose.connection.name}`);
        
        // Inicializar datos de ejemplo si la base está vacía
        const { seedDatabase } = await import('./seed.js');
        await seedDatabase();
        
        // Iniciar servidor
        app.listen(PORT, () => {
            console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
            console.log(`📡 API disponible en http://localhost:${PORT}/api`);
            console.log(`🌐 Frontend en http://localhost:${PORT}/login.html\n`);
        });
    })
    .catch(err => {
        console.error('❌ Error al conectar a MongoDB:', err.message);
        console.log('\n💡 Pasos para resolver:');
        console.log('1. Verifica que tu cluster de MongoDB Atlas esté activo');
        console.log('2. Revisa que el MONGODB_URI en .env sea correcto');
        console.log('3. Asegúrate de permitir tu IP en MongoDB Atlas (0.0.0.0/0 para desarrollo)\n');
        process.exit(1);
    });

// Manejo de señales de terminación
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('\n👋 Servidor detenido correctamente');
    process.exit(0);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
    console.error('❌ Error no manejado:', err.message);
});
