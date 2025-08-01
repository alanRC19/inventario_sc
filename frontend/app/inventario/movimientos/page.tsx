'use client';

import { useEffect, useState } from 'react';
import { fetchArticulos } from '@/domain/inventario/inventario.service';
import { Table, TableColumn } from '@/shared/components/Table';
import { SearchBar } from '@/shared/components/SearchBar';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { formatDate, formatCurrency } from '@/shared/utils/formatters';
import { EntradaDetailModal } from '@/shared/components/EntradaDetailModal';
import { getEntradas } from '@/domain/entradas/entrada.service';
import { Entrada } from '@/domain/entradas/entrada.types';
import { ArticuloDetailModal } from '@/shared/components/ArticuloDetailModal';
import { Articulo } from '@/domain/inventario/inventario.types';

interface Movimiento {
  _id: string;
  articuloId: string;
  tipo: string;
  cantidad: number;
  stockAntes: number;
  stockDespues: number;
  usuarioId?: string;
  usuarioNombre?: string;
  fecha: string;
  motivo?: string;
  referencia?: string;
}

const PAGE_SIZE = 10;

export default function MovimientosPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [entradasCache, setEntradasCache] = useState<Record<string, Entrada>>({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedMovimiento, setSelectedMovimiento] = useState<Movimiento | null>(null);
  const [selectedArticulo, setSelectedArticulo] = useState<Articulo | null>(null);
  const [showEntradaModal, setShowEntradaModal] = useState(false);
  const [showArticuloModal, setShowArticuloModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      setLoading(true);
      try {
        let url = `http://localhost:3001/api/articulos/movimientos?page=${page}&limit=${PAGE_SIZE}`;
        if (tipoFiltro) url += `&tipo=${tipoFiltro}`;
        if (searchText) url += `&busqueda=${encodeURIComponent(searchText)}`;
        
        const [movimientosRes, articulosRes] = await Promise.all([
          fetch(url, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }).then(res => res.json()),
          fetchArticulos(1, 1000)
        ]);

        setMovimientos(movimientosRes.data || []);
        setTotalPages(movimientosRes.totalPages || 1);
        setTotal(movimientosRes.total || 0);
        setArticulos(articulosRes.data || []);

        const entradasParaCargar = movimientosRes.data
          .filter((mov: Movimiento) => mov.tipo === 'entrada' && mov.referencia)
          .map((mov: Movimiento) => mov.referencia)
          .filter((ref: string | undefined, index: number, self: (string | undefined)[]) => 
            ref && self.indexOf(ref) === index
          ) as string[];

        if (entradasParaCargar.length > 0) {
          const entradas = await Promise.all(
            entradasParaCargar.map((ref: string) => 
              getEntradas({ busqueda: ref }, 1, 1).then(res => res.data?.[0])
            )
          );
          const entradasValidas = entradas.filter(Boolean) as Entrada[];
          setEntradasCache(prev => ({
            ...prev,
            ...Object.fromEntries(entradasValidas.map(e => [e._id, e]))
          }));
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setMovimientos([]);
        setTotalPages(1);
        setTotal(0);
      }
      setLoading(false);
    };

    fetchData();
  }, [page, tipoFiltro, searchText]);

  const getNombreArticulo = (id: string) => {
    const art = articulos.find(a => a._id === id);
    return art ? art.nombre : id;
  };

  const handleRowClick = (mov: Movimiento) => {
    setSelectedMovimiento(mov);
    const articulo = articulos.find(a => a._id === mov.articuloId);
    
    if (mov.tipo === 'entrada' && mov.referencia && entradasCache[mov.referencia]) {
      setShowEntradaModal(true);
    } else if (articulo) {
      setSelectedArticulo(articulo);
      setShowArticuloModal(true);
    }
  };

  const columns: TableColumn[] = [
    { key: 'fecha', label: 'Fecha' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'articulo', label: 'Artículo' },
    { key: 'cantidad', label: 'Cantidad' },
    { key: 'precioVenta', label: 'Precio Venta' },
    { key: 'precioCompra', label: 'Precio Compra' },
    { key: 'stockAntes', label: 'Stock Anterior' },
    { key: 'stockDespues', label: 'Stock Actual' },
    { key: 'usuario', label: 'Usuario' },
    { key: 'referencia', label: 'Referencia' },
  ];

  const renderRow = (mov: Movimiento) => {
    const articulo = articulos.find(a => a._id === mov.articuloId);
    return (
      <tr
        key={mov._id}
        className="hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={() => handleRowClick(mov)}
      >
        <td className="px-6 py-4">{formatDate(new Date(mov.fecha))}</td>
        <td className="px-6 py-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium
            ${mov.tipo === 'entrada' ? 'bg-green-100 text-green-800' :
              mov.tipo === 'salida' ? 'bg-red-100 text-red-800' :
              mov.tipo === 'venta' ? 'bg-purple-100 text-purple-800' :
              mov.tipo === 'cancelacion' ? 'bg-orange-100 text-orange-800' :
              mov.tipo === 'ajuste' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}
          >
            {mov.tipo}
          </span>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center">
            <span>{getNombreArticulo(mov.articuloId)}</span>
          </div>
        </td>
        <td className="px-6 py-4">{mov.cantidad}</td>
        <td className="px-6 py-4">{articulo ? formatCurrency(articulo.precioVenta) : '-'}</td>
        <td className="px-6 py-4">{articulo ? formatCurrency(articulo.precioCompra) : '-'}</td>
        <td className="px-6 py-4">{mov.stockAntes}</td>
        <td className="px-6 py-4">{mov.stockDespues}</td>
        <td className="px-6 py-4">{mov.usuarioNombre || 'Sistema'}</td>
        <td className="px-6 py-4">{mov.referencia || '-'}</td>
      </tr>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Movimientos de Inventario</h1>
          <p className="text-gray-600">Consulta y gestiona los movimientos de inventario.</p>
        </div>
        <div className="flex gap-4 items-center">
          <SearchBar 
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Buscar por artículo, usuario o referencia..." 
            className="w-96"
          />
          <select
            className="border border-gray-300 rounded px-3 py-2 bg-white text-gray-700"
            value={tipoFiltro}
            onChange={e => { setTipoFiltro(e.target.value); setPage(1); }}
            aria-label="Filtrar por tipo de movimiento"
          >
            <option value="">Todos los tipos</option>
            <option value="entrada">Entradas</option>
            <option value="venta">Ventas</option>
            <option value="cancelacion">Cancelaciones</option>
            <option value="ajuste">Ajustes</option>
            <option value="salida">Salidas</option>
            <option value="creacion">Creación</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-500"></div>
          </div>
        ) : movimientos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No se encontraron movimientos
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={movimientos}
              renderRow={renderRow}
            />

            <div className="flex items-center justify-between px-6 py-4 bg-gray-50">
              <div className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{(page - 1) * PAGE_SIZE + 1}</span> a{' '}
                <span className="font-medium">
                  {Math.min(page * PAGE_SIZE, total)}
                </span>{' '}
                de <span className="font-medium">{total}</span> resultados
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded bg-white disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border rounded bg-white disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedMovimiento?.tipo === 'entrada' && showEntradaModal && selectedMovimiento.referencia && (
        <EntradaDetailModal
          entrada={entradasCache[selectedMovimiento.referencia]}
          open={showEntradaModal}
          onClose={() => {
            setShowEntradaModal(false);
            setSelectedMovimiento(null);
          }}
        />
      )}

      {selectedArticulo && showArticuloModal && (
        <ArticuloDetailModal
          articulo={selectedArticulo}
          open={showArticuloModal}
          onClose={() => {
            setShowArticuloModal(false);
            setSelectedArticulo(null);
          }}
        />
      )}
    </div>
  );
}
