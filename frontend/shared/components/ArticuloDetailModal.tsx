"use client"

import React from 'react';
import { DetailModal, DetailSection, DetailField, DetailGrid } from './DetailModal';
import { StatusBadge } from './StatusBadge';
import { formatCurrency, formatDate } from '@/shared/utils/formatters';
import { calculateStockStatus, getStockStatusText, getStockStatusVariant } from '@/shared/utils/stockUtils';

interface ArticuloDetailProps {
  articulo: {
    _id: string;
    nombre: string;
    codigo?: string;
    descripcion?: string;
    categoria: string;
    subcategoria?: string;
    unidad?: string;
    stock: number;
    stockMinimo: number;
    puntoReorden: number;
    precio: number;  // precio de venta
    costo: number;   // precio de compra
    estado: "disponible" | "stock bajo" | "fuera de stock";
    ubicacion?: string;
    proveedor?: {
      _id: string;
      nombre: string;
    };
    ultimaEntrada?: Date;
    ultimaSalida?: Date;
    ultimoPrecioCompra?: number;
    estadisticas?: {
      promedioMensual: number;
      tendencia: string;
      ultimaActualizacion: Date;
    };
    alertas?: {
      tipo: string;
      mensaje: string;
      prioridad: string;
      fecha: Date;
    }[];
  };
  open: boolean;
  onClose: () => void;
}
export const ArticuloDetailModal: React.FC<ArticuloDetailProps> = ({
  open,
  onClose,
  articulo
}) => {
  const stockStatusType = calculateStockStatus(articulo.stock, articulo.stockMinimo || 5);
  const stockStatus = getStockStatusVariant(stockStatusType);
  const stockText = getStockStatusText(stockStatusType);

  const margenBruto = articulo.precio > 0 ? 
    ((articulo.precio - articulo.costo) / articulo.precio) * 100 : 0;

  return (
    <DetailModal
      open={open}
      onClose={onClose}
      title={`Detalle del Artículo: ${articulo.nombre}`}
    >
      <div className="space-y-6">
        <DetailSection title="Información General">
          <DetailGrid>
            <DetailField 
              label="Código" 
              value={
                <span className="font-mono bg-gray-50 px-2 py-1 rounded theme-transition">
                  {articulo.codigo}
                </span>
              }
            />
            <DetailField 
              label="Nombre" 
              value={articulo.nombre}
            />
            <DetailField 
              label="Categoría" 
              value={
                <div className="flex gap-2">
                  <StatusBadge
                    variant="neutral"
                    text={articulo.categoria}
                  />
                  {articulo.subcategoria && (
                    <>
                      <span className="text-muted">/</span>
                      <StatusBadge
                        variant="neutral"
                        text={articulo.subcategoria}
                      />
                    </>
                  )}
                </div>
              }
            />
            <DetailField 
              label="Unidad" 
              value={articulo.unidad}
            />
          </DetailGrid>
        </DetailSection>

        <DetailSection title="Inventario">
          <DetailGrid>
            <DetailField 
              label="Stock Actual" 
              value={
                <div className="flex items-center gap-2">
                  <span className="text-xl font-semibold">{articulo.stock}</span>
                  <StatusBadge
                    variant={stockStatus}
                    text={stockText}
                  />
                </div>
              }
            />
            <DetailField 
              label="Stock Mínimo" 
              value={articulo.stockMinimo}
            />
            <DetailField 
              label="Punto de Reorden" 
              value={articulo.puntoReorden}
            />
            <DetailField 
              label="Ubicación" 
              value={articulo.ubicacion || '—'}
            />
          </DetailGrid>
        </DetailSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DetailSection title="Información de Precios">
            <DetailGrid>
              <DetailField 
                label="Precio de Venta" 
                value={
                  <span className="text-lg font-semibold text-card">
                    {formatCurrency(articulo.precio)}
                  </span>
                }
              />
              <DetailField 
                label="Costo" 
                value={formatCurrency(articulo.costo)}
              />
              <DetailField 
                label="Margen Bruto" 
                value={
                  <div className="flex items-center gap-2">
                    <span>{margenBruto.toFixed(2)}%</span>
                    <StatusBadge
                      variant={margenBruto >= 30 ? 'success' : 
                              margenBruto >= 20 ? 'info' : 
                              margenBruto >= 10 ? 'warning' : 'error'}
                      text={
                        margenBruto >= 30 ? 'Excelente' :
                        margenBruto >= 20 ? 'Bueno' :
                        margenBruto >= 10 ? 'Regular' : 'Bajo'
                      }
                    />
                  </div>
                }
              />
              <DetailField 
                label="Último Precio de Compra" 
                value={articulo.ultimoPrecioCompra ? 
                  formatCurrency(articulo.ultimoPrecioCompra) : '—'}
              />
            </DetailGrid>
          </DetailSection>

          <DetailSection title="Movimientos">
            <DetailGrid>
              <DetailField 
                label="Última Entrada" 
                value={articulo.ultimaEntrada ? 
                  formatDate(articulo.ultimaEntrada) : '—'}
              />
              <DetailField 
                label="Última Salida" 
                value={articulo.ultimaSalida ? 
                  formatDate(articulo.ultimaSalida) : '—'}
              />
              {articulo.proveedor && (
                <DetailField 
                  label="Proveedor Principal" 
                  value={articulo.proveedor.nombre}
                />
              )}
            </DetailGrid>
          </DetailSection>
        </div>

        {articulo.estadisticas && (
          <DetailSection title="Estadísticas">
            <DetailGrid>
              <DetailField 
                label="Promedio Mensual" 
                value={`${articulo.estadisticas.promedioMensual.toFixed(2)} unidades`}
              />
              <DetailField 
                label="Tendencia" 
                value={
                  <StatusBadge
                    variant={articulo.estadisticas.tendencia === 'alta' ? 'success' : 'warning'}
                    text={articulo.estadisticas.tendencia}
                  />
                }
              />
              <DetailField 
                label="Última Actualización" 
                value={formatDate(articulo.estadisticas.ultimaActualizacion)}
              />
            </DetailGrid>
          </DetailSection>
        )}

        {articulo.alertas && articulo.alertas.length > 0 && (
          <DetailSection title="Alertas Activas">
            <div className="space-y-3">
              {articulo.alertas?.map((alerta: { tipo: string; mensaje: string; prioridad: string; fecha: Date }, index: number) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 bg-white border rounded-lg shadow-sm"
                >
                  <span className={`material-icons ${
                    alerta.prioridad === 'alta' ? 'text-red-500' :
                    alerta.prioridad === 'media' ? 'text-yellow-500' : 'text-blue-500'
                  }`}>
                    {alerta.tipo === 'stock' ? 'inventory_2' :
                     alerta.tipo === 'vencimiento' ? 'event_busy' : 'warning'}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <StatusBadge
                        variant={
                          alerta.prioridad === 'alta' ? 'error' :
                          alerta.prioridad === 'media' ? 'warning' : 'info'
                        }
                        text={alerta.tipo}
                      />
                      <span className="text-sm text-gray-500">
                        {formatDate(alerta.fecha)}
                      </span>
                    </div>
                    <p className="mt-1 text-gray-700">{alerta.mensaje}</p>
                  </div>
                </div>
              ))}
            </div>
          </DetailSection>
        )}

        {articulo.descripcion && (
          <DetailSection title="Descripción">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-line">
                {articulo.descripcion}
              </p>
            </div>
          </DetailSection>
        )}
      </div>
    </DetailModal>
  );
};
