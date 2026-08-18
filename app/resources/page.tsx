/*
 * The page the videos point at.
 *
 * Deliberately public and ungated. Someone arriving from YouTube should be able
 * to download the scenario brief and start working before they have an account,
 * let alone a practice seat — the paid thing is the GoHighLevel sandbox, never
 * the material. Gating the brief would cost the audience the videos are for.
 *
 * It is also built to be honest when empty. A resources page padded with filler
 * to look busy is worse than one that says plainly that the first videos are
 * coming, because the filler is what people judge the whole thing by.
 */
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { db, withRetry } from '@/lib/db'
import type { Resource } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Resources',
  description:
    'Scenario briefs, templates, and walkthroughs you can practise with — free to download, no account needed.',
  alternates: { canonical: 'https://virtualfreaks.co/resources' },
}

const KIND_LABEL: Record<string, string> = {
  scenario: 'Scenario',
  document: 'Template',
  video: 'Video',
}

function prettySize(bytes: number | null) {
  if (!bytes) return null
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default async function ResourcesPage() {
  let resources: Resource[] = []
  try {
    resources = await withRetry(() => db.resource.findMany({
      where: { published: true },
      orderBy: [{ track: 'asc' }, { position: 'asc' }],
    }))
  } catch (error) {
    // An empty page beats an error page. Someone arriving mid-video should see
    // the section exists even if the database is having a moment.
    console.error('Resources load error:', error)
  }

  const grouped = resources.reduce<Record<string, Resource[]>>((acc, r) => {
    (acc[r.track] ||= []).push(r)
    return acc
  }, {})
  const tracks = Object.keys(grouped)

  return (
    <div className="max-w-4xl mx-auto px-5 py-14">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Resources</h1>
      <p className="text-brand-muted text-base leading-relaxed mb-10 max-w-2xl">
        The briefs and templates from the videos. Download them and do the work — this is the
        part that turns watching into something you can put on a profile. Free, no account
        needed.
      </p>

      {!tracks.length ? (
        <div className="card p-10 text-center">
          <p className="font-semibold text-lg mb-2">The first scenarios are on their way</p>
          <p className="text-brand-muted text-sm leading-relaxed max-w-md mx-auto mb-6">
            Each video comes with a brief you work through yourself, plus the templates to do it
            with. They land here as the videos go out.
          </p>
          <Link href="/register" className="btn-primary">Make a free profile</Link>
        </div>
      ) : (
        tracks.map(track => (
          <section key={track} className="mb-10">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-muted mb-3">
              {track}
            </h2>
            <div className="card divide-y divide-brand-border">
              {grouped[track].map(r => (
                <div key={r.id} className="p-5 flex gap-4 items-start flex-wrap">
                  <div className="flex-1 min-w-[240px]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-brand-purple/[0.08] text-brand-purple">
                        {KIND_LABEL[r.kind] ?? r.kind}
                      </span>
                    </div>
                    <h3 className="font-semibold leading-snug">{r.title}</h3>
                    {r.summary && (
                      <p className="text-sm text-brand-muted leading-relaxed mt-1">{r.summary}</p>
                    )}
                  </div>

                  {r.kind === 'video' && r.videoUrl ? (
                    <a className="btn-secondary text-sm" href={r.videoUrl} target="_blank" rel="noreferrer">
                      Watch
                    </a>
                  ) : r.filePath ? (
                    <a className="btn-secondary text-sm" href={r.filePath} target="_blank" rel="noreferrer">
                      Download{prettySize(r.fileSize) ? ` · ${prettySize(r.fileSize)}` : ''}
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      <div className="card p-6 mt-12 border-brand-purple/30 bg-brand-purple/[0.04]">
        <h2 className="font-semibold mb-1.5">Want somewhere to actually do it?</h2>
        <p className="text-sm text-brand-muted leading-relaxed mb-4 max-w-xl">
          The briefs are free forever. A GoHighLevel practice account — a real sandbox to build
          in, break, and rebuild — is ₱100 for 30 days, and you can earn more time instead of
          paying for it.
        </p>
        <Link href="/sandbox" className="btn-primary">See the practice account</Link>
      </div>
    </div>
  )
}
