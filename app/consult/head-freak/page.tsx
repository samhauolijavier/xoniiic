/* Same page as /consult. Kept as its own route rather than a redirect so the
   link Spencer hands out never shows a redirect hop in a preview card. */
import type { Metadata } from 'next'
import { ConsultPage } from '@/components/consult/ConsultPage'

export const metadata: Metadata = {
  title: 'Book a call — Spencer Javier',
  description:
    'Thirty minutes on one process that keeps falling over, and where it actually breaks.',
  alternates: { canonical: 'https://virtualfreaks.co/consult' },
  robots: { index: false, follow: true },
}

export default function Page() {
  return <ConsultPage />
}
