export interface ProductoVenta {
  articuloId: string
  nombre: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface Venta {
  _id: string
  cliente: string
  telefono?: string
  productos: ProductoVenta[]
  total: number
  metodoPago: "efectivo" | "tarjeta" | "transferencia"
  fecha: string
}

export interface NuevaVenta {
  cliente: string
  telefono?: string
  productos: ProductoVenta[]
  total: number
  metodoPago: "efectivo" | "tarjeta" | "transferencia"
  enviarWhatsApp?: boolean
}

export interface VentasPaginadas {
  data: Venta[]
  totalPages: number
  total: number
  currentPage: number
}
