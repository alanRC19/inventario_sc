const fetch = require('node-fetch');

async function testWhatsAppTicket() {
  const testData = {
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

  try {
    console.log('🧪 Enviando ticket de prueba...');
    console.log('📊 Datos:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3001/api/whatsapp/send-ticket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('📱 Status:', response.status);
    console.log('📋 Respuesta:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testWhatsAppTicket();
