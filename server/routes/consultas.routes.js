// ================================================
// RUTAS DE CONSULTAS/DIAGNÓSTICOS
// ================================================

import express from 'express';
import {
    createConsulta,
    getConsultas,
    getConsultaById,
    getConsultasRecientes
} from '../controllers/consultasController.js';
import { proteger } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.use(proteger); // Todas las rutas requieren autenticación

router.get('/recientes', getConsultasRecientes);

router.route('/')
    .post(upload.single('imagenZona'), createConsulta)
    .get(getConsultas);

router.get('/:id', getConsultaById);

export default router;
