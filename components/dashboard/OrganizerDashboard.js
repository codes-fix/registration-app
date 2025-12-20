import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from './DashboardLayout'
import StatsCard from './StatsCard'
import { createClient } from '@/lib/supabase/client'
import { EventIcon, CalendarIcon, UsersIcon, MoneyIcon, EmptyStateIcon, PlusIcon, WaveIcon, EditIcon, EyeIcon } from '@/components/ui/Icons'

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
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-lg p-6 border border-primary-400 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-full">
                <WaveIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Welcome back, {profile.first_name}!
                </h2>
                <p className="text-primary-100 mt-1">Manage your events and track registrations</p>
              </div>
            </div>
            <Link href="/events/create" className="inline-flex items-center gap-2 px-4 py-2 bg-white text-primary-600 rounded-lg hover:bg-primary-50 hover:shadow-lg transition-all duration-200 font-medium">
              <PlusIcon className="w-5 h-5" />
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
          />
          <StatsCard
            title="Active Events"
            value={stats.activeEvents}
            IconComponent={CalendarIcon}
            color="secondary"
          />
          <StatsCard
            title="Total Registrations"
            value={stats.totalRegistrations}
            IconComponent={UsersIcon}
            color="accent"
          />
          <StatsCard
            title="Total Revenue"
            value={`$${stats.totalRevenue}`}
            IconComponent={MoneyIcon}
            color="success"
          />
        </div>

        {/* My Events */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg">
                  <EventIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">My Events</h3>
              </div>
              <Link href="/organizer/events" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                View All →
              </Link>
            </div>
          </div>
          
          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg"></div>
                ))}
              </div>
            </div>
          ) : events.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {events.slice(0, 5).map((event) => (
                <div key={event.id} className="p-6 hover:bg-gradient-to-r hover:from-primary-50 hover:to-white transition-all duration-200 group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gradient-to-br from-primary-100 to-primary-50 rounded-lg group-hover:from-primary-200 group-hover:to-primary-100 transition-colors">
                          <CalendarIcon className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-base font-semibold text-gray-900">{event.name || event.title}</h4>
                          <p className="text-sm text-gray-500">
                            {new Date(event.start_date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-11">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          event.status === 'published' ? 'bg-green-100 text-green-800' :
                          event.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {event.status}
                        </span>
                        {event.approval_status === 'pending_approval' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending Approval
                          </span>
                        )}
                        {event.approval_status === 'approved' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Approved
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/events/${event.id}/edit`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 hover:shadow-md transition-all text-sm font-medium whitespace-nowrap"
                      >
                        <EditIcon className="w-4 h-4" />
                        Edit
                      </Link>
                      <Link
                        href={`/events/${event.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 hover:shadow-md transition-all text-sm font-medium whitespace-nowrap"
                      >
                        <EyeIcon className="w-4 h-4" />
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                <EmptyStateIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">No events yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first event.</p>
              <div className="mt-6">
                <Link href="/events/create" className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 hover:shadow-lg transition-all duration-200 font-medium">
                  <PlusIcon className="w-5 h-5" />
                  Create Event
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}