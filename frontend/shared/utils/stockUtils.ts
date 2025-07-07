// Utilidades para manejo de estados de stock

export type StockStatus = 'disponible' | 'stock bajo' | 'fuera de stock';

export function calculateStockStatus(stock: number): StockStatus {
  if (stock === 0) {
    return 'fuera de stock';
  } else if (stock < 5) {
    return 'stock bajo';
  } else {
    return 'disponible';
  }
}

export function getStockStatusColor(status: StockStatus): string {
  switch (status) {
    case 'disponible':
      return 'bg-green-100 text-green-800';
    case 'stock bajo':
      return 'bg-yellow-100 text-yellow-800';
    case 'fuera de stock':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getStockStatusText(status: StockStatus): string {
  switch (status) {
    case 'disponible':
      return 'Disponible';
    case 'stock bajo':
      return 'Stock Bajo';
    case 'fuera de stock':
      return 'Fuera de Stock';
    default:
      return 'Desconocido';
  }
} 