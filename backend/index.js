const express = require('express')
const cors = require('cors')
const { connectDB } = require('./db')
const articulosRoutes = require('./routes/articulos')
const categoriasRoutes = require('./routes/categorias')
const proveedoresRoutes = require('./routes/proveedores')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())

// Rutas
app.use('/api/articulos', articulosRoutes)
app.use('/api/categorias', categoriasRoutes)
app.use('/api/proveedores', proveedoresRoutes)

connectDB().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${process.env.PORT}`)
  })
})
