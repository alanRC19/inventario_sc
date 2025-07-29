"use client"
import { useState, useEffect } from "react"
import { Modal } from "./Modal"
import { Articulo } from "@/domain/inventario/inventario.types"

interface EntradaModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (entrada: EntradaData) => void
  articulos: Articulo[]
}

export interface EntradaData {
  articuloId: string
  cantidad: number
  proveedorId: string
}

export function EntradaModal({ open, onClose, onSubmit, articulos }: EntradaModalProps) {
  const [articuloSeleccionado, setArticuloSeleccionado] = useState("")
  const [cantidad, setCantidad] = useState("")
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState("")
  const [proveedoresDisponibles, setProveedoresDisponibles] = useState<{_id: string, nombre: string}[]>([])

  const fetchProveedores = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/proveedores?limit=1000")
      const data = await res.json()
      setProveedoresDisponibles(data.data || data)
    } catch (error) {
      console.error("Error al cargar proveedores:", error)
    }
  }

  useEffect(() => {
    if (open) {
      fetchProveedores()
    }
  }, [open])

  const handleSubmit = () => {
    if (!articuloSeleccionado || !cantidad || !proveedorSeleccionado) {
      alert("Por favor completa todos los campos obligatorios")
      return
    }

    onSubmit({
      articuloId: articuloSeleccionado,
      cantidad: parseInt(cantidad),
      proveedorId: proveedorSeleccionado
    })

    // Limpiar formulario
    setArticuloSeleccionado("")
    setCantidad("")
    setProveedorSeleccionado("")
  }

  const articuloActual = articulos.find(a => a._id === articuloSeleccionado)

  return (
    <Modal open={open} onClose={onClose} title="Agregar Entrada al Inventario">
      <div className="max-h-96 overflow-y-auto space-y-4">
        {/* Selección de artículo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Artículo *
          </label>
          <select
            className="border border-[#ececec] p-2 rounded-lg w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
            value={articuloSeleccionado}
            onChange={e => setArticuloSeleccionado(e.target.value)}
          >
            <option value="">Selecciona un artículo</option>
            {articulos.map(articulo => (
              <option key={articulo._id} value={articulo._id}>
                {articulo.nombre} (Stock actual: {articulo.stock})
              </option>
            ))}
          </select>
        </div>

        {/* Información del artículo seleccionado */}
        {articuloActual && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-gray-800">{articuloActual.nombre}</h4>
            <p className="text-sm text-gray-600">Stock actual: {articuloActual.stock}</p>
            <p className="text-sm text-gray-600">Precio venta: ${articuloActual.precioVenta?.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Categoría: {articuloActual.categoria}</p>
          </div>
        )}

        {/* Cantidad a ingresar */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cantidad a ingresar *
          </label>
          <input
            className="border border-[#ececec] p-2 rounded-lg w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
            type="number"
            min="1"
            placeholder="Ej: 10"
            value={cantidad}
            onChange={e => setCantidad(e.target.value)}
          />
        </div>

        {/* Selección de proveedor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Proveedor *
          </label>
          <select
            className="border border-[#ececec] p-2 rounded-lg w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
            value={proveedorSeleccionado}
            onChange={e => setProveedorSeleccionado(e.target.value)}
          >
            <option value="">Selecciona un proveedor</option>
            {proveedoresDisponibles.map(proveedor => (
              <option key={proveedor._id} value={proveedor._id}>
                {proveedor.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Resumen de la entrada */}
        {articuloActual && cantidad && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Resumen de la entrada:</h4>
            <div className="text-sm text-blue-700">
              <p>• Artículo: {articuloActual.nombre}</p>
              <p>• Cantidad: {cantidad} unidades</p>
              <p>• Stock después de entrada: {articuloActual.stock + parseInt(cantidad || "0")} unidades</p>
            </div>
          </div>
        )}
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-2 mt-6">
        <button
          className="bg-gray-200 text-black px-4 py-2 rounded-lg hover:bg-gray-300 transition"
          onClick={onClose}
        >
          Cancelar
        </button>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          onClick={handleSubmit}
          disabled={!articuloSeleccionado || !cantidad || !proveedorSeleccionado}
        >
          Agregar Entrada
        </button>
      </div>
    </Modal>
  )
}
