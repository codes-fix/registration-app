import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin
  const role = requestUrl.searchParams.get('role') || 'attendee'

  if (code) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${origin}/login?error=auth_failed`)
      }

      if (data?.user) {
        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle()

        if (profileError) {
          console.error('Profile query error:', profileError)
        }

        // If no profile, create it
        if (!profile) {
          const approvalStatus = role === 'organizer' ? 'pending_approval' : 'approved'
          
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              id: data.user.id,
              email: data.user.email,
              role: role,
              approval_status: approvalStatus,
              is_active: true
            })

          if (insertError) {
            console.error('Profile creation error:', insertError)
          }

          // Redirect to appropriate setup page
          if (role === 'admin') {
            return NextResponse.redirect(`${origin}/admin/setup`)
          }
          return NextResponse.redirect(`${origin}/profile/setup?role=${role}`)
        }

        // Profile exists but incomplete
        if (!profile.first_name) {
          if (profile.role === 'admin') {
            return NextResponse.redirect(`${origin}/admin/setup`)
          }
          return NextResponse.redirect(`${origin}/profile/setup?role=${profile.role}`)
        }

        // Check approval status for organizers
        if (profile.role === 'organizer' && profile.approval_status === 'pending_approval') {
          return NextResponse.redirect(`${origin}/pending-approval`)
        }

        // Profile complete and approved
        return NextResponse.redirect(`${origin}/dashboard`)
      }
    } catch (err) {
      console.error('Exception in auth callback:', err)
      return NextResponse.redirect(`${origin}/login?error=callback_failed`)
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}