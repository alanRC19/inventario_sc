const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecreto';

// Middleware para verificar JWT y extraer usuario
function requireAuth(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No autenticado' });
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.rol === 'admin') return next();
  return res.status(403).json({ error: 'Solo administradores' });
}

// Registrar usuario (solo admin, excepto si es el primero)
router.post('/register', async (req, res, next) => {
  const db = getDB();
  const usuarios = db.collection('usuarios');
  const total = await usuarios.countDocuments();

  if (total > 0) {
    // Si ya hay usuarios, requiere autenticación y admin
    return requireAuth(req, res, () => requireAdmin(req, res, next));
  }
  // Si no hay usuarios, permite registrar el primer admin sin autenticación
  next();
}, async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  if (!nombre || !email || !password || !rol) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }
  const db = getDB();
  const usuarios = db.collection('usuarios');
  const existe = await usuarios.findOne({ email });
  if (existe) return res.status(409).json({ error: 'Email ya registrado' });
  const passwordHash = await bcrypt.hash(password, 10);
  const usuario = {
    nombre,
    email,
    passwordHash,
    rol,
    fechaCreacion: new Date()
  };
  await usuarios.insertOne(usuario);
  res.status(201).json({ message: 'Usuario registrado' });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Faltan campos' });
  const db = getDB();
  const usuarios = db.collection('usuarios');
  const usuario = await usuarios.findOne({ email });
  if (!usuario) return res.status(401).json({ error: 'Credenciales inválidas' });
  const ok = await bcrypt.compare(password, usuario.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });
  // Generar JWT
  const token = jwt.sign({ _id: usuario._id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, usuario: { nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } });
});

// Listar usuarios (solo admin)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  const db = getDB();
  const usuarios = await db.collection('usuarios').find({}, { projection: { passwordHash: 0 } }).toArray();
  res.json({ data: usuarios });
});

// Obtener perfil propio
router.get('/me', requireAuth, async (req, res) => {
  const db = getDB();
  const usuario = await db.collection('usuarios').findOne({ email: req.user.email }, { projection: { passwordHash: 0 } });
  if (!usuario) return res.status(404).json({ error: 'No encontrado' });
  res.json(usuario);
});

// Editar usuario (solo admin, no puede editarse a sí mismo)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const db = getDB();
  const usuarios = db.collection('usuarios');
  const { id } = req.params;
  const { nombre, email, rol } = req.body;
  if (!nombre || !email || !rol) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }
  // No permitir editarse a sí mismo
  if (req.user && req.user._id && req.user._id === id) {
    return res.status(400).json({ error: 'No puedes editar tu propio usuario desde aquí.' });
  }
  const result = await usuarios.updateOne(
    { _id: new ObjectId(id) },
    { $set: { nombre, email, rol } }
  );
  if (result.matchedCount === 0) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  res.json({ modifiedCount: result.modifiedCount });
});

// Eliminar usuario (solo admin, no puede eliminarse a sí mismo)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const db = getDB();
  const usuarios = db.collection('usuarios');
  const { id } = req.params;
  // No permitir eliminarse a sí mismo
  if (req.user && req.user._id && req.user._id === id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propio usuario.' });
  }
  const result = await usuarios.deleteOne({ _id: new ObjectId(id) });
  if (result.deletedCount === 0) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  res.json({ deletedCount: result.deletedCount });
});

// Exportar middlewares como propiedades del router
router.requireAuth = requireAuth;
router.requireAdmin = requireAdmin;
module.exports = router; 