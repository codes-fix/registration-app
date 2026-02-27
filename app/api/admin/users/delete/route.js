import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

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

    // Use admin client for cascading deletes
    const adminClient = createAdminClient()
    
    try {
      // Get user's organization_id if they own one
      const { data: userProfile } = await adminClient
        .from('user_profiles')
        .select('organization_id, is_organization_owner')
        .eq('id', userId)
        .single()

      console.log('User profile to delete:', userProfile)

      // Step 1: Delete all registrations by this user
      await adminClient
        .from('registrations')
        .delete()
        .eq('user_id', userId)

      // Step 2: If user owns an organization, handle organization deletion
      if (userProfile?.is_organization_owner && userProfile?.organization_id) {
        const orgId = userProfile.organization_id

        // Delete all registrations for events in this org
        const { data: orgEvents } = await adminClient
          .from('events')
          .select('id')
          .eq('organization_id', orgId)

        if (orgEvents && orgEvents.length > 0) {
          const eventIds = orgEvents.map(e => e.id)
          await adminClient
            .from('registrations')
            .delete()
            .in('event_id', eventIds)
        }

        // Delete all events in this organization
        await adminClient
          .from('events')
          .delete()
          .eq('organization_id', orgId)

        // Remove organization reference from other users in this org
        await adminClient
          .from('user_profiles')
          .update({ organization_id: null })
          .eq('organization_id', orgId)
          .neq('id', userId)

        // Delete the organization
        await adminClient
          .from('organizations')
          .delete()
          .eq('id', orgId)
      }

      // Step 3: Delete any events created by this user (outside their org)
      const { data: userEvents } = await adminClient
        .from('events')
        .select('id')
        .eq('created_by', userId)

      if (userEvents && userEvents.length > 0) {
        const eventIds = userEvents.map(e => e.id)
        
        // Delete registrations for these events
        await adminClient
          .from('registrations')
          .delete()
          .in('event_id', eventIds)

        // Delete the events
        await adminClient
          .from('events')
          .delete()
          .eq('created_by', userId)
      }

      // Step 4: Delete user profile
      const { error: profileError } = await adminClient
        .from('user_profiles')
        .delete()
        .eq('id', userId)

      if (profileError) {
        console.error('Profile deletion error:', profileError)
        throw new Error(`Failed to delete user profile: ${profileError.message}`)
      }

      // Step 5: Delete auth user with shouldSoftDelete = false to force permanent deletion
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(
        userId,
        false // shouldSoftDelete - false means hard delete
      )

      if (deleteError) {
        console.error('Auth user deletion error:', deleteError)
        
        // If hard delete fails due to DB constraints, try soft delete approach
        // This anonymizes the user instead of actually deleting from auth.users
        console.log('Hard delete failed, attempting soft delete...')
        
        const { error: updateError } = await adminClient.auth.admin.updateUserById(
          userId,
          { 
            email: `deleted_${userId}@deleted.local`,
            user_metadata: { deleted: true, deleted_at: new Date().toISOString() }
          }
        )
        
        if (updateError) {
          throw new Error(`Both hard and soft delete failed: ${deleteError.message}`)
        }
        
        return NextResponse.json({ 
          success: true,
          message: 'User data deleted and account deactivated',
          method: 'soft_delete'
        })
      }

    } catch (deleteErr) {
      console.error('Deletion process error:', deleteErr)
      return NextResponse.json(
        { error: deleteErr.message || 'Failed to delete user' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'User and all related data deleted successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    )
  }
}
