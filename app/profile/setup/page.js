'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { createClient } from '@/lib/supabase/client'

export default function ProfileSetupPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    company: '',
    job_title: '',
    role: 'attendee'
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
        
        // Check if profile already exists
        const supabase = createClient()
        const { data: existingProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle()

        if (profileError) {
          console.error('Error checking profile:', profileError)
          setError('Error loading profile. Please try again.')
          setLoading(false)
          return
        }

        if (existingProfile && existingProfile.first_name) {
          router.push('/dashboard')
          return
        }

        // If profile exists but incomplete, pre-fill data
        if (existingProfile) {
          setFormData({
            first_name: existingProfile.first_name || '',
            last_name: existingProfile.last_name || '',
            phone: existingProfile.phone || '',
            company: existingProfile.company || '',
            job_title: existingProfile.job_title || '',
            role: existingProfile.role || 'attendee'
          })
        }
      } catch (err) {
        console.error('Error:', err)
        setError('Failed to load user data: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, [router])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('') // Clear error when user types
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
      
      // Prepare profile data
      const profileData = {
        id: user.id,
        email: user.email,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim() || null,
        company: formData.company.trim() || null,
        job_title: formData.job_title.trim() || null,
        role: formData.role,
        is_active: true,
        updated_at: new Date().toISOString()
      }

      // Use upsert to create or update
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
      
      // Small delay to ensure data is saved
      await new Promise(resolve => setTimeout(resolve, 500))
      
      router.push('/dashboard')
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
              <label className="label">
                Email Address
              </label>
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
              <label className="label">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="input"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Professional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">
                  Company/Organization
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Company Name"
                />
              </div>

              <div>
                <label className="label">
                  Job Title
                </label>
                <input
                  type="text"
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Software Engineer"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="label">
                I am registering as <span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
                className="input"
              >
                <option value="attendee">Event Attendee</option>
                <option value="speaker">Speaker</option>
                <option value="staff">Staff Member</option>
                <option value="volunteer">Volunteer</option>
                <option value="guest">Guest</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                You can update this later in your profile settings
              </p>
            </div>

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