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

    // Get all admins
    const { data, error } = await adminClient
      .from('user_profiles')
      .select('*')
      .eq('role', 'admin')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching admins:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ data: data || [] })
  } catch (err) {
    console.error('API exception:', err)
    return Response.json({ error: 'Internal server error: ' + err.message }, { status: 500 })
  }
}

export async function POST(request) {
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

    const body = await request.json()
    const { email, first_name, last_name, phone, company, job_title, password } = body

    if (!email || !first_name || !last_name) {
      return Response.json({ error: 'Email, first name, and last name are required' }, { status: 400 })
    }

    if (!password || password.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Check if user already exists in auth
    const { data: existingAuthUser } = await adminClient.auth.admin.listUsers()
    const userExists = existingAuthUser?.users?.find(u => u.email === email)
    
    if (userExists) {
      return Response.json({ error: 'User with this email already exists' }, { status: 400 })
    }

    // Create auth user with password
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        phone,
        company,
        job_title,
        role: 'admin'
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return Response.json({ error: authError.message }, { status: 500 })
    }

    // Check if profile already exists (might be created by trigger)
    const { data: existingProfile } = await adminClient
      .from('user_profiles')
      .select('id')
      .eq('id', authUser.user.id)
      .single()

    let newProfile

    if (existingProfile) {
      // Update existing profile
      const { data: updatedProfile, error: updateError } = await adminClient
        .from('user_profiles')
        .update({
          email: email,
          first_name,
          last_name,
          phone,
          company,
          job_title,
          role: 'admin',
          approval_status: 'approved',
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', authUser.user.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating profile:', updateError)
        await adminClient.auth.admin.deleteUser(authUser.user.id)
        return Response.json({ error: updateError.message }, { status: 500 })
      }

      newProfile = updatedProfile
    } else {
      // Create new profile
      const { data: insertedProfile, error: profileInsertError } = await adminClient
        .from('user_profiles')
        .insert([{
          id: authUser.user.id,
          email: email,
          first_name,
          last_name,
          phone,
          company,
          job_title,
          role: 'admin',
          approval_status: 'approved',
          is_active: true
        }])
        .select()
        .single()

      if (profileInsertError) {
        console.error('Error creating profile:', profileInsertError)
        await adminClient.auth.admin.deleteUser(authUser.user.id)
        return Response.json({ error: profileInsertError.message }, { status: 500 })
      }

      newProfile = insertedProfile
    }

    // TODO: Send welcome email with login credentials

    return Response.json({ 
      data: newProfile,
      message: 'Admin created successfully. Credentials have been set.'
    }, { status: 201 })
  } catch (err) {
    console.error('API exception:', err)
    return Response.json({ error: 'Internal server error: ' + err.message }, { status: 500 })
  }
}
