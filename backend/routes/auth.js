const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { connectToDatabase } = require('../db');

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    const db = await connectToDatabase();
    const usersCollection = db.collection('usuarios');

    // Buscar usuario por email
    const user = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Generar JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.rol || 'user' 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Responder con token y datos del usuario (sin contraseña)
    const userResponse = {
      id: user._id,
      email: user.email,
      nombre: user.nombre,
      role: user.rol || 'user'
    };

    res.json({
      message: 'Login exitoso',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Registro endpoint (opcional)
router.post('/register', async (req, res) => {
  try {
    const { email, password, nombre, role = 'user' } = req.body;

    if (!email || !password || !nombre) {
      return res.status(400).json({ message: 'Email, contraseña y nombre son requeridos' });
    }

    const db = await connectToDatabase();
    const usersCollection = db.collection('usuarios');

    // Verificar si el usuario ya existe
    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({ message: 'El usuario ya existe' });
    }

    // Hashear la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear nuevo usuario
    const newUser = {
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      nombre,
      rol: role,
      fechaCreacion: new Date(),
      activo: true
    };

    const result = await usersCollection.insertOne(newUser);

    // Generar JWT token
    const token = jwt.sign(
      { 
        userId: result.insertedId, 
        email: newUser.email, 
        role: newUser.rol 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Responder con token y datos del usuario
    const userResponse = {
      id: result.insertedId,
      email: newUser.email,
      nombre: newUser.nombre,
      role: newUser.rol
    };

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Verificar token endpoint
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const db = await connectToDatabase();
    const usersCollection = db.collection('usuarios');
    
    const user = await usersCollection.findOne({ _id: decoded.userId });

    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const userResponse = {
      id: user._id,
      email: user.email,
      nombre: user.nombre,
      role: user.rol || 'user'
    };

    res.json({
      valid: true,
      user: userResponse
    });

  } catch (error) {
    console.error('Error verificando token:', error);
    res.status(401).json({ message: 'Token inválido' });
  }
});

module.exports = router;
