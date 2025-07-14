const express = require('express')
const router = express.Router()
const { getDB } = require('../db')
const { verificarToken, verificarRol } = require('../middleware/auth')

// GET - Obtener perfil del usuario autenticado
router.get('/perfil', verificarToken, async (req, res) => {
  try {
    const db = getDB()
    const usuario = await db.collection('usuarios').findOne(
      { _id: req.usuario.userId },
      { projection: { password: 0 } } // Excluir contraseña
    )

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      })
    }

    res.json({
      success: true,
      usuario
    })

  } catch (error) {
    console.error('Error obteniendo perfil:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// PUT - Actualizar perfil del usuario
router.put('/perfil', verificarToken, async (req, res) => {
  try {
    const { nombre, email } = req.body
    const db = getDB()

    // Verificar si el email ya existe (si se está cambiando)
    if (email && email !== req.usuario.email) {
      const usuarioExistente = await db.collection('usuarios').findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: req.usuario.userId }
      })

      if (usuarioExistente) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está en uso'
        })
      }
    }

    const datosActualizados = {}
    if (nombre) datosActualizados.nombre = nombre
    if (email) datosActualizados.email = email.toLowerCase()

    const result = await db.collection('usuarios').updateOne(
      { _id: req.usuario.userId },
      { $set: datosActualizados }
    )

    if (result.modifiedCount > 0) {
      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente'
      })
    } else {
      res.json({
        success: true,
        message: 'No se realizaron cambios'
      })
    }

  } catch (error) {
    console.error('Error actualizando perfil:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// GET - Listar todos los usuarios (solo administradores)
router.get('/', verificarToken, verificarRol(['admin']), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const search = req.query.search || ""

    const db = getDB()
    const collection = db.collection('usuarios')

    // Construir filtro de búsqueda
    let filter = {}
    if (search) {
      filter = {
        $or: [
          { nombre: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }
    }

    const total = await collection.countDocuments(filter)
    const usuarios = await collection.find(filter, { projection: { password: 0 } })
      .skip(skip)
      .limit(limit)
      .toArray()

    res.json({
      success: true,
      data: usuarios,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })

  } catch (error) {
    console.error('Error listando usuarios:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

module.exports = router

