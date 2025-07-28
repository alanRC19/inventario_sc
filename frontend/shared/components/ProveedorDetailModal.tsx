"use client"

import React from 'react';
import { DetailModal, DetailSection, DetailField, DetailGrid, DetailTable } from './DetailModal';
import { formatCurrency } from '@/shared/utils/formatters';
import { Proveedor } from '@/domain/proveedores/proveedor.types';

interface ProveedorDetalle extends Proveedor {}

interface ProveedorModalProps {
  open: boolean;
  onClose: () => void;
  proveedor: ProveedorDetalle;
}

export const ProveedorDetailModal: React.FC<ProveedorModalProps> = ({
  open,
  onClose,
  proveedor
}) => {
  return (
    <DetailModal
      open={open}
      onClose={onClose}
      title={`Detalle del Proveedor: ${proveedor.nombre}`}
    >
      <div className="space-y-6">
        <DetailSection title="Información General">
          <DetailGrid>
            <DetailField label="Nombre" value={proveedor.nombre} />
            <DetailField label="Razón Social" value={proveedor.razonSocial} />
            <DetailField label="RFC" value={proveedor.rfc} />
            <DetailField label="Estado" value={
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                proveedor.estado === 'activo' ? 'bg-green-100 text-green-800' :
                proveedor.estado === 'inactivo' ? 'bg-gray-100 text-gray-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {proveedor.estado}
              </span>
            } />
          </DetailGrid>
        </DetailSection>

        <DetailSection title="Contacto">
          <DetailGrid>
            <DetailField label="Persona de Contacto" value={proveedor.contacto} />
            <DetailField label="Teléfono Principal" value={proveedor.telefono} />
            <DetailField label="Teléfono Secundario" value={proveedor.telefonoSecundario} />
            <DetailField label="Correo Principal" value={proveedor.correo} />
            <DetailField label="Correo Secundario" value={proveedor.correoSecundario} />
            <DetailField label="Página Web" value={proveedor.paginaWeb} />
            <DetailField label="Dirección" value={proveedor.direccion} />
          </DetailGrid>
        </DetailSection>

        <DetailSection title="Términos Comerciales">
          <DetailGrid>
            <DetailField 
              label="Días de Crédito" 
              value={proveedor.diasCredito ? `${proveedor.diasCredito} días` : '—'} 
            />
            <DetailField 
              label="Tiempo de Entrega" 
              value={proveedor.tiempoEntrega ? `${proveedor.tiempoEntrega} días` : '—'} 
            />
            <DetailField 
              label="Moneda" 
              value={proveedor.moneda || 'MXN'} 
            />
            <DetailField 
              label="Condiciones de Pago" 
              value={proveedor.condicionesPago} 
            />
            <DetailField 
              label="Última Compra" 
              value={proveedor.ultimaCompra ? new Date(proveedor.ultimaCompra).toLocaleDateString() : '—'} 
            />
            <DetailField 
              label="Calificación" 
              value={proveedor.calificacion ? '⭐'.repeat(proveedor.calificacion) : '—'} 
            />
          </DetailGrid>
        </DetailSection>

        {proveedor.categorias && proveedor.categorias.length > 0 && (
          <DetailSection title="Categorías">
            <div className="flex flex-wrap gap-2">
              {proveedor.categorias.map((cat: string, index: number) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {cat}
                </span>
              ))}
            </div>
          </DetailSection>
        )}

        {proveedor.metodoPago && proveedor.metodoPago.length > 0 && (
          <DetailSection title="Métodos de Pago">
            <div className="flex flex-wrap gap-2">
              {proveedor.metodoPago.map((metodo: string, index: number) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                >
                  {metodo}
                </span>
              ))}
            </div>
          </DetailSection>
        )}

        {proveedor.descuentos && proveedor.descuentos.length > 0 && (
          <DetailSection title="Descuentos Activos">
            <div className="space-y-4">
              {proveedor.descuentos.map((descuento, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">
                      {descuento.tipo === 'porcentaje' ? `${descuento.valor}% de descuento` : 
                       `$${descuento.valor} de descuento`}
                    </span>
                    {(descuento.fechaInicio || descuento.fechaFin) && (
                      <span className="text-sm text-gray-500">
                        {descuento.fechaInicio && new Date(descuento.fechaInicio).toLocaleDateString()} - 
                        {descuento.fechaFin ? new Date(descuento.fechaFin).toLocaleDateString() : 'Sin vencimiento'}
                      </span>
                    )}
                  </div>
                  {descuento.minimoCompra && (
                    <p className="text-sm text-gray-600">
                      Mínimo de compra: ${descuento.minimoCompra}
                    </p>
                  )}
                  {descuento.categorias && descuento.categorias.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-1">Aplica a categorías:</p>
                      <div className="flex flex-wrap gap-1">
                        {descuento.categorias.map((cat, i) => (
                          <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </DetailSection>
        )}

        {proveedor.historialPrecios && proveedor.historialPrecios.length > 0 && (
          <DetailSection title="Historial de Precios">
            <DetailTable
              headers={['Artículo', 'Precio', 'Fecha']}
              rows={proveedor.historialPrecios.map(historial => [
                historial.articuloId,
                formatCurrency(historial.precio),
                new Date(historial.fecha).toLocaleDateString()
              ])}
            />
          </DetailSection>
        )}

        {proveedor.documentos && proveedor.documentos.length > 0 && (
          <DetailSection title="Documentos">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {proveedor.documentos.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{doc.tipo}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(doc.fechaSubida).toLocaleDateString()}
                    </p>
                  </div>
                  <a 
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Ver
                  </a>
                </div>
              ))}
            </div>
          </DetailSection>
        )}

        {proveedor.notas && (
          <DetailSection title="Notas">
            <p className="text-gray-700 whitespace-pre-line">{proveedor.notas}</p>
          </DetailSection>
        )}
      </div>
    </DetailModal>
  );
};
