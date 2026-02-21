'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, updatePassword, signOut, getUserProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import LoadingSpinner from '@/components/ui/LoadingSpinner'


export default function SettingsPage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [organization, setOrganization] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const router = useRouter()

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  })

  const [notifications, setNotifications] = useState({
    email: true,
    eventReminders: true,
    marketing: false
  })

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showEmail: false,
    showPhone: false
  })

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/login')
        return
      }
      setUser(currentUser)

      // Load user profile
      const userProfile = await getUserProfile(currentUser.id)
      setProfile(userProfile)

      // Load organization if user has one
      if (userProfile?.organization_id) {
        const supabase = createClient()
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', userProfile.organization_id)
          .single()
        
        setOrganization(orgData)
        if (orgData?.logo_url) {
          setLogoPreview(orgData.logo_url)
        }
      }
    } catch (err) {
      setError('Failed to load user data')
      console.error('User load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    setUpdating(true)
    setError('')
    setMessage('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match')
      setUpdating(false)
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      setUpdating(false)
      return
    }

    try {
      await updatePassword(passwordForm.newPassword)
      setMessage('Password updated successfully!')
      setPasswordForm({ newPassword: '', confirmPassword: '' })
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError('Failed to update password')
      console.error('Password update error:', err)
    } finally {
      setUpdating(false)
    }
  }

  const handleLogoSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Logo file size must be less than 2MB')
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file')
        return
      }

      setLogoFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result)
      }
      reader.readAsDataURL(file)
      setError('')
    }
  }

  const handleLogoUpload = async () => {
    if (!logoFile) {
      setError('Please select a logo file first')
      return
    }

    setUpdating(true)
    setError('')
    setMessage('')

    try {
      const supabase = createClient()
      let bucketName = ''
      let updateTable = ''
      let updateId = ''

      // Determine which bucket and table to use based on user role
      if (profile?.role === 'super_admin') {
        bucketName = 'site-logos'
        // Upload logo and update site_settings table
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `site-logo-${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, logoFile, { upsert: true })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName)

        // Update site settings
        const { error: updateError } = await supabase
          .from('site_settings')
          .update({ 
            logo_url: publicUrl,
            updated_by: user.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', (await supabase.from('site_settings').select('id').single()).data.id)

        if (updateError) throw updateError

        setMessage('Site logo uploaded successfully!')
        setLogoFile(null)
        setUpdating(false)
        setTimeout(() => setMessage(''), 3000)
        return
        
      } else if (profile?.role === 'management' && organization) {
        bucketName = 'organization-logos'
        updateTable = 'organizations'
        updateId = organization.id
      } else {
        setError('No organization found to update logo')
        setUpdating(false)
        return
      }

      // Upload logo
      const fileExt = logoFile.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, logoFile, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName)

      // Update organization logo if management
      if (updateTable && updateId) {
        const { error: updateError } = await supabase
          .from(updateTable)
          .update({ logo_url: publicUrl })
          .eq('id', updateId)

        if (updateError) throw updateError

        setOrganization({ ...organization, logo_url: publicUrl })
      }

      setMessage('Logo uploaded successfully!')
      setLogoFile(null)
      setTimeout(() => setMessage(''), 3000)
      
    } catch (err) {
      console.error('Logo upload error:', err)
      setError(err.message  || 'Failed to upload logo')
    } finally {
      setUpdating(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (err) {
      setError('Failed to sign out')
      console.error('Sign out error:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-gray-600 hover:text-primary mb-6 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Settings Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary via-secondary to-accent rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
                <p className="text-gray-600">Manage your account security and preferences</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Account Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <p className="text-sm text-gray-900">{user?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Created</label>
                    <p className="text-sm text-gray-900">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Verified</label>
                    {user?.email_confirmed_at ? (
                      <span className="inline-flex items-center text-sm text-primary-700">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-sm text-accent-700">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        Not Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Logo Management - For Super Admin and Management */}
            {(profile?.role === 'super_admin' || profile?.role === 'management') && (
              <div className="border-t pt-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {profile?.role === 'super_admin' ? 'Site Logo' : 'Organization Logo'}
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  {profile?.role === 'super_admin' 
                    ? 'This logo will appear on login, registration, and other public pages.'
                    : 'This logo will appear for your organization and your team members.'}
                </p>
                
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center gap-6">
                    {/* Current Logo Preview */}
                    <div className="flex-shrink-0">
                      {logoPreview ? (
                        <img 
                          src={logoPreview} 
                          alt="Current logo" 
                          className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                          <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Upload Controls */}
                    <div className="flex-grow">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoSelect}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="inline-flex items-center gap-2 px-4 py-2 border-2 border-primary text-primary rounded-lg cursor-pointer hover:bg-primary hover:text-white transition-colors font-medium"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Choose Logo
                      </label>
                      
                      {logoFile && (
                        <button
                          type="button"
                          onClick={handleLogoUpload}
                          disabled={updating}
                          className="ml-3 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors font-medium disabled:opacity-50"
                        >
                          {updating ? 'Uploading...' : 'Upload Logo'}
                        </button>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-2">
                        PNG, JPG or GIF (max. 2MB)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Password Update */}
            <div className="border-t pt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
              <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
                <div>
                  <label className="label">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordInputChange}
                    required
                    minLength={6}
                    className="input"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className="label">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordInputChange}
                    required
                    minLength={6}
                    className="input"
                    placeholder="Confirm new password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-600 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>

            {/* Notifications Settings */}
            <div className="border-t pt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <div className="font-medium text-gray-900">Email Notifications</div>
                    <div className="text-sm text-gray-600">Receive updates about events and registrations</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.email}
                    onChange={(e) => setNotifications({...notifications, email: e.target.checked})}
                    className="w-5 h-5 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <div className="font-medium text-gray-900">Event Reminders</div>
                    <div className="text-sm text-gray-600">Get reminded about upcoming events</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.eventReminders}
                    onChange={(e) => setNotifications({...notifications, eventReminders: e.target.checked})}
                    className="w-5 h-5 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <div className="font-medium text-gray-900">Marketing Emails</div>
                    <div className="text-sm text-gray-600">Receive promotional content and special offers</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.marketing}
                    onChange={(e) => setNotifications({...notifications, marketing: e.target.checked})}
                    className="w-5 h-5 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                </label>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="border-t pt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Privacy Settings</h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <div className="font-medium text-gray-900">Profile Visibility</div>
                    <div className="text-sm text-gray-600">Allow other attendees to see your profile</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacy.profileVisible}
                    onChange={(e) => setPrivacy({...privacy, profileVisible: e.target.checked})}
                    className="w-5 h-5 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <div className="font-medium text-gray-900">Show Email</div>
                    <div className="text-sm text-gray-600">Display email on your public profile</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacy.showEmail}
                    onChange={(e) => setPrivacy({...privacy, showEmail: e.target.checked})}
                    className="w-5 h-5 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <div className="font-medium text-gray-900">Show Phone</div>
                    <div className="text-sm text-gray-600">Display phone number on your public profile</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacy.showPhone}
                    onChange={(e) => setPrivacy({...privacy, showPhone: e.target.checked})}
                    className="w-5 h-5 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                </label>
              </div>
            </div>

            {/* Messages */}
            {message && (
              <div className="bg-primary-50 border-l-4 border-primary rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-primary mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-primary-800 font-medium">{message}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-accent-50 border-l-4 border-accent rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-accent mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-accent-800 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Danger Zone */}
            <div className="border-t pt-8">
              <h2 className="text-lg font-semibold text-accent-900 mb-4">Danger Zone</h2>
              <div className="bg-accent-50 border-2 border-accent-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-accent-900 mb-1">Sign Out</h3>
                    <p className="text-sm text-accent-700">Sign out of your account on this device</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent-dark transition-colors shadow-md hover:shadow-lg"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}