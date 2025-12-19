// components/dashboard/AdminDashboard.js

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from './DashboardLayout'
import StatsCard from './StatsCard'
import { createClient } from '@/lib/supabase/client'

export default function AdminDashboard({ user, profile }) {
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    upcomingEvents: 0,
    totalUsers: 0,
    totalRevenue: 0,
    totalRegistrations: 0,
    recentRegistrations: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const navigation = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Event Management', href: '/events' },
    { label: 'Users', href: '/users' },
    { label: 'Reports', href: '/reports' }
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()
    
    try {
      // Get events stats
      const [eventsCount, usersCount, registrationsData, eventsData] = await Promise.all([
        supabase.from('events').select('*', { count: 'exact' }),
        supabase.from('user_profiles').select('*', { count: 'exact' }),
        supabase.from('registrations').select('total_amount, created_at, status, event:events(title, start_date), user_profiles!registrations_user_id_fkey(first_name, last_name)').order('created_at', { ascending: false }).limit(10),
        supabase.from('events').select('*').order('start_date', { ascending: true })
      ])

      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      // Calculate stats
      const allEvents = eventsData.data || []
      const activeEvents = allEvents.filter(e => 
        e.status === 'published' || e.status === 'registration_open'
      ).length
      
      const upcomingEventsCount = allEvents.filter(e => 
        new Date(e.start_date) > now
      ).length

      const totalRevenue = registrationsData.data?.reduce((sum, reg) => 
        sum + (reg.total_amount || 0), 0
      ) || 0

      const recentRegs = registrationsData.data?.filter(r => 
        new Date(r.created_at) > sevenDaysAgo
      ).length || 0

      setStats({
        totalEvents: eventsCount.count || 0,
        activeEvents,
        upcomingEvents: upcomingEventsCount,
        totalUsers: usersCount.count || 0,
        totalRevenue: totalRevenue,
        totalRegistrations: registrationsData.data?.length || 0,
        recentRegistrations: recentRegs
      })

      // Set recent activity
      setRecentActivity(registrationsData.data?.slice(0, 5) || [])

      // Set upcoming events
      const upcoming = allEvents
        .filter(e => new Date(e.start_date) > now)
        .slice(0, 5)
      setUpcomingEvents(upcoming)

    } catch (error) {
      console.error('Error loading admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      published: 'bg-green-100 text-green-800',
      registration_open: 'bg-blue-100 text-blue-800',
      registration_closed: 'bg-yellow-100 text-yellow-800',
      ongoing: 'bg-purple-100 text-purple-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800'
    }
    return colors[status] || colors.draft
  }

  return (
    <DashboardLayout user={user} profile={profile} navigation={navigation}>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome back, {profile.first_name}!
              </h2>
              <p className="text-gray-600 mt-1">
                Here's what's happening with your events today.
              </p>
            </div>
            <Link href="/events/create" className="btn-primary">
              + Create Event
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Events"
            value={stats.totalEvents}
            icon="🎪"
            color="primary"
            subtitle={`${stats.activeEvents} active`}
          />
          <StatsCard
            title="Total Users"
            value={stats.totalUsers}
            icon="👥"
            color="secondary"
            subtitle="registered users"
          />
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon="💰"
            color="accent"
            subtitle={`${stats.totalRegistrations} registrations`}
          />
          <StatsCard
            title="Upcoming Events"
            value={stats.upcomingEvents}
            icon="📅"
            color="success"
            subtitle={`${stats.recentRegistrations} recent reg.`}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-green-100">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <Link href="/events/create" className="btn-primary text-center">
                Create Event
              </Link>
              <Link href="/events" className="btn-secondary text-center">
                Manage Events
              </Link>
              <Link href="/users" className="btn-accent text-center">
                Manage Users
              </Link>
              <Link href="/reports" className="btn-outline text-center">
                View Reports
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-green-100">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Registrations</h3>
                <Link href="/registrations" className="text-sm text-primary hover:text-primary-600">
                  View All →
                </Link>
              </div>
            </div>
            {loading ? (
              <div className="p-6">
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.user_profiles?.first_name} {activity.user_profiles?.last_name}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {activity.event?.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                            {activity.status}
                          </span>
                          <p className="text-xs text-gray-500">
                            {formatDateTime(activity.created_at)}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(activity.total_amount || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No recent registrations
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-lg shadow-sm border border-green-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
              <Link href="/events" className="text-sm text-primary hover:text-primary-600">
                View All →
              </Link>
            </div>
          </div>
          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-base font-semibold text-gray-900">{event.title}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(event.status)}`}>
                          {event.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center">
                          📅 {formatDate(event.start_date)}
                        </span>
                        <span className="flex items-center">
                          {event.is_virtual ? '🌐 Virtual' : `📍 ${event.venue_city || 'TBA'}`}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/events/${event.id}/manage`}
                      className="ml-4 text-primary hover:text-primary-600 text-sm font-medium"
                    >
                      Manage →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming events</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new event.</p>
              <div className="mt-6">
                <Link href="/events/create" className="btn-primary">
                  + Create Event
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* System Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-green-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">System Overview</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {stats.totalEvents > 0 ? ((stats.totalRegistrations / stats.totalEvents) || 0).toFixed(1) : '0.0'}
                </div>
                <div className="text-sm text-gray-600 mt-1">Avg. Registrations per Event</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary">
                  {formatCurrency(stats.totalEvents > 0 ? (stats.totalRevenue / stats.totalEvents) : 0)}
                </div>
                <div className="text-sm text-gray-600 mt-1">Avg. Revenue per Event</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">
                  {((stats.activeEvents / Math.max(stats.totalEvents, 1)) * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600 mt-1">Active Events Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}