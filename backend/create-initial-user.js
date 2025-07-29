const bcrypt = require('bcrypt');
const { connectToDatabase } = require('./db');

async function createInitialUser() {
  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('usuarios');

    // Verificar si ya existe un usuario admin
    const existingAdmin = await usersCollection.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('Ya existe un usuario administrador:', existingAdmin.email);
      return;
    }

    // Crear usuario administrador por defecto
    const adminEmail = 'admin@inventario.com';
    const adminPassword = 'admin123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    const adminUser = {
      email: adminEmail,
      password: hashedPassword,
      nombre: 'Administrador',
      role: 'admin',
      fechaCreacion: new Date(),
      activo: true
    };

    const result = await usersCollection.insertOne(adminUser);
    
    console.log('Usuario administrador creado exitosamente:');
    console.log('Email:', adminEmail);
    console.log('Contraseña:', adminPassword);
    console.log('ID:', result.insertedId);

    // También crear un usuario normal de ejemplo
    const userPassword = 'user123';
    const hashedUserPassword = await bcrypt.hash(userPassword, saltRounds);

    const normalUser = {
      email: 'user@inventario.com',
      password: hashedUserPassword,
      nombre: 'Usuario Normal',
      role: 'user',
      fechaCreacion: new Date(),
      activo: true
    };

    const userResult = await usersCollection.insertOne(normalUser);
    
    console.log('\nUsuario normal creado exitosamente:');
    console.log('Email: user@inventario.com');
    console.log('Contraseña: user123');
    console.log('ID:', userResult.insertedId);

  } catch (error) {
    console.error('Error creando usuarios iniciales:', error);
  } finally {
    process.exit(0);
  }
}

createInitialUser();
