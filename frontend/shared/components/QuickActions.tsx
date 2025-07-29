import React from 'react';
import Link from 'next/link';

export const QuickActions: React.FC = () => {
  const actions = [
    {
      href: '/inventario',
      icon: 'inventory_2',
      title: 'Gestionar Inventario',
      description: 'Administrar productos y stock',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-800'
    },
    {
      href: '/ventas',
      icon: 'point_of_sale',
      title: 'Nueva Venta',
      description: 'Registrar una nueva venta',
      color: 'bg-green-50 hover:bg-green-100 border-green-200',
      iconColor: 'text-green-600',
      textColor: 'text-green-800'
    },
    {
      href: '/usuarios',
      icon: 'people',
      title: 'Gestionar Usuarios',
      description: 'Administrar usuarios del sistema',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
      iconColor: 'text-purple-600',
      textColor: 'text-purple-800'
    },
    {
      href: '/reportes',
      icon: 'analytics',
      title: 'Ver Reportes',
      description: 'Análisis y estadísticas',
      color: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
      iconColor: 'text-orange-600',
      textColor: 'text-orange-800'
    },
    {
      href: '/categorias',
      icon: 'category',
      title: 'Categorías',
      description: 'Gestionar categorías de productos',
      color: 'bg-pink-50 hover:bg-pink-100 border-pink-200',
      iconColor: 'text-pink-600',
      textColor: 'text-pink-800'
    },
    {
      href: '/proveedores',
      icon: 'local_shipping',
      title: 'Proveedores',
      description: 'Administrar proveedores',
      color: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200',
      iconColor: 'text-indigo-600',
      textColor: 'text-indigo-800'
    }
  ];

  return (
    <div className="bg-card rounded-xl shadow-app border border-app p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="material-icons text-primary text-2xl">bolt</span>
        <div>
          <h3 className="text-lg font-semibold text-card">Acciones Rápidas</h3>
          <p className="text-sm text-muted">Accesos directos a funciones principales</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {actions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all border ${action.color}`}
          >
            <div className={`p-2 rounded-lg bg-white/50 ${action.iconColor}`}>
              <span className="material-icons text-lg">
                {action.icon}
              </span>
            </div>
            <div className="flex-1">
              <p className={`font-medium text-sm ${action.textColor}`}>
                {action.title}
              </p>
              <p className="text-xs text-gray-600">
                {action.description}
              </p>
            </div>
            <span className={`material-icons text-sm ${action.iconColor}`}>
              arrow_forward_ios
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};
