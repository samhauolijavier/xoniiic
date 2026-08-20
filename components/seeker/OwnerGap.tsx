/*
 * The gaps in your own profile, shown where they would be.
 *
 * The dashboard already had a completion score, and a score is a report card:
 * it tells you that you are at 40% without telling you what an employer is
 * failing to find. Nobody fills in a percentage.
 *
 * These sit in the actual position the missing section would occupy, on the
 * real public page, and each one says what a person looking to hire loses by
 * its absence — not "add a bio" but what happens because there isn't one. Only
 * the profile's owner ever sees them; to everyone else the section is simply
 * not there.
 */
import Link from 'next/link'

export function OwnerGap({
  title,
  because,
  cta,
  href,
}: {
  title: string
  because: string
  cta: string
  href: string
}) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-purple/40 bg-brand-purple/[0.03] p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[220px]">
          <h3 className="font-semibold text-brand-text mb-1">{title}</h3>
          <p className="text-sm text-brand-muted leading-relaxed">{because}</p>
        </div>
        <Link href={href} className="btn-secondary text-sm">{cta}</Link>
      </div>
      <p className="text-[11px] text-brand-muted mt-3">Only you can see this. Employers see nothing here.</p>
    </div>
  )
}

/**
 * The strip at the top of your own profile.
 *
 * Without it, the dashed prompts look like something is broken. With it, the
 * whole page reads as a preview — which is the point: this is the page an
 * employer lands on, and you are looking at exactly what they get.
 */
export function OwnerViewBanner({ remaining }: { remaining: number }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-card p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <p className="font-semibold text-sm">This is your profile, exactly as an employer sees it.</p>
        <p className="text-sm text-brand-muted mt-0.5">
          {remaining === 0
            ? 'Nothing missing. This is the whole page they get.'
            : remaining === 1
              ? 'One dashed box below is a gap they would notice. Only you can see it.'
              : `${remaining} dashed boxes below are gaps they would notice. Only you can see them.`}
        </p>
      </div>
      <Link href="/profile/edit" className="btn-secondary text-sm">Edit profile</Link>
    </div>
  )
}
