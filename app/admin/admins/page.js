'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, getUserProfile } from '@/lib/auth'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Link from 'next/link'

export default function AdminsManagementPage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    company: '',
    job_title: '',
    password: ''
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

        await loadAdmins()
      } catch (error) {
        console.error('Error loading data:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const loadAdmins = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/admin/admins', {
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
      setAdmins(data || [])
    } catch (err) {
      console.error('Error loading admins:', err)
      alert(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAddAdmin = async (e) => {
    e.preventDefault()
    setActionLoading('add')

    try {
      const response = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add admin')
      }

      alert('Admin added successfully! They will receive an invitation email.')
      setShowAddModal(false)
      setFormData({ email: '', first_name: '', last_name: '', phone: '', company: '', job_title: '', password: '' })
      await loadAdmins()
    } catch (error) {
      console.error('Error adding admin:', error)
      alert(`Failed to add admin: ${error.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleEditAdmin = async (e) => {
    e.preventDefault()
    setActionLoading('edit')

    try {
      const response = await fetch(`/api/admin/admins/${editingAdmin.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update admin')
      }

      alert('Admin updated successfully!')
      setShowEditModal(false)
      setEditingAdmin(null)
      setFormData({ email: '', first_name: '', last_name: '', phone: '', company: '', job_title: '', password: '' })
      await loadAdmins()
    } catch (error) {
      console.error('Error updating admin:', error)
      alert(`Failed to update admin: ${error.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteAdmin = async (adminId, adminEmail) => {
    if (!confirm(`Are you sure you want to delete admin ${adminEmail}? This action cannot be undone.`)) {
      return
    }

    setActionLoading(adminId)

    try {
      const response = await fetch(`/api/admin/admins/${adminId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete admin')
      }

      alert('Admin deleted successfully!')
      await loadAdmins()
    } catch (error) {
      console.error('Error deleting admin:', error)
      alert(`Failed to delete admin: ${error.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const openEditModal = (admin) => {
    setEditingAdmin(admin)
    setFormData({
      email: admin.email || '',
      first_name: admin.first_name || '',
      last_name: admin.last_name || '',
      phone: admin.phone || '',
      company: admin.company || '',
      job_title: admin.job_title || ''
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
            <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary"
              >
                + Add Admin
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admins List */}
        <div className="bg-white rounded-lg shadow-sm border border-green-100">
          {admins.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No admins yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a new admin.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {admins.map((admin) => (
                <div key={admin.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    {/* Admin Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {admin.first_name} {admin.last_name}
                        </h3>
                        {admin.id === user?.id && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            YOU
                          </span>
                        )}
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${admin.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {admin.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {admin.email}
                        </div>

                        {admin.phone && (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {admin.phone}
                          </div>
                        )}

                        {admin.company && (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {admin.company}
                          </div>
                        )}

                        {admin.job_title && (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {admin.job_title}
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-gray-500">
                        Joined: {formatDate(admin.created_at)}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="ml-6 flex gap-2">
                      <button
                        onClick={() => openEditModal(admin)}
                        disabled={actionLoading === admin.id}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        ✎ Edit
                      </button>
                      {admin.id !== user?.id && (
                        <button
                          onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                          disabled={actionLoading === admin.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          {actionLoading === admin.id ? 'Deleting...' : '✗ Delete'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Add New Admin</h2>
            <form onSubmit={handleAddAdmin}>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Minimum 6 characters"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={actionLoading === 'add'}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {actionLoading === 'add' ? 'Adding...' : 'Add Admin'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setFormData({ email: '', first_name: '', last_name: '', phone: '', company: '', job_title: '', password: '' })
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

      {/* Edit Admin Modal */}
      {showEditModal && editingAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Edit Admin</h2>
            <form onSubmit={handleEditAdmin}>
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
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={actionLoading === 'edit'}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {actionLoading === 'edit' ? 'Updating...' : 'Update Admin'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingAdmin(null)
                    setFormData({ email: '', first_name: '', last_name: '', phone: '', company: '', job_title: '', password: '' })
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
