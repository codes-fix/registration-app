'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, getUserProfile, signOut } from '@/lib/auth'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Link from 'next/link'

export default function PendingApprovalPage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function checkApprovalStatus() {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push('/login')
          return
        }

        const userProfile = await getUserProfile(currentUser.id)
        if (!userProfile) {
          router.push('/profile/setup')
          return
        }

        setUser(currentUser)
        setProfile(userProfile)

        // Check email confirmation from auth.users
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        // If email is confirmed, redirect to dashboard
        if (authUser?.email_confirmed_at) {
          router.push('/dashboard')
          return
        }
      } catch (error) {
        console.error('Error checking approval status:', error)
      } finally {
        setLoading(false)
      }
    }

    checkApprovalStatus()
  }, [router])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-yellow-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Content */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Approval Pending
          </h1>
          <p className="text-gray-600 mb-6">
            Thank you for registering your business account!<br />
            Your account is currently under review by our admin team.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start text-left">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 mb-1">What happens next?</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Our admin team will review your registration</li>
                  <li>• You will receive an email notification once approved</li>
                  <li>• After approval, you can access your dashboard and start managing events</li>
                  <li>• This usually takes 1-2 business days</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              className="btn-primary w-full"
            >
              Sign Out
            </button>
          </div>

          {/* Help section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Have questions?{' '}
              <Link href="/support" className="text-primary hover:text-primary-600 font-medium">
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}