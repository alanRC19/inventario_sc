const express = require('express')
const cors = require('cors')
const { connectDB } = require('./db')
const articulosRoutes = require('./routes/articulos')
const categoriasRoutes = require('./routes/categorias')
const proveedoresRoutes = require('./routes/proveedores')
const ventasRoutes = require('./routes/ventas')
const reportesRoutes = require('./routes/reportes')
const usuariosRouter = require('./routes/usuarios');
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
app.use('/api/reportes', reportesRoutes)
app.use('/api/usuarios', usuariosRouter);

// Debug: verificar que las rutas se cargan
console.log('Rutas cargadas:', {
  articulos: !!articulosRoutes,
  categorias: !!categoriasRoutes,
  proveedores: !!proveedoresRoutes,
  ventas: !!ventasRoutes
})

connectDB().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${process.env.PORT}`)
  })
})
