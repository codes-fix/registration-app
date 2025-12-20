// components/dashboard/AdminDashboard.js

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from './DashboardLayout'
import StatsCard from './StatsCard'
import { EventIcon, UsersIcon, ClockIcon, MoneyIcon, CalendarIcon, TrendingUpIcon, LocationIcon, ChartIcon } from '@/components/ui/Icons'

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
  { label: 'Organizers', href: '/admin/organizers' },
  { label: 'Admins', href: '/admin/admins' },
  { label: 'Attendees', href: '/admin/attendees' },
  { label: 'Events', href: '/events' },
  { label: 'Reports', href: '/admin/reports' }
]

  useEffect(() => {
    loadData()
  }, [])

const loadData = async () => {
  try {
    // Get all stats from admin API (uses service role, bypasses RLS)
    const statsResponse = await fetch('/api/admin/stats')
    
    if (!statsResponse.ok) {
      throw new Error(`API error: ${statsResponse.status}`)
    }

    const statsData = await statsResponse.json()

    setStats({
      totalEvents: statsData.totalEvents || 0,
      activeEvents: statsData.activeEvents || 0,
      upcomingEvents: statsData.upcomingEvents || 0,
      totalUsers: statsData.totalUsers || 0,
      totalRevenue: statsData.totalRevenue || 0,
      totalRegistrations: statsData.totalRegistrations || 0,
      recentRegistrations: statsData.recentRegistrations || 0,
      pendingOrganizers: statsData.pendingOrganizers || 0
    })

    // Set recent activity
    setRecentActivity(statsData.recentActivity || [])

    // Set upcoming events
    setUpcomingEvents(statsData.upcomingEventsList || [])

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
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500 rounded-2xl shadow-2xl p-8 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-4xl font-bold">
                  Welcome back, {profile.first_name}!
                </h2>
              </div>
              <p className="text-white/90 text-lg ml-15">
                Manage your platform and monitor event performance in real-time.
              </p>
            </div>
            <Link href="/events/create" className="bg-white text-primary-600 hover:bg-white/90 font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 hover:shadow-2xl hover:-translate-y-1 flex items-center gap-2 group">
              <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Event
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Events"
            value={stats.totalEvents}
            IconComponent={EventIcon}
            color="primary"
            subtitle={`${stats.activeEvents} active`}
          />
          <StatsCard
            title="Total Users"
            value={stats.totalUsers}
            IconComponent={UsersIcon}
            color="secondary"
            subtitle="registered users"
          />
          <StatsCard
            title="Pending Organizers"
            value={stats.pendingOrganizers}
            IconComponent={ClockIcon}
            color="warning"
            subtitle="awaiting approval"
            trend={stats.pendingOrganizers > 0 ? { direction: 'up', value: 'Needs attention' } : null}
          />
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            IconComponent={MoneyIcon}
            color="accent"
            subtitle={`${stats.totalRegistrations} registrations`}
          />
          <StatsCard
            title="Upcoming Events"
            value={stats.upcomingEvents}
            IconComponent={CalendarIcon}
            color="success"
            subtitle={`${stats.recentRegistrations} recent reg.`}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-white to-primary-50 rounded-xl shadow-lg border border-primary-100">
            <div className="p-6 border-b border-primary-100/50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center mr-3 shadow-md">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </span>
                Quick Actions
              </h3>
            </div>
            <div className="p-6 grid grid-cols-2 gap-3">
              <Link href="/admin/organizers" className="group flex flex-col items-center justify-center p-4 rounded-xl border-2 border-primary-200 hover:border-primary-400 bg-white hover:bg-primary-50 transition-all duration-200 hover:shadow-md">
                <UsersIcon className="w-8 h-8 text-primary-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-700 text-center">Manage Organizers</span>
              </Link>
              <Link href="/admin/admins" className="group flex flex-col items-center justify-center p-4 rounded-xl border-2 border-purple-200 hover:border-purple-400 bg-white hover:bg-purple-50 transition-all duration-200 hover:shadow-md">
                <UsersIcon className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-700 text-center">Manage Admins</span>
              </Link>
              <Link href="/admin/attendees" className="group flex flex-col items-center justify-center p-4 rounded-xl border-2 border-blue-200 hover:border-blue-400 bg-white hover:bg-blue-50 transition-all duration-200 hover:shadow-md">
                <UsersIcon className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-700 text-center">Manage Attendees</span>
              </Link>
              <Link href="/events/create" className="group flex flex-col items-center justify-center p-4 rounded-xl border-2 border-secondary-200 hover:border-secondary-400 bg-white hover:bg-secondary-50 transition-all duration-200 hover:shadow-md">
                <EventIcon className="w-8 h-8 text-secondary-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-700 text-center">Create Event</span>
              </Link>
              <Link href="/events" className="group flex flex-col items-center justify-center p-4 rounded-xl border-2 border-accent-200 hover:border-accent-400 bg-white hover:bg-accent-50 transition-all duration-200 hover:shadow-md">
                <CalendarIcon className="w-8 h-8 text-accent-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-700 text-center">Manage Events</span>
              </Link>
              <Link href="/reports" className="group flex flex-col items-center justify-center p-4 rounded-xl border-2 border-green-200 hover:border-green-400 bg-white hover:bg-green-50 transition-all duration-200 hover:shadow-md">
                <TrendingUpIcon className="w-8 h-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-700 text-center">View Reports</span>
              </Link>
            </div>
          </div>

{/* Recent Activity */}
<div className="bg-gradient-to-br from-white to-secondary-50 rounded-xl shadow-lg border border-secondary-100">
  <div className="p-6 border-b border-secondary-100/50">
    <div className="flex items-center justify-between">
      <h3 className="text-xl font-bold text-gray-900 flex items-center">
        <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary-500 to-secondary-600 text-white flex items-center justify-center mr-3 shadow-md">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </span>
        Recent Registrations
      </h3>
      <Link href="/registrations" className="text-sm font-semibold text-secondary-600 hover:text-secondary-700 flex items-center">
        View All 
        <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  </div>
  {loading ? (
    <div className="p-6">
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg"></div>
        ))}
      </div>
    </div>
  ) : recentActivity.length > 0 ? (
    <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
      {recentActivity.map((activity, index) => (
        <div key={index} className="p-4 hover:bg-white/80 transition-colors">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold">
                  {activity.user?.first_name?.charAt(0) || 'U'}
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {activity.user?.first_name} {activity.user?.last_name}
                </p>
              </div>
              <p className="text-xs text-gray-600 ml-10 mb-1">
                {activity.event?.title}
              </p>
              <div className="flex items-center gap-2 ml-10">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                  {activity.status}
                </span>
                <p className="text-xs text-gray-500">
                  {formatDateTime(activity.created_at)}
                </p>
              </div>
            </div>
            <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
              {formatCurrency(activity.total_amount || 0)}
            </span>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="p-12 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <p className="text-gray-600 font-medium">No recent registrations</p>
    </div>
  )}
</div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-gradient-to-br from-white to-accent-50 rounded-xl shadow-lg border border-accent-100">
          <div className="p-6 border-b border-accent-100/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 text-white flex items-center justify-center mr-3 shadow-md">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </span>
                Upcoming Events
              </h3>
              <Link href="/events" className="text-sm font-semibold text-accent-600 hover:text-accent-700 flex items-center">
                View All
                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="p-5 hover:bg-white/80 transition-all duration-200 group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white shadow-md">
                          <CalendarIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-gray-900 group-hover:text-accent-600 transition-colors">{event.name}</h4>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(event.status)}`}>
                            {event.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 ml-12 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          {formatDate(event.start_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <LocationIcon className="w-4 h-4" />
                          {event.venue || event.city || 'TBA'}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/events/${event.id}`}
                      className="ml-4 px-4 py-2 bg-accent-100 text-accent-700 hover:bg-accent-200 text-sm font-semibold rounded-lg transition-colors flex items-center gap-1"
                    >
                      Manage
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <CalendarIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">No upcoming events</h3>
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
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg">
                <ChartIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">System Overview</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-primary-50 to-white p-6 rounded-xl border border-primary-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full">
                    <UsersIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                    {stats.totalEvents > 0 ? ((stats.totalRegistrations / stats.totalEvents) || 0).toFixed(1) : '0.0'}
                  </div>
                  <div className="text-sm text-gray-600 mt-2 font-medium">Avg. Registrations per Event</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-secondary-50 to-white p-6 rounded-xl border border-secondary-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-full">
                    <MoneyIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-secondary-600 to-secondary-700 bg-clip-text text-transparent">
                    {formatCurrency(stats.totalEvents > 0 ? (stats.totalRevenue / stats.totalEvents) : 0)}
                  </div>
                  <div className="text-sm text-gray-600 mt-2 font-medium">Avg. Revenue per Event</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-accent-50 to-white p-6 rounded-xl border border-accent-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full">
                    <TrendingUpIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-accent-600 to-accent-700 bg-clip-text text-transparent">
                    {((stats.activeEvents / Math.max(stats.totalEvents, 1)) * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-600 mt-2 font-medium">Active Events Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}