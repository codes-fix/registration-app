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

export async function GET() {
  try {
    // Get authenticated user
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use admin client to check role and get stats
    const adminClient = createAdminClient()
    
    const { data: profile } = await adminClient
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all stats using admin client (bypasses RLS)
    const [
      { count: totalUsersCount, error: usersError },
      { count: pendingOrganizersCount, error: orgError },
      { data: eventsData, error: eventsError },
      { data: registrationsData, error: regError }
    ] = await Promise.all([
      adminClient
        .from('user_profiles')
        .select('*', { count: 'exact', head: true }),
      adminClient
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'organizer')
        .eq('approval_status', 'pending_approval'),
      adminClient
        .from('events')
        .select('*'),
      adminClient
        .from('registrations')
        .select(`
          *,
          event:events(title, start_date),
          user:user_profiles(first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10)
    ])

    if (usersError) {
      console.error('Error loading users count:', usersError)
    }
    if (orgError) {
      console.error('Error loading pending organizers:', orgError)
    }
    if (eventsError) {
      console.error('Error loading events:', eventsError)
    }
    if (regError) {
      console.error('Error loading registrations:', regError)
    }

    const now = new Date()

    // Calculate stats
    const allEvents = eventsData || []
    const activeEvents = allEvents.filter(e => 
      e.status === 'published' || e.status === 'registration_open'
    ).length
    
    const upcomingEventsCount = allEvents.filter(e => 
      new Date(e.start_date) > now
    ).length

    const totalRevenue = registrationsData?.reduce((sum, reg) => 
      sum + (reg.total_amount || 0), 0
    ) || 0

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const recentRegs = registrationsData?.filter(r => 
      new Date(r.created_at) > sevenDaysAgo
    ).length || 0

    return Response.json({
      totalUsers: totalUsersCount || 0,
      pendingOrganizers: pendingOrganizersCount || 0,
      totalEvents: allEvents.length,
      activeEvents,
      upcomingEvents: upcomingEventsCount,
      totalRevenue,
      totalRegistrations: registrationsData?.length || 0,
      recentRegistrations: recentRegs,
      recentActivity: registrationsData?.slice(0, 5) || [],
      upcomingEventsList: allEvents
        .filter(e => new Date(e.start_date) > now)
        .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
        .slice(0, 5)
    })
  } catch (err) {
    console.error('Admin stats API error:', err)
    return Response.json({ 
      error: 'Internal server error',
      details: err.message
    }, { status: 500 })
  }
}
