'use client'

import { useEffect } from 'react'

export function SearchMatchChecker() {
  useEffect(() => {
    fetch('/api/saved-searches/check-matches').catch(() => {})
  }, [])

  return null
}
