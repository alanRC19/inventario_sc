"use client"

export interface Activity {
  icon: string;
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

export const ActivityItem = ({ icon, title, description, timestamp, status = 'info' }: Activity) => {
  const statusColors = {
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200'
  }

  return (
    <div className={`flex items-start gap-4 p-4 rounded-lg border ${statusColors[status]}`}>
      <div className="rounded-full p-2 bg-white/50">
        <span className="material-icons">{icon}</span>
      </div>
      <div className="flex-grow">
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm opacity-80">{description}</p>
        <span className="text-xs opacity-60">{timestamp}</span>
      </div>
    </div>
  )
}

interface RecentActivitiesProps {
  activities: Activity[]
}

export const RecentActivities = ({ activities }: RecentActivitiesProps) => {
  return (
    <div className="bg-card rounded-xl shadow-app border border-app p-6">
      <h3 className="text-lg font-semibold mb-4">Actividad Reciente</h3>
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <ActivityItem key={index} {...activity} />
        ))}
      </div>
    </div>
  )
}
