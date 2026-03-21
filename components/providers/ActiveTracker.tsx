'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

export function ActiveTracker() {
  const { data: session } = useSession()
  const user = session?.user as { id?: string; role?: string } | undefined

  useEffect(() => {
    if (!session || user?.role !== 'seeker') return

    const sendHeartbeat = () => {
      fetch('/api/heartbeat', { method: 'POST' }).catch(() => {})
    }

    sendHeartbeat()
    const interval = setInterval(sendHeartbeat, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [session, user?.role])

  return null
}
