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

    // Get pending organizers count
    const { count: pendingCount } = await adminClient
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'organizer')
      .eq('approval_status', 'pending_approval')

    return Response.json({ 
      pendingOrganizers: pendingCount || 0 
    })
  } catch (err) {
    console.error('Stats API error:', err)
    return Response.json({ 
      error: 'Internal server error',
      pendingOrganizers: 0 
    }, { status: 500 })
  }
}