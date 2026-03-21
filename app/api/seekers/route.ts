import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const availability = searchParams.get('availability') || ''
    const minRate = searchParams.get('minRate') ? parseFloat(searchParams.get('minRate')!) : null
    const maxRate = searchParams.get('maxRate') ? parseFloat(searchParams.get('maxRate')!) : null
    const minEnglish = searchParams.get('minEnglish') ? parseInt(searchParams.get('minEnglish')!) : null
    const featured = searchParams.get('featured') === 'true'

    const skip = (page - 1) * limit

    const where: Prisma.SeekerProfileWhereInput = {
      user: { active: true },
    }

    if (featured) {
      where.featured = true
    }

    if (availability) {
      where.availability = availability
    }

    if (minRate !== null) {
      where.hourlyRate = { ...((where.hourlyRate as object) || {}), gte: minRate }
    }

    if (maxRate !== null) {
      where.hourlyRate = { ...((where.hourlyRate as object) || {}), lte: maxRate }
    }

    if (minEnglish !== null) {
      where.englishRating = { gte: minEnglish }
    }

    if (search) {
      where.OR = [
        { username: { contains: search } },
        { bio: { contains: search } },
        { location: { contains: search } },
        { user: { name: { contains: search } } },
        { skills: { some: { skill: { name: { contains: search } } } } },
      ]
    }

    if (category) {
      where.skills = {
        some: {
          skill: { category },
        },
      }
    }

    const [profiles, total] = await Promise.all([
      db.seekerProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { featured: 'desc' },
          { profileViews: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          user: { select: { id: true, name: true, email: true } },
          skills: {
            include: { skill: true },
            orderBy: { rating: 'desc' },
          },
        },
      }),
      db.seekerProfile.count({ where }),
    ])

    return NextResponse.json({
      profiles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Seekers GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
