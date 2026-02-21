'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSiteLogo } from '@/lib/hooks/useLogo'
import Link from 'next/link'
import Image from 'next/image'

export default function ManagementRegisterPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const { logo: siteLogo } = useSiteLogo()
  const router = useRouter()

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Company & Account
    companyName: '',
    businessType: '',
    adminFullName: '',
    adminEmail: '',
    password: '',
    confirmPassword: '',
    // Step 2: Payment (will be handled by Stripe)
  })

  const businessTypes = [
    'Event Management Company',
    'Conference Organizer',
    'Corporate Events',
    'Wedding Planner',
    'Concert & Festival',
    'Non-Profit Organization',
    'Education & Training',
    'Sports & Recreation',
    'Other'
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleLogoUpload = (e) => {
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

  const validateStep1 = () => {
    if (!formData.companyName.trim()) {
      setError('Company name is required')
      return false
    }
    if (!formData.businessType) {
      setError('Please select your business type')
      return false
    }
    if (!formData.adminFullName.trim()) {
      setError('Full name is required')
      return false
    }
    if (!formData.adminEmail.trim()) {
      setError('Email address is required')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
      setError('Please enter a valid email address')
      return false
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  const handleNext = async () => {
    if (!validateStep1()) {
      return
    }

    setLoading(true)
    const supabase = createClient()

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.adminEmail,
        password: formData.password,
        options: {
          data: {
            full_name: formData.adminFullName,
            role: 'management'
          }
        }
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('Failed to create account')
      }

      // Ensure the session is set for RLS policies
      if (authData.session) {
        await supabase.auth.setSession({
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token
        })
      }

      // Upload logo if provided
      let logoUrl = null
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `${authData.user.id}-${Date.now()}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('organization-logos')
          .upload(fileName, logoFile)

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('organization-logos')
            .getPublicUrl(fileName)
          logoUrl = publicUrl
        }
      }

      // Generate organization slug
      const slug = formData.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Math.random().toString(36).substring(2, 7)

      // Create organization via API route (bypasses RLS with service role)
      const orgResponse = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: formData.companyName,
          businessType: formData.businessType,
          logoUrl: logoUrl,
          userId: authData.user.id
        })
      })

      if (!orgResponse.ok) {
        const errorData = await orgResponse.json()
        throw new Error(errorData.error || 'Failed to create organization')
      }

      const { organization: orgData } = await orgResponse.json()

      // Split full name into first and last name
      const nameParts = formData.adminFullName.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      // Update user profile with organization
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          organization_id: orgData.id,
          is_organization_owner: true,
          role: 'management'
        })
        .eq('id', authData.user.id)

      if (profileError) throw profileError

      // Store organization ID for payment step
      sessionStorage.setItem('pending_org_id', orgData.id)
      sessionStorage.setItem('pending_user_id', authData.user.id)

      // Move to payment step
      setCurrentStep(2)
      
    } catch (err) {
      console.error('Registration error:', err)
      setError(err.message || 'Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setCurrentStep(1)
    setError('')
  }

  const handleCompleteRegistration = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      // Sign in the user with their credentials
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.adminEmail,
        password: formData.password
      })

      if (signInError) throw signInError

      // Clear session storage
      sessionStorage.removeItem('pending_org_id')
      sessionStorage.removeItem('pending_user_id')

      // Redirect to dashboard
      router.push('/dashboard')
      
    } catch (err) {
      console.error('Sign in error:', err)
      setError(err.message || 'Account created but sign-in failed. Please try logging in.')
      // Even if sign-in fails, redirect to login page after a delay
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full opacity-20 blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-200 rounded-full opacity-20 blur-3xl"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Header with Logo */}
        <div className="text-center mb-6">
          <Link href="/">
            <div className="inline-flex items-center justify-center mb-4 cursor-pointer group">
              {siteLogo ? (
                <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                  <img 
                    src={siteLogo} 
                    alt="Site Logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 via-secondary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
              )}
            </div>
            <h1 className="text-4xl font-bold text-primary mb-2">
              At The Roc
            </h1>
          </Link>
          <h2 className="text-xl font-semibold text-gray-800 mb-1">Create Your Business Account</h2>
          <p className="text-sm text-gray-600">Start your 14-day free trial</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center">
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                currentStep === 1 
                  ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                  : 'bg-primary-600 text-white'
              }`}>
                {currentStep > 1 ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : '1'}
              </div>
              <span className="text-xs mt-1 font-medium text-gray-700">Company & Account</span>
            </div>

            {/* Connector */}
            <div className={`w-16 h-0.5 mx-2 ${currentStep > 1 ? 'bg-primary' : 'bg-gray-300'}`}></div>

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                currentStep === 2 
                  ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                  : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <span className="text-xs mt-1 font-medium text-gray-700">Payment</span>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl border border-gray-100">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-red-700 font-medium">{error}</span>
              </div>
            </div>
          )}

          {currentStep === 1 ? (
            // Step 1: Company & Account
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Company Information
                </h2>
                <p className="text-sm text-gray-600">Tell us about your organization</p>
              </div>

              {/* Company Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="Enter your company name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Business Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select your business type</option>
                  {businessTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Company Logo */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Logo
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-sm">Upload Logo</span>
                    </label>
                  </div>
                  {logoPreview && (
                    <div className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden">
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB (Optional)</p>
              </div>

              {/* Admin Account Section */}
              <div className="mb-6 pt-6 border-t border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Admin Account
                </h2>
              </div>

              {/* Full Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="adminFullName"
                  value={formData.adminFullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Email Address */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Password */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a strong password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Confirm Password */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Next Button */}
              <button
                onClick={handleNext}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    Next
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          ) : (
            // Step 2: Payment
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Account Summary</h2>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-200">
                    {logoPreview && (
                      <img src={logoPreview} alt="Company logo" className="w-12 h-12 rounded object-cover" />
                    )}
                    <div>
                      <div className="font-semibold text-gray-800">{formData.companyName}</div>
                      <div className="text-sm text-gray-600">Business Type: {formData.businessType}</div>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div><span className="text-gray-600">Admin Name:</span> <span className="font-medium">{formData.adminFullName}</span></div>
                    <div><span className="text-gray-600">Email:</span> <span className="font-medium">{formData.adminEmail}</span></div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Start Your Free Trial</h2>
                <p className="text-sm text-gray-600 mb-4">No payment required now. You'll be notified before your trial ends.</p>
                
                {/* Free Trial Notice */}
                <div className="border-2 border-green-500 bg-green-50 rounded-lg p-6 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-500 rounded-full p-2">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">14-Day Free Trial Activated!</h3>
                      <p className="text-sm text-gray-700 mb-3">
                        Your account is ready. No credit card required during the trial period.
                      </p>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Full access to all features
                        </li>
                        <li className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          No payment required now
                        </li>
                        <li className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Cancel anytime before trial ends
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Subscription Plan */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-500 rounded-lg p-6 mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-sm font-medium text-green-700 mb-1">Monthly Subscription</div>
                      <div className="text-3xl font-bold text-gray-800">$49<span className="text-lg text-gray-600">/mo</span></div>
                    </div>
                    <div className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      14-day free trial
                    </div>
                  </div>
                  
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Unlimited users</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Custom workflows</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>24/7 support</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Advanced reporting</span>
                    </li>
                  </ul>

                  <div className="mt-4 pt-4 border-t border-green-200 text-xs text-gray-600">
                    14-day free trial. Cancel anytime
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleBack}
                  className="flex-1 border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <button
                  onClick={handleCompleteRegistration}
                  disabled={loading}
                  className="flex-1 bg-primary hover:bg-primary-600 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Completing...
                    </>
                  ) : (
                    'Complete Registration'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sign In Link */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-700">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-semibold hover:text-primary-600 hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
