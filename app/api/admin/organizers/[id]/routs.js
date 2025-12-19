import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

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

async function createAuthClient() {
  const cookieStore = await cookies()
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action, notes } = body // action: 'approve' or 'reject'

    // Check authentication
    const authClient = await createAuthClient()
    const { data: { user }, error: userError } = await authClient.auth.getUser()
    
    if (userError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update organizer status
    const updateData = {
      approval_status: action === 'approve' ? 'approved' : 'rejected',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (notes) {
      updateData.approval_notes = notes
    }

    const { data, error } = await adminClient
      .from('user_profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating organizer:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    // TODO: Send email notification to organizer

    return Response.json({ data })
  } catch (err) {
    console.error('API error:', err)
    return Response.json({ error: 'Internal server error: ' + err.message }, { status: 500 })
  }
}