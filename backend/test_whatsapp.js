const fs = require('fs');

// Datos de prueba para el ticket
const testTicketData = {
  phoneNumber: "5218115551234",
  ticketData: {
    cliente: "Cliente Prueba",
    productos: [
      { nombre: "Producto Test", cantidad: 1, precio: 100 }
    ],
    total: 100,
    metodoPago: "Efectivo",
    fecha: new Date().toISOString()
  }
};

// Crear archivo JSON
fs.writeFileSync('./test_ticket.json', JSON.stringify(testTicketData, null, 2));

console.log('Archivo test_ticket.json creado');
console.log('Para probar, ejecuta:');
console.log('curl -X POST http://localhost:3001/api/whatsapp/send-ticket -H "Content-Type: application/json" -d @test_ticket.json');
