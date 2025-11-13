// ================================================
// CONTROLADOR DE AUTENTICACIÓN
// ================================================

import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';

// Generar JWT
const generarToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret-key', {
        expiresIn: '30d'
    });
};

// @desc    Login de usuario
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validar campos
        if (!username || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Por favor ingrese usuario y contraseña' 
            });
        }

        // Buscar usuario
        const usuario = await Usuario.findOne({ username, activo: true });
        
        if (!usuario) {
            return res.status(401).json({ 
                success: false,
                message: 'Credenciales inválidas' 
            });
        }

        // Verificar contraseña
        const passwordMatch = await usuario.comparePassword(password);
        
        if (!passwordMatch) {
            return res.status(401).json({ 
                success: false,
                message: 'Credenciales inválidas' 
            });
        }

        // Generar token
        const token = generarToken(usuario._id);

        res.json({
            success: true,
            data: {
                id: usuario._id,
                username: usuario.username,
                role: usuario.role,
                token
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error en el servidor' 
        });
    }
};

// @desc    Obtener perfil de usuario
// @route   GET /api/auth/perfil
// @access  Private
export const getPerfil = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id);
        
        if (!usuario) {
            return res.status(404).json({ 
                success: false,
                message: 'Usuario no encontrado' 
            });
        }

        res.json({
            success: true,
            data: usuario
        });
    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error en el servidor' 
        });
    }
};

// @desc    Logout (cliente maneja el token)
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
    res.json({
        success: true,
        message: 'Sesión cerrada exitosamente'
    });
};
