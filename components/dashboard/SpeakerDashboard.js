import { useState, useEffect } from 'react'
import DashboardLayout from './DashboardLayout'
import StatsCard from './StatsCard'
import { createClient } from '@/lib/supabase/client'

export default function SpeakerDashboard({ user, profile }) {
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalSessions: 0
  })
  const [speakerEngagements, setSpeakerEngagements] = useState([])
  const [loading, setLoading] = useState(true)

  const navigation = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Events', href: '/events' },
    { label: 'My Events', href: '/speaker/events' },
    { label: 'Sessions', href: '/speaker/sessions' },
    { label: 'Materials', href: '/speaker/materials' }
  ]

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      
      try {
        // Get speaker engagements
        const { data: speakers } = await supabase
          .from('speakers')
          .select(`
            *,
            event:events(*)
          `)
          .eq('user_id', user.id)

        setSpeakerEngagements(speakers || [])

        // Calculate stats
        const now = new Date()
        const upcoming = speakers?.filter(speaker => 
          new Date(speaker.event.start_date) > now
        ).length || 0

        setStats({
          totalEvents: speakers?.length || 0,
          upcomingEvents: upcoming,
          totalSessions: 0 // TODO: Calculate from event_sessions
        })
      } catch (error) {
        console.error('Error loading speaker data:', error)
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
            Speaker Dashboard
          </h2>
          <p className="text-gray-600">
            Manage your speaking engagements, presentations, and materials.
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Total Events"
            value={stats.totalEvents}
            icon="🎤"
            color="primary"
          />
          <StatsCard
            title="Upcoming Events"
            value={stats.upcomingEvents}
            icon="📅"
            color="secondary"
          />
          <StatsCard
            title="Total Sessions"
            value={stats.totalSessions}
            icon="🎯"
            color="accent"
          />
        </div>

        {/* Speaking engagements */}
        <div className="bg-white rounded-lg shadow-sm border border-green-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">My Speaking Engagements</h3>
              <a href="/speaker/events" className="text-primary hover:text-primary-600 text-sm font-medium">
                View All
              </a>
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
          ) : speakerEngagements.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {speakerEngagements.slice(0, 5).map((engagement) => (
                <div key={engagement.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {engagement.event.title}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(engagement.event.start_date).toLocaleDateString()} • 
                        {engagement.event.venue_name || 'Virtual Event'}
                      </p>
                      {engagement.presentation_title && (
                        <p className="text-sm text-primary mt-1">
                          "{engagement.presentation_title}"
                        </p>
                      )}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                        engagement.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        engagement.status === 'invited' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {engagement.status}
                      </span>
                    </div>
                    <div className="ml-4">
                      <a 
                        href={`/speaker/events/${engagement.id}`}
                        className="btn-outline btn-sm"
                      >
                        Manage
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500 mb-4">No speaking engagements yet</p>
              <p className="text-sm text-gray-400">
                Event organizers will invite you to speak at their events.
              </p>
            </div>
          )}
        </div>

        {/* Quick actions and resources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-green-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <a href="/speaker/profile" className="block w-full btn-primary text-center">
                Update Speaker Profile
              </a>
              <a href="/speaker/materials" className="block w-full btn-secondary text-center">
                Manage Materials
              </a>
              <a href="/speaker/availability" className="block w-full btn-outline text-center">
                Set Availability
              </a>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-green-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resources</h3>
            <div className="space-y-3">
              <a href="/speaker/guidelines" className="block text-primary hover:text-primary-600">
                Speaker Guidelines
              </a>
              <a href="/speaker/templates" className="block text-primary hover:text-primary-600">
                Presentation Templates
              </a>
              <a href="/speaker/support" className="block text-primary hover:text-primary-600">
                Technical Support
              </a>
              <a href="/speaker/community" className="block text-primary hover:text-primary-600">
                Speaker Community
              </a>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}