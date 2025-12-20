'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUser, getUserProfile } from '@/lib/auth'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function EventDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState(null)
  const [ticketTypes, setTicketTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [registering, setRegistering] = useState(false)
  const [selectedTickets, setSelectedTickets] = useState({})

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
        if (currentUser) {
          const profile = await getUserProfile(currentUser.id)
          setUserRole(profile?.role)
        }
        await loadEvent()
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params.id])

  const loadEvent = async () => {
    const supabase = createClient()
    
    // Load event details
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', params.id)
      .single()

    if (eventError) {
      console.error('Error loading event:', eventError)
      return
    }

    setEvent(eventData)

    // Load ticket types
    const { data: ticketData, error: ticketError } = await supabase
      .from('ticket_types')
      .select('*')
      .eq('event_id', params.id)
      .eq('is_active', true)
      .order('price', { ascending: true })

    if (ticketError) {
      console.error('Error loading tickets:', ticketError)
      return
    }

    setTicketTypes(ticketData || [])
  }

  const handleTicketQuantityChange = (ticketTypeId, quantity) => {
    setSelectedTickets(prev => ({
      ...prev,
      [ticketTypeId]: Math.max(0, quantity)
    }))
  }

  const calculateTotal = () => {
    return Object.entries(selectedTickets).reduce((total, [ticketTypeId, quantity]) => {
      const ticketType = ticketTypes.find(t => t.id === ticketTypeId)
      return total + (ticketType?.price || 0) * quantity
    }, 0)
  }

  const getTotalQuantity = () => {
    return Object.values(selectedTickets).reduce((total, quantity) => total + quantity, 0)
  }

  const handleRegister = async () => {
    if (!user) {
      router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname))
      return
    }

    if (getTotalQuantity() === 0) {
      alert('Please select at least one ticket')
      return
    }

    setRegistering(true)

    try {
      const supabase = createClient()

      // Create registrations for each selected ticket type
      const registrations = Object.entries(selectedTickets)
        .filter(([_, quantity]) => quantity > 0)
        .map(([ticketTypeId, quantity]) => ({
          event_id: params.id,
          user_id: user.id,
          ticket_type_id: ticketTypeId,
          quantity,
          total_amount: (ticketTypes.find(t => t.id === ticketTypeId)?.price || 0) * quantity,
          status: 'pending',
          confirmation_code: generateConfirmationCode()
        }))

      const { data, error } = await supabase
        .from('registrations')
        .insert(registrations)
        .select()

      if (error) {
        throw error
      }

      // Redirect to registration confirmation
      router.push(`/registrations/${data[0].id}/confirmation`)
    } catch (error) {
      console.error('Registration error:', error)
      alert('Registration failed. Please try again.')
    } finally {
      setRegistering(false)
    }
  }

  const generateConfirmationCode = () => {
    return Math.random().toString(36).substr(2, 9).toUpperCase()
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isEventPast = () => {
    return event && new Date(event.start_date) < new Date()
  }

  const isRegistrationOpen = () => {
    if (!event) return false
    const now = new Date()
    const startDate = event.registration_start_date ? new Date(event.registration_start_date) : null
    const endDate = event.registration_end_date ? new Date(event.registration_end_date) : null
    
    if (startDate && now < startDate) return false
    if (endDate && now > endDate) return false
    
    return event.status === 'registration_open' || event.status === 'published'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
          <Link href="/events" className="btn-primary">
            Browse Events
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            href={userRole === 'organizer' ? '/organizer/events' : '/events'} 
            className="text-primary hover:text-primary-600 font-medium"
          >
            ← Back to Events
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Section */}
            <div className="card p-0 overflow-hidden">
              {event.featured_image_url ? (
                <img
                  src={event.featured_image_url}
                  alt={event.title}
                  className="w-full h-64 object-cover"
                />
              ) : (
                <div className="h-64 bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                  <svg className="w-24 h-24 text-white/50" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    event.is_virtual ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {event.is_virtual ? 'Virtual Event' : 'In-Person'}
                  </span>
                </div>
                
                {event.short_description && (
                  <p className="text-xl text-gray-600 mb-4">{event.short_description}</p>
                )}
              </div>
            </div>

            {/* Event Info */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Date & Time</h3>
                  <p className="text-gray-600">
                    <strong>Starts:</strong> {formatDate(event.start_date)}
                  </p>
                  <p className="text-gray-600">
                    <strong>Ends:</strong> {formatDate(event.end_date)}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Location</h3>
                  {event.is_virtual ? (
                    <div>
                      <p className="text-gray-600">Online Event</p>
                      {event.virtual_platform && (
                        <p className="text-gray-600">Platform: {event.virtual_platform}</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      {event.venue_name && <p className="text-gray-600">{event.venue_name}</p>}
                      {event.venue_address && <p className="text-gray-600">{event.venue_address}</p>}
                      {(event.venue_city || event.venue_state) && (
                        <p className="text-gray-600">
                          {event.venue_city}{event.venue_city && event.venue_state && ', '}{event.venue_state}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {event.description && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-2">About This Event</h3>
                  <div className="text-gray-600 whitespace-pre-wrap">{event.description}</div>
                </div>
              )}

              {event.tags && event.tags.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Registration Sidebar */}
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Registration</h2>
              
              {isEventPast() ? (
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-4">This event has already ended.</p>
                </div>
              ) : !isRegistrationOpen() ? (
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-4">Registration is not currently open.</p>
                  {event.registration_start_date && (
                    <p className="text-sm text-gray-500">
                      Opens: {formatDate(event.registration_start_date)}
                    </p>
                  )}
                </div>
              ) : ticketTypes.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-600">No tickets available for this event.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ticketTypes.map((ticketType) => (
                    <div key={ticketType.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900">{ticketType.name}</h3>
                          {ticketType.description && (
                            <p className="text-sm text-gray-600">{ticketType.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {ticketType.price === 0 ? 'Free' : `$${ticketType.price}`}
                          </p>
                        </div>
                      </div>

                      {ticketType.includes_items && ticketType.includes_items.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">Includes:</p>
                          <ul className="text-xs text-gray-600">
                            {ticketType.includes_items.map((item, index) => (
                              <li key={index}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          {ticketType.quantity_available ? (
                            `${ticketType.quantity_available - ticketType.quantity_sold} available`
                          ) : (
                            'Unlimited'
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleTicketQuantityChange(
                              ticketType.id, 
                              (selectedTickets[ticketType.id] || 0) - 1
                            )}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                            disabled={!selectedTickets[ticketType.id]}
                          >
                            -
                          </button>
                          <span className="w-8 text-center">
                            {selectedTickets[ticketType.id] || 0}
                          </span>
                          <button
                            onClick={() => handleTicketQuantityChange(
                              ticketType.id, 
                              (selectedTickets[ticketType.id] || 0) + 1
                            )}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                            disabled={
                              ticketType.quantity_available && 
                              (selectedTickets[ticketType.id] || 0) >= (ticketType.quantity_available - ticketType.quantity_sold)
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Total */}
                  {getTotalQuantity() > 0 && (
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-medium text-gray-900">
                          Total ({getTotalQuantity()} ticket{getTotalQuantity() !== 1 ? 's' : ''})
                        </span>
                        <span className="font-bold text-lg text-gray-900">
                          ${calculateTotal().toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Register Button */}
                  <button
                    onClick={handleRegister}
                    disabled={registering || getTotalQuantity() === 0}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      getTotalQuantity() > 0 && !registering
                        ? 'bg-primary text-white hover:bg-primary-600'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {registering ? 'Processing...' : 
                     getTotalQuantity() === 0 ? 'Select Tickets' : 
                     calculateTotal() === 0 ? 'Register for Free' : 
                     `Register - $${calculateTotal().toFixed(2)}`}
                  </button>

                  {!user && (
                    <p className="text-xs text-gray-500 text-center">
                      You&apos;ll need to sign in to complete registration
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Event Organizer */}
            <div className="card p-6">
              <h3 className="font-medium text-gray-900 mb-2">Contact</h3>
              {event.contact_email && (
                <p className="text-sm text-gray-600">
                  <a href={`mailto:${event.contact_email}`} className="text-primary hover:text-primary-600">
                    {event.contact_email}
                  </a>
                </p>
              )}
              {event.website_url && (
                <p className="text-sm text-gray-600">
                  <a 
                    href={event.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-600"
                  >
                    Event Website ↗
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}