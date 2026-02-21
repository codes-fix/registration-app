'use client'

import { useEffect } from 'react'
import { useSiteColors } from '@/lib/hooks/useColors'

export default function ColorProvider({ children }) {
  const { colors } = useSiteColors()

  useEffect(() => {
    // Inject CSS custom properties into the document root
    document.documentElement.style.setProperty('--color-primary', colors.primary)
    document.documentElement.style.setProperty('--color-secondary', colors.secondary)
    document.documentElement.style.setProperty('--color-accent', colors.accent)
  }, [colors])

  return <>{children}</>
}
