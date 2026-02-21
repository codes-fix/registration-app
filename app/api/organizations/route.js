import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { 
      companyName, 
      businessType, 
      logoUrl, 
      userId 
    } = await request.json()

    // Create a Supabase admin client to bypass RLS
    const supabase = createAdminClient()

    // Generate organization slug
    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Math.random().toString(36).substring(2, 7)

    // Create organization (this bypasses RLS with service role)
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: companyName,
        slug: slug,
        business_type: businessType,
        logo_url: logoUrl,
        subscription_status: 'trialing',
        subscription_plan: 'free',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: userId
      })
      .select()
      .single()

    if (orgError) {
      console.error('Organization creation error:', orgError)
      return NextResponse.json(
        { error: orgError.message },
        { status: 500 }
      )
    }

    // Auto-confirm user email so they can login immediately
    const { error: confirmError } = await supabase.auth.admin.updateUserById(
      userId,
      { email_confirm: true }
    )

    if (confirmError) {
      console.error('Email confirmation error:', confirmError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({ organization: orgData })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create organization' },
      { status: 500 }
    )
  }
}
