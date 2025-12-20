import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

// Map incoming fields from the UI to the actual DB schema columns
function mapPayloadToEventColumns(body, userId, isAdmin) {
  const name = body.name || body.title || ''
  const slug = (body.slug || name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

  return {
    // Required
    name,
    slug,
    start_date: body.start_date,
    end_date: body.end_date,

    // Optional mapped fields
    description: body.description || null,
    venue: body.venue || body.venue_name || null,
    address: body.address || body.venue_address || null,
    city: body.city || body.venue_city || null,
    country: body.country || body.venue_country || null,
    capacity: body.capacity ?? body.max_attendees ?? null,
    banner_url: body.banner_url || body.featured_image_url || null,

    // Ownership and workflow
    created_by: userId,
    approval_status: isAdmin ? 'approved' : 'pending_approval',
    status: isAdmin ? (body.status || 'draft') : 'draft'
  }
}

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

export async function GET(request) {
  try {
    // Get authenticated user
    const serverClient = await createServerClient()
    const { data: { user }, error: userError } = await serverClient.auth.getUser()
    
    if (userError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check role
    const adminClient = createAdminClient()
    const { data: profile, error: profileError } = await adminClient
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return Response.json({ error: 'Error fetching profile' }, { status: 500 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all' // all, my, draft, pending, approved, rejected
    const search = searchParams.get('search') || ''

    let query = adminClient
      .from('events')
      .select(`
        id, name, slug, description, start_date, end_date,
        venue, address, city, country, capacity, status,
        banner_url, approval_status, approval_notes,
        is_virtual, virtual_platform, virtual_url,
        created_by, created_at, updated_at
      `)
      .order('created_at', { ascending: false })

    // Role-based filtering
    if (profile.role === 'organizer') {
      // Organizers see only their own events
      query = query.eq('created_by', user.id)

      if (filter === 'draft') {
        query = query.eq('status', 'draft')
      } else if (filter === 'published') {
        query = query.eq('status', 'published')
      }
    } else if (profile.role === 'admin') {
      // Admins see all events, but can filter
      if (filter === 'pending_approval') {
        query = query.eq('approval_status', 'pending_approval')
      } else if (filter === 'approved') {
        query = query.eq('approval_status', 'approved')
      } else if (filter === 'rejected') {
        query = query.eq('approval_status', 'rejected')
      }
    } else {
      // Attendees see only approved and published events
      query = query
        .eq('approval_status', 'approved')
        .eq('status', 'published')
    }

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%, description.ilike.%${search}%`)
    }

    const { data: events, error: eventsError } = await query

    if (eventsError) {
      console.error('Error fetching events:', eventsError)
      return Response.json({ error: eventsError.message }, { status: 500 })
    }

    return Response.json({
      events: events || [],
      userRole: profile.role
    })
  } catch (err) {
    console.error('Events API error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    // Get authenticated user
    const serverClient = await createServerClient()
    const { data: { user }, error: userError } = await serverClient.auth.getUser()
    
    if (userError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'organizer')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Basic validation
    if (!body.title && !body.name) {
      return Response.json({ error: 'Event name/title is required' }, { status: 400 })
    }
    if (!body.start_date || !body.end_date) {
      return Response.json({ error: 'Start and end date are required' }, { status: 400 })
    }

    const eventData = mapPayloadToEventColumns(body, user.id, profile.role === 'admin')

    const { data: event, error: createError } = await adminClient
      .from('events')
      .insert([eventData])
      .select()
      .single()

    if (createError) {
      console.error('Error creating event:', createError)
      return Response.json({ error: createError.message }, { status: 500 })
    }

    return Response.json({ event }, { status: 201 })
  } catch (err) {
    console.error('Create event error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
