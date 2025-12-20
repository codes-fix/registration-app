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

    // Check authentication
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
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update profile
    const updateData = {
      updated_at: new Date().toISOString()
    }

    if (body.email) updateData.email = body.email
    if (body.first_name) updateData.first_name = body.first_name
    if (body.last_name) updateData.last_name = body.last_name
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.company !== undefined) updateData.company = body.company
    if (body.job_title !== undefined) updateData.job_title = body.job_title

    const { data, error } = await adminClient
      .from('user_profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating admin:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    // Update auth email if changed
    if (body.email && body.email !== data.email) {
      await adminClient.auth.admin.updateUserById(id, {
        email: body.email
      })
    }

    return Response.json({ data })
  } catch (err) {
    console.error('API error:', err)
    return Response.json({ error: 'Internal server error: ' + err.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    // Check authentication
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
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prevent deleting yourself
    if (id === user.id) {
      return Response.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Delete profile
    const { error: deleteProfileError } = await adminClient
      .from('user_profiles')
      .delete()
      .eq('id', id)

    if (deleteProfileError) {
      console.error('Error deleting profile:', deleteProfileError)
      return Response.json({ error: deleteProfileError.message }, { status: 500 })
    }

    // Delete auth user
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(id)

    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError)
      // Continue anyway as profile is already deleted
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error('API error:', err)
    return Response.json({ error: 'Internal server error: ' + err.message }, { status: 500 })
  }
}
