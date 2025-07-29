import React from 'react';

interface Trend {
  value: number;
  isPositive: boolean;
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  description?: string;
  trend?: Trend;
  color?: 'primary' | 'success' | 'info' | 'warning' | 'danger';
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  color = 'primary',
  className = ''
}) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'danger':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case 'success':
        return 'text-green-600';
      case 'info':
        return 'text-blue-600';
      case 'warning':
        return 'text-yellow-600';
      case 'danger':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`bg-card rounded-xl shadow-app border border-app p-6 transition-all ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${getColorClasses(color)}`}>
          <span className={`material-icons text-2xl ${getIconColor(color)}`}>
            {icon}
          </span>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <span className="material-icons text-sm">
              {trend.isPositive ? 'trending_up' : 'trending_down'}
            </span>
            <span>{trend.value}%</span>
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-muted mb-1">{title}</h3>
        <p className="text-2xl font-bold text-card mb-2">{value}</p>
        {description && (
          <p className="text-xs text-muted">{description}</p>
        )}
      </div>
    </div>
  );
};
