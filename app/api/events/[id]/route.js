import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const adminClient = createAdminClient()

    const { data: event, error } = await adminClient
      .from('events')
      .select(`
        *,
        organizer:user_profiles(id, first_name, last_name, email),
        ticket_types:ticket_types(*),
        registrations:registrations(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      return Response.json({ error: 'Event not found' }, { status: 404 })
    }

    return Response.json({ event })
  } catch (err) {
    console.error('Event API error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()

    // Get authenticated user
    const serverClient = await createServerClient()
    const { data: { user }, error: userError } = await serverClient.auth.getUser()
    
    if (userError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Get event and user profile
    const [eventResult, profileResult] = await Promise.all([
      adminClient
        .from('events')
        .select('organizer_id')
        .eq('id', id)
        .single(),
      adminClient
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    ])

    const event = eventResult.data
    const profile = profileResult.data

    // Check authorization - organizer can only edit own events, admin can edit all
    if (profile.role !== 'admin' && event.organizer_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: updatedEvent, error: updateError } = await adminClient
      .from('events')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating event:', updateError)
      return Response.json({ error: updateError.message }, { status: 500 })
    }

    return Response.json({ event: updatedEvent })
  } catch (err) {
    console.error('Update event error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    // Get authenticated user
    const serverClient = await createServerClient()
    const { data: { user }, error: userError } = await serverClient.auth.getUser()
    
    if (userError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Get event and user profile
    const [eventResult, profileResult] = await Promise.all([
      adminClient
        .from('events')
        .select('organizer_id, status')
        .eq('id', id)
        .single(),
      adminClient
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    ])

    const event = eventResult.data
    const profile = profileResult.data

    // Check authorization
    if (profile.role !== 'admin' && event.organizer_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Organizers can only delete draft events
    if (profile.role !== 'admin' && event.status !== 'draft') {
      return Response.json({ 
        error: 'Can only delete draft events. Please contact admin for published events.' 
      }, { status: 400 })
    }

    const { error: deleteError } = await adminClient
      .from('events')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting event:', deleteError)
      return Response.json({ error: deleteError.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error('Delete event error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
