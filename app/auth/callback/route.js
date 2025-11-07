import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin
  const next = requestUrl.searchParams.get('next') || '/profile/setup'

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
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        // If no profile or incomplete profile, redirect to setup
        if (!profile || !profile.first_name) {
          return NextResponse.redirect(`${origin}/profile/setup`)
        }

        // Profile exists, go to dashboard
        return NextResponse.redirect(`${origin}/dashboard`)
      }
    } catch (err) {
      console.error('Exception in auth callback:', err)
      return NextResponse.redirect(`${origin}/login?error=callback_failed`)
    }
  }

  // No code present, redirect to login
  return NextResponse.redirect(`${origin}/login`)
}