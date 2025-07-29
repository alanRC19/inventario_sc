const express = require('express');
const router = express.Router();
const { connectToDatabase } = require('../db');
const bcrypt = require('bcrypt');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { ObjectId } = require('mongodb');

// Obtener todos los usuarios (solo admin)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const usuarios = await db.collection('usuarios').find({}, { 
      projection: { passwordHash: 0 } 
    }).toArray();
    res.json(usuarios);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Crear nuevo usuario (solo admin)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { nombre, email, password, role = 'user' } = req.body;

    // console.log('Creating user with data:', { nombre, email, role }); // Debug comentado

    if (!nombre || !email || !password) {
      return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos' });
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
      nombre,
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      rol: role,
      fechaCreacion: new Date(),
      activo: true
    };

    const result = await usersCollection.insertOne(newUser);

    // console.log('User created successfully:', result.insertedId); // Debug comentado

    // Responder sin la contraseña
    const userResponse = {
      _id: result.insertedId,
      nombre,
      email: email.toLowerCase(),
      rol: role,
      fechaCreacion: newUser.fechaCreacion,
      activo: true
    };

    // console.log('Sending response:', userResponse); // Debug comentado
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    console.error('Error stack:', error.stack); // More detailed error
    res.status(500).json({ message: 'Error interno del servidor: ' + error.message });
  }
});

// Actualizar usuario (solo admin)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, role } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }

    const db = await connectToDatabase();
    const usersCollection = db.collection('usuarios');

    // Verificar que el usuario existe
    const existingUser = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!existingUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar si el nuevo email ya existe (si cambió)
    if (email && email.toLowerCase() !== existingUser.email) {
      const emailExists = await usersCollection.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(409).json({ message: 'El email ya está en uso' });
      }
    }

    // Preparar los datos a actualizar
    const updateData = {};
    if (nombre) updateData.nombre = nombre;
    if (email) updateData.email = email.toLowerCase();
    if (role) updateData.rol = role;
    updateData.fechaModificacion = new Date();

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Obtener el usuario actualizado sin contraseña
    const updatedUser = await usersCollection.findOne(
      { _id: new ObjectId(id) },
      { projection: { passwordHash: 0 } }
    );

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Eliminar usuario (solo admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }

    // No permitir que el admin se elimine a sí mismo
    if (req.user.userId.toString() === id) {
      return res.status(400).json({ message: 'No puedes eliminarte a ti mismo' });
    }

    const db = await connectToDatabase();
    const usersCollection = db.collection('usuarios');

    const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});
module.exports = router; 