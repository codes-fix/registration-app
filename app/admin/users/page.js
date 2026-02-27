'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUser, getUserProfile } from '@/lib/auth'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

export default function SuperAdminUsersPage() {
  const [currentUser, setCurrentUser] = useState(null)
  const [currentProfile, setCurrentProfile] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [filter, setFilter] = useState('all') // all, pending, approved
  const router = useRouter()

  const navigation = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Users', href: '/admin/users' },
    { label: 'Organizers', href: '/admin/organizers' },
    { label: 'Admins', href: '/admin/admins' },
    { label: 'Attendees', href: '/admin/attendees' },
    { label: 'Events', href: '/events' },
    { label: 'Reports', href: '/admin/reports' }
  ]

  useEffect(() => {
    loadCurrentUser()
    loadUsers()
  }, [filter])

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push('/login')
        return
      }
      const profile = await getUserProfile(user.id)
      if (!profile) {
        router.push('/profile/setup')
        return
      }
      setCurrentUser(user)
      setCurrentProfile(profile)
    } catch (err) {
      console.error('Error loading user:', err)
      router.push('/login')
    }
  }

  const loadUsers = async () => {
    try {
      setLoading(true)
      
      // Fetch users from API route
      const response = await fetch('/api/admin/users')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load users')
      }

      const data = await response.json()
      const allUsers = data.users || []

      // Apply filter
      let filteredUsers = allUsers
      if (filter === 'pending') {
        filteredUsers = allUsers.filter(u => !u.email_confirmed)
      } else if (filter === 'approved') {
        filteredUsers = allUsers.filter(u => u.email_confirmed)
      }

      setUsers(filteredUsers)
    } catch (err) {
      console.error('Load users error:', err)
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const confirmUserEmail = async (userId, email) => {
    try {
      setMessage('')
      setError('')
      
      const response = await fetch('/api/admin/users/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to confirm email')
        } else {
          const text = await response.text()
          console.error('Non-JSON response:', text)
          throw new Error(`Failed to confirm email (${response.status})`)
        }
      }

      const data = await response.json()
      setMessage(`Email confirmed for ${email}`)
      loadUsers() // Reload users
    } catch (err) {
      console.error('Confirm email error:', err)
      setError(err.message || 'Failed to confirm email')
    }
  }

  const deleteUser = async (userId, email) => {
    if (!confirm(`Are you sure you want to delete user ${email}? This cannot be undone.`)) {
      return
    }

    try {
      setMessage('')
      setError('')

      const response = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to delete user')
        } else {
          const text = await response.text()
          console.error('Non-JSON response:', text)
          throw new Error(`Failed to delete user (${response.status})`)
        }
      }

      const data = await response.json()
      setMessage(`User ${email} deleted successfully`)
      loadUsers()
    } catch (err) {
      console.error('Delete user error:', err)
      setError(err.message || 'Failed to delete user')
    }
  }

  if (loading || !currentProfile) {
    return <LoadingSpinner />
  }

  return (
    <DashboardLayout user={currentUser} profile={currentProfile} navigation={navigation}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600 mt-1">Approve and manage all platform users</p>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
            <p className="text-green-700">{message}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Users ({users.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-secondary text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Pending Approval
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Approved
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'super_admin' 
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === 'management'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.organizations?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.email_confirmed ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Approved
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {!user.email_confirmed && (
                          <button
                            onClick={() => confirmUserEmail(user.id, user.email)}
                            className="text-green-600 hover:text-green-900 font-medium"
                          >
                            Approve
                          </button>
                        )}
                        {user.role !== 'super_admin' && (
                          <button
                            onClick={() => deleteUser(user.id, user.email)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
