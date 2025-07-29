const { MongoClient } = require("mongodb")
require("dotenv").config()

let db = null
let client = null

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/inventario"

async function connectToDatabase() {
  try {
    if (db) {
      console.log("✅ Usando conexión existente a MongoDB")
      return db
    }

    console.log("🔄 Conectando a MongoDB Atlas...")
    client = new MongoClient(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: "majority"
    })
    await client.connect()

    const dbName = "inventario"
    db = client.db(dbName)

    console.log(`✅ Conectado a MongoDB - Base de datos: ${dbName}`)
    return db
  } catch (error) {
    console.error("❌ Error conectando a MongoDB:", error)
    throw error
  }
}

// Función con 'B' mayúscula para compatibilidad con archivos existentes
function getDB() {
  if (!db) {
    throw new Error("Base de datos no inicializada. Llama a connectToDatabase() primero.")
  }
  return db
}

// Función con 'b' minúscula (alias)
function getDb() {
  return getDB()
}

async function closeConnection() {
  if (client) {
    await client.close()
    db = null
    client = null
    console.log("🔒 Conexión a MongoDB cerrada")
  }
}

// Manejar cierre del proceso
process.on("SIGINT", async () => {
  await closeConnection()
  process.exit(0)
})

process.on("SIGTERM", async () => {
  await closeConnection()
  process.exit(0)
})

module.exports = {
  connectToDatabase,
  getDB, // Con 'B' mayúscula para compatibilidad
  getDb, // Con 'b' minúscula (alias)
  closeConnection,
}
