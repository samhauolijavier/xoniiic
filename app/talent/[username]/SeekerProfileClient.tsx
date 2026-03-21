'use client'

import { useState } from 'react'
import { ReviewForm } from '@/components/reviews/ReviewForm'
import { ReportModal } from '@/components/ui/ReportModal'

interface SeekerProfileClientProps {
  seekerProfileId: string
  seekerName: string
  isEmployer: boolean
  sessionUserId?: string
  sidebarOnly?: boolean
}

export function SeekerProfileClient({
  seekerProfileId,
  seekerName,
  isEmployer,
  sessionUserId,
  sidebarOnly = false,
}: SeekerProfileClientProps) {
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  if (!sessionUserId) return null

  // Sidebar-only mode: just the report button
  if (sidebarOnly) {
    return (
      <div className="card p-4 text-center">
        <button
          onClick={() => setReportOpen(true)}
          className="text-xs text-brand-muted hover:text-red-400 transition-colors flex items-center gap-1 mx-auto"
        >
          <span>🚩</span> Report this profile
        </button>
        <ReportModal
          targetType="seeker"
          targetId={seekerProfileId}
          targetName={seekerName}
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Leave a Review (employers only) */}
      {isEmployer && (
        <div>
          {!showReviewForm ? (
            <button
              onClick={() => setShowReviewForm(true)}
              className="btn-secondary text-sm"
            >
              Leave a Review
            </button>
          ) : (
            <ReviewForm
              targetType="seeker"
              targetId={seekerProfileId}
              targetName={seekerName}
              onSuccess={() => setShowReviewForm(false)}
            />
          )}
        </div>
      )}

      {/* Report button */}
      <div>
        <button
          onClick={() => setReportOpen(true)}
          className="text-xs text-brand-muted hover:text-red-400 transition-colors flex items-center gap-1"
        >
          <span>🚩</span> Report this profile
        </button>
        <ReportModal
          targetType="seeker"
          targetId={seekerProfileId}
          targetName={seekerName}
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
        />
      </div>
    </div>
  )
}
