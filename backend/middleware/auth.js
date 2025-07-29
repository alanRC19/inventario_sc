const jwt = require('jsonwebtoken');
const { connectToDatabase } = require('../db');
const { ObjectId } = require('mongodb');

// Middleware para verificar JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('Auth header:', authHeader); // Debug
    console.log('Token:', token ? 'Present' : 'Missing'); // Debug

    if (!token) {
      return res.status(401).json({ message: 'Token de acceso requerido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    // console.log('Decoded token:', decoded); // Debug comentado para reducir logs
    
    // Opcional: Verificar que el usuario aún existe en la base de datos
    const db = await connectToDatabase();
    const usersCollection = db.collection('usuarios');
    const user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) });

    // console.log('User found:', user ? 'Yes' : 'No'); // Debug comentado
    // console.log('User active:', user?.activo); // Debug comentado
    // console.log('User object keys:', user ? Object.keys(user) : 'No user'); // Debug comentado

    if (!user) {
      return res.status(401).json({ message: 'Usuario no válido o inactivo' });
    }

    // Si el campo activo existe y es false, rechazar
    if (user.activo === false) {
      return res.status(401).json({ message: 'Usuario no válido o inactivo' });
    }

    // Agregar información del usuario al request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      rol: decoded.role  // Guardamos como 'rol' para consistencia
    };

    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    return res.status(403).json({ message: 'Token inválido' });
  }
};

// Middleware para verificar roles específicos
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    if (roles.includes(req.user.rol)) {
      next();
    } else {
      res.status(403).json({ message: 'No tienes permisos suficientes' });
    }
  };
};

// Middleware específico para administradores
const requireAdmin = requireRole(['admin']);

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin
};