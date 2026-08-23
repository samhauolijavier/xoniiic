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
  // Retired. Its only home was the profile page, and profiles are the link
  // members post publicly — an advert beside somebody's name on the page they
  // are using as a portfolio makes them look hosted somewhere free. Kept
  // defined so existing rows still read, but no longer offered.
  sidebar: {
    label: 'Sidebar (retired)',
    width: 300,
    height: 250,
    ratio: '6 / 5',
    note: 'No longer has anywhere to appear.',
    retired: true,
  },
  banner: {
    label: 'Banner',
    width: 728,
    height: 90,
    ratio: '728 / 90',
    note: 'Runs across the top of the dashboard, browse, jobs, and the leaderboard.',
    retired: false,
  },
} as const

export type Placement = keyof typeof PLACEMENTS

export function isPlacement(value: string): value is Placement {
  return value === 'sidebar' || value === 'banner'
}

export function placementSpec(placement: string) {
  // Falls back to banner, not sidebar. Sidebar is retired, so an unrecognised
  // placement would otherwise be sized as the one unit that renders nowhere.
  return isPlacement(placement) ? PLACEMENTS[placement] : PLACEMENTS.banner
}

export const AUDIENCES = {
  all: 'Everyone',
  seeker: 'Freelancers only',
  employer: 'Businesses only',
} as const

export type Audience = keyof typeof AUDIENCES

/**
 * A viewer's role reduced to the audiences they belong to.
 *
 * An empty list means no ads at all, and that is what a signed-out visitor
 * gets. Three reasons, and the first is the one that matters:
 *
 * A profile page is a member's shopfront. They are being asked to post
 * /@username on LinkedIn, and when their client follows that link and finds an
 * advert for somebody else's CRM beside their name, the member looks like they
 * are hosted somewhere free. That is what would stop people sharing the link.
 *
 * A signed-out visitor is also the least valuable impression — nobody buys
 * "unknown person, might be anyone" — and the most valuable conversion, since
 * the page is already asking them to make an account and an ad competes with
 * that.
 */
export function audiencesFor(role?: string | null): string[] {
  if (role === 'seeker') return ['all', 'seeker']
  if (role === 'employer') return ['all', 'employer']
  return []
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
