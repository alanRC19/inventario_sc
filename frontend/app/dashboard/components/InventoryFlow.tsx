import React from 'react';

interface InventoryFlowProps {
  totalEntradas?: number;
  totalStock?: number;
  totalSalidas?: number;
  valorEntradas?: number;
  valorStock?: number;
  valorSalidas?: number;
}

const InventoryFlow: React.FC<InventoryFlowProps> = ({
  totalEntradas = 0,
  totalStock = 0,
  totalSalidas = 0,
  valorEntradas = 0,
  valorStock = 0,
  valorSalidas = 0
}) => {
  return (
    <div className="bg-card rounded-xl shadow-app border border-app p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="material-icons text-primary text-2xl">inventory</span>
        <div>
          <h3 className="text-lg font-semibold text-card">Flujo de Inventario</h3>
          <p className="text-sm text-muted">Visualización del movimiento de productos</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Entradas */}
        <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-green-600 text-2xl">input</span>
          </div>
          <h4 className="font-semibold text-green-800 mb-2">Entradas</h4>
          <p className="text-2xl font-bold text-green-700 mb-1">{totalEntradas}</p>
          <p className="text-sm text-green-600">
            ${valorEntradas.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
          </p>
        </div>

        {/* Stock Actual */}
        <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-blue-600 text-2xl">inventory_2</span>
          </div>
          <h4 className="font-semibold text-blue-800 mb-2">Stock Actual</h4>
          <p className="text-2xl font-bold text-blue-700 mb-1">{totalStock}</p>
          <p className="text-sm text-blue-600">
            ${valorStock.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
          </p>
        </div>

        {/* Salidas */}
        <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-red-600 text-2xl">output</span>
          </div>
          <h4 className="font-semibold text-red-800 mb-2">Salidas</h4>
          <p className="text-2xl font-bold text-red-700 mb-1">{totalSalidas}</p>
          <p className="text-sm text-red-600">
            ${valorSalidas.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Flujo visual */}
      <div className="mt-8 flex items-center justify-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Entradas</span>
          </div>
          <span className="material-icons text-gray-400">arrow_forward</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Inventario</span>
          </div>
          <span className="material-icons text-gray-400">arrow_forward</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Salidas</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryFlow;
