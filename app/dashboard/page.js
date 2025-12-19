'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, getUserProfile } from '@/lib/auth'
import AttendeeDashboard from '@/components/dashboard/AttendeeDashboard'
import OrganizerDashboard from '@/components/dashboard/OrganizerDashboard'
import AdminDashboard from '@/components/dashboard/AdminDashboard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadUserData() {
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

        // Check if organizer pending approval
        if (userProfile.role === 'organizer' && userProfile.approval_status === 'pending_approval') {
          router.push('/pending-approval')
          return
        }

        setUser(currentUser)
        setProfile(userProfile)
      } catch (error) {
        console.error('Error loading user data:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  const renderDashboard = () => {
    switch (profile.role) {
      case 'admin':
        return <AdminDashboard user={user} profile={profile} />
      case 'organizer':
        return <OrganizerDashboard user={user} profile={profile} />
      case 'attendee':
      default:
        return <AttendeeDashboard user={user} profile={profile} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      {renderDashboard()}
    </div>
  )
}