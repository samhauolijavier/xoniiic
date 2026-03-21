export interface UserSession {
  id: string
  email: string
  name?: string | null
  role: string
  username?: string | null
}

export interface SeekerWithDetails {
  id: string
  username: string
  avatarUrl: string | null
  bio: string | null
  location: string | null
  hourlyRate: number | null
  availability: string
  englishRating: number
  featured: boolean
  profileViews: number
  createdAt: Date
  user: {
    id: string
    name: string | null
    email: string
  }
  skills: {
    id: string
    rating: number
    yearsExp: number | null
    skill: {
      id: string
      name: string
      slug: string
      category: string
    }
  }[]
}

export interface SkillWithRating {
  id: string
  skillId: string
  rating: number
  yearsExp: number | null
  skill: {
    id: string
    name: string
    slug: string
    category: string
  }
}

export type AvailabilityStatus = 'open' | 'part-time' | 'unavailable'
