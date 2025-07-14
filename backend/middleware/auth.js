const jwt = require('jsonwebtoken')
const { getDB } = require('../db')

// Middleware para verificar token JWT
const verificarToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación requerido'
      })
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_secret_key_aqui')
    
    // Verificar que el usuario aún existe en la base de datos
    const db = getDB()
    const usuario = await db.collection('usuarios').findOne({ _id: decoded.userId })

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      })
    }

    // Agregar información del usuario al request
    req.usuario = {
      userId: decoded.userId,
      email: decoded.email,
      nombre: decoded.nombre,
      rol: decoded.rol
    }

    next()
  } catch (error) {
    console.error('Error verificando token:', error)
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    })
  }
}

// Middleware para verificar roles específicos
const verificarRol = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      })
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso'
      })
    }

    next()
  }
}

module.exports = {
  verificarToken,
  verificarRol
} 