import multer from 'multer';
import cloudinary from 'cloudinary';
import { Readable } from 'stream';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Configurar Cloudinary
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('⚠️  Cloudinary: Faltan variables de entorno');
  console.error('   Cloud name:', cloudName || 'NO CONFIGURADO');
  console.error('   API Key:', apiKey ? 'Configurado' : 'NO CONFIGURADO');
  console.error('   API Secret:', apiSecret ? 'Configurado' : 'NO CONFIGURADO');
}

cloudinary.v2.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

// Configuración de multer para almacenar en memoria (buffer)
const storage = multer.memoryStorage();

// Filtro de archivos (solo imágenes)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(file.originalname.toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
  }
};

// Configuración de multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

/**
 * Función para subir una imagen a Cloudinary
 * @param {Buffer} buffer - Buffer de la imagen
 * @param {string} folder - Carpeta en Cloudinary (opcional)
 * @param {string} publicId - ID público personalizado (opcional)
 * @returns {Promise<string>} URL pública de la imagen
 */
export const uploadToCloudinary = (buffer, folder = 'dermatologica', publicId = null) => {
  return new Promise((resolve, reject) => {
    // Verificar que Cloudinary esté configurado
    if (!cloudName || !apiKey || !apiSecret) {
      const error = new Error('Cloudinary no está configurado correctamente. Verifica las variables de entorno.');
      console.error('❌', error.message);
      reject(error);
      return;
    }

    // Verificar que el buffer exista
    if (!buffer || !Buffer.isBuffer(buffer)) {
      const error = new Error('Buffer de imagen inválido');
      console.error('❌', error.message);
      reject(error);
      return;
    }

    console.log(`📤 Subiendo imagen a Cloudinary (cloud: ${cloudName}, folder: ${folder})...`);

    // Convertir buffer a stream
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'image',
        public_id: publicId,
        // Optimizaciones automáticas
        transformation: [
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('❌ Error subiendo a Cloudinary:', error.message);
          console.error('   Detalles:', {
            http_code: error.http_code,
            cloud_name: cloudName,
            error_type: error.name
          });
          reject(error);
        } else {
          console.log('✅ Imagen subida exitosamente a Cloudinary');
          // Retornar la URL segura (HTTPS)
          resolve(result.secure_url);
        }
      }
    );

    // Convertir buffer a stream legible
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

/**
 * Función para eliminar una imagen de Cloudinary
 * @param {string} imageUrl - URL completa de la imagen o public_id
 * @returns {Promise<Object>} Resultado de la eliminación
 */
export const deleteFromCloudinary = async (imageUrl) => {
  try {
    // Extraer public_id de la URL
    // Formato: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    const publicId = filename.split('.')[0];
    
    // Intentar extraer el folder si existe
    const uploadIndex = urlParts.indexOf('upload');
    let fullPublicId = publicId;
    
    if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
      // Hay un folder
      const folder = urlParts[uploadIndex + 1];
      fullPublicId = `${folder}/${publicId}`;
    }

    const result = await cloudinary.v2.uploader.destroy(fullPublicId, {
      resource_type: 'image'
    });

    return result;
  } catch (error) {
    console.error('Error eliminando de Cloudinary:', error);
    throw error;
  }
};

export default upload;

