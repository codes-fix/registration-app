import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from './DashboardLayout'
import StatsCard from './StatsCard'
import { createClient } from '@/lib/supabase/client'

export default function OrganizerDashboard({ user, profile }) {
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalRegistrations: 0,
    totalRevenue: 0
  })
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const navigation = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'My Events', href: '/organizer/events' },
    { label: 'Create Event', href: '/events/create' }
  ]

  useEffect(() => {
    loadData()
  }, [user.id])

  const loadData = async () => {
    const supabase = createClient()
    
    try {
      // Get organizer's events
      const { data: eventsData } = await supabase
        .from('events')
        .select(`
          *,
          registrations:registrations(count),
          ticket_types:ticket_types(*)
        `)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })

      setEvents(eventsData || [])

      // Calculate stats
      const now = new Date()
      const activeEvents = eventsData?.filter(e => 
        e.status === 'published' || e.status === 'registration_open'
      ).length || 0

      setStats({
        totalEvents: eventsData?.length || 0,
        activeEvents,
        totalRegistrations: 0, // Calculate from registrations
        totalRevenue: 0 // Calculate from payments
      })
    } catch (error) {
      console.error('Error loading organizer data:', error)
    } finally {
      setLoading(false)
    }
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
              <p className="text-gray-600 mt-1">Manage your events and track registrations</p>
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
          />
          <StatsCard
            title="Active Events"
            value={stats.activeEvents}
            icon="📅"
            color="secondary"
          />
          <StatsCard
            title="Total Registrations"
            value={stats.totalRegistrations}
            icon="👥"
            color="accent"
          />
          <StatsCard
            title="Total Revenue"
            value={`$${stats.totalRevenue}`}
            icon="💰"
            color="success"
          />
        </div>

        {/* My Events */}
        <div className="bg-white rounded-lg shadow-sm border border-green-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">My Events</h3>
          </div>
          
          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : events.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {events.map((event) => (
                <div key={event.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-gray-900">{event.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(event.start_date).toLocaleDateString()}
                      </p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                        event.status === 'published' ? 'bg-green-100 text-green-800' :
                        event.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {event.status}
                      </span>
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">No events yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first event.</p>
              <div className="mt-6">
                <Link href="/events/create" className="btn-primary">
                  + Create Event
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}