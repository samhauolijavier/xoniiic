import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string; role: string }

    const profile = await db.seekerProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        skills: {
          include: {
            skill: true,
          },
          orderBy: { rating: 'desc' },
        },
        portfolioLinks: { orderBy: { order: 'asc' } },
        certificates: { orderBy: { createdAt: 'asc' } },
        projectImages: { orderBy: { order: 'asc' } },
        languages: true,
      },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Also fetch founding member number from user
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { foundingMemberNumber: true },
    })

    return NextResponse.json({ profile, foundingMemberNumber: dbUser?.foundingMemberNumber ?? null })
  } catch (error) {
    console.error('Profile GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string; role: string }
    const body = await req.json()

    const {
      bio,
      location,
      hourlyRate,
      availability,
      englishRating,
      skills,
      name,
      title,
      videoIntroUrl,
      timezone,
      portfolioLinks,
      languages,
    } = body

    // Update user name
    if (name !== undefined) {
      await db.user.update({
        where: { id: user.id },
        data: { name },
      })
    }

    // Update profile
    const profile = await db.seekerProfile.update({
      where: { userId: user.id },
      data: {
        ...(bio !== undefined && { bio }),
        ...(location !== undefined && { location }),
        ...(hourlyRate !== undefined && { hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null }),
        ...(availability !== undefined && { availability }),
        ...(englishRating !== undefined && { englishRating: parseInt(englishRating) }),
        ...(title !== undefined && { title }),
        ...(videoIntroUrl !== undefined && { videoIntroUrl }),
        ...(timezone !== undefined && { timezone }),
      },
    })

    // Update skills if provided
    if (skills && Array.isArray(skills)) {
      await db.seekerSkill.deleteMany({ where: { profileId: profile.id } })

      if (skills.length > 0) {
        await db.seekerSkill.createMany({
          data: skills.map((s: { skillId: string; rating: number; yearsExp?: number | null }) => ({
            profileId: profile.id,
            skillId: s.skillId,
            rating: s.rating,
            yearsExp: s.yearsExp ?? null,
          })),
        })
      }
    }

    // Update portfolio links if provided
    if (portfolioLinks !== undefined && Array.isArray(portfolioLinks)) {
      await db.portfolioLink.deleteMany({ where: { profileId: profile.id } })

      if (portfolioLinks.length > 0) {
        await db.portfolioLink.createMany({
          data: portfolioLinks.map((l: { label: string; url: string }, index: number) => ({
            profileId: profile.id,
            label: l.label,
            url: l.url,
            order: index,
          })),
        })
      }
    }

    // Update languages if provided
    if (languages !== undefined && Array.isArray(languages)) {
      await db.language.deleteMany({ where: { profileId: profile.id } })

      if (languages.length > 0) {
        await db.language.createMany({
          data: languages.map((l: { name: string; level: string }) => ({
            profileId: profile.id,
            name: l.name,
            level: l.level,
          })),
        })
      }
    }

    return NextResponse.json({ message: 'Profile updated successfully', profile })
  } catch (error) {
    console.error('Profile PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
