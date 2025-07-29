import React from 'react';

interface VentaStatusBadgeProps {
  estado: 'completada' | 'cancelada';
}

export function VentaStatusBadge({ estado }: VentaStatusBadgeProps) {
  const getStatusStyle = () => {
    switch (estado) {
      case 'completada':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelada':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = () => {
    switch (estado) {
      case 'completada':
        return 'Completada';
      case 'cancelada':
        return 'Cancelada';
      default:
        return 'Desconocido';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle()}`}>
      {getStatusText()}
    </span>
  );
}
