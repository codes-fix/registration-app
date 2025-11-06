'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Link from 'next/link'

export default function RegistrationsPage() {
  const [user, setUser] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, upcoming, past, cancelled
  const router = useRouter()

  useEffect(() => {
    loadRegistrations()
  }, [])

  const loadRegistrations = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/login')
        return
      }

      setUser(currentUser)
      const supabase = createClient()

      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          event:events (
            id,
            title,
            description,
            start_date,
            end_date,
            venue_name,
            venue_address,
            event_type,
            status
          ),
          ticket_selections (
            id,
            quantity,
            price_paid,
            ticket_type:ticket_types (
              id,
              name,
              description,
              price
            )
          )
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setRegistrations(data || [])
    } catch (err) {
      console.error('Error loading registrations:', err)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredRegistrations = () => {
    const now = new Date()
    
    return registrations.filter(registration => {
      if (filter === 'cancelled') {
        return registration.status === 'cancelled'
      }
      
      if (filter === 'upcoming') {
        return new Date(registration.event.start_date) > now && registration.status !== 'cancelled'
      }
      
      if (filter === 'past') {
        return new Date(registration.event.end_date) < now && registration.status !== 'cancelled'
      }
      
      return true // all
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      checked_in: 'bg-blue-100 text-blue-800'
    }
    return colors[status] || colors.pending
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const filteredRegistrations = getFilteredRegistrations()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">My Registrations</h1>
                <p className="text-gray-600">Manage your event registrations and tickets</p>
              </div>
              <Link
                href="/events"
                className="mt-4 md:mt-0 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
              >
                Browse Events
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4">
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'upcoming', label: 'Upcoming' },
                { key: 'past', label: 'Past' },
                { key: 'cancelled', label: 'Cancelled' }
              ].map(filterOption => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === filterOption.key
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Registrations List */}
        {filteredRegistrations.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'No registrations yet' : `No ${filter} registrations`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You haven't registered for any events yet. Browse our events to get started!"
                : `You don't have any ${filter} registrations.`
              }
            </p>
            {filter === 'all' && (
              <Link
                href="/events"
                className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
              >
                Browse Events
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredRegistrations.map((registration) => (
              <div key={registration.id} className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start space-x-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {registration.event.title}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(registration.status)}`}>
                              {registration.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          
                          <p className="text-gray-600 mb-3">{registration.event.description}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m0 0V3h4a2 2 0 012 2v4M8 7v10h8V7M8 7H4a2 2 0 00-2 2v10a2 2 0 002 2h4V7z" />
                              </svg>
                              <span>Starts: {formatDate(registration.event.start_date)}</span>
                            </div>
                            
                            {registration.event.venue_name && (
                              <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{registration.event.venue_name}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                              <span>Total: {formatCurrency(registration.total_amount)}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                              </svg>
                              <span>Reg #: {registration.confirmation_code}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 md:mt-0 md:ml-6 flex flex-col space-y-2">
                      <Link
                        href={`/events/${registration.event.id}`}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 text-center"
                      >
                        View Event
                      </Link>
                      
                      {registration.status === 'confirmed' && (
                        <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary">
                          Download Ticket
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Ticket Details */}
                  {registration.ticket_selections && registration.ticket_selections.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Ticket Details</h4>
                      <div className="space-y-2">
                        {registration.ticket_selections.map((selection) => (
                          <div key={selection.id} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">
                              {selection.ticket_type.name} × {selection.quantity}
                            </span>
                            <span className="font-medium">
                              {formatCurrency(selection.price_paid)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}