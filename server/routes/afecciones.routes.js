import express from 'express';
import {
    getAfecciones,
    getAfeccionById,
    createAfeccion,
    updateAfeccion,
    deleteAfeccion
} from '../controllers/afeccionesController.js';
import { proteger } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.use(proteger); 

router.route('/')
    .get(getAfecciones)
    .post(upload.single('imagen'), createAfeccion);

router.route('/:id')
    .get(getAfeccionById)
    .put(upload.single('imagen'), updateAfeccion)
    .delete(deleteAfeccion);

export default router;
