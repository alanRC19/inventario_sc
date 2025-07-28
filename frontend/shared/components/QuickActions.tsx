"use client"

interface QuickActionProps {
  icon: string
  title: string
  onClick: () => void
  description?: string
  color?: string
}

export const QuickAction = ({ icon, title, description, onClick, color = "bg-primary" }: QuickActionProps) => {
  return (
    <button
      onClick={onClick}
      className={`${color} text-white p-4 rounded-xl flex items-center gap-3 hover:opacity-90 transition-opacity w-full`}
    >
      <span className="material-icons">{icon}</span>
      <div className="text-left">
        <h4 className="font-medium">{title}</h4>
        {description && <p className="text-sm opacity-80">{description}</p>}
      </div>
    </button>
  )
}

interface QuickActionsProps {
  actions: Omit<QuickActionProps, 'color'>[]
}

export const QuickActions = ({ actions }: QuickActionsProps) => {
  const colors = [
    'bg-primary',
    'bg-secondary',
    'bg-accent',
    'bg-success'
  ]

  return (
    <div className="bg-card rounded-xl shadow-app border border-app p-6">
      <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((action, index) => (
          <QuickAction
            key={index}
            {...action}
            color={colors[index % colors.length]}
          />
        ))}
      </div>
    </div>
  )
}
