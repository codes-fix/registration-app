import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useSiteLogo() {
  const [logo, setLogo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSiteLogo() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('site_settings')
          .select('logo_url')
          .single()

        if (!error && data?.logo_url) {
          setLogo(data.logo_url)
        }
      } catch (err) {
        console.error('Failed to fetch site logo:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSiteLogo()
  }, [])

  return { logo, loading }
}

export function useOrganizationLogo(organizationId) {
  const [logo, setLogo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!organizationId) {
      setLoading(false)
      return
    }

    async function fetchOrgLogo() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('organizations')
          .select('logo_url')
          .eq('id', organizationId)
          .single()

        if (!error && data?.logo_url) {
          setLogo(data.logo_url)
        }
      } catch (err) {
        console.error('Failed to fetch organization logo:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrgLogo()
  }, [organizationId])

  return { logo, loading }
}
