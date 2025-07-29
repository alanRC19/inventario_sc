import React from 'react';

// Componente base para mostrar detalles de una entrada de inventario
export function EntradaDetailModal({ open, onClose, entrada }: {
  open: boolean;
  onClose: () => void;
  entrada?: any;
}) {
  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Detalle de Entrada</h2>
        {entrada ? (
          <pre>{JSON.stringify(entrada, null, 2)}</pre>
        ) : (
          <p>No hay datos de la entrada.</p>
        )}
        <button onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}
