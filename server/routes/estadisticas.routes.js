// ================================================
// RUTAS DE ESTADÍSTICAS
// ================================================

import express from 'express';
import {
    getEstadisticas,
    getDistribucionSeveridad
} from '../controllers/estadisticasController.js';
import { proteger } from '../middleware/auth.js';

const router = express.Router();

router.use(proteger); // Todas las rutas requieren autenticación

router.get('/', getEstadisticas);
router.get('/severidad', getDistribucionSeveridad);

export default router;
