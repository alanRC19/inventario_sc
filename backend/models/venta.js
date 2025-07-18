// backend/models/Venta.js
const mongoose = require('mongoose')

const ventaSchema = new mongoose.Schema({
  cliente: { type: String, required: true },
  telefono: String,
  productos: [{
    articuloId: { type: mongoose.Schema.Types.ObjectId, ref: 'Articulo' },
    nombre: String,
    cantidad: Number,
    precioUnitario: Number,
    subtotal: Number
  }],
  total: { type: Number, required: true },
  metodoPago: { 
    type: String, 
    enum: ['efectivo', 'tarjeta', 'transferencia'],
    default: 'efectivo'
  },
  fecha: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Venta', ventaSchema)