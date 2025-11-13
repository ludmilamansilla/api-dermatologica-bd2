# Backend - Sistema de Diagnóstico Dermatológico

API REST completa para el sistema de diagnóstico dermatológico con Node.js, Express y MongoDB Atlas.

## 🚀 Inicio Rápido

### 1. Configurar MongoDB Atlas

1. Crea cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea un cluster (gratis)
3. Configura usuario y contraseña en "Database Access"
4. Añade tu IP en "Network Access" (o 0.0.0.0/0 para desarrollo)
5. Obtén el connection string en "Connect" → "Connect your application"

### 2. Instalar dependencias

```powershell
cd server
npm install
```

### 3. Configurar variables de entorno

Edita el archivo `.env` y reemplaza con tus valores:

```env
MONGODB_URI=mongodb+srv://usuario:password@cluster.xxxxx.mongodb.net/dermatologia?retryWrites=true&w=majority
PORT=3000
JWT_SECRET=tu-secreto-super-seguro-aqui
NODE_ENV=development
```

### 4. Iniciar servidor

```powershell
npm start
```

El servidor iniciará en `http://localhost:3000`.

## 👤 Usuarios de Prueba

El sistema crea automáticamente estos usuarios:

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | admin |
| estudiante | estudiante123 | alumno |

## 📡 API Endpoints

### Autenticación

#### POST /api/auth/login
Login de usuario.

**Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "username": "admin",
    "role": "admin",
    "token": "eyJhbGciOiJ..."
  }
}
```

#### GET /api/auth/perfil
Obtener perfil del usuario autenticado.

**Headers:** `Authorization: Bearer {token}`

#### POST /api/auth/logout
Cerrar sesión (el cliente elimina el token).

---

### Afecciones

#### GET /api/afecciones
Listar afecciones con filtros y paginación.

**Query params:**
- `search`: Buscar por nombre o descripción
- `zona`: Filtrar por zona (rostro, cuello, tronco, etc.)
- `severidad`: Filtrar por severidad (leve, moderada, grave)
- `page`: Número de página (default: 1)
- `limit`: Items por página (default: 12)

**Headers:** `Authorization: Bearer {token}`

**Respuesta:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 10,
    "pages": 1
  }
}
```

#### GET /api/afecciones/:id
Obtener una afección por ID.

#### POST /api/afecciones
Crear una afección.

**Headers:** 
- `Authorization: Bearer {token}`
- `Content-Type: multipart/form-data`

**Form data:**
- `nombre`: string (requerido)
- `descripcion`: string (requerido)
- `severidad`: leve|moderada|grave (requerido)
- `zona`: string
- `sintomas`: JSON array de IDs
- `tratamiento`: string
- `imagen`: file (jpg, png, gif, webp, max 5MB)

#### PUT /api/afecciones/:id
Actualizar una afección (mismos campos que POST).

#### DELETE /api/afecciones/:id
Eliminar una afección (soft delete).

---

### Síntomas

#### GET /api/sintomas
Listar síntomas.

**Query params:**
- `search`: Buscar por nombre o descripción
- `zona`: Filtrar por zona

#### GET /api/sintomas/:id
Obtener un síntoma por ID.

#### POST /api/sintomas
Crear un síntoma.

**Body:**
```json
{
  "nombre": "Enrojecimiento",
  "descripcion": "Piel roja e inflamada",
  "zona": "todas"
}
```

#### PUT /api/sintomas/:id
Actualizar un síntoma.

#### DELETE /api/sintomas/:id
Eliminar un síntoma (soft delete).

---

### Consultas/Diagnósticos

#### POST /api/consultas
Crear una consulta y obtener diagnóstico.

**Headers:** 
- `Authorization: Bearer {token}`
- `Content-Type: multipart/form-data`

**Form data:**
- `nombrePaciente`: string (requerido)
- `zonaAfectada`: rostro|cuello|torax|abdomen|brazos|piernas|manos|pies (requerido)
- `sintomasReportados`: JSON array de IDs de síntomas (requerido)
- `notas`: string
- `imagenZona`: file (opcional)

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "nombrePaciente": "Juan Pérez",
    "zonaAfectada": "rostro",
    "sintomasReportados": [...],
    "resultados": [
      {
        "afeccion": {...},
        "porcentajeCoincidencia": 85,
        "sintomasCoincidentes": [...]
      }
    ],
    "diagnosticoPrincipal": {...}
  }
}
```

#### GET /api/consultas
Listar consultas del usuario.

**Query params:**
- `page`: Número de página
- `limit`: Items por página (default: 10)
- `search`: Buscar por nombre de paciente

#### GET /api/consultas/:id
Obtener una consulta por ID.

#### GET /api/consultas/recientes
Obtener las últimas 5 consultas del usuario.

---

### Estadísticas

#### GET /api/estadisticas
Obtener estadísticas para el dashboard.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "totalAfecciones": 10,
    "totalSintomas": 15,
    "totalConsultas": 5,
    "consultasRecientes": [...]
  }
}
```

