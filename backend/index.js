const express = require('express')
const cors = require('cors')
const { connectDB } = require('./db')
const articulosRoutes = require('./routes/articulos')
const categoriasRoutes = require('./routes/categorias')
const proveedoresRoutes = require('./routes/proveedores')
const ventasRoutes = require('./routes/ventas')
const entradasRoutes = require('./routes/entradas')
const reportesRoutes = require('./routes/reportes')
const usuariosRouter = require('./routes/usuarios');
const whatsappRoutes = require('./routes/whatsapp');
const whatsappService = require('./whatsappService'); // Importar el servicio
require('dotenv').config()

const app = express()
app.use(cors())
// Middleware condicional para parsear JSON solo en POST, PUT, PATCH
app.use((req, res, next) => {
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    express.json()(req, res, next)
  } else {
    next()
  }
})

// Rutas
app.use('/api/articulos', articulosRoutes)
app.use('/api/categorias', categoriasRoutes)
app.use('/api/proveedores', proveedoresRoutes)
app.use('/api/ventas', ventasRoutes)
app.use('/api/entradas', entradasRoutes)
app.use('/api/reportes', reportesRoutes)
app.use('/api/usuarios', usuariosRouter);
app.use('/api/whatsapp', whatsappRoutes);

// Debug: verificar que las rutas se cargan
console.log('Rutas cargadas:', {
  articulos: !!articulosRoutes,
  categorias: !!categoriasRoutes,
  proveedores: !!proveedoresRoutes,
  ventas: !!ventasRoutes,
  entradas: !!entradasRoutes
})

// Función para inicializar WhatsApp automáticamente
async function initializeWhatsAppService() {
  try {
    console.log('\n🚀 Inicializando servicio de WhatsApp...');
    await whatsappService.initialize();
    console.log('✅ Servicio de WhatsApp inicializado correctamente');
  } catch (error) {
    console.error('❌ Error inicializando WhatsApp:', error.message);
    console.log('📱 Puedes inicializar manualmente desde el frontend');
  }
}

connectDB().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${process.env.PORT}`)
    
    // Inicializar WhatsApp después de que el servidor esté corriendo
    setTimeout(() => {
      initializeWhatsAppService();
    }, 2000); // Esperar 2 segundos para que el servidor esté completamente listo
  })
})
