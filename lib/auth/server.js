import { createServerActionClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Server-side authentication for API routes and server components
export async function getServerUser() {
  const supabase = createServerActionClient({ cookies })
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Server auth error:', error)
    return null
  }

  return user
}

export async function getServerUserProfile(userId) {
  const supabase = createServerActionClient({ cookies })
  
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

export async function checkServerUserRole(userId, allowedRoles) {
  const profile = await getServerUserProfile(userId)
  
  if (!profile) {
    return false
  }

  return allowedRoles.includes(profile.role)
}

export async function requireAuth(allowedRoles = []) {
  const user = await getServerUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }

  if (allowedRoles.length > 0) {
    const hasPermission = await checkServerUserRole(user.id, allowedRoles)
    if (!hasPermission) {
      throw new Error('Insufficient permissions')
    }
  }

  return user
}