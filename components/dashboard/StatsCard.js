export default function StatsCard({ title, value, icon, IconComponent, color = 'primary', subtitle, trend }) {
  const colorClasses = {
    primary: 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-primary/20',
    secondary: 'bg-gradient-to-br from-secondary-500 to-secondary-600 text-white shadow-secondary/20',
    accent: 'bg-gradient-to-br from-accent-600 to-accent-700 text-white shadow-accent/20',
    success: 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-green/20',
    warning: 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-yellow/20',
    danger: 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-red/20'
  }

  const bgClasses = {
    primary: 'bg-primary-50',
    secondary: 'bg-secondary-50',
    accent: 'bg-accent-50',
    success: 'bg-green-50',
    warning: 'bg-yellow-50',
    danger: 'bg-red-50'
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-100 p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${bgClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center mt-3 text-sm font-medium ${
              trend.direction === 'up' ? 'text-green-600' : 
              trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {trend.direction === 'up' && (
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              )}
              {trend.direction === 'down' && (
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              )}
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        
        <div className={`w-14 h-14 rounded-xl ${colorClasses[color]} shadow-lg flex items-center justify-center`}>
          {IconComponent ? <IconComponent className="w-7 h-7" /> : <span className="text-3xl">{icon}</span>}
        </div>
      </div>
    </div>
  )
}