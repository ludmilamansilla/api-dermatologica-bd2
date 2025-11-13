// ================================================
// SERVICIO DE GEMINI AI
// ================================================

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Obtener modelo Gemini
const getModel = () => {
    return genAI.getGenerativeModel({ model: 'gemini-pro' });
};

// Analizar síntomas y sugerir diagnósticos
export const analizarSintomas = async (sintomas, zonaAfectada) => {
    try {
        // Verificar API key
        if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === 'tu-api-key-de-google') {
            console.log('⚠️ Google API Key no configurada correctamente');
            console.log('⚠️ Valor actual:', process.env.GOOGLE_API_KEY ? 'existe pero no válida' : 'no existe');
            return null;
        }

        console.log('🤖 Iniciando análisis con Gemini AI...');
        console.log('📝 Síntomas a analizar:', sintomas);
        console.log('📍 Zona:', zonaAfectada);

        const model = getModel();
        
        const prompt = `Eres un asistente médico especializado en dermatología. 
        
Analiza los siguientes síntomas dermatológicos:
- Zona afectada: ${zonaAfectada}
- Síntomas reportados: ${sintomas.join(', ')}

Proporciona un análisis médico profesional con:
1. Una explicación clara de qué podrían indicar estos síntomas (2-3 oraciones)
2. Tres a cuatro recomendaciones específicas de cuidado
3. Nivel de urgencia: bajo, medio o alto
4. Un mensaje de advertencia sobre consulta médica

Responde ÚNICAMENTE con un objeto JSON válido en este formato exacto:
{
    "explicacion": "Explicación médica de los síntomas",
    "recomendaciones": ["Recomendación 1", "Recomendación 2", "Recomendación 3"],
    "urgencia": "bajo",
    "advertencia": "Esta información es referencial. Consulte con un dermatólogo profesional para un diagnóstico preciso y tratamiento adecuado."
}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log('📥 Respuesta de Gemini recibida');
        
        // Intentar parsear como JSON
        try {
            // Limpiar markdown si existe
            let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(cleanText);
            
            console.log('✅ Análisis IA parseado correctamente');
            console.log('📊 Urgencia:', parsed.urgencia);
            console.log('💡 Recomendaciones:', parsed.recomendaciones.length);
            
            return parsed;
        } catch (parseError) {
            console.log('⚠️ Error parseando JSON, usando formato alternativo');
            // Si no es JSON válido, crear estructura a partir del texto
            return {
                explicacion: text.substring(0, 500),
                recomendaciones: [
                    'Mantener la zona afectada limpia y seca',
                    'Evitar rascar o irritar la zona',
                    'Consultar con un dermatólogo'
                ],
                urgencia: 'medio',
                advertencia: 'Esta es una orientación general. Consulte a un profesional médico para un diagnóstico preciso.'
            };
        }
    } catch (error) {
        console.error('❌ Error en análisis con Gemini AI:', error.message);
        if (error.message.includes('API key')) {
            console.error('❌ Problema con la API key de Google');
        }
        return null;
    }
};

// Generar descripción para una afección
export const generarDescripcionAfeccion = async (nombre, sintomas) => {
    try {
        if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === 'tu-api-key-de-google') {
            return null;
        }

        const model = getModel();
        
        const prompt = `Genera una descripción médica breve (2-3 párrafos) sobre la afección dermatológica "${nombre}".
        
Síntomas asociados: ${sintomas.join(', ')}

La descripción debe ser:
- Clara y profesional
- Incluir causas comunes
- Mencionar población afectada
- Máximo 300 palabras`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error generando descripción:', error.message);
        return null;
    }
};

// Sugerir tratamiento
export const sugerirTratamiento = async (afeccion, severidad) => {
    try {
        if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === 'tu-api-key-de-google') {
            return null;
        }

        const model = getModel();
        
        const prompt = `Sugiere un plan de tratamiento general para:
        
Afección: ${afeccion}
Severidad: ${severidad}

Incluye:
1. Medidas de cuidado inmediato (2-3 puntos)
2. Tratamientos tópicos comunes
3. Cuándo buscar atención médica urgente
4. Prevención

Responde en formato de lista clara y concisa.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error sugiriendo tratamiento:', error.message);
        return null;
    }
};

export default {
    analizarSintomas,
    generarDescripcionAfeccion,
    sugerirTratamiento
};
