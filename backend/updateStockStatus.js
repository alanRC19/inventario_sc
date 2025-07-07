const { MongoClient } = require('mongodb')
require('dotenv').config()

// Función para calcular el estado del stock
function calculateStockStatus(stock) {
  if (stock === 0) {
    return 'fuera de stock'
  } else if (stock < 5) {
    return 'stock bajo'
  } else {
    return 'disponible'
  }
}

async function updateStockStatus() {
  const client = new MongoClient(process.env.MONGODB_URI)
  
  try {
    await client.connect()
    console.log('Conectado a MongoDB Atlas')
    
    const db = client.db('inventario')
    const collection = db.collection('articulos')
    
    // Obtener todos los artículos
    const articulos = await collection.find({}).toArray()
    
    console.log(`Encontrados ${articulos.length} artículos`)
    
    // Actualizar el estado de cada artículo
    for (const articulo of articulos) {
      const nuevoEstado = calculateStockStatus(articulo.stock || 0)
      
      await collection.updateOne(
        { _id: articulo._id },
        { $set: { estado: nuevoEstado } }
      )
      
      console.log(`Artículo "${articulo.nombre}" - Stock: ${articulo.stock} - Estado: ${nuevoEstado}`)
    }
    
    console.log('✅ Estado de stock actualizado para todos los artículos')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

// Ejecutar el script
updateStockStatus() 