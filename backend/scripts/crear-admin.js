const { connectDB, getDB } = require('../db')
const bcrypt = require('bcryptjs')

async function crearAdmin() {
  try {
    await connectDB()
    const db = getDB()
    const usuariosCollection = db.collection('usuarios')

    // Verificar si ya existe un admin
    const adminExistente = await usuariosCollection.findOne({ rol: 'admin' })
    
    if (adminExistente) {
      console.log('Ya existe un usuario administrador')
      return
    }

    // Crear usuario administrador
    const saltRounds = 10
    const passwordEncriptada = await bcrypt.hash('admin123', saltRounds)

    const admin = {
      nombre: 'Administrador',
      email: 'admin@inventario.com',
      password: passwordEncriptada,
      rol: 'admin',
      fechaCreacion: new Date()
    }

    const result = await usuariosCollection.insertOne(admin)

    console.log('Usuario administrador creado exitosamente:')
    console.log('Email: admin@inventario.com')
    console.log('Password: admin123')
    console.log('ID:', result.insertedId)

  } catch (error) {
    console.error('Error creando administrador:', error)
  } finally {
    process.exit(0)
  }
}

crearAdmin() 