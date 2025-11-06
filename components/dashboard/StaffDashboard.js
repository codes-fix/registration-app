import { useState, useEffect } from 'react'
import DashboardLayout from './DashboardLayout'
import StatsCard from './StatsCard'
import { createClient } from '@/lib/supabase/client'

export default function StaffDashboard({ user, profile }) {
  const [stats, setStats] = useState({
    assignedEvents: 0,
    upcomingShifts: 0,
    completedTasks: 0
  })
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  const navigation = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Events', href: '/events' },
    { label: 'My Assignments', href: '/staff/assignments' },
    { label: 'Schedule', href: '/staff/schedule' },
    { label: 'Check-In', href: '/staff/checkin' }
  ]

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      
      try {
        // Get staff assignments
        const { data: staffAssignments } = await supabase
          .from('staff_assignments')
          .select(`
            *,
            event:events(*)
          `)
          .eq('user_id', user.id)
          .order('shift_start', { ascending: true })

        setAssignments(staffAssignments || [])

        // Calculate stats
        const now = new Date()
        const upcoming = staffAssignments?.filter(assignment => 
          assignment.shift_start && new Date(assignment.shift_start) > now
        ).length || 0

        const completed = staffAssignments?.filter(assignment => 
          assignment.status === 'completed'
        ).length || 0

        setStats({
          assignedEvents: staffAssignments?.length || 0,
          upcomingShifts: upcoming,
          completedTasks: completed
        })
      } catch (error) {
        console.error('Error loading staff data:', error)
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
            {profile.role === 'volunteer' ? 'Volunteer' : 'Staff'} Dashboard
          </h2>
          <p className="text-gray-600">
            Manage your assignments, schedules, and event responsibilities.
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Assigned Events"
            value={stats.assignedEvents}
            icon="📋"
            color="primary"
          />
          <StatsCard
            title="Upcoming Shifts"
            value={stats.upcomingShifts}
            icon="⏰"
            color="secondary"
          />
          <StatsCard
            title="Completed Tasks"
            value={stats.completedTasks}
            icon="✅"
            color="accent"
          />
        </div>

        {/* Current and upcoming assignments */}
        <div className="bg-white rounded-lg shadow-sm border border-green-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">My Assignments</h3>
              <a href="/staff/assignments" className="text-primary hover:text-primary-600 text-sm font-medium">
                View All
              </a>
            </div>
          </div>
          
          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : assignments.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {assignments.slice(0, 5).map((assignment) => (
                <div key={assignment.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {assignment.event.title}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Role: {assignment.role}
                        {assignment.department && ` • ${assignment.department}`}
                      </p>
                      {assignment.shift_start && (
                        <p className="text-sm text-gray-500">
                          {new Date(assignment.shift_start).toLocaleDateString()} • 
                          {new Date(assignment.shift_start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          {assignment.shift_end && ` - ${new Date(assignment.shift_end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                        </p>
                      )}
                      {assignment.location && (
                        <p className="text-sm text-primary mt-1">
                          📍 {assignment.location}
                        </p>
                      )}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                        assignment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        assignment.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                        assignment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {assignment.status}
                      </span>
                    </div>
                    <div className="ml-4">
                      <a 
                        href={`/staff/assignments/${assignment.id}`}
                        className="btn-outline btn-sm"
                      >
                        Details
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500 mb-4">No assignments yet</p>
              <p className="text-sm text-gray-400">
                Event coordinators will assign you to events and shifts.
              </p>
            </div>
          )}
        </div>

        {/* Quick actions and tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-green-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <a href="/staff/checkin" className="block w-full btn-primary text-center">
                Check-In Attendees
              </a>
              <a href="/staff/schedule" className="block w-full btn-secondary text-center">
                View Schedule
              </a>
              <a href="/staff/resources" className="block w-full btn-outline text-center">
                Training Materials
              </a>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-green-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tools & Resources</h3>
            <div className="space-y-3">
              <a href="/staff/directory" className="block text-primary hover:text-primary-600">
                Staff Directory
              </a>
              <a href="/staff/communication" className="block text-primary hover:text-primary-600">
                Team Communication
              </a>
              <a href="/staff/emergency" className="block text-primary hover:text-primary-600">
                Emergency Contacts
              </a>
              <a href="/staff/support" className="block text-primary hover:text-primary-600">
                Get Support
              </a>
            </div>
          </div>
        </div>

        {/* Upcoming schedule preview */}
        <div className="bg-white rounded-lg shadow-sm border border-green-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Today's Schedule</h3>
          </div>
          <div className="p-6">
            {assignments.filter(a => {
              const today = new Date().toDateString()
              return a.shift_start && new Date(a.shift_start).toDateString() === today
            }).length > 0 ? (
              <div className="space-y-4">
                {assignments
                  .filter(a => {
                    const today = new Date().toDateString()
                    return a.shift_start && new Date(a.shift_start).toDateString() === today
                  })
                  .map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{assignment.role}</p>
                        <p className="text-sm text-gray-600">{assignment.event.title}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(assignment.shift_start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          {assignment.shift_end && ` - ${new Date(assignment.shift_end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                        </p>
                      </div>
                      {assignment.location && (
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">📍 {assignment.location}</p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center">No shifts scheduled for today</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}