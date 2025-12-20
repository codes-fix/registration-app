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

export async function GET(request) {
  try {
    // Check authentication
    const serverClient = await createServerClient()
    const { data: { user }, error: userError } = await serverClient.auth.getUser()
    
    if (userError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const adminClient = createAdminClient()
    const { data: profile, error: profileError } = await adminClient
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return Response.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get all attendees
    const { data, error } = await adminClient
      .from('user_profiles')
      .select('*')
      .eq('role', 'attendee')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching attendees:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ data: data || [] })
  } catch (err) {
    console.error('API exception:', err)
    return Response.json({ error: 'Internal server error: ' + err.message }, { status: 500 })
  }
}
