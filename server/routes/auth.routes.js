// ================================================
// RUTAS DE AUTENTICACIÓN
// ================================================

import express from 'express';
import { login, getPerfil, logout } from '../controllers/authController.js';
import { proteger } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.get('/perfil', proteger, getPerfil);
router.post('/logout', proteger, logout);

export default router;
