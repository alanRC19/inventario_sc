import React from 'react';
import { ActividadReciente } from '@/domain/reportes/reporte.types';

interface RecentActivitiesProps {
  activities: ActividadReciente[];
}

export const RecentActivities: React.FC<RecentActivitiesProps> = ({ activities }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-600 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-600 border-red-200';
      default:
        return 'bg-blue-100 text-blue-600 border-blue-200';
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-app border border-app p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="material-icons text-primary text-2xl">history</span>
        <div>
          <h3 className="text-lg font-semibold text-card">Actividades Recientes</h3>
          <p className="text-sm text-muted">Últimas operaciones del sistema</p>
        </div>
      </div>
      
      <div className="space-y-4 max-h-[400px] overflow-y-auto">
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className={`p-2 rounded-lg border ${getStatusColor(activity.status)}`}>
                <span className="material-icons text-sm">
                  {activity.icon}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-sm">
                  {activity.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {activity.timestamp}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-muted py-8">
            <span className="material-icons text-4xl mb-2 opacity-50">
              history
            </span>
            <p className="text-sm">No hay actividades registradas</p>
            <p className="text-xs text-gray-500 mt-1">
              Las actividades aparecerán aquí cuando se realicen operaciones
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
