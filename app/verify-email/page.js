'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getCurrentUser, resendVerificationEmail } from '@/lib/auth'
import Link from 'next/link'
import { Suspense } from 'react'

function VerifyEmailContent() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [resending, setResending] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  useEffect(() => {
    async function checkUser() {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        // Not logged in yet - normal for registration flow
        setLoading(false)
        return
      }

      if (currentUser.email_confirmed_at) {
        router.push('/profile/setup')
        return
      }

      setUser(currentUser)
      setLoading(false)
    }

    checkUser()
  }, [router])

  const handleResend = async () => {
    setResending(true)
    setMessage('')

    try {
      await resendVerificationEmail()
      setMessage('Verification email sent! Please check your inbox.')
    } catch (error) {
      setMessage('Failed to send verification email. Please try again.')
    } finally {
      setResending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Verify Your Email
          </h1>
          <p className="text-gray-600 mb-6">
            We've sent a verification email to:
            <br />
            <strong>{email || user?.email || 'your email'}</strong>
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              Please check your inbox and click the verification link to activate your account.
            </p>
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded-lg ${
              message.includes('sent') 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <p className="text-sm">{message}</p>
            </div>
          )}

          {user && (
            <button
              onClick={handleResend}
              disabled={resending}
              className="btn-primary w-full mb-4"
            >
              {resending ? 'Sending...' : 'Resend Verification Email'}
            </button>
          )}

          <div className="text-sm text-gray-600">
            <p>Didn't receive the email? Check your spam folder.</p>
            <Link href="/support" className="text-primary hover:text-primary-600 font-medium">
              Need help?
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}