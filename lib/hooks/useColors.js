'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useSiteColors() {
  const [colors, setColors] = useState({
    primary: '#22C55E',
    secondary: '#EAB308',
    accent: '#991B1B'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchColors() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('site_settings')
          .select('primary_color, secondary_color, accent_color')
          .single()

        if (error) throw error

        if (data) {
          setColors({
            primary: data.primary_color || '#22C55E',
            secondary: data.secondary_color || '#EAB308',
            accent: data.accent_color || '#991B1B'
          })
        }
      } catch (error) {
        console.error('Error fetching site colors:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchColors()
  }, [])

  return { colors, loading }
}
