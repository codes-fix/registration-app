import { useState, useEffect } from 'react'
import DashboardLayout from './DashboardLayout'
import StatsCard from './StatsCard'
import { createClient } from '@/lib/supabase/client'

export default function AttendeeDashboard({ user, profile }) {
  const [stats, setStats] = useState({
    registrations: 0,
    upcomingEvents: 0,
    completedEvents: 0
  })
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)

  const navigation = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Browse Events', href: '/events' },
    { label: 'My Registrations', href: '/registrations' }
  ]

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      
      try {
        // Get user registrations
        const { data: userRegistrations } = await supabase
          .from('registrations')
          .select(`
            *,
            event:events(*),
            ticket_type:ticket_types(*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        setRegistrations(userRegistrations || [])

        // Calculate stats
        const now = new Date()
        const upcoming = userRegistrations?.filter(reg => 
          new Date(reg.event.start_date) > now
        ).length || 0
        
        const completed = userRegistrations?.filter(reg => 
          new Date(reg.event.end_date) < now
        ).length || 0

        setStats({
          registrations: userRegistrations?.length || 0,
          upcomingEvents: upcoming,
          completedEvents: completed
        })
      } catch (error) {
        console.error('Error loading attendee data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user.id])

  return (
    <DashboardLayout user={user} profile={profile} navigation={navigation}>
      <div className="space-y-8">
        {/* Welcome section */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-green-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {profile.first_name}!
          </h2>
          <p className="text-gray-600">
            Manage your event registrations and discover new events.
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Total Registrations"
            value={stats.registrations}
            icon="📋"
            color="primary"
          />
          <StatsCard
            title="Upcoming Events"
            value={stats.upcomingEvents}
            icon="📅"
            color="secondary"
          />
          <StatsCard
            title="Completed Events"
            value={stats.completedEvents}
            icon="✅"
            color="accent"
          />
        </div>

        {/* Recent registrations */}
        <div className="bg-white rounded-lg shadow-sm border border-green-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">My Registrations</h3>
          </div>
          
          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : registrations.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {registrations.slice(0, 5).map((registration) => (
                <div key={registration.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {registration.event.title}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(registration.event.start_date).toLocaleDateString()} • 
                        {registration.ticket_type.name}
                      </p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                        registration.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        registration.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {registration.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ${registration.total_amount}
                      </p>
                      {registration.confirmation_code && (
                        <p className="text-xs text-gray-500">
                          {registration.confirmation_code}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500 mb-4">No registrations yet</p>
              <a 
                href="/events" 
                className="btn-primary inline-flex items-center"
              >
                Browse Events
              </a>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-green-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <a href="/events" className="block w-full btn-primary text-center">
                Find Events
              </a>
              <a href="/profile" className="block w-full btn-outline text-center">
                Update Profile
              </a>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-green-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
            <div className="space-y-3">
              <a href="/support" className="block text-primary hover:text-primary-600">
                Contact Support
              </a>
              <a href="/faq" className="block text-primary hover:text-primary-600">
                View FAQ
              </a>
              <a href="/docs" className="block text-primary hover:text-primary-600">
                User Guide
              </a>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}