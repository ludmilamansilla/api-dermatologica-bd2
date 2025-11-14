import express from 'express';
import {
    createConsulta,
    getConsultas,
    getConsultaById,
    getConsultasRecientes,
    deleteConsulta
} from '../controllers/consultasController.js';
import { proteger } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.use(proteger); 

router.get('/recientes', getConsultasRecientes);

router.route('/')
    .post(upload.single('imagenZona'), createConsulta)
    .get(getConsultas);

router.route('/:id')
    .get(getConsultaById)
    .delete(deleteConsulta);

export default router;
