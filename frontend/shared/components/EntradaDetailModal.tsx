"use client"

import React from 'react';
import { DetailModal, DetailSection, DetailField, DetailGrid, DetailTable } from './DetailModal';
import { StatusBadge, BadgeType } from './StatusBadge';
import { formatCurrency, formatDate } from '@/shared/utils/formatters';
import { Entrada } from '@/domain/entradas/entrada.types';

type TipoEntrada = 'compra' | 'devolucion' | 'ajuste' | 'inicial';
type EstadoEntrada = 'pendiente' | 'parcial' | 'completada' | 'cancelada';

const getTipoBadgeVariant = (tipo: TipoEntrada): BadgeType => {
  switch (tipo) {
    case 'compra':
      return 'success';
    case 'devolucion':
      return 'warning';
    case 'ajuste':
      return 'info';
    case 'inicial':
      return 'neutral';
    default:
      return 'neutral';
  }
};

const getEstadoBadgeVariant = (estado: EstadoEntrada): BadgeType => {
  switch (estado) {
    case 'completada':
      return 'success';
    case 'pendiente':
      return 'warning';
    case 'parcial':
      return 'info';
    case 'cancelada':
      return 'error';
    default:
      return 'neutral';
  }
};

interface EntradaModalProps {
  open: boolean;
  onClose: () => void;
  entrada: Entrada;
}

export const EntradaDetailModal: React.FC<EntradaModalProps> = ({
  open,
  onClose,
  entrada
}) => {
  return (
    <DetailModal
      open={open}
      onClose={onClose}
      title={`Detalle de Entrada: ${entrada.numeroFactura || 'Sin factura'}`}
    >
      <div className="space-y-6">
        <DetailSection title="Información General">
          <DetailGrid>
            <DetailField 
              label="Fecha" 
              value={formatDate(entrada.fecha)} 
            />
            <DetailField 
              label="Tipo" 
              value={
                <StatusBadge
                  variant={getTipoBadgeVariant(entrada.tipo as TipoEntrada)}
                  text={entrada.tipo}
                />
              }
            />
            <DetailField 
              label="Estado" 
              value={
                <StatusBadge
                  variant={getEstadoBadgeVariant(entrada.estado as EstadoEntrada)}
                  text={entrada.estado}
                />
              }
            />
            <DetailField 
              label="Total" 
              value={formatCurrency(entrada.total)} 
            />
          </DetailGrid>
        </DetailSection>

        <DetailSection title="Proveedor y Documentación">
          <DetailGrid>
            <DetailField 
              label="Proveedor" 
              value={entrada.numeroFactura} 
            />
            <DetailField 
              label="Factura" 
              value={entrada.numeroFactura || '—'} 
            />
            <DetailField 
              label="Orden de Compra" 
              value={entrada.ordenCompra || '—'} 
            />
            <DetailField 
              label="Recibido Por" 
              value={entrada.recibidoPor} 
            />
          </DetailGrid>
        </DetailSection>

        <DetailSection title="Productos">
          <DetailTable
            headers={['Producto', 'Cantidad', 'Precio Unit.', 'Subtotal', 'Lote', 'Ubicación']}
            rows={entrada.productos.map(prod => [
              prod.nombre,
              prod.cantidad.toString(),
              formatCurrency(prod.precioUnitario),
              formatCurrency(prod.subtotal),
              prod.lote || '—',
              prod.ubicacion || '—'
            ])}
          />
        </DetailSection>

        {entrada.calidad && (
          <DetailSection title="Control de Calidad">
            <DetailGrid>
              <DetailField 
                label="Estado" 
                value={
                  <StatusBadge
                    variant={entrada.calidad.estado === 'aprobado' ? 'success' :
                            entrada.calidad.estado === 'rechazado' ? 'error' : 'warning'}
                    text={entrada.calidad.estado || '—'}
                  />
                }
              />
              <DetailField 
                label="Revisado Por" 
                value={entrada.calidad.revisadoPor || '—'} 
              />
              <DetailField 
                label="Fecha" 
                value={entrada.calidad.fecha ? formatDate(entrada.calidad.fecha) : '—'} 
              />
              <DetailField 
                label="Notas" 
                value={entrada.calidad.notas || '—'} 
              />
            </DetailGrid>
            {entrada.calidad.items && entrada.calidad.items.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Detalle por Producto</h4>
                <DetailTable
                  headers={['Producto', 'Estado', 'Cantidad', 'Observaciones']}
                  rows={entrada.calidad.items.map(item => [
                    item.productoId,
                    <StatusBadge
                      key={`status-${item.productoId}`}
                      variant={item.estado === 'aprobado' ? 'success' :
                              item.estado === 'rechazado' ? 'error' : 'warning'}
                      text={item.estado}
                    />,
                    item.cantidad.toString(),
                    item.observaciones || '—'
                  ])}
                />
              </div>
            )}
          </DetailSection>
        )}

        {entrada.pagos && entrada.pagos.length > 0 && (
          <DetailSection title="Pagos">
            <DetailTable
              headers={['Fecha', 'Monto', 'Método', 'Referencia']}
              rows={entrada.pagos.map(pago => [
                formatDate(pago.fecha),
                formatCurrency(pago.monto),
                <StatusBadge
                  key={`payment-${pago.fecha.toISOString()}`}
                  variant={pago.metodoPago === 'efectivo' ? 'success' : 'info'}
                  text={pago.metodoPago}
                />,
                pago.referencia || '—'
              ])}
            />
            <div className="mt-4 flex justify-end">
              <div className="text-right">
                <span className="text-sm text-gray-500">Total pagado:</span>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(entrada.pagos.reduce((sum, p) => sum + p.monto, 0))}
                </p>
              </div>
            </div>
          </DetailSection>
        )}

        {entrada.adjuntos && entrada.adjuntos.length > 0 && (
          <DetailSection title="Archivos Adjuntos">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {entrada.adjuntos.map((adj, index) => (
                <div 
                  key={index}
                  className="flex items-center p-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <span className="material-icons text-gray-500 mr-2">
                    {adj.tipo === 'factura' ? 'receipt' :
                     adj.tipo === 'ordenCompra' ? 'shopping_cart' :
                     adj.tipo === 'remision' ? 'local_shipping' : 'attach_file'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {adj.nombre}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <StatusBadge
                        variant="neutral"
                        text={adj.tipo}
                      />
                      <span className="mx-1">•</span>
                      {formatDate(adj.fechaSubida)}
                    </p>
                  </div>
                  <a
                    href={adj.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <span className="material-icons text-blue-600">download</span>
                  </a>
                </div>
              ))}
            </div>
          </DetailSection>
        )}

        {entrada.notas && (
          <DetailSection title="Notas Adicionales">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-line">{entrada.notas}</p>
            </div>
          </DetailSection>
        )}
      </div>
    </DetailModal>
  );
};
