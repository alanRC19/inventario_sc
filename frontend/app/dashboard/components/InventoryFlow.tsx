"use client"
import { useState, useEffect } from 'react'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

type MovimientoInventario = {
  fecha: string
  entradas: number
  salidas: number
  stock: number
}

export default function InventoryFlow() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week')
  const [viewType, setViewType] = useState<'flujo' | 'entradas' | 'salidas'>('flujo')
  const [data, setData] = useState<MovimientoInventario[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`http://localhost:3001/api/reportes/movimientos-inventario?rango=${timeRange}`)
        const jsonData = await res.json()
        setData(jsonData)
      } catch (error) {
        console.error('Error fetching inventory data:', error)
      }
      setIsLoading(false)
    }

    fetchData()
  }, [timeRange])

  const chartData = {
    labels: data.map(item => item.fecha),
    datasets: viewType === 'flujo' ? [
      {
        label: 'Entradas',
        data: data.map(item => item.entradas),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.4,
      },
      {
        label: 'Salidas',
        data: data.map(item => item.salidas),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.4,
      },
    ] : [
      {
        label: viewType === 'entradas' ? 'Entradas' : 'Salidas',
        data: data.map(item => viewType === 'entradas' ? item.entradas : item.salidas),
        borderColor: viewType === 'entradas' ? 'rgb(75, 192, 192)' : 'rgb(255, 99, 132)',
        backgroundColor: viewType === 'entradas' ? 'rgba(75, 192, 192, 0.5)' : 'rgba(255, 99, 132, 0.5)',
        tension: 0.4,
      }
    ],
  }

  const stockData = {
    labels: data.map(item => item.fecha),
    datasets: [{
      label: 'Nivel de Stock',
      data: data.map(item => item.stock),
      backgroundColor: 'rgba(53, 162, 235, 0.5)',
    }],
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: viewType === 'flujo' ? 'Flujo de Inventario' : 
              viewType === 'entradas' ? 'Entradas de Inventario' : 
              'Salidas de Inventario'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }

  const stockOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Nivel de Stock'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Flujo de Inventario</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                timeRange === 'week'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                timeRange === 'month'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => setTimeRange('year')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                timeRange === 'year'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Año
            </button>
          </div>
        </div>

        <div className="flex justify-center gap-2">
          <button
            onClick={() => setViewType('flujo')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewType === 'flujo'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Flujo General
          </button>
          <button
            onClick={() => setViewType('entradas')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewType === 'entradas'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Solo Entradas
          </button>
          <button
            onClick={() => setViewType('salidas')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewType === 'salidas'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Solo Salidas
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {(viewType === 'flujo' || viewType === 'entradas') && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 mb-1">Total Entradas</h3>
                <p className="text-2xl font-semibold text-blue-900">
                  {data.reduce((acc, curr) => acc + curr.entradas, 0)}
                </p>
                <p className="text-sm text-blue-600">
                  Promedio: {(data.reduce((acc, curr) => acc + curr.entradas, 0) / data.length).toFixed(2)}
                </p>
              </div>
            )}
            {(viewType === 'flujo' || viewType === 'salidas') && (
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-red-800 mb-1">Total Salidas</h3>
                <p className="text-2xl font-semibold text-red-900">
                  {data.reduce((acc, curr) => acc + curr.salidas, 0)}
                </p>
                <p className="text-sm text-red-600">
                  Promedio: {(data.reduce((acc, curr) => acc + curr.salidas, 0) / data.length).toFixed(2)}
                </p>
              </div>
            )}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-800 mb-1">Stock Actual</h3>
              <p className="text-2xl font-semibold text-green-900">
                {data[data.length - 1]?.stock || 0}
              </p>
              <p className="text-sm text-green-600">
                Promedio: {(data.reduce((acc, curr) => acc + curr.stock, 0) / data.length).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-gray-50">
            <Line options={options} data={chartData} height={80} />
          </div>

          <div className="border rounded-lg p-4 bg-gray-50">
            <Bar options={stockOptions} data={stockData} height={80} />
          </div>
        </div>
      )}
    </div>
  )
}
