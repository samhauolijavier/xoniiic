/**
 * Ad placements, and what fits in them.
 *
 * The sizes are the two standard IAB units, chosen so an advertiser can hand
 * over creative they already have rather than commissioning something for this
 * site alone. Defined here rather than in the form, so the guidance shown while
 * uploading and the box the ad renders into can never disagree — a slot that
 * advertises 300×250 and then renders a different shape crops somebody's paid
 * artwork.
 */
export const PLACEMENTS = {
  sidebar: {
    label: 'Sidebar',
    width: 300,
    height: 250,
    ratio: '6 / 5',
    note: 'Medium rectangle. Sits beside profile and browse content.',
  },
  banner: {
    label: 'Banner',
    width: 728,
    height: 90,
    ratio: '728 / 90',
    note: 'Leaderboard. Runs across the top of a page, above the content.',
  },
} as const

export type Placement = keyof typeof PLACEMENTS

export function isPlacement(value: string): value is Placement {
  return value === 'sidebar' || value === 'banner'
}

export function placementSpec(placement: string) {
  return isPlacement(placement) ? PLACEMENTS[placement] : PLACEMENTS.sidebar
}

export const AUDIENCES = {
  all: 'Everyone',
  seeker: 'Freelancers only',
  employer: 'Businesses only',
} as const

export type Audience = keyof typeof AUDIENCES

/** A viewer's role reduced to the audiences they belong to. */
export function audiencesFor(role?: string | null): string[] {
  if (role === 'seeker') return ['all', 'seeker']
  if (role === 'employer') return ['all', 'employer']
  // Signed out, or an admin looking around: only untargeted ads. Somebody
  // whose side we do not know is not worth spending a targeted impression on.
  return ['all']
}

/**
 * Whether an ad should be on screen right now, for this viewer.
 *
 * Scheduling is a range with both ends optional: no start means it runs from
 * the moment it is switched on, and no end means it runs until somebody turns
 * it off. Both are common — a house ad has neither, a paid placement has both.
 */
export function adWhereClause(placement: Placement, audiences: string[], now = new Date()) {
  return {
    placement,
    active: true,
    audience: { in: audiences },
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
    ],
  }
}
