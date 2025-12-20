'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, getUserProfile } from '@/lib/auth'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Link from 'next/link'

export default function AttendeesManagementPage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [attendees, setAttendees] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingAttendee, setEditingAttendee] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    company: '',
    job_title: '',
    is_active: true
  })
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

        await loadAttendees()
      } catch (error) {
        console.error('Error loading data:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const loadAttendees = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/admin/attendees', {
        method: 'GET',
        credentials: 'include',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 401) {
          router.push('/login')
          return
        }
        if (response.status === 403) {
          router.push('/unauthorized')
          return
        }
        throw new Error(errorData.error)
      }

      const { data } = await response.json()
      setAttendees(data || [])
    } catch (err) {
      console.error('Error loading attendees:', err)
      alert(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleEditAttendee = async (e) => {
    e.preventDefault()
    setActionLoading('edit')

    try {
      const response = await fetch(`/api/admin/attendees/${editingAttendee.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update attendee')
      }

      alert('Attendee updated successfully!')
      setShowEditModal(false)
      setEditingAttendee(null)
      setFormData({ email: '', first_name: '', last_name: '', phone: '', company: '', job_title: '', is_active: true })
      await loadAttendees()
    } catch (error) {
      console.error('Error updating attendee:', error)
      alert(`Failed to update attendee: ${error.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteAttendee = async (attendeeId, attendeeEmail) => {
    if (!confirm(`Are you sure you want to delete attendee ${attendeeEmail}? This action cannot be undone.`)) {
      return
    }

    setActionLoading(attendeeId)

    try {
      const response = await fetch(`/api/admin/attendees/${attendeeId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete attendee')
      }

      alert('Attendee deleted successfully!')
      await loadAttendees()
    } catch (error) {
      console.error('Error deleting attendee:', error)
      alert(`Failed to delete attendee: ${error.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const openEditModal = (attendee) => {
    setEditingAttendee(attendee)
    setFormData({
      email: attendee.email || '',
      first_name: attendee.first_name || '',
      last_name: attendee.last_name || '',
      phone: attendee.phone || '',
      company: attendee.company || '',
      job_title: attendee.job_title || '',
      is_active: attendee.is_active !== false
    })
    setShowEditModal(true)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredAttendees = attendees.filter(attendee => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      attendee.email?.toLowerCase().includes(search) ||
      attendee.first_name?.toLowerCase().includes(search) ||
      attendee.last_name?.toLowerCase().includes(search) ||
      attendee.company?.toLowerCase().includes(search)
    )
  })

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
              <h1 className="text-2xl font-bold text-gray-900">Attendee Management</h1>
              <p className="text-gray-600">Manage event attendees</p>
            </div>
            <Link href="/dashboard" className="btn-outline">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-green-100 mb-6 p-4">
          <input
            type="text"
            placeholder="Search attendees by name, email, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-green-100 p-4">
            <div className="text-sm text-gray-600">Total Attendees</div>
            <div className="text-2xl font-bold text-gray-900">{attendees.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-green-100 p-4">
            <div className="text-sm text-gray-600">Active</div>
            <div className="text-2xl font-bold text-green-600">
              {attendees.filter(a => a.is_active).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-green-100 p-4">
            <div className="text-sm text-gray-600">Inactive</div>
            <div className="text-2xl font-bold text-gray-600">
              {attendees.filter(a => !a.is_active).length}
            </div>
          </div>
        </div>

        {/* Attendees List */}
        <div className="bg-white rounded-lg shadow-sm border border-green-100">
          {filteredAttendees.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm ? 'No attendees found' : 'No attendees yet'}
              </h3>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAttendees.map((attendee) => (
                <div key={attendee.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    {/* Attendee Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {attendee.first_name} {attendee.last_name}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${attendee.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {attendee.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {attendee.email}
                        </div>

                        {attendee.phone && (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {attendee.phone}
                          </div>
                        )}

                        {attendee.company && (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {attendee.company}
                          </div>
                        )}

                        {attendee.job_title && (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {attendee.job_title}
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-gray-500">
                        Joined: {formatDate(attendee.created_at)}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="ml-6 flex gap-2">
                      <button
                        onClick={() => openEditModal(attendee)}
                        disabled={actionLoading === attendee.id}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        ✎ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAttendee(attendee.id, attendee.email)}
                        disabled={actionLoading === attendee.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {actionLoading === attendee.id ? 'Deleting...' : '✗ Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Attendee Modal */}
      {showEditModal && editingAttendee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Edit Attendee</h2>
            <form onSubmit={handleEditAttendee}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={formData.job_title}
                    onChange={(e) => setFormData({...formData, job_title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                    Active Account
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={actionLoading === 'edit'}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {actionLoading === 'edit' ? 'Updating...' : 'Update Attendee'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingAttendee(null)
                    setFormData({ email: '', first_name: '', last_name: '', phone: '', company: '', job_title: '', is_active: true })
                  }}
                  className="flex-1 btn-outline"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
