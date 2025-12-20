'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getCurrentUser, getUserProfile } from '@/lib/auth'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function EventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    filter: 'all'
  })
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push('/login')
          return
        }

        const userProfile = await getUserProfile(currentUser.id)
        setUser(currentUser)
        setProfile(userProfile)
        
        await loadEvents(userProfile.role)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const loadEvents = async (role, searchParams = {}) => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        filter: searchParams.filter || filters.filter,
        search: searchParams.search || filters.search
      })

      const response = await fetch(`/api/events?${params.toString()}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to load events')
      }

      const data = await response.json()
      setEvents(data.events || [])
      setUserRole(data.userRole)
    } catch (err) {
      console.error('Error loading events:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    loadEvents(userRole, newFilters)
  }

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      setEvents(events.filter(e => e.id !== eventId))
      alert('Event deleted successfully')
    } catch (err) {
      alert(`Failed to delete event: ${err.message}`)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getApprovalStatusColor = (status) => {
    const colors = {
      pending_approval: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const isAdmin = userRole === 'admin'
  const isOrganizer = userRole === 'organizer'
  const title = isAdmin ? 'Manage All Events' : isOrganizer ? 'My Events' : 'Browse Events'
  const description = isAdmin ? 'Review and manage all events' : isOrganizer ? 'Create and manage your events' : 'Discover and register for amazing events'

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              <p className="text-gray-600 mt-1">{description}</p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-4">
              <Link href="/dashboard" className="btn-outline">
                ← Back to Dashboard
              </Link>
              {(isAdmin || isOrganizer) && (
                <Link href="/events/create" className="btn-primary">
                  + Create Event
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-green-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Events
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search by title or description..."
                className="input"
              />
            </div>

            {/* Admin and Organizer filters */}
            {(isAdmin || isOrganizer) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isAdmin ? 'Approval Status' : 'Status'}
                </label>
                <select
                  value={filters.filter}
                  onChange={(e) => handleFilterChange('filter', e.target.value)}
                  className="input"
                >
                  <option value="all">All {isAdmin ? 'Events' : 'Events'}</option>
                  {isAdmin && (
                    <>
                      <option value="pending_approval">Pending Approval</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </>
                  )}
                  {isOrganizer && (
                    <>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </>
                  )}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Events List/Grid */}
        {events.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {isOrganizer ? 'Create your first event to get started.' : 'Try adjusting your search filters.'}
            </p>
            {isOrganizer && (
              <div className="mt-6">
                <Link href="/events/create" className="btn-primary">
                  + Create Event
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-lg shadow-sm border border-green-100 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                      {isAdmin && event.approval_status && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getApprovalStatusColor(event.approval_status)}`}>
                          {event.approval_status.replace('_', ' ')}
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        event.is_virtual ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {event.is_virtual ? 'Virtual' : 'In-Person'}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-3">{event.description}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        📅 {formatDate(event.start_date)}
                      </span>
                      <span className="flex items-center">
                        📍 {event.is_virtual ? event.virtual_platform || 'Online' : event.venue_name || 'TBA'}
                      </span>
                      {isAdmin && event.organizer && (
                        <span className="flex items-center">
                          👤 {event.organizer.first_name} {event.organizer.last_name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="ml-4 flex flex-col gap-2">
                    <Link
                      href={`/events/${event.id}`}
                      className="text-primary hover:text-primary-600 text-sm font-medium"
                    >
                      View Details
                    </Link>

                    {(isAdmin || (isOrganizer && event.organizer_id === user?.id)) && (
                      <>
                        <Link
                          href={`/events/${event.id}/edit`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Edit
                        </Link>

                        {event.status === 'draft' && (
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Delete
                          </button>
                        )}
                      </>
                    )}

                    {isAdmin && event.approval_status === 'pending_approval' && (
                      <Link
                        href={`/events/${event.id}/approve`}
                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                      >
                        Review Approval
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}