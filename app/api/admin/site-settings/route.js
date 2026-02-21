import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET site settings
export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get site settings
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error('Error fetching site settings:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT update site settings (colors, logo, etc)
export async function PUT(request) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is super admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Super admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { primary_color, secondary_color, accent_color, logo_url, site_name } = body

    // Get existing site settings ID
    const { data: existingSettings } = await supabase
      .from('site_settings')
      .select('id')
      .single()

    if (!existingSettings) {
      return NextResponse.json({ error: 'Site settings not found' }, { status: 404 })
    }

    // Update site settings
    const updateData = {
      updated_at: new Date().toISOString(),
      updated_by: user.id
    }

    if (primary_color) updateData.primary_color = primary_color
    if (secondary_color) updateData.secondary_color = secondary_color
    if (accent_color) updateData.accent_color = accent_color
    if (logo_url !== undefined) updateData.logo_url = logo_url
    if (site_name) updateData.site_name = site_name

    const { data, error } = await supabase
      .from('site_settings')
      .update(updateData)
      .eq('id', existingSettings.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error('Error updating site settings:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
