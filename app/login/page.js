'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [user, setUser] = useState(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user)
        router.push('/dashboard')
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase.auth])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-3xl font-bold text-primary mb-2 cursor-pointer">EventReg</h1>
          </Link>
          <p className="text-slate-600">Sign in to your account</p>
        </div>

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
            providers={['google', 'github']}
            redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined}
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