'use client'

import { useState } from 'react'
import { ReviewForm } from '@/components/reviews/ReviewForm'
import { ReportModal } from '@/components/ui/ReportModal'

interface EmployerProfileClientProps {
  employerProfileId: string
  employerName: string
  employerUserId: string
  isSeeker: boolean
  sessionUserId?: string
}

export function EmployerProfileClient({
  employerProfileId,
  employerName,
  isSeeker,
  sessionUserId,
}: EmployerProfileClientProps) {
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  return (
    <div className="space-y-4">
      {/* Leave a Review button (seekers only) */}
      {isSeeker && sessionUserId && (
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
              targetType="employer"
              targetId={employerProfileId}
              targetName={employerName}
              onSuccess={() => setShowReviewForm(false)}
            />
          )}
        </div>
      )}

      {/* Report button */}
      {sessionUserId && (
        <div>
          <button
            onClick={() => setReportOpen(true)}
            className="text-xs text-brand-muted hover:text-red-400 transition-colors flex items-center gap-1"
          >
            <span>🚩</span> Report this employer
          </button>
          <ReportModal
            targetType="employer"
            targetId={employerProfileId}
            targetName={employerName}
            isOpen={reportOpen}
            onClose={() => setReportOpen(false)}
          />
        </div>
      )}
    </div>
  )
}
