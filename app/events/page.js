'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUser } from '@/lib/auth'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function EventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    dateRange: 'all'
  })

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
        await loadEvents()
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const loadEvents = async () => {
    const supabase = createClient()
    
    let query = supabase
      .from('events')
      .select(`
        *,
        ticket_types:ticket_types(*)
      `)
      .in('status', ['published', 'registration_open'])
      .order('start_date', { ascending: true })

    // Apply filters
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%, description.ilike.%${filters.search}%`)
    }

    if (filters.dateRange === 'upcoming') {
      query = query.gte('start_date', new Date().toISOString())
    } else if (filters.dateRange === 'this_month') {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      query = query.gte('start_date', startOfMonth.toISOString())
                   .lte('start_date', endOfMonth.toISOString())
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading events:', error)
      return
    }

    setEvents(data || [])
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  useEffect(() => {
    if (!loading) {
      loadEvents()
    }
  }, [filters])

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

  const getLowestPrice = (ticketTypes) => {
    if (!ticketTypes || ticketTypes.length === 0) return null
    const prices = ticketTypes.filter(t => t.is_active).map(t => t.price)
    return prices.length > 0 ? Math.min(...prices) : null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Browse Events</h1>
              <p className="text-gray-600 mt-1">Discover and register for amazing events</p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-4">
              <Link href="/dashboard" className="btn-outline">
                ← Back to Dashboard
              </Link>
              {user && (
                <Link href="/events/create" className="btn-primary">
                  Create Event
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="input"
              >
                <option value="">All Categories</option>
                <option value="conference">Conference</option>
                <option value="workshop">Workshop</option>
                <option value="networking">Networking</option>
                <option value="seminar">Seminar</option>
                <option value="webinar">Webinar</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="input"
              >
                <option value="all">All Dates</option>
                <option value="upcoming">Upcoming</option>
                <option value="this_month">This Month</option>
                <option value="next_month">Next Month</option>
              </select>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const lowestPrice = getLowestPrice(event.ticket_types)
              const isVirtual = event.is_virtual
              const isPastEvent = new Date(event.start_date) < new Date()

              return (
                <div key={event.id} className={`card overflow-hidden ${isPastEvent ? 'opacity-75' : ''}`}>
                  {/* Event Image */}
                  <div className="h-48 bg-gradient-to-r from-primary to-secondary relative">
                    {event.featured_image_url ? (
                      <img
                        src={event.featured_image_url}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <svg className="w-16 h-16 text-white/50" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Event Type Badge */}
                    <div className="absolute top-4 left-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isVirtual ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {isVirtual ? 'Virtual' : 'In-Person'}
                      </span>
                    </div>

                    {/* Price Badge */}
                    {lowestPrice !== null && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-white/90 text-gray-900 px-2 py-1 rounded-full text-sm font-medium">
                          {lowestPrice === 0 ? 'Free' : `From $${lowestPrice}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Event Info */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {event.title}
                      </h3>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {event.short_description || event.description}
                    </p>

                    {/* Date and Location */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        {formatDate(event.start_date)}
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        {isVirtual ? event.virtual_platform || 'Online' : event.venue_name || 'TBA'}
                      </div>
                    </div>

                    {/* Tags */}
                    {event.tags && event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {event.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {event.tags.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{event.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    <Link
                      href={`/events/${event.id}`}
                      className={`block w-full text-center py-2 px-4 rounded-lg font-medium transition-colors ${
                        isPastEvent
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'bg-primary text-white hover:bg-primary-600'
                      }`}
                    >
                      {isPastEvent ? 'Event Ended' : 'View Details'}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}