#### GET /api/estadisticas/severidad
Obtener distribución de afecciones por severidad.

---

## 🗂️ Modelos de Datos

### Usuario
```javascript
{
  username: String (único, requerido),
  password: String (hasheado, requerido),
  role: String (alumno|admin),
  activo: Boolean
}
```

### Síntoma
```javascript
{
  nombre: String (único, requerido),
  descripcion: String,
  zona: String,
  activo: Boolean
}
```

### Afección
```javascript
{
  nombre: String (único, requerido),
  descripcion: String (requerido),
  severidad: String (leve|moderada|grave),
  zona: String,
  imagen: String (URL),
  sintomas: [ObjectId] (ref: Sintoma),
  tratamiento: String,
  activo: Boolean
}
```

### Consulta
```javascript
{
  nombrePaciente: String (requerido),
  zonaAfectada: String (requerido),
  imagenZona: String (URL),
  sintomasReportados: [ObjectId] (ref: Sintoma),
  resultados: [{
    afeccion: ObjectId (ref: Afeccion),
    porcentajeCoincidencia: Number,
    sintomasCoincidentes: [ObjectId]
  }],
  diagnosticoPrincipal: ObjectId (ref: Afeccion),
  usuario: ObjectId (ref: Usuario),
  notas: String,
  estado: String (pendiente|completado|revisado)
}
```

## 🔐 Autenticación

Todas las rutas (excepto `/api/auth/login`) requieren autenticación JWT.

**Header requerido:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

El token se obtiene al hacer login y tiene validez de 30 días.

## 🛠️ Tecnologías

- **Node.js** - Runtime
- **Express 4.19** - Framework web
- **MongoDB Atlas** - Base de datos en la nube
- **Mongoose 8.19** - ODM para MongoDB
- **JWT** - Autenticación
- **Bcryptjs** - Hash de contraseñas
- **Multer** - Upload de archivos
- **Cors** - CORS habilitado
- **Dotenv** - Variables de entorno

## 📝 Datos Iniciales

El servidor crea automáticamente:
- 2 usuarios (admin y estudiante)
- 15 síntomas comunes
- 10 afecciones dermatológicas

Puedes modificar estos datos en `seed.js`.

## 🧪 Algoritmo de Diagnóstico

El sistema calcula coincidencias entre síntomas reportados y síntomas de afecciones:

```
Porcentaje = (Síntomas coincidentes / Total síntomas de la afección) × 100
```

Devuelve las top 5 afecciones ordenadas por porcentaje descendente.

## 📂 Estructura de Archivos

```
server/
├── controllers/          # Lógica de negocio
│   ├── authController.js
│   ├── afeccionesController.js
│   ├── sintomasController.js
│   ├── consultasController.js
│   └── estadisticasController.js
├── middleware/          # Middlewares
│   ├── auth.js         # Verificación JWT
│   └── upload.js       # Configuración Multer
├── models/             # Modelos Mongoose
│   ├── Usuario.js
│   ├── Sintoma.js
│   ├── Afeccion.js
│   └── Consulta.js
├── routes/             # Rutas Express
│   ├── auth.routes.js
│   ├── afecciones.routes.js
│   ├── sintomas.routes.js
│   ├── consultas.routes.js
│   └── estadisticas.routes.js
├── uploads/            # Imágenes subidas
├── server.js           # Servidor principal
├── seed.js             # Datos iniciales
├── package.json
├── .env                # Variables de entorno
└── .env.example        # Plantilla de .env
```

## 🐛 Troubleshooting

### Error: Cannot connect to MongoDB
- Verifica el `MONGODB_URI` en `.env`
- Confirma que tu IP está en la whitelist de Atlas
- Verifica credenciales de usuario de MongoDB

### Error: Port 3000 already in use
- Cambia `PORT` en `.env`
- O mata el proceso: `netstat -ano | findstr :3000` → `taskkill /PID {PID} /F`

### Error: Images not uploading
- Verifica que existe la carpeta `uploads/`
- Verifica permisos de escritura

### Error: Invalid token
- El token expiró (30 días)
- Haz login nuevamente para obtener uno nuevo

## 📄 Licencia

Proyecto académico - Base de Datos 2
