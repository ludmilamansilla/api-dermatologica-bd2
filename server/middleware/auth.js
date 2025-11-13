// ================================================
// MIDDLEWARE DE AUTENTICACIÓN
// ================================================

import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';

export const proteger = async (req, res, next) => {
    let token;

    // Verificar si hay token en el header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Obtener token del header
            token = req.headers.authorization.split(' ')[1];

            // Verificar token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key');

            // Obtener usuario del token
            req.usuario = await Usuario.findById(decoded.id).select('-password');

            if (!req.usuario || !req.usuario.activo) {
                return res.status(401).json({ 
                    success: false,
                    message: 'Usuario no autorizado' 
                });
            }

            next();
        } catch (error) {
            console.error('Error en autenticación:', error);
            return res.status(401).json({ 
                success: false,
                message: 'Token inválido' 
            });
        }
    } else {
        return res.status(401).json({ 
            success: false,
            message: 'No hay token, autorización denegada' 
        });
    }
};

// Middleware para verificar rol de admin
export const esAdmin = (req, res, next) => {
    if (req.usuario && req.usuario.role === 'admin') {
        next();
    } else {
        res.status(403).json({ 
            success: false,
            message: 'Acceso denegado. Se requiere rol de administrador' 
        });
    }
};
