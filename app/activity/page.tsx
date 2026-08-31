/*
 * A server shell around a client feed.
 *
 * The ad slot has to render on the server — it reads the session to decide
 * which audience to show — so the page that contains it cannot be a client
 * component. The interactive half is ActivityFeed.
 */
import type { Metadata } from 'next'
import { AdSlot } from '@/components/ads/AdSlot'
import { ActivityFeed } from '@/components/activity/ActivityFeed'

export const metadata: Metadata = {
  title: 'Activity',
  description: 'What is happening on Virtual Freaks right now.',
}

export default function ActivityPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl sm:text-3xl font-black text-brand-text mb-2">
        <span className="gradient-text">Activity Feed</span>
      </h1>
      <p className="text-brand-muted mb-8">See what&apos;s happening on the platform</p>

      <AdSlot placement="banner" />

      <ActivityFeed />
    </div>
  )
}
