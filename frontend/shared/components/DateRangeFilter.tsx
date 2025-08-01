import React from "react";

interface DateRangeFilterProps {
  fechaInicio: string;
  fechaFin: string;
  onFechaInicioChange: (fecha: string) => void;
  onFechaFinChange: (fecha: string) => void;
  onLimpiarFiltros: () => void;
  className?: string;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  fechaInicio,
  fechaFin,
  onFechaInicioChange,
  onFechaFinChange,
  onLimpiarFiltros,
  className = ""
}) => {
  const hoy = new Date().toISOString().split('T')[0];
  const haceUnMes = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Desde:</label>
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => onFechaInicioChange(e.target.value)}
          max={hoy}
          className="border border-[#ececec] p-2 rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-black text-sm"
        />
      </div>
      
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Hasta:</label>
        <input
          type="date"
          value={fechaFin}
          onChange={(e) => onFechaFinChange(e.target.value)}
          max={hoy}
          min={fechaInicio}
          className="border border-[#ececec] p-2 rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-black text-sm"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            onFechaInicioChange(haceUnMes);
            onFechaFinChange(hoy);
          }}
          className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
        >
          Último mes
        </button>
        
        <button
          onClick={() => {
            onFechaInicioChange(hoy);
            onFechaFinChange(hoy);
          }}
          className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
        >
          Hoy
        </button>
        
        {(fechaInicio || fechaFin) && (
          <button
            onClick={onLimpiarFiltros}
            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}; 