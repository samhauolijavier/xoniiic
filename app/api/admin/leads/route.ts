import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { id: string; role: string } | undefined

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role') || 'all'
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const search = searchParams.get('search')
    const format = searchParams.get('format') || 'json'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    if (role === 'seeker') {
      where.role = 'seeker'
    } else if (role === 'employer') {
      where.role = 'employer'
    } else {
      where.role = { in: ['seeker', 'employer'] }
    }

    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) {
        const toDate = new Date(to)
        toDate.setHours(23, 59, 59, 999)
        where.createdAt.lte = toDate
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { seekerProfile: { username: { contains: search, mode: 'insensitive' } } },
        { employerProfile: { companyName: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // Counts for stats
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())

    const [totalUsers, totalSeekers, totalEmployers, newThisWeek, newThisMonth] = await Promise.all([
      db.user.count({ where: { role: { in: ['seeker', 'employer'] } } }),
      db.user.count({ where: { role: 'seeker' } }),
      db.user.count({ where: { role: 'employer' } }),
      db.user.count({ where: { role: { in: ['seeker', 'employer'] }, createdAt: { gte: oneWeekAgo } } }),
      db.user.count({ where: { role: { in: ['seeker', 'employer'] }, createdAt: { gte: oneMonthAgo } } }),
    ])

    const totalFiltered = await db.user.count({ where })

    const users = await db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: format === 'csv' ? 0 : (page - 1) * limit,
      take: format === 'csv' ? undefined : limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        seekerProfile: {
          select: {
            username: true,
            location: true,
            title: true,
            hourlyRate: true,
            skills: { select: { id: true } },
          },
        },
        employerProfile: {
          select: {
            companyName: true,
            website: true,
            verified: true,
            verificationTier: true,
          },
        },
      },
    })

    if (format === 'csv') {
      const rows: string[] = []

      if (role === 'employer') {
        rows.push('Company Name,Contact Email,Website,Verified,Tier,Joined Date,Status')
        for (const u of users) {
          const ep = u.employerProfile
          rows.push([
            csvEscape(ep?.companyName || u.name || ''),
            csvEscape(u.email),
            csvEscape(ep?.website || ''),
            ep?.verified ? 'Yes' : 'No',
            csvEscape(ep?.verificationTier || 'None'),
            new Date(u.createdAt).toISOString().split('T')[0],
            u.active ? 'Active' : 'Inactive',
          ].join(','))
        }
      } else {
        rows.push('Name,Email,Role,Username,Location,Title,Hourly Rate,Skills Count,Joined Date,Status')
        for (const u of users) {
          const sp = u.seekerProfile
          const ep = u.employerProfile
          rows.push([
            csvEscape(u.role === 'employer' ? (ep?.companyName || u.name || '') : (u.name || '')),
            csvEscape(u.email),
            u.role,
            csvEscape(sp?.username || ''),
            csvEscape(sp?.location || ''),
            csvEscape(sp?.title || ''),
            sp?.hourlyRate != null ? String(sp.hourlyRate) : '',
            sp?.skills ? String(sp.skills.length) : '',
            new Date(u.createdAt).toISOString().split('T')[0],
            u.active ? 'Active' : 'Inactive',
          ].join(','))
        }
      }

      const csv = rows.join('\n')
      const dateStr = new Date().toISOString().split('T')[0]
      const filename = `virtualfreaks-leads-${role}-${dateStr}.csv`

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: totalFiltered,
        totalPages: Math.ceil(totalFiltered / limit),
      },
      stats: {
        totalUsers,
        totalSeekers,
        totalEmployers,
        newThisWeek,
        newThisMonth,
      },
    })
  } catch (error) {
    console.error('Leads GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
