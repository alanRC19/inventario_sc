const express = require('express')
const router = express.Router()
const { getDB } = require('../db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// POST - Login de usuario
router.post('/', async (req, res) => {
  try {
    const { usuario, password } = req.body

    // Validar que se proporcionen los campos requeridos
    if (!usuario || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son requeridos'
      })
    }

    const db = getDB()
    const usuariosCollection = db.collection('usuarios')

    // Buscar usuario por nombre de usuario
    const usuarioDB = await usuariosCollection.findOne({ usuario: usuario })

    if (!usuarioDB) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      })
    }

    // Verificar contraseña
    const passwordValida = await bcrypt.compare(password, usuarioDB.password)

    if (!passwordValida) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      })
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        userId: usuarioDB._id,
        usuario: usuarioDB.usuario,
        nombre: usuarioDB.nombre,
        rol: usuarioDB.rol
      },
      process.env.JWT_SECRET || 'tu_secret_key_aqui',
      { expiresIn: '24h' }
    )

    // Enviar respuesta exitosa
    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      usuario: {
        id: usuarioDB._id,
        usuario: usuarioDB.usuario,
        nombre: usuarioDB.nombre,
        rol: usuarioDB.rol
      }
    })

  } catch (error) {
    console.error('Error en login:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// POST - Registro de usuario
router.post('/registro', async (req, res) => {
  try {
    const { usuario, password } = req.body;

    // Validar campos requeridos
    if (!usuario || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son requeridos'
      });
    }

    const db = getDB();
    const usuariosCollection = db.collection('usuarios');

    // Verificar si el usuario ya existe
    const usuarioExistente = await usuariosCollection.findOne({ usuario });
    if (usuarioExistente) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya está registrado'
      });
    }

    // Encriptar contraseña
    const saltRounds = 10;
    const passwordEncriptada = await bcrypt.hash(password, saltRounds);

    // Crear nuevo usuario
    const nuevoUsuario = {
      usuario,
      password: passwordEncriptada,
      fechaCreacion: new Date(),
      rol: 'usuario'
    };

    const result = await usuariosCollection.insertOne(nuevoUsuario);

    // Generar token JWT
    const token = jwt.sign(
      {
        userId: result.insertedId,
        usuario: nuevoUsuario.usuario,
        rol: nuevoUsuario.rol
      },
      process.env.JWT_SECRET || 'tu_secret_key_aqui',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      token,
      usuario: {
        id: result.insertedId,
        usuario: nuevoUsuario.usuario,
        rol: nuevoUsuario.rol
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET - Verificar token (middleware para proteger rutas)
router.get('/verificar', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      })
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_secret_key_aqui')

    res.json({
      success: true,
      message: 'Token válido',
      usuario: {
        userId: decoded.userId,
        email: decoded.email,
        nombre: decoded.nombre,
        rol: decoded.rol
      }
    })

  } catch (error) {
    console.error('Error verificando token:', error)
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    })
  }
})

module.exports = router

