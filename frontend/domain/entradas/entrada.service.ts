// Servicio base para obtener entradas de inventario
// Puedes reemplazar la lógica por una llamada real a tu backend/API

import { Entrada } from './entrada.types';

export async function getEntradas(): Promise<Entrada[]> {
  // Ejemplo de datos mock
  return [
    {
      id: '1',
      fecha: new Date().toISOString(),
      articulo: 'Vela blanca',
      cantidad: 10,
      usuario: 'admin',
      observaciones: 'Entrada inicial',
    },
    // Puedes agregar más objetos de ejemplo aquí
  ];
}
