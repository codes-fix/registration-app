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
    console.log('=== Organizers API Called ===')
    
    // Check authentication using server client
    const serverClient = await createServerClient()
    const { data: { user }, error: userError } = await serverClient.auth.getUser()
    
    console.log('Auth user:', user?.id, user?.email)
    console.log('Auth error:', userError)
    
    if (userError || !user) {
      console.error('❌ No authenticated user')
      return Response.json({ error: 'Unauthorized - Please log in' }, { status: 401 })
    }

    // Check if user is admin using service role (to bypass RLS)
    const adminClient = createAdminClient()
    const { data: profile, error: profileError } = await adminClient
      .from('user_profiles')
      .select('role, approval_status')
      .eq('id', user.id)
      .single()

    console.log('User profile:', profile)
    console.log('Profile error:', profileError)

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError)
      return Response.json({ error: 'Error fetching user profile' }, { status: 500 })
    }

    if (!profile || profile.role !== 'admin') {
      console.error('❌ User is not admin. Role:', profile?.role)
      return Response.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    console.log('✅ User is admin')

    // Get filter from query params
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'

    console.log('Filter:', filter)

    // Query organizers using service role (bypasses RLS)
    let query = adminClient
      .from('user_profiles')
      .select('*')
      .eq('role', 'organizer')
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('approval_status', filter)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Error fetching organizers:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    console.log(`✅ Found ${data?.length || 0} organizers`)

    return Response.json({ data: data || [] })
  } catch (err) {
    console.error('❌ API exception:', err)
    return Response.json({ error: 'Internal server error: ' + err.message }, { status: 500 })
  }
}