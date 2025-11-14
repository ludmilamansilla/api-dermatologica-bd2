import { GoogleGenerativeAI } from '@google/generative-ai';

// Inicializar el cliente de manera lazy (solo cuando se necesite)
let genAI = null;

const initGenAI = () => {
    if (!genAI && process.env.GOOGLE_API_KEY) {
        genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        console.log('🔑 Cliente Gemini inicializado');
    }
    return genAI;
};

// Obtener modelo Gemini 2.5 Flash (el más rápido y moderno)
const getModel = () => {
    const client = initGenAI();
    if (!client) {
        throw new Error('Cliente Gemini no inicializado - verifica GOOGLE_API_KEY');
    }
    return client.getGenerativeModel({ model: 'gemini-2.5-flash' });
};

// Analizar síntomas y sugerir diagnósticos
export const analizarSintomas = async (sintomas, zonaAfectada) => {
    try {
        // Validar API key
        const apiKey = process.env.GOOGLE_API_KEY;
        
        console.log('🔍 Verificando API key...');
        console.log('   API key existe:', !!apiKey);
        console.log('   Longitud:', apiKey ? apiKey.length : 0);
        
        if (!apiKey || apiKey === 'tu-api-key-de-google') {
            console.log('⚠️ API key de Gemini no configurada, usando análisis básico');
            return null;
        }
        
        console.log('🤖 Iniciando análisis con Gemini 2.5 Flash...');
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

Responde ÚNICAMENTE con un objeto JSON válido en este formato exacto (sin markdown):
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
            // Limpiar markdown si existe (```json y ```)
            let cleanText = text
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            
            const parsed = JSON.parse(cleanText);
            
            console.log('✅ Análisis IA parseado correctamente');
            console.log('📊 Urgencia:', parsed.urgencia);
            console.log('💡 Recomendaciones:', parsed.recomendaciones.length);
            
            return parsed;
        } catch (parseError) {
            console.log('⚠️ Error parseando JSON:', parseError.message);
            console.log('📝 Texto recibido:', text.substring(0, 200));
            
            // Si no es JSON válido, crear estructura a partir del texto
            return {
                explicacion: text.substring(0, 500),
                recomendaciones: [
                    'Mantener la zona afectada limpia y seca',
                    'Evitar rascar o irritar la zona',
                    'Consultar con un dermatólogo para evaluación profesional'
                ],
                urgencia: 'medio',
                advertencia: 'Esta es una orientación general. Consulte a un profesional médico para un diagnóstico preciso.'
            };
        }
    } catch (error) {
        console.error('❌ Error en análisis con Gemini AI:', error.message);
        console.error('   Stack:', error.stack);
        
        if (error.message.includes('API key')) {
            console.error('❌ Problema con la API key de Google');
            console.error('   Valor actual:', process.env.GOOGLE_API_KEY ? 'existe' : 'no existe');
        }
        
        if (error.message.includes('not found') || error.message.includes('404')) {
            console.error('❌ Modelo no encontrado - verifica que gemini-2.5-flash esté disponible');
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

        console.log('📝 Generando descripción para:', nombre);
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
        const text = response.text();
        
        console.log('✅ Descripción generada');
        return text;
    } catch (error) {
        console.error('❌ Error generando descripción:', error.message);
        return null;
    }
};

// Sugerir tratamiento
export const sugerirTratamiento = async (afeccion, severidad) => {
    try {
        if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === 'tu-api-key-de-google') {
            return null;
        }

        console.log('💊 Generando tratamiento para:', afeccion, '- Severidad:', severidad);
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
        const text = response.text();
        
        console.log('✅ Tratamiento generado');
        return text;
    } catch (error) {
        console.error('❌ Error sugiriendo tratamiento:', error.message);
        return null;
    }
};

export default { analizarSintomas, analizarSintomasConImagen, generarDescripcionAfeccion, sugerirTratamiento };