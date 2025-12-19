import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

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

        // If no profile exists, we need to create one
        if (!profile) {
          // Try to get role from session storage via response (passed through redirect)
          // Default to attendee if not found
          const role = 'attendee' // We'll get this from the client-side
          
          return NextResponse.redirect(`${origin}/profile/setup?new=true`)
        }

        // Profile exists but incomplete
        if (!profile.first_name || !profile.last_name) {
          return NextResponse.redirect(`${origin}/profile/setup`)
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