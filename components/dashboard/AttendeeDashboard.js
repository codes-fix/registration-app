import { useState, useEffect } from 'react'
import DashboardLayout from './DashboardLayout'
import StatsCard from './StatsCard'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { TicketIcon, CalendarIcon, CheckCircleIcon, SearchIcon, UserIcon, EmptyStateIcon, LocationIcon, EventIcon } from '@/components/ui/Icons'

export default function AttendeeDashboard({ user, profile }) {
  const [stats, setStats] = useState({
    registrations: 0,
    upcomingEvents: 0,
    completedEvents: 0
  })
  const [registrations, setRegistrations] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
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

        // Get upcoming available events (approved and published)
        const now = new Date().toISOString()
        const { data: availableEvents } = await supabase
          .from('events')
          .select('*')
          .eq('approval_status', 'approved')
          .eq('status', 'published')
          .gte('start_date', now)
          .order('start_date', { ascending: true })
          .limit(5)

        setUpcomingEvents(availableEvents || [])

        // Calculate stats
        const upcoming = userRegistrations?.filter(reg => 
          new Date(reg.event.start_date) > new Date()
        ).length || 0
        
        const completed = userRegistrations?.filter(reg => 
          new Date(reg.event.end_date) < new Date()
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

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <DashboardLayout user={user} profile={profile} navigation={navigation}>
      <div className="space-y-8">
        {/* Welcome section */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-lg p-6 border border-primary-400 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-2">
              Welcome back, {profile.first_name}!
            </h2>
            <p className="text-primary-100">
              Manage your event registrations and discover new events.
            </p>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Total Registrations"
            value={stats.registrations}
            IconComponent={TicketIcon}
            color="primary"
          />
          <StatsCard
            title="Upcoming Events"
            value={stats.upcomingEvents}
            IconComponent={CalendarIcon}
            color="secondary"
          />
          <StatsCard
            title="Completed Events"
            value={stats.completedEvents}
            IconComponent={CheckCircleIcon}
            color="accent"
          />
        </div>

        {/* Upcoming Available Events */}
        <div className="bg-gradient-to-br from-white to-secondary-50 rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-secondary-50 to-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-lg">
                  <EventIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
              </div>
              <Link href="/events" className="text-sm text-secondary-600 hover:text-secondary-700 font-medium">
                View All →
              </Link>
            </div>
          </div>
          
          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg"></div>
                ))}
              </div>
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="p-6 hover:bg-gradient-to-r hover:from-secondary-50 hover:to-white transition-all duration-200 group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gradient-to-br from-secondary-100 to-secondary-50 rounded-lg group-hover:from-secondary-200 group-hover:to-secondary-100 transition-colors">
                          <CalendarIcon className="w-4 h-4 text-secondary-600" />
                        </div>
                        <h4 className="text-base font-semibold text-gray-900">{event.name}</h4>
                        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                          event.is_virtual ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {event.is_virtual ? 'Virtual' : 'In-Person'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 ml-11 mb-2 line-clamp-2">{event.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 ml-11">
                        <span className="flex items-center gap-1.5">
                          <CalendarIcon className="w-4 h-4" />
                          {formatDate(event.start_date)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <LocationIcon className="w-4 h-4" />
                          {event.is_virtual ? (event.virtual_platform || 'Online') : (event.city || event.venue)}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/events/${event.id}`}
                      className="ml-4 inline-flex items-center gap-1.5 px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 hover:shadow-md transition-all text-sm font-medium"
                    >
                      View Details
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
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                <EmptyStateIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4 font-medium">No upcoming events available</p>
              <Link 
                href="/events" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 hover:shadow-lg transition-all duration-200 font-medium"
              >
                <SearchIcon className="w-5 h-5" />
                Browse All Events
              </Link>
            </div>
          )}
        </div>

        {/* Recent registrations */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg">
                  <TicketIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">My Registrations</h3>
              </div>
              {registrations.length > 0 && (
                <Link href="/registrations" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  View All →
                </Link>
              )}
            </div>
          </div>
          
          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg"></div>
                ))}
              </div>
            </div>
          ) : registrations.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {registrations.slice(0, 5).map((registration) => (
                <div key={registration.id} className="p-6 hover:bg-gradient-to-r hover:from-primary-50 hover:to-white transition-all duration-200 group">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gradient-to-br from-primary-100 to-primary-50 rounded-lg group-hover:from-primary-200 group-hover:to-primary-100 transition-colors">
                          <CalendarIcon className="w-4 h-4 text-primary-600" />
                        </div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {registration.event.name || registration.event.title}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-500 ml-11">
                        {formatDate(registration.event.start_date)} • 
                        {registration.ticket_type?.name || 'General Admission'}
                      </p>
                      <span className={`inline-flex items-center ml-11 px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                        registration.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        registration.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {registration.status}
                      </span>
                    </div>
                    <div className="text-right bg-gradient-to-br from-secondary-50 to-white px-4 py-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">
                        ${registration.total_amount || '0.00'}
                      </p>
                      {registration.confirmation_code && (
                        <p className="text-xs text-gray-500 mt-1">
                          {registration.confirmation_code}
                        </p>
                      )}
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
              <p className="text-gray-500 mb-4 font-medium">No registrations yet</p>
              <Link 
                href="/events" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 hover:shadow-lg transition-all duration-200 font-medium"
              >
                <SearchIcon className="w-5 h-5" />
                Browse Events
              </Link>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-white to-primary-50 rounded-xl shadow-md p-6 border border-primary-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg">
                <SearchIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="space-y-3">
              <Link href="/events" className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 font-medium">
                <SearchIcon className="w-5 h-5" />
                Find Events
              </Link>
              <Link href="/profile" className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white text-primary-600 border-2 border-primary-300 rounded-lg hover:bg-primary-50 hover:shadow-md transition-all duration-200 font-medium">
                <UserIcon className="w-5 h-5" />
                Update Profile
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-secondary-50 rounded-xl shadow-md p-6 border border-secondary-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Need Help?</h3>
            </div>
            <div className="space-y-2">
              <a href="/support" className="flex items-center gap-2 p-3 rounded-lg bg-white hover:bg-secondary-100 transition-colors text-gray-700 hover:text-secondary-700">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Support
              </a>
              <a href="/faq" className="flex items-center gap-2 p-3 rounded-lg bg-white hover:bg-secondary-100 transition-colors text-gray-700 hover:text-secondary-700">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View FAQ
              </a>
              <a href="/docs" className="flex items-center gap-2 p-3 rounded-lg bg-white hover:bg-secondary-100 transition-colors text-gray-700 hover:text-secondary-700">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                User Guide
              </a>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}