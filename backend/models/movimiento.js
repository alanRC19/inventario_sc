// backend/models/Movimiento.js
const mongoose = require('mongoose')

const movimientoSchema = new mongoose.Schema({
  tipo: { 
    type: String, 
    enum: ['entrada', 'venta', 'ajuste', 'devolucion'],
    required: true 
  },
  articuloId: { 
    type: String,
    required: true 
  },
  articuloNombre: { 
    type: String, 
    required: true 
  },
  cantidad: { 
    type: Number, 
    required: true 
  },
  cantidadAnterior: { 
    type: Number, 
    required: true 
  },
  cantidadNueva: { 
    type: Number, 
    required: true 
  },
  usuario: { 
    type: String, 
    required: true 
  },
  fecha: { 
    type: Date, 
    default: Date.now 
  },
  descripcion: String,
  referencia: String // ID de la venta, entrada, etc.
})

// Índices para optimizar consultas
movimientoSchema.index({ fecha: -1 })
movimientoSchema.index({ articuloId: 1 })
movimientoSchema.index({ tipo: 1 })

module.exports = mongoose.model('Movimiento', movimientoSchema)
