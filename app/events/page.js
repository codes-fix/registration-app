'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getCurrentUser, getUserProfile } from '@/lib/auth'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { CalendarIcon, LocationIcon, UserIcon, SearchIcon, PlusIcon, EditIcon, TrashIcon, EyeIcon, CheckCircleIcon } from '@/components/ui/Icons'

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
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const isAdmin = userRole === 'admin'
  const isOrganizer = userRole === 'organizer'
  const title = isAdmin ? 'Manage All Events' : isOrganizer ? 'My Events' : 'Browse Events'
  const description = isAdmin ? 'Review and manage all events' : isOrganizer ? 'Create and manage your events' : 'Discover and register for amazing events'

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-primary-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <div className="flex gap-3">
              {(isAdmin || isOrganizer) && (
                <Link href="/events/create" className="btn-primary">
                  + Create Event
                </Link>
              )}
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <SearchIcon className="w-4 h-4 text-gray-500" />
                Search Events
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search by title or description..."
                  className="input pl-10"
                />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Admin and Organizer filters */}
            {(isAdmin || isOrganizer) && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
          <div className="bg-white rounded-xl shadow-md border border-gray-200 text-center py-16 px-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
              <CalendarIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">No events found</h3>
            <p className="mt-2 text-sm text-gray-500">
              {isOrganizer ? 'Create your first event to get started.' : 'Try adjusting your search filters.'}
            </p>
            {isOrganizer && (
              <div className="mt-6">
                <Link href="/events/create" className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 hover:shadow-lg transition-all duration-200 font-medium">
                  <PlusIcon className="w-5 h-5" />
                  Create Event
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 group">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-gradient-to-br from-primary-100 to-primary-50 rounded-lg group-hover:from-primary-200 group-hover:to-primary-100 transition-colors">
                        <CalendarIcon className="w-4 h-4 text-primary-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{event.name || event.title}</h3>
                      {isAdmin && event.approval_status && (
                        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${getApprovalStatusColor(event.approval_status)}`}>
                          {event.approval_status.replace('_', ' ')}
                        </span>
                      )}
                      <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                        event.is_virtual ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {event.is_virtual ? 'Virtual' : 'In-Person'}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-3 ml-11">{event.description}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-600 ml-11">
                      <span className="flex items-center gap-1.5">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        {formatDate(event.start_date)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <LocationIcon className="w-4 h-4 text-gray-400" />
                        {event.is_virtual ? event.virtual_platform || 'Online' : event.venue || 'TBA'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="ml-4 flex flex-col gap-2">
                    <Link
                      href={`/events/${event.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 hover:shadow-md transition-all text-sm font-medium"
                    >
                      <EyeIcon className="w-4 h-4" />
                      View
                    </Link>

                    {(isAdmin || (isOrganizer && event.created_by === user?.id)) && (
                      <>
                        <Link
                          href={`/events/${event.id}/edit`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 hover:shadow-md transition-all text-sm font-medium"
                        >
                          <EditIcon className="w-4 h-4" />
                          Edit
                        </Link>

                        {event.status === 'draft' && (
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 hover:shadow-md transition-all text-sm font-medium"
                          >
                            <TrashIcon className="w-4 h-4" />
                            Delete
                          </button>
                        )}
                      </>
                    )}

                    {isAdmin && event.approval_status === 'pending_approval' && (
                      <Link
                        href={`/events/${event.id}/approve`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 hover:shadow-md transition-all text-sm font-medium"
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                        Review
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