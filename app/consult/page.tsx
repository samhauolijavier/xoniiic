/*
 * /consult — the canonical booking page.
 *
 * /consult/head-freak renders the same thing, so either link works and neither
 * has to be retired if the other gets used somewhere permanent.
 */
import type { Metadata } from 'next'
import { existsSync } from 'fs'
import { join } from 'path'
import { ConsultPage } from '@/components/consult/ConsultPage'

export const metadata: Metadata = {
  title: 'Book a call — Spencer Javier',
  description:
    'Thirty minutes on one process that keeps falling over, and where it actually breaks. Fractional COO — operations, systems, and the team to run them.',
  alternates: { canonical: 'https://virtualfreaks.co/consult' },
  // Not a page that wants to rank. It exists to be clicked from a profile, and
  // an indexed personal booking page competes with the marketplace's own pages
  // for the same domain authority.
  robots: { index: false, follow: true },
}

export default function Page() {
  return <ConsultPage hasHeadshot={existsSync(join(process.cwd(), 'public', 'spencer.jpg'))} />
}
