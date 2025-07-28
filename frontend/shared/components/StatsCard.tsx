"use client"

interface StatsCardProps {
  title: string
  value: string | number
  icon: string
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export const StatsCard = ({ title, value, icon, description, trend, className = "" }: StatsCardProps) => {
  return (
    <div className={`bg-card rounded-xl shadow-app border border-app p-6 hover:shadow-lg transition-all duration-300 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-grow">
          <p className="text-sm font-medium text-muted uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-card mt-2">
            {value}
          </p>
          {trend && (
            <div className={`flex items-center mt-2 ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
              <span className="material-icons text-sm">
                {trend.isPositive ? 'trending_up' : 'trending_down'}
              </span>
              <span className="text-sm ml-1">{trend.value}% vs mes anterior</span>
            </div>
          )}
        </div>
        <div className="bg-primary/10 p-3 rounded-lg">
          <span className="material-icons text-2xl text-primary">{icon}</span>
        </div>
      </div>
      {description && (
        <div className="mt-4">
          <p className="text-sm text-muted">
            {description}
          </p>
        </div>
      )}
    </div>
  )
}
