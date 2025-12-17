import { createClient } from '@/lib/supabase/client'

// ============================================
// EVENT MANAGEMENT FUNCTIONS
// ============================================

/**
 * Get all published events with optional filters
 */
export async function getPublishedEvents(filters = {}) {
  const supabase = createClient()
  let query = supabase
    .from('events')
    .select(`
      *,
      event_tickets (
        id,
        ticket_name,
        price,
        quantity_available,
        quantity_sold
      )
    `)
    .eq('status', 'published')
    .order('start_date', { ascending: true })

  // Apply filters
  if (filters.eventType) {
    query = query.eq('event_type', filters.eventType)
  }

  if (filters.isVirtual !== undefined) {
    query = query.eq('is_virtual', filters.isVirtual)
  }

  if (filters.city) {
    query = query.ilike('city', `%${filters.city}%`)
  }

  if (filters.startDate) {
    query = query.gte('start_date', filters.startDate)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

/**
 * Get single event by ID
 */
export async function getEventById(eventId) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      event_tickets (
        id,
        ticket_name,
        description,
        price,
        quantity_available,
        quantity_sold,
        is_active,
        sale_start_date,
        sale_end_date
      ),
      event_sessions (
        id,
        title,
        description,
        session_type,
        start_time,
        end_time,
        room_name,
        speaker_name
      )
    `)
    .eq('id', eventId)
    .single()

  if (error) throw error
  return data
}

/**
 * Get single event by slug
 */
export async function getEventBySlug(slug) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      event_tickets (
        id,
        ticket_name,
        description,
        price,
        quantity_available,
        quantity_sold,
        is_active,
        sale_start_date,
        sale_end_date
      ),
      event_sessions (
        id,
        title,
        description,
        session_type,
        start_time,
        end_time,
        room_name,
        speaker_name
      )
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error) throw error
  return data
}

/**
 * Create new event (Admin only)
 */
export async function createEvent(eventData) {
  const supabase = createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('events')
    .insert({
      ...eventData,
      created_by: user.id
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update event (Admin only)
 */
export async function updateEvent(eventId, eventData) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('events')
    .update(eventData)
    .eq('id', eventId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete event (Admin only)
 */
export async function deleteEvent(eventId) {
  const supabase = createClient()
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)

  if (error) throw error
}

/**
 * Get events created by current user (Admin)
 */
export async function getMyEvents() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      event_tickets (count),
      event_registrations (count)
    `)
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// ============================================
// TICKET MANAGEMENT FUNCTIONS
// ============================================

/**
 * Create ticket type for an event
 */
export async function createTicket(ticketData) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('event_tickets')
    .insert(ticketData)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update ticket
 */
export async function updateTicket(ticketId, ticketData) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('event_tickets')
    .update(ticketData)
    .eq('id', ticketId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete ticket
 */
export async function deleteTicket(ticketId) {
  const supabase = createClient()
  const { error } = await supabase
    .from('event_tickets')
    .delete()
    .eq('id', ticketId)

  if (error) throw error
}

/**
 * Get tickets for an event
 */
export async function getEventTickets(eventId) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('event_tickets')
    .select('*')
    .eq('event_id', eventId)
    .eq('is_active', true)
    .order('price', { ascending: true })

  if (error) throw error
  return data
}

// ============================================
// REGISTRATION FUNCTIONS
// ============================================

/**
 * Register for an event
 */
export async function registerForEvent(registrationData) {
  const supabase = createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if already registered
  const { data: existing } = await supabase
    .from('event_registrations')
    .select('id')
    .eq('event_id', registrationData.event_id)
    .eq('user_id', user.id)
    .eq('ticket_id', registrationData.ticket_id)
    .single()

  if (existing) {
    throw new Error('Already registered for this event with this ticket type')
  }

  // Create registration
  const { data, error } = await supabase
    .from('event_registrations')
    .insert({
      ...registrationData,
      user_id: user.id,
      qr_code_data: `${user.id}-${registrationData.event_id}-${Date.now()}`
    })
    .select()
    .single()

  if (error) throw error

  // Update ticket quantity sold
  await supabase
    .from('event_tickets')
    .update({ quantity_sold: supabase.rpc('increment', { x: 1 }) })
    .eq('id', registrationData.ticket_id)

  return data
}

/**
 * Get user's registrations
 */
export async function getMyRegistrations() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('event_registrations')
    .select(`
      *,
      events (
        id,
        title,
        slug,
        start_date,
        end_date,
        venue_name,
        city,
        is_virtual,
        banner_image_url
      ),
      event_tickets (
        ticket_name,
        price
      )
    `)
    .eq('user_id', user.id)
    .order('registered_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get registration by ID
 */
export async function getRegistrationById(registrationId) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('event_registrations')
    .select(`
      *,
      events (
        id,
        title,
        slug,
        start_date,
        end_date,
        venue_name,
        venue_address,
        city,
        state,
        country,
        is_virtual,
        virtual_link,
        banner_image_url
      ),
      event_tickets (
        ticket_name,
        price
      )
    `)
    .eq('id', registrationId)
    .eq('user_id', user.id)
    .single()

  if (error) throw error
  return data
}

/**
 * Cancel registration
 */
export async function cancelRegistration(registrationId) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('event_registrations')
    .update({ registration_status: 'cancelled' })
    .eq('id', registrationId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get all registrations for an event (Admin only)
 */
export async function getEventRegistrations(eventId) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('event_registrations')
    .select(`
      *,
      event_tickets (
        ticket_name,
        price
      )
    `)
    .eq('event_id', eventId)
    .order('registered_at', { ascending: false })

  if (error) throw error
  return data
}

// ============================================
// SESSION MANAGEMENT FUNCTIONS
// ============================================

/**
 * Create event session
 */
export async function createSession(sessionData) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('event_sessions')
    .insert(sessionData)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update session
 */
export async function updateSession(sessionId, sessionData) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('event_sessions')
    .update(sessionData)
    .eq('id', sessionId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete session
 */
export async function deleteSession(sessionId) {
  const supabase = createClient()
  const { error } = await supabase
    .from('event_sessions')
    .delete()
    .eq('id', sessionId)

  if (error) throw error
}

/**
 * Get sessions for an event
 */
export async function getEventSessions(eventId) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('event_sessions')
    .select('*')
    .eq('event_id', eventId)
    .order('start_time', { ascending: true })

  if (error) throw error
  return data
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate unique slug from title
 */
export function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    + '-' + Date.now().toString(36)
}

/**
 * Format currency
 */
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

/**
 * Format date range
 */
export function formatDateRange(startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
  
  const startStr = start.toLocaleDateString('en-US', options)
  const endStr = end.toLocaleDateString('en-US', options)
  
  return `${startStr} - ${endStr}`
}

/**
 * Check if event is full
 */
export function isEventFull(event) {
  if (!event.max_capacity) return false
  return event.current_registrations >= event.max_capacity
}

/**
 * Get event status badge color
 */
export function getEventStatusColor(status) {
  const colors = {
    draft: 'gray',
    published: 'primary',
    cancelled: 'accent',
    completed: 'secondary'
  }
  return colors[status] || 'gray'
}