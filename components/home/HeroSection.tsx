/*
 * The hero, rebuilt.
 *
 * What it was: centred, on a lavender-to-peach wash, with the last words of the
 * headline in a purple gradient, a three-stat row beneath, and everything in
 * Inter. Every one of those is a house style — put together they are the
 * fingerprint of a generated page, which is exactly how it read.
 *
 * What changed. It is left-aligned and asymmetric, because centred everything
 * is the tell. The type carries the screen rather than a background gradient.
 * And the accent moved off the words and onto the strike through them: the
 * sentence is "nobody should have to pay to get hired", so colouring "pay to
 * get hired" put the eye on the toll — the thing we are against. The gradient
 * now marks the cancelling instead, which is the argument the page is making.
 *
 * The faces are here rather than three sections down. It is a marketplace of
 * people and it used to show none of them above the fold.
 */
'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

/** Split so the closing phrase can be struck rather than coloured. */
const STRIKE_FROM = 'pay to get hired.'

export function HeroSection() {
  const { data: session } = useSession()
  const router = useRouter()

  const [heroHeadline, setHeroHeadline] = useState('Nobody should have to pay to get hired.')
  const [heroSubtitle, setHeroSubtitle] = useState('No commission on your rate. No fee to apply. No charge to message anyone. Free for freelancers, free for businesses, and it stays that way.')
  const [heroCta1, setHeroCta1] = useState('Make a free profile')
  const [heroCta2, setHeroCta2] = useState("I'm hiring")

  const [faces, setFaces] = useState<{ avatarUrl: string | null; username: string }[]>([])
  const [memberCount, setMemberCount] = useState(0)
  const [skillCount, setSkillCount] = useState(0)

  useEffect(() => {
    fetch('/api/site-settings')
      .then(r => r.json())
      .then(data => {
        if (data.heroHeadline) setHeroHeadline(data.heroHeadline)
        if (data.heroSubtitle) setHeroSubtitle(data.heroSubtitle)
        if (data.heroCta1) setHeroCta1(data.heroCta1)
        if (data.heroCta2) setHeroCta2(data.heroCta2)
        setMemberCount(Number(data._seekerCount ?? 0))
        setSkillCount(Number(data._skillCount ?? 0))
        try {
          const parsed = JSON.parse(data._faces ?? '[]')
          if (Array.isArray(parsed)) setFaces(parsed)
        } catch {
          // A missing row of avatars is a smaller loss than a broken hero.
        }
      })
      .catch(() => {})
  }, [])

  function goToProfile() {
    if (session) router.push('/profile/edit')
    else router.push('/register?role=seeker&redirect=/profile/edit')
  }

  // Struck only when the phrase is actually present — an admin can rewrite the
  // headline from the branding screen, and a hard-coded split would strike the
  // wrong words or crash on a shorter line.
  const cut = heroHeadline.lastIndexOf(STRIKE_FROM)
  const head = cut > -1 ? heroHeadline.slice(0, cut) : heroHeadline
  const struck = cut > -1 ? heroHeadline.slice(cut) : ''

  return (
    <section className="relative overflow-hidden">
      {/* One bloom, off to the side. Not a full-width wash. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-56 w-[820px] h-[820px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(162,28,175,0.40), rgba(249,115,22,0.13) 52%, transparent 72%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-14 sm:pt-32 sm:pb-20">
        <h1 className="display text-[clamp(2.6rem,8.4vw,6.5rem)] max-w-[15ch]">
          {head}
          {struck && <span className="strikeout">{struck}</span>}
        </h1>

        <div className="mt-10 sm:mt-14 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
          <p className="quiet text-base sm:text-lg leading-relaxed max-w-[42ch]">
            {heroSubtitle}
          </p>

          <div className="flex flex-col items-start lg:items-end gap-4 flex-none">
            {faces.length >= 3 && (
              <div className="flex items-center gap-3 lg:flex-row-reverse">
                <div className="flex">
                  {faces.map((f, i) => (
                    <Link
                      key={f.username}
                      href={`/@${f.username}`}
                      className="block -ml-3 first:ml-0 transition-transform hover:-translate-y-1"
                      style={{ zIndex: faces.length - i }}
                      aria-label={`See ${f.username}'s profile`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={f.avatarUrl ?? ''}
                        alt=""
                        width={44}
                        height={44}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-[#0f0d11]"
                      />
                    </Link>
                  ))}
                </div>
                <p className="quieter font-mono text-xs tabular-nums">
                  {memberCount} looking for work now
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button onClick={goToProfile} className="btn-grad text-[15px]">
                {heroCta1}
              </button>
              <Link href="/hire" className="btn-outline text-[15px]">
                {heroCta2}
              </Link>
            </div>

            {!session && (
              <p className="quieter text-sm">
                Already have an account?{' '}
                <Link
                  href="/login?redirect=/browse"
                  className="text-white/80 hover:text-white underline underline-offset-2 transition-colors"
                >
                  Log in
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* Facts on a rule rather than in three centred cards. */}
        <dl className="mt-14 sm:mt-20 grid grid-cols-3 gap-6 sm:gap-10 border-t border-white/10 pt-7 max-w-3xl">
          {[
            { n: memberCount ? String(memberCount) : '—', l: 'people looking for work' },
            { n: '0%', l: 'taken from what they earn' },
            { n: skillCount ? String(skillCount) : '—', l: 'skills across six areas' },
          ].map(stat => (
            <div key={stat.l}>
              <dt className="display-sm text-3xl sm:text-5xl tabular-nums">{stat.n}</dt>
              <dd className="quieter text-xs sm:text-sm mt-1.5 leading-snug">{stat.l}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
