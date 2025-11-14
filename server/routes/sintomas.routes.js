import express from 'express';
import {
    getSintomas,
    getSintomaById,
    createSintoma,
    updateSintoma,
    deleteSintoma
} from '../controllers/sintomasController.js';
import { proteger } from '../middleware/auth.js';

const router = express.Router();

router.use(proteger); 

router.route('/')
    .get(getSintomas)
    .post(createSintoma);

router.route('/:id')
    .get(getSintomaById)
    .put(updateSintoma)
    .delete(deleteSintoma);

export default router;
