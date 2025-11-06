import { useState, useEffect } from 'react'
import DashboardLayout from './DashboardLayout'
import StatsCard from './StatsCard'
import { createClient } from '@/lib/supabase/client'

export default function AdminDashboard({ user, profile }) {
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalUsers: 0,
    totalRevenue: 0,
    totalRegistrations: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  const navigation = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Events', href: '/events' },
    { label: 'Admin Panel', href: '/admin/events' },
    { label: 'Users', href: '/admin/users' },
    { label: 'Reports', href: '/admin/reports' }
  ]

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      
      try {
        // Get basic stats
        const [eventsCount, usersCount, registrationsData] = await Promise.all([
          supabase.from('events').select('*', { count: 'exact' }),
          supabase.from('user_profiles').select('*', { count: 'exact' }),
          supabase.from('registrations').select('total_amount, created_at, event:events(title)')
        ])

        const totalRevenue = registrationsData.data?.reduce((sum, reg) => sum + (reg.total_amount || 0), 0) || 0

        setStats({
          totalEvents: eventsCount.count || 0,
          totalUsers: usersCount.count || 0,
          totalRevenue: totalRevenue,
          totalRegistrations: registrationsData.data?.length || 0
        })

        // Get recent activity
        setRecentActivity(registrationsData.data?.slice(0, 5) || [])
      } catch (error) {
        console.error('Error loading admin data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <DashboardLayout user={user} profile={profile} navigation={navigation}>
      <div className="space-y-8">
        {/* Welcome section */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-green-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h2>
          <p className="text-gray-600">
            Manage events, users, and system settings.
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Events"
            value={stats.totalEvents}
            icon="🎪"
            color="primary"
          />
          <StatsCard
            title="Total Users"
            value={stats.totalUsers}
            icon="👥"
            color="secondary"
          />
          <StatsCard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            icon="💰"
            color="accent"
          />
          <StatsCard
            title="Registrations"
            value={stats.totalRegistrations}
            icon="📝"
            color="success"
          />
        </div>

        {/* Quick actions and recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick actions */}
          <div className="bg-white rounded-lg shadow-sm border border-green-100">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <a href="/admin/events/create" className="btn-primary text-center">
                Create Event
              </a>
              <a href="/admin/users" className="btn-secondary text-center">
                Manage Users
              </a>
              <a href="/admin/reports" className="btn-accent text-center">
                View Reports
              </a>
              <a href="/admin/settings" className="btn-outline text-center">
                System Settings
              </a>
            </div>
          </div>

          {/* Recent activity */}
          <div className="bg-white rounded-lg shadow-sm border border-green-100">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Registrations</h3>
            </div>
            {loading ? (
              <div className="p-6">
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {activity.event?.title || 'Unknown Event'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-green-600">
                        ${activity.total_amount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No recent activity
              </div>
            )}
          </div>
        </div>

        {/* System overview */}
        <div className="bg-white rounded-lg shadow-sm border border-green-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">System Overview</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {((stats.totalRegistrations / stats.totalEvents) || 0).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Avg. Registrations per Event</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">
                  ${((stats.totalRevenue / stats.totalEvents) || 0).toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">Avg. Revenue per Event</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">
                  {((stats.totalRegistrations / stats.totalUsers) || 0).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Avg. Registrations per User</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}