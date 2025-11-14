import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import 'dotenv/config';

// Inicializar el cliente de manera lazy (solo cuando se necesite)
let genAI = null;

const initGenAI = () => {
    if (!genAI && process.env.GOOGLE_API_KEY) {
        genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        console.log('Cliente Gemini inicializado');
    }
    return genAI;
};

// Obtener modelo Gemini
const getModel = () => {
    const client = initGenAI();
    if (!client) {
        throw new Error('Cliente Gemini no inicializado - verifica GOOGLE_API_KEY');
    }
    return client.getGenerativeModel({ model: 'gemini-2.5-flash' });
};

function archivoAparte(ruta, mimeType) {
    if (!fs.existsSync(ruta)) {
        throw new Error(`Archivo no encontrado en la ruta: ${ruta}`); 
    }
    const datosBinarios = fs.readFileSync(ruta);
    const base64Data = datosBinarios.toString('base64');
    
    return {
        inlineData: {
            data: base64Data,
            mimeType,
        },
    };
}

// Objeto de respuesta por defecto en caso de error total
const getErrorResponse = (message = 'No se pudo realizar un análisis detallado.') => ({
    diagnosticoIA: 'Análisis no disponible',
    explicacion: message,
    recomendaciones: [
        'Mantener la zona limpia y seca',
        'Evitar rascar o irritar la zona',
        'Consultar con un dermatólogo para una evaluación profesional'
    ],
    urgencia: 'indeterminada',
    advertencia: 'Esta es una orientación general. Consulte a un profesional médico para un diagnóstico preciso.'
});

// --- FUNCIÓN UNIFICADA DE ANÁLISIS ---
export const analizarImagenDermatologica = async ({ sintomas, zonaAfectada, rutaImagen }) => {
    try {
        if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === 'tu-api-key-de-google') {
            console.log('API key no configurada para análisis de imagen');
            return getErrorResponse('API key de Gemini no configurada.');
        }

        const model = getModel();
        let prompt;
        const parts = [];

        // 1. Decidir el tipo de análisis (con o sin imagen)
        if (rutaImagen) {
            console.log('Iniciando análisis multimodal (imagen + texto)...');
            let mimeType = 'image/jpeg';
            if (rutaImagen.toLowerCase().endsWith('.png')) mimeType = 'image/png';

            const imagePart = archivoAparte(rutaImagen, mimeType);
            
            prompt = `Eres un asistente médico especializado en dermatología. Analiza la imagen y los datos del paciente. Responde EXACTAMENTE con un JSON válido (sin markdown) con este formato:
            {
                "diagnosticoIA": "diagnóstico probable (2-4 frases)",
                "explicacion": "Explicación detallada del diagnóstico basada en la imagen y síntomas",
                "recomendaciones": ["Recomendación 1", "Recomendación 2", "Recomendación 3"],
                "urgencia": "bajo",
                "advertencia": "Esta información es referencial. Consulte con un dermatólogo profesional para un diagnóstico preciso y tratamiento adecuado."
            }
            ---
            DATOS DEL PACIENTE:
            - Zona afectada: ${zonaAfectada}
            - Síntomas reportados: ${Array.isArray(sintomas) ? sintomas.join(', ') : sintomas}`;
            
            parts.push(prompt, imagePart);

        } else {
            console.log('Iniciando análisis de solo texto...');
            prompt = `Eres un asistente médico especializado en dermatología. Analiza los datos del paciente. Responde EXACTAMENTE con un JSON válido (sin markdown) con este formato:
            {
                "diagnosticoIA": "diagnóstico probable basado en síntomas (2-4 frases)",
                "explicacion": "Explicación detallada del diagnóstico basada en los síntomas reportados",
                "recomendaciones": ["Recomendación 1", "Recomendación 2", "Recomendación 3"],
                "urgencia": "medio",
                "advertencia": "Esta información es referencial. Consulte con un dermatólogo profesional para un diagnóstico preciso y tratamiento adecuado."
            }
            ---
            DATOS DEL PACIENTE:
            - Zona afectada: ${zonaAfectada}
            - Síntomas reportados: ${Array.isArray(sintomas) ? sintomas.join(', ') : sintomas}`;

            parts.push(prompt);
        }

        // 2. Ejecutar la llamada a la IA
        const result = await model.generateContent(parts);
        const response = await result.response;
        const text = response.text();
        
        console.log('Respuesta de Gemini recibida.');

        // 3. Parsear la respuesta (con fallback si el parseo falla)
        try {
            let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(cleanText);
            console.log('Análisis IA parseado correctamente.');
            return parsed;
        } catch (parseError) {
            console.error('Error parseando JSON de Gemini:', parseError.message);
            console.log('Texto recibido:', text);
            return getErrorResponse('La respuesta del análisis no tuvo un formato válido.');
        }

    } catch (error) {
        console.error('Error en el servicio de análisis de Gemini:', error.message);
        
        // Si el error es por sobrecarga del modelo (503), devuelve un mensaje amigable.
        if (error.message.includes('503') || error.message.toLowerCase().includes('overloaded')) {
            return getErrorResponse('El servicio de análisis está sobrecargado. Por favor, inténtalo de nuevo más tarde.');
        }
        
        // Para cualquier otro error, devuelve un mensaje genérico sin exponer detalles.
        return getErrorResponse('No se pudo completar el análisis debido a un error inesperado.');
    }
};