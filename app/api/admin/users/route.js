import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    // Verify the current user is super admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Super admin access required' },
        { status: 403 }
      )
    }

    // Use admin client to get all users
    const adminClient = createAdminClient()

    // Fetch all user profiles with organizations
    const { data: usersData, error: usersError } = await adminClient
      .from('user_profiles')
      .select(`
        *,
        organizations (
          name,
          slug
        )
      `)
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('Users fetch error:', usersError)
      return NextResponse.json(
        { error: usersError.message },
        { status: 500 }
      )
    }

    // Get auth users to check email confirmation
    const { data: { users: authUsers }, error: authError } = await adminClient.auth.admin.listUsers()
    
    if (authError) {
      console.error('Auth users error:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      )
    }

    // Merge auth data with profile data
    const mergedUsers = usersData.map(profile => {
      const authUser = authUsers?.find(au => au.id === profile.id)
      return {
        ...profile,
        email: authUser?.email || 'N/A',
        email_confirmed: authUser?.email_confirmed_at ? true : false,
        email_confirmed_at: authUser?.email_confirmed_at,
        last_sign_in: authUser?.last_sign_in_at
      }
    })

    return NextResponse.json({ 
      success: true,
      users: mergedUsers
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
