import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name, options) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get session and user data
  const { data: { user }, error } = await supabase.auth.getUser()

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register', '/auth/callback', '/verify-email']
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith('/auth/')
  )

  // Allow access to public routes
  if (isPublicRoute) {
    return response
  }

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/profile', '/events/create', '/admin', '/speaker', '/staff', '/settings']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated, get their profile and role
  if (user && isProtectedRoute) {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, is_active, first_name')
      .eq('id', user.id)
      .single()

    // If profile doesn't exist or is incomplete, redirect to profile setup
    if (!profile || !profile.first_name) {
      if (request.nextUrl.pathname !== '/profile/setup') {
        return NextResponse.redirect(new URL('/profile/setup', request.url))
      }
      return response
    }

    // Check if user account is active
    if (profile && profile.is_active === false) {
      return NextResponse.redirect(new URL('/account-suspended', request.url))
    }

    // Role-based route protection
    const userRole = profile?.role
    const adminRoutes = ['/admin']
    const speakerRoutes = ['/speaker']
    const staffRoutes = ['/staff']

    // Admin routes
    if (adminRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
      if (userRole !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }

    // Speaker routes
    if (speakerRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
      if (!['speaker', 'admin'].includes(userRole)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }

    // Staff routes
    if (staffRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
      if (!['staff', 'admin'].includes(userRole)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}