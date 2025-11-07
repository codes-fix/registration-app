'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // Check for error in URL
    const errorParam = searchParams.get('error')
    if (errorParam === 'auth_failed') {
      setError('Authentication failed. Please try again.')
    } else if (errorParam === 'callback_failed') {
      setError('Login callback failed. Please try again.')
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        
        // Check if profile exists
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (!profile || !profile.first_name) {
          router.push('/profile/setup')
        } else {
          router.push('/dashboard')
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase.auth, searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-3xl font-bold text-primary mb-2 cursor-pointer">EventReg</h1>
          </Link>
          <p className="text-slate-600">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="card p-8">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#22C55E',
                    brandAccent: '#16A34A',
                    brandButtonText: 'white',
                    defaultButtonBackground: '#EAB308',
                    defaultButtonBackgroundHover: '#CA8A04',
                  },
                },
              },
            }}
            providers={['google']}
            redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined}
            showLinks={true}
            view="sign_in"
          />
        </div>

        <p className="text-center mt-6 text-slate-600">
          Don't have an account?{' '}
          <Link href="/register" className="text-secondary font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}