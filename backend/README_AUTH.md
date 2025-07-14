# Sistema de Autenticación

Este sistema de autenticación utiliza JWT (JSON Web Tokens) y bcryptjs para la seguridad de las contraseñas.

## Endpoints Disponibles

### 1. Login
**POST** `/api/auth/`
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "email": "usuario@ejemplo.com",
    "nombre": "Usuario Ejemplo",
    "rol": "usuario"
  }
}
```

### 2. Registro
**POST** `/api/auth/registro`
```json
{
  "nombre": "Usuario Ejemplo",
  "email": "usuario@ejemplo.com",
  "password": "contraseña123",
  "rol": "usuario" // opcional, por defecto es "usuario"
}
```

### 3. Verificar Token
**GET** `/api/auth/verificar`
**Headers:** `Authorization: Bearer <token>`

### 4. Perfil de Usuario
**GET** `/api/usuarios/perfil`
**Headers:** `Authorization: Bearer <token>`

### 5. Actualizar Perfil
**PUT** `/api/usuarios/perfil`
**Headers:** `Authorization: Bearer <token>`
```json
{
  "nombre": "Nuevo Nombre",
  "email": "nuevo@email.com"
}
```

### 6. Listar Usuarios (Solo Admin)
**GET** `/api/usuarios/`
**Headers:** `Authorization: Bearer <token>`

## Middleware de Autenticación

### Proteger Rutas
```javascript
const { verificarToken, verificarRol } = require('../middleware/auth')

// Ruta protegida para cualquier usuario autenticado
router.get('/ruta-protegida', verificarToken, (req, res) => {
  // req.usuario contiene la información del usuario
  res.json({ mensaje: 'Ruta protegida' })
})

// Ruta protegida solo para administradores
router.get('/ruta-admin', verificarToken, verificarRol(['admin']), (req, res) => {
  res.json({ mensaje: 'Solo para administradores' })
})

// Ruta protegida para múltiples roles
router.get('/ruta-multi', verificarToken, verificarRol(['admin', 'moderador']), (req, res) => {
  res.json({ mensaje: 'Para admin o moderador' })
})
```

## Variables de Entorno

Agrega estas variables a tu archivo `.env`:

```env
MONGODB_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/inventario
JWT_SECRET=tu_secret_key_muy_segura_aqui
PORT=3001
```

## Estructura de Usuario en Base de Datos

```javascript
{
  _id: ObjectId,
  nombre: String,
  email: String, // único, en minúsculas
  password: String, // encriptada con bcrypt
  rol: String, // "usuario", "admin", "moderador"
  fechaCreacion: Date
}
```

## Roles Disponibles

- `usuario`: Usuario básico
- `admin`: Administrador con acceso completo
- `moderador`: Moderador con permisos limitados

## Seguridad

1. **Contraseñas**: Se encriptan con bcryptjs (salt rounds: 10)
2. **Tokens**: JWT con expiración de 24 horas
3. **Validación**: Verificación de email único
4. **Headers**: Token se envía en header `Authorization: Bearer <token>`

## Ejemplo de Uso en Frontend

```javascript
// Login
const login = async (email, password) => {
  const response = await fetch('/api/auth/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  })
  
  const data = await response.json()
  if (data.success) {
    localStorage.setItem('token', data.token)
    localStorage.setItem('usuario', JSON.stringify(data.usuario))
  }
  
  return data
}

// Ruta protegida
const obtenerDatosProtegidos = async () => {
  const token = localStorage.getItem('token')
  
  const response = await fetch('/api/usuarios/perfil', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  return await response.json()
}
``` 