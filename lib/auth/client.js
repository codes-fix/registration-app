import { createClient } from '@/lib/supabase/client'

export async function signUp(email, password, userData) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: userData.role || 'attendee'
      }
    }
  })

  if (error) {
    throw new Error(error.message)
  }

  // Create user profile
  if (data.user) {
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: data.user.id,
        email: data.user.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phone,
        company: userData.company,
        job_title: userData.jobTitle,
        role: userData.role || 'attendee',
        dietary_restrictions: userData.dietaryRestrictions || [],
        accessibility_needs: userData.accessibilityNeeds || []
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
    }
  }

  return data
}

export async function signIn(email, password) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    throw new Error(error.message)
  }
}

export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error getting user:', error)
    return null
  }

  return user
}

export async function getUserProfile(userId) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error getting user profile:', error)
    return null
  }

  return data
}

export async function updateUserProfile(userId, profileData) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_profiles')
    .update(profileData)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function checkUserRole(userId, allowedRoles) {
  const profile = await getUserProfile(userId)
  
  if (!profile) {
    return false
  }

  return allowedRoles.includes(profile.role)
}

// Password reset
export async function resetPassword(email) {
  const supabase = createClient()
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function updatePassword(newPassword) {
  const supabase = createClient()
  
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (error) {
    throw new Error(error.message)
  }
}

// Social authentication
export async function signInWithProvider(provider) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

// Email verification
export async function resendVerificationEmail() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('No user found')
  }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: user.email
  })

  if (error) {
    throw new Error(error.message)
  }
}

// Check if profile is complete
export async function isProfileComplete(userId) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('first_name, last_name, role')
    .eq('id', userId)
    .single()

  if (error || !data) {
    return false
  }

  return !!(data.first_name && data.last_name && data.role)
}

// Update user role
export async function updateUserRole(userId, newRole) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

// Deactivate account
export async function deactivateAccount(userId) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('user_profiles')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) {
    throw new Error(error.message)
  }
}

// Reactivate account
export async function reactivateAccount(userId) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('user_profiles')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) {
    throw new Error(error.message)
  }
}