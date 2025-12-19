'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { createClient } from '@/lib/supabase/client'
import { Suspense } from 'react'

function ProfileSetupForm() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const roleFromUrl = searchParams.get('role') || 'attendee'
 
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    company: '',
    job_title: '',
    role: roleFromUrl
  })

  useEffect(() => {
    async function checkUser() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      router.push('/login')
      return
    }
    setUser(currentUser)
    
    const supabase = createClient()
    
    // Try to get existing profile
    const { data: existingProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', currentUser.id)
      .maybeSingle()

    if (profileError) {
      console.error('Error checking profile:', profileError)
      // Don't fail completely, just log the error
      console.log('Profile error details:', {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code
      })
      
      // Set default form data with role from URL
      setFormData(prev => ({
        ...prev,
        role: roleFromUrl
      }))
      
      setLoading(false)
      return
    }

    // If profile exists and is complete, redirect to appropriate page
    if (existingProfile && existingProfile.first_name) {
      // Check if organizer pending approval
      if (existingProfile.role === 'organizer' && existingProfile.approval_status === 'pending_approval') {
        router.push('/pending-approval')
        return
      }
      
      // Otherwise go to dashboard
      router.push('/dashboard')
      return
    }

    // Profile exists but incomplete, pre-fill data
    if (existingProfile) {
      setFormData({
        first_name: existingProfile.first_name || '',
        last_name: existingProfile.last_name || '',
        phone: existingProfile.phone || '',
        company: existingProfile.company || '',
        job_title: existingProfile.job_title || '',
        role: existingProfile.role || roleFromUrl
      })
    } else {
      // No profile exists, use role from URL
      setFormData(prev => ({
        ...prev,
        role: roleFromUrl
      }))
    }
    
  } catch (err) {
    console.error('Error in checkUser:', err)
    console.log('Error details:', {
      message: err.message,
      stack: err.stack
    })
    // Don't show error to user, just log it
  } finally {
    setLoading(false)
  }
}

    checkUser()
  }, [router, roleFromUrl])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (!user) {
        throw new Error('No user found')
      }

      const supabase = createClient()
      
      // Determine approval status based on role
      const approvalStatus = formData.role === 'organizer' ? 'pending_approval' : 'approved'
      
      const profileData = {
        id: user.id,
        email: user.email,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim() || null,
        company: formData.company.trim() || null,
        job_title: formData.job_title.trim() || null,
        role: formData.role,
        approval_status: approvalStatus,
        is_active: true,
        updated_at: new Date().toISOString()
      }

      const { data, error: upsertError } = await supabase
        .from('user_profiles')
        .upsert(profileData, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select()

      if (upsertError) {
        console.error('Upsert error:', upsertError)
        throw new Error(upsertError.message)
      }

      console.log('Profile created/updated:', data)
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Redirect based on approval status
      if (approvalStatus === 'pending_approval') {
        router.push('/pending-approval')
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('Profile setup error:', err)
      setError(err.message || 'Failed to complete profile setup. Please try again.')
    } finally {
      setSaving(false)
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
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
          <p className="text-gray-600">Help us personalize your experience</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Display */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Registering as</p>
                  <p className="text-lg font-bold text-gray-900 capitalize">{formData.role}</p>
                </div>
                {formData.role === 'organizer' && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                    Requires Approval
                  </span>
                )}
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                  className="input"
                  placeholder="John"
                />
              </div>

              <div>
                <label className="label">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                  className="input"
                  placeholder="Doe"
                />
              </div>
            </div>

            {/* Email (readonly) */}
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="input bg-gray-100 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Your email cannot be changed</p>
            </div>

            {/* Phone */}
            <div>
              <label className="label">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="input"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Professional Info - Show for organizers */}
            {formData.role === 'organizer' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">
                    Company/Organization <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    required={formData.role === 'organizer'}
                    className="input"
                    placeholder="Company Name"
                  />
                </div>

                <div>
                  <label className="label">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="job_title"
                    value={formData.job_title}
                    onChange={handleInputChange}
                    required={formData.role === 'organizer'}
                    className="input"
                    placeholder="Event Manager"
                  />
                </div>
              </div>
            )}

            {/* Optional for attendees */}
            {formData.role !== 'organizer' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Company/Organization</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Company Name (Optional)"
                  />
                </div>

                <div>
                  <label className="label">Job Title</label>
                  <input
                    type="text"
                    name="job_title"
                    value={formData.job_title}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Your Position (Optional)"
                  />
                </div>
              </div>
            )}

            {/* Approval Notice for Organizers */}
            {formData.role === 'organizer' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">Organizer Account Approval</h4>
                    <p className="text-xs text-blue-800">
                      Your account will be reviewed by our admin team. You'll receive an email notification once approved. 
                      After approval, you'll be able to create and manage events.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-full md:w-auto"
              >
                {saving ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  'Complete Setup'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function ProfileSetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-yellow-50">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <ProfileSetupForm />
    </Suspense>
  )
}