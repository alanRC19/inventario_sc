import React from 'react';

// Modal base
export const DetailModal: React.FC<{
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}> = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose}>Cerrar</button>
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
};

// Sección de detalles
export const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="detail-section">
    <h3 className="detail-section-title">{title}</h3>
    <div>{children}</div>
  </section>
);

// Grid de detalles
export const DetailGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="detail-grid grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
);

// Campo de detalle
export const DetailField: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="detail-field">
    <span className="detail-label font-semibold text-gray-600">{label}:</span>
    <span className="detail-value ml-2">{value}</span>
  </div>
);
