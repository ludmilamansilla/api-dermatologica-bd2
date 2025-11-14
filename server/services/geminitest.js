import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configurar la ruta correcta al .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

async function testGemini() {
    console.log('🔍 Verificando Gemini 2.5 API...\n');
    
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
        console.error('❌ GOOGLE_API_KEY no está definida');
        return;
    }
    
    const cleanApiKey = apiKey.trim();
    
    console.log('📋 Información de la API Key:');
    console.log(`   Longitud: ${cleanApiKey.length}`);
    console.log(`   Primeros 10 caracteres: "${cleanApiKey.substring(0, 10)}"`);
    console.log(`   Últimos 5 caracteres: "${cleanApiKey.slice(-5)}"`);
    
    if (!cleanApiKey.startsWith('AIzaSy')) {
        console.error('❌ La API key no comienza con "AIzaSy"');
        return;
    }
    
    console.log('✅ Formato de API key correcto\\n');
    
    try {
        console.log('🚀 Probando conexión con Gemini 2.5 Flash...');
        const genAI = new GoogleGenerativeAI(cleanApiKey);
        
        // Usar Gemini 2.5 Flash
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        
        console.log('📦 Modelo: gemini-2.5-flash\\n');
        
        const result = await model.generateContent('Di solo "Conexión exitosa con Gemini 2.5"');
        const response = await result.response;
        const text = response.text();
        
        console.log('✅ ¡Conexión exitosa!');
        console.log('📥 Respuesta de Gemini:', text);
        
        // Prueba adicional con síntomas
        console.log('\\n🧪 Probando análisis de síntomas...');
        const testPrompt = `Analiza estos síntomas dermatológicos:
- Zona: rostro
- Síntomas: picazón, enrojecimiento

Responde SOLO con JSON:
{
    "explicacion": "explicación breve",
    "recomendaciones": ["rec1", "rec2", "rec3"],
    "urgencia": "bajo",
    "advertencia": "Consulte a un profesional"
}`;
        
        const testResult = await model.generateContent(testPrompt);
        const testResponse = await testResult.response;
        const testText = testResponse.text();
        
        console.log('📊 Respuesta de análisis:');
        console.log(testText);
        
        // Intentar parsear JSON
        try {
            // Limpiar la respuesta: quitar markdown y espacios
            let cleanJson = testText
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            
            console.log('\n🔍 JSON limpio para parsear:');
            console.log(cleanJson);
            
            const parsed = JSON.parse(cleanJson);
            console.log('\n✅ JSON parseado correctamente');
            console.log('   Explicación:', parsed.explicacion.substring(0, 60) + '...');
            console.log('   Urgencia:', parsed.urgencia);
            console.log('   Recomendaciones:', parsed.recomendaciones.length);
        } catch (e) {
            console.log('\n⚠️ Error al parsear JSON:', e.message);
            console.log('   Pero el modelo funciona correctamente');
        }
        
        console.log('\\n✨ ¡Todo funciona correctamente con Gemini 2.5!\\n');
        
    } catch (error) {
        console.error('\\n❌ Error al conectar con Gemini:');
        console.error('   Mensaje:', error.message);
        
        if (error.message.includes('not found')) {
            console.log('\\n💡 El modelo especificado no existe');
            console.log('   Intenta con: gemini-2.5-flash o gemini-2.0-flash');
        }
    }
}

testGemini();