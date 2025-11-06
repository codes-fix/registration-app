import Link from 'next/link'
import { signOut } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export default function DashboardLayout({ children, user, profile, navigation = [] }) {
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-accent text-white',
      speaker: 'bg-secondary text-white',
      staff: 'bg-primary text-white',
      volunteer: 'bg-primary text-white',
      attendee: 'bg-gray-100 text-gray-800',
      guest: 'bg-gray-100 text-gray-800'
    }
    return colors[role] || colors.attendee
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <h1 className="text-2xl font-bold text-primary cursor-pointer">EventReg</h1>
              </Link>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(profile.role)}`}>
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </span>
            </div>

            <div className="flex items-center space-x-6">
              {/* Navigation */}
              <nav className="hidden md:flex space-x-6">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-gray-600 hover:text-primary font-medium transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              {/* User menu */}
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {profile.first_name} {profile.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{profile.email}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Link 
                    href="/profile"
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Profile"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                  
                  <Link 
                    href="/settings"
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Settings"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </Link>
                  
                  <button
                    onClick={handleSignOut}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                    title="Sign Out"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}