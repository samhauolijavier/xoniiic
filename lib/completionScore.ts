export interface ProfileForScore {
  avatarUrl?: string | null
  bio?: string | null
  title?: string | null
  hourlyRate?: number | null
  englishRating?: number | null
  location?: string | null
  videoIntroUrl?: string | null
  timezone?: string | null
  skills?: { id: string }[]
  portfolioLinks?: { id: string }[]
  certificates?: { id: string }[]
}

export interface CompletionItem {
  key: string
  label: string
  done: boolean
  points: number
  editTab?: string // query param for profile/edit tab
}

export function getCompletionScore(profile: ProfileForScore): {
  score: number
  items: CompletionItem[]
  color: 'green' | 'orange' | 'red'
} {
  const items: CompletionItem[] = [
    {
      key: 'avatar',
      label: 'Upload a profile photo',
      done: !!profile.avatarUrl,
      points: 10,
      editTab: 'basic',
    },
    {
      key: 'bio',
      label: 'Write a bio',
      done: !!profile.bio && profile.bio.trim().length > 0,
      points: 10,
      editTab: 'basic',
    },
    {
      key: 'title',
      label: 'Add a headline / title',
      done: !!profile.title && profile.title.trim().length > 0,
      points: 10,
      editTab: 'basic',
    },
    {
      key: 'hourlyRate',
      label: 'Set your hourly rate',
      done: profile.hourlyRate !== null && profile.hourlyRate !== undefined && profile.hourlyRate > 0,
      points: 10,
      editTab: 'basic',
    },
    {
      key: 'skills',
      label: 'Add at least 3 skills',
      done: (profile.skills?.length ?? 0) >= 3,
      points: 15,
      editTab: 'skills',
    },
    {
      key: 'englishRating',
      label: 'Set your English proficiency',
      done: profile.englishRating !== null && profile.englishRating !== undefined && profile.englishRating > 0,
      points: 10,
      editTab: 'basic',
    },
    {
      key: 'location',
      label: 'Add your location',
      done: !!profile.location && profile.location.trim().length > 0,
      points: 5,
      editTab: 'basic',
    },
    {
      key: 'portfolioLinks',
      label: 'Add at least 1 portfolio link',
      done: (profile.portfolioLinks?.length ?? 0) >= 1,
      points: 10,
      editTab: 'portfolio',
    },
    {
      key: 'videoIntro',
      label: 'Add a video introduction',
      done: !!profile.videoIntroUrl && profile.videoIntroUrl.trim().length > 0,
      points: 10,
      editTab: 'basic',
    },
    {
      key: 'certificates',
      label: 'Add at least 1 certificate',
      done: (profile.certificates?.length ?? 0) >= 1,
      points: 5,
      editTab: 'certificates',
    },
    {
      key: 'timezone',
      label: 'Set your timezone',
      done: !!profile.timezone && profile.timezone.trim().length > 0,
      points: 5,
      editTab: 'basic',
    },
  ]

  const score = items.filter((i) => i.done).reduce((acc, i) => acc + i.points, 0)

  const color: 'green' | 'orange' | 'red' =
    score >= 80 ? 'green' : score >= 50 ? 'orange' : 'red'

  return { score, items, color }
}
