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

export async function PATCH(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action, notes } = body // action: 'approve' or 'reject'

    // Get authenticated user
    const serverClient = await createServerClient()
    const { data: { user }, error: userError } = await serverClient.auth.getUser()
    
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
      return Response.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Update event approval status
    const updateData = {
      approval_status: action === 'approve' ? 'approved' : 'rejected',
      status: action === 'approve' ? 'draft' : 'draft',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (notes) {
      updateData.approval_notes = notes
    }

    const { data: event, error: updateError } = await adminClient
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating event:', updateError)
      return Response.json({ error: updateError.message }, { status: 500 })
    }

    // TODO: Send email notification to organizer

    return Response.json({ event })
  } catch (err) {
    console.error('API error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
