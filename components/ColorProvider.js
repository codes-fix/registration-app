'use client'

import { useEffect } from 'react'
import { useSiteColors } from '@/lib/hooks/useColors'

export default function ColorProvider({ children }) {
  const { colors } = useSiteColors()

  useEffect(() => {
    // Inject CSS custom properties into the document root
    if (colors.primary) {
      document.documentElement.style.setProperty('--color-primary', colors.primary)
      console.log('Updated primary color:', colors.primary)
    }
    if (colors.secondary) {
      document.documentElement.style.setProperty('--color-secondary', colors.secondary)
      console.log('Updated secondary color:', colors.secondary)
    }
    if (colors.accent) {
      document.documentElement.style.setProperty('--color-accent', colors.accent)
      console.log('Updated accent color:', colors.accent)
    }
  }, [colors])

  return <>{children}</>
}

