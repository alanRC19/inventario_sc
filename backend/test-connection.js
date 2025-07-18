// Archivo para probar la conexión a la base de datos
const { connectToDatabase, getDb, closeConnection } = require("./db")

async function testConnection() {
  try {
    console.log("🧪 Probando conexión a la base de datos...")

    await connectToDatabase()
    const db = getDb()

    // Probar una operación simple
    const collections = await db.listCollections().toArray()
    console.log(
      "📊 Colecciones encontradas:",
      collections.map((c) => c.name),
    )

    // Probar inserción y eliminación
    const testCollection = db.collection("test")
    const result = await testCollection.insertOne({ test: true, timestamp: new Date() })
    console.log("✅ Inserción de prueba exitosa:", result.insertedId)

    await testCollection.deleteOne({ _id: result.insertedId })
    console.log("🗑️ Eliminación de prueba exitosa")

    console.log("✅ Todas las pruebas pasaron correctamente")
  } catch (error) {
    console.error("❌ Error en las pruebas:", error)
  } finally {
    await closeConnection()
  }
}

testConnection()
