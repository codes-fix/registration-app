'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, getUserProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Link from 'next/link'

export default function AdminOrganizersPage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [organizers, setOrganizers] = useState([])
  const [filter, setFilter] = useState('pending_approval') // pending_approval, approved, rejected, all
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push('/login')
          return
        }

        const userProfile = await getUserProfile(currentUser.id)
        if (!userProfile || userProfile.role !== 'admin') {
          router.push('/unauthorized')
          return
        }

        setUser(currentUser)
        setProfile(userProfile)

        await loadOrganizers()
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

const loadOrganizers = async () => {
  try {
    setLoading(true)
    
    const response = await fetch(`/api/admin/organizers?filter=${filter}`, {
      method: 'GET',
      credentials: 'include', // Important for cookies
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('Error loading organizers:', errorData)
      
      if (response.status === 401) {
        router.push('/login')
        return
      }
      
      if (response.status === 403) {
        router.push('/unauthorized')
        return
      }
      
      alert(`Error: ${errorData.error}`)
      return
    }

    const { data } = await response.json()
    console.log('Loaded organizers:', data)
    setOrganizers(data || [])
  } catch (err) {
    console.error('Exception loading organizers:', err)
    alert(`Exception: ${err.message}`)
  } finally {
    setLoading(false)
  }
}

const handleApprove = async (organizerId) => {
  if (!confirm('Are you sure you want to approve this organizer?')) {
    return
  }

  setActionLoading(organizerId)

  try {
    const response = await fetch(`/api/admin/organizers/${organizerId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        action: 'approve'
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to approve organizer')
    }

    alert('Organizer approved successfully!')
    await loadOrganizers()

    // TODO: Send email notification
  } catch (error) {
    console.error('Error approving organizer:', error)
    alert(`Failed to approve organizer: ${error.message}`)
  } finally {
    setActionLoading(null)
  }
}

const handleReject = async (organizerId) => {
  const notes = prompt('Enter rejection reason (optional):')
  
  if (notes === null) {
    return // User cancelled
  }

  setActionLoading(organizerId)

  try {
    const response = await fetch(`/api/admin/organizers/${organizerId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        action: 'reject',
        notes: notes || null
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to reject organizer')
    }

    alert('Organizer rejected')
    await loadOrganizers()

    // TODO: Send email notification
  } catch (error) {
    console.error('Error rejecting organizer:', error)
    alert(`Failed to reject organizer: ${error.message}`)
  } finally {
    setActionLoading(null)
  }
}

  useEffect(() => {
  if (!loading && user && profile) {
    loadOrganizers()
  }
}, [filter, loading, user, profile])


  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending_approval: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Organizer Management</h1>
              <p className="text-gray-600">Review and approve event organizer applications</p>
            </div>
            <Link href="/dashboard" className="btn-outline">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-green-100 mb-6 p-4">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'pending_approval', label: 'Pending', count: organizers.filter(o => o.approval_status === 'pending_approval').length },
              { key: 'approved', label: 'Approved', count: organizers.filter(o => o.approval_status === 'approved').length },
              { key: 'rejected', label: 'Rejected', count: organizers.filter(o => o.approval_status === 'rejected').length },
              { key: 'all', label: 'All', count: organizers.length }
            ].map(filterOption => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === filterOption.key
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filterOption.label}
                {filter === filterOption.key && (
                  <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {filterOption.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Organizers List */}
        <div className="bg-white rounded-lg shadow-sm border border-green-100">
          {organizers.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {filter === 'all' ? 'No organizers yet' : `No ${filter.replace('_', ' ')} organizers`}
              </h3>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {organizers.map((organizer) => (
                <div key={organizer.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    {/* Organizer Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {organizer.first_name} {organizer.last_name}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(organizer.approval_status)}`}>
                          {organizer.approval_status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {organizer.email}
                        </div>

                        {organizer.phone && (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {organizer.phone}
                          </div>
                        )}

                        {organizer.company && (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {organizer.company}
                          </div>
                        )}

                        {organizer.job_title && (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {organizer.job_title}
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-gray-500">
                        Applied: {formatDate(organizer.created_at)}
                      </div>

                      {organizer.approval_notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs font-semibold text-gray-700 mb-1">Notes:</p>
                          <p className="text-sm text-gray-600">{organizer.approval_notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {organizer.approval_status === 'pending_approval' && (
                      <div className="ml-6 flex flex-col gap-2">
                        <button
                          onClick={() => handleApprove(organizer.id)}
                          disabled={actionLoading === organizer.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          {actionLoading === organizer.id ? 'Processing...' : '✓ Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(organizer.id)}
                          disabled={actionLoading === organizer.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          {actionLoading === organizer.id ? 'Processing...' : '✗ Reject'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}