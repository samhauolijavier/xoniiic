import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const skills = [
  // Development
  { name: 'React', slug: 'react', category: 'Development' },
  { name: 'Node.js', slug: 'nodejs', category: 'Development' },
  { name: 'Python', slug: 'python', category: 'Development' },
  { name: 'TypeScript', slug: 'typescript', category: 'Development' },
  { name: 'PHP', slug: 'php', category: 'Development' },
  { name: 'Vue.js', slug: 'vuejs', category: 'Development' },
  { name: 'Angular', slug: 'angular', category: 'Development' },
  { name: 'Next.js', slug: 'nextjs', category: 'Development' },
  { name: 'Django', slug: 'django', category: 'Development' },
  { name: 'Laravel', slug: 'laravel', category: 'Development' },
  { name: 'PostgreSQL', slug: 'postgresql', category: 'Development' },
  { name: 'MongoDB', slug: 'mongodb', category: 'Development' },
  { name: 'Docker', slug: 'docker', category: 'Development' },
  { name: 'AWS', slug: 'aws', category: 'Development' },
  // Design
  { name: 'Figma', slug: 'figma', category: 'Design' },
  { name: 'Photoshop', slug: 'photoshop', category: 'Design' },
  { name: 'Illustrator', slug: 'illustrator', category: 'Design' },
  { name: 'UI/UX Design', slug: 'ui-ux-design', category: 'Design' },
  { name: 'Logo Design', slug: 'logo-design', category: 'Design' },
  { name: 'Video Editing', slug: 'video-editing', category: 'Design' },
  { name: 'Motion Graphics', slug: 'motion-graphics', category: 'Design' },
  { name: 'Canva', slug: 'canva', category: 'Design' },
  { name: 'After Effects', slug: 'after-effects', category: 'Design' },
  { name: 'Premiere Pro', slug: 'premiere-pro', category: 'Design' },
  // Virtual Assistant
  { name: 'Data Entry', slug: 'data-entry', category: 'Virtual Assistant' },
  { name: 'Email Management', slug: 'email-management', category: 'Virtual Assistant' },
  { name: 'Calendar Management', slug: 'calendar-management', category: 'Virtual Assistant' },
  { name: 'Customer Support', slug: 'customer-support', category: 'Virtual Assistant' },
  { name: 'Research', slug: 'research', category: 'Virtual Assistant' },
  { name: 'Transcription', slug: 'transcription', category: 'Virtual Assistant' },
  { name: 'Shopify', slug: 'shopify', category: 'Virtual Assistant' },
  { name: 'WordPress', slug: 'wordpress', category: 'Virtual Assistant' },
  // Writing
  { name: 'Copywriting', slug: 'copywriting', category: 'Writing' },
  { name: 'Blog Writing', slug: 'blog-writing', category: 'Writing' },
  { name: 'SEO Writing', slug: 'seo-writing', category: 'Writing' },
  { name: 'Proofreading', slug: 'proofreading', category: 'Writing' },
  { name: 'Technical Writing', slug: 'technical-writing', category: 'Writing' },
  { name: 'Grant Writing', slug: 'grant-writing', category: 'Writing' },
  { name: 'Social Media Content', slug: 'social-media-content', category: 'Writing' },
  // Marketing
  { name: 'Facebook Ads', slug: 'facebook-ads', category: 'Marketing' },
  { name: 'Google Ads', slug: 'google-ads', category: 'Marketing' },
  { name: 'SEO', slug: 'seo', category: 'Marketing' },
  { name: 'Email Marketing', slug: 'email-marketing', category: 'Marketing' },
  { name: 'Social Media Management', slug: 'social-media-management', category: 'Marketing' },
  { name: 'Content Strategy', slug: 'content-strategy', category: 'Marketing' },
  { name: 'Analytics', slug: 'analytics', category: 'Marketing' },
  { name: 'TikTok Marketing', slug: 'tiktok-marketing', category: 'Marketing' },
  // Other
  { name: 'Excel', slug: 'excel', category: 'Other' },
  { name: 'PowerPoint', slug: 'powerpoint', category: 'Other' },
  { name: 'Bookkeeping', slug: 'bookkeeping', category: 'Other' },
  { name: 'QuickBooks', slug: 'quickbooks', category: 'Other' },
  { name: 'Project Management', slug: 'project-management', category: 'Other' },
  { name: 'Recruiting', slug: 'recruiting', category: 'Other' },
  { name: 'Translation', slug: 'translation', category: 'Other' },
  { name: 'Teaching', slug: 'teaching', category: 'Other' },
]

async function main() {
  console.log('Seeding database...')

  // Create skills
  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { slug: skill.slug },
      update: {},
      create: skill,
    })
  }
  console.log(`Created ${skills.length} skills`)

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@virtualfreaks.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@virtualfreaks.com',
      password: adminPassword,
      role: 'admin',
    },
  })
  console.log('Created admin user:', admin.email)

  const now = new Date()
  const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)

  // Create employer accounts
  const emp1Password = await bcrypt.hash('employer123', 12)
  const employer1 = await prisma.user.upsert({
    where: { email: 'hiring@techcorp.com' },
    update: {},
    create: {
      name: 'TechCorp Hiring',
      email: 'hiring@techcorp.com',
      password: emp1Password,
      role: 'employer',
    },
  })

  // Create employer profile for TechCorp if missing
  await prisma.employerProfile.upsert({
    where: { userId: employer1.id },
    update: {},
    create: {
      userId: employer1.id,
      companyName: 'TechCorp',
      verified: true,
    },
  })

  const emp2Password = await bcrypt.hash('employer123', 12)
  const employer2 = await prisma.user.upsert({
    where: { email: 'jobs@startupxyz.com' },
    update: {},
    create: {
      name: 'StartupXYZ',
      email: 'jobs@startupxyz.com',
      password: emp2Password,
      role: 'employer',
    },
  })

  await prisma.employerProfile.upsert({
    where: { userId: employer2.id },
    update: {},
    create: {
      userId: employer2.id,
      companyName: 'StartupXYZ',
      verified: false,
    },
  })

  // Create Verified Partner employer
  const emp3Password = await bcrypt.hash('partner123', 12)
  const partnerEmployer = await prisma.user.upsert({
    where: { email: 'partner@acmeinc.com' },
    update: {},
    create: {
      name: 'Acme Inc',
      email: 'partner@acmeinc.com',
      password: emp3Password,
      role: 'employer',
      premium: true,
      premiumSince: now,
      premiumUntil: oneYearFromNow,
    },
  })

  await prisma.employerProfile.upsert({
    where: { userId: partnerEmployer.id },
    update: {},
    create: {
      userId: partnerEmployer.id,
      companyName: 'Acme Inc',
      description: 'Leading tech company hiring remote talent worldwide. We build innovative SaaS products and are always looking for top-tier remote talent to join our fully distributed team.',
      website: 'https://acme.example.com',
      verified: true,
      verifiedAt: now,
      verificationTier: 'vf_verified',
      newEmployer: false,
      industry: 'Technology',
      companySize: '21-50 (Growing)',
      location: 'Remote - Global',
      foundedYear: 2019,
      techStack: 'React, Next.js, Node.js, PostgreSQL, AWS, Figma',
      benefits: 'Flexible hours, equipment stipend, professional development budget, unlimited PTO',
      cultureStatement: 'We value autonomy, transparency, and shipping fast. Our team spans 12 countries and we believe the best talent isn\'t limited by geography.',
    },
  })

  console.log('Created Verified Partner employer: partner@acmeinc.com / partner123')
  console.log('Created employer accounts')

  // Create seeker profiles
  const seekerData = [
    {
      email: 'alex.dev@example.com',
      name: 'Alex Rivera',
      password: 'seeker123',
      username: 'alex-rivera',
      title: 'Full Stack Developer',
      bio: 'Full-stack developer with 5+ years building scalable web applications. Passionate about clean code and modern frameworks.',
      location: 'Philippines',
      hourlyRate: 35,
      availability: 'open',
      englishRating: 9,
      featured: true,
      skills: [
        { slug: 'react', rating: 9, yearsExp: 5 },
        { slug: 'nodejs', rating: 8, yearsExp: 4 },
        { slug: 'typescript', rating: 8, yearsExp: 3 },
        { slug: 'nextjs', rating: 7, yearsExp: 2 },
        { slug: 'postgresql', rating: 7, yearsExp: 4 },
      ],
    },
    {
      email: 'maria.design@example.com',
      name: 'Maria Santos',
      password: 'seeker123',
      username: 'maria-santos',
      title: 'UI/UX Designer',
      bio: 'Creative UI/UX designer specializing in mobile-first, user-centered design. I turn complex problems into beautiful, intuitive interfaces.',
      location: 'Colombia',
      hourlyRate: 28,
      availability: 'open',
      englishRating: 8,
      featured: true,
      skills: [
        { slug: 'figma', rating: 10, yearsExp: 6 },
        { slug: 'ui-ux-design', rating: 9, yearsExp: 6 },
        { slug: 'photoshop', rating: 8, yearsExp: 5 },
        { slug: 'illustrator', rating: 7, yearsExp: 4 },
        { slug: 'canva', rating: 9, yearsExp: 3 },
      ],
    },
    {
      email: 'john.va@example.com',
      name: 'John Mendez',
      password: 'seeker123',
      username: 'john-mendez',
      title: 'Virtual Assistant',
      bio: 'Experienced virtual assistant with 4 years helping entrepreneurs and startups streamline operations. Detail-oriented and highly organized.',
      location: 'Philippines',
      hourlyRate: 12,
      availability: 'part-time',
      englishRating: 8,
      featured: false,
      skills: [
        { slug: 'email-management', rating: 9, yearsExp: 4 },
        { slug: 'calendar-management', rating: 9, yearsExp: 4 },
        { slug: 'customer-support', rating: 8, yearsExp: 3 },
        { slug: 'data-entry', rating: 9, yearsExp: 5 },
        { slug: 'research', rating: 8, yearsExp: 4 },
        { slug: 'shopify', rating: 7, yearsExp: 2 },
      ],
    },
    {
      email: 'sarah.writes@example.com',
      name: 'Sarah Chen',
      password: 'seeker123',
      username: 'sarah-chen',
      title: 'Content Strategist & Copywriter',
      bio: 'Content strategist and copywriter who crafts compelling narratives for B2B and B2C brands. SEO-certified with a track record of ranking #1.',
      location: 'India',
      hourlyRate: 20,
      availability: 'open',
      englishRating: 10,
      featured: true,
      skills: [
        { slug: 'copywriting', rating: 9, yearsExp: 5 },
        { slug: 'seo-writing', rating: 9, yearsExp: 4 },
        { slug: 'blog-writing', rating: 10, yearsExp: 6 },
        { slug: 'content-strategy', rating: 8, yearsExp: 3 },
        { slug: 'social-media-content', rating: 8, yearsExp: 4 },
      ],
    },
    {
      email: 'carlos.mktg@example.com',
      name: 'Carlos Reyes',
      password: 'seeker123',
      username: 'carlos-reyes',
      title: 'Performance Marketing Specialist',
      bio: 'Performance marketing specialist with expertise in paid ads and growth hacking. Have managed $2M+ in ad spend across Facebook, Google, and TikTok.',
      location: 'Mexico',
      hourlyRate: 32,
      availability: 'open',
      englishRating: 8,
      featured: false,
      skills: [
        { slug: 'facebook-ads', rating: 9, yearsExp: 5 },
        { slug: 'google-ads', rating: 8, yearsExp: 4 },
        { slug: 'tiktok-marketing', rating: 9, yearsExp: 3 },
        { slug: 'analytics', rating: 8, yearsExp: 5 },
        { slug: 'seo', rating: 7, yearsExp: 3 },
        { slug: 'email-marketing', rating: 8, yearsExp: 4 },
      ],
    },
  ]

  for (const seeker of seekerData) {
    const hashedPassword = await bcrypt.hash(seeker.password, 12)
    const user = await prisma.user.upsert({
      where: { email: seeker.email },
      update: {},
      create: {
        name: seeker.name,
        email: seeker.email,
        password: hashedPassword,
        role: 'seeker',
      },
    })

    const profile = await prisma.seekerProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        username: seeker.username,
        title: seeker.title,
        bio: seeker.bio,
        location: seeker.location,
        hourlyRate: seeker.hourlyRate,
        availability: seeker.availability,
        englishRating: seeker.englishRating,
        featured: seeker.featured,
        profileViews: Math.floor(Math.random() * 500) + 50,
      },
    })

    for (const skillData of seeker.skills) {
      const skill = await prisma.skill.findUnique({ where: { slug: skillData.slug } })
      if (skill) {
        await prisma.seekerSkill.upsert({
          where: { profileId_skillId: { profileId: profile.id, skillId: skill.id } },
          update: {},
          create: {
            profileId: profile.id,
            skillId: skill.id,
            rating: skillData.rating,
            yearsExp: skillData.yearsExp,
          },
        })
      }
    }
  }
  console.log('Created 5 seeker profiles')

  // ─── PREMIUM SEEKER ACCOUNT ─────────────────────────────────────────────
  const premiumPassword = await bcrypt.hash('premium123', 12)

  const premiumUser = await prisma.user.upsert({
    where: { email: 'premium.seeker@example.com' },
    update: {},
    create: {
      name: 'Jordan Premium',
      email: 'premium.seeker@example.com',
      password: premiumPassword,
      role: 'seeker',
      premium: true,
      premiumSince: now,
      premiumUntil: oneYearFromNow,
    },
  })

  const premiumProfile = await prisma.seekerProfile.upsert({
    where: { userId: premiumUser.id },
    update: {},
    create: {
      userId: premiumUser.id,
      username: 'jordan-premium',
      title: 'Senior Full Stack Developer',
      bio: 'Senior full-stack developer with 8+ years building enterprise-grade web applications and APIs. Expert in React, Node.js, TypeScript, and cloud infrastructure. Open to exciting remote opportunities worldwide.',
      location: 'Remote - Global',
      hourlyRate: 45,
      availability: 'open',
      englishRating: 9,
      featured: true,
      profileViews: 312,
    },
  })

  const premiumSkills = [
    { slug: 'react', rating: 9, yearsExp: 7 },
    { slug: 'nodejs', rating: 8, yearsExp: 6 },
    { slug: 'typescript', rating: 9, yearsExp: 5 },
    { slug: 'postgresql', rating: 7, yearsExp: 5 },
    { slug: 'aws', rating: 7, yearsExp: 4 },
  ]

  for (const skillData of premiumSkills) {
    const skill = await prisma.skill.findUnique({ where: { slug: skillData.slug } })
    if (skill) {
      await prisma.seekerSkill.upsert({
        where: { profileId_skillId: { profileId: premiumProfile.id, skillId: skill.id } },
        update: {},
        create: {
          profileId: premiumProfile.id,
          skillId: skill.id,
          rating: skillData.rating,
          yearsExp: skillData.yearsExp,
        },
      })
    }
  }

  // Add portfolio links for premium seeker
  const existingLinks = await prisma.portfolioLink.findMany({
    where: { profileId: premiumProfile.id },
  })
  if (existingLinks.length === 0) {
    await prisma.portfolioLink.createMany({
      data: [
        { profileId: premiumProfile.id, label: 'GitHub', url: 'https://github.com', order: 0 },
        { profileId: premiumProfile.id, label: 'Portfolio', url: 'https://example.com', order: 1 },
      ],
    })
  }

  console.log('Created premium seeker: jordan-premium')

  // ─── SEED PROFILE VIEWS ─────────────────────────────────────────────────
  // Get the alex-rivera profile to add views for
  const alexProfile = await prisma.seekerProfile.findUnique({ where: { username: 'alex-rivera' } })

  // Seed ProfileView records for both alex and jordan-premium using employer1 (TechCorp)
  const viewTargetProfiles = [alexProfile, premiumProfile].filter(Boolean)

  for (const targetProfile of viewTargetProfiles) {
    if (!targetProfile) continue
    // Create 5 sample views spread over the last 20 days
    for (let i = 0; i < 5; i++) {
      const daysAgo = i * 4 // 0, 4, 8, 12, 16 days ago
      const viewDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
      await prisma.profileView.create({
        data: {
          seekerProfileId: targetProfile.id,
          viewerUserId: employer1.id,
          createdAt: viewDate,
        },
      })
    }

    // Also add a view from employer2 for premium profile
    if (targetProfile.id === premiumProfile.id) {
      await prisma.profileView.create({
        data: {
          seekerProfileId: premiumProfile.id,
          viewerUserId: employer2.id,
          createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        },
      })
    }
  }
  console.log('Created profile view records')

  // Create sample ad slots (skip if already exist)
  const existingAds = await prisma.adSlot.count()
  if (existingAds === 0) {
    await prisma.adSlot.createMany({
      data: [
        {
          name: 'Coursera Sidebar',
          placement: 'sidebar',
          imageUrl: '/ads/coursera-placeholder.jpg',
          linkUrl: 'https://coursera.org',
          altText: 'Upgrade your skills with Coursera',
          advertiser: 'Coursera',
          active: true,
        },
        {
          name: 'Udemy Banner',
          placement: 'banner',
          imageUrl: '/ads/udemy-placeholder.jpg',
          linkUrl: 'https://udemy.com',
          altText: 'Learn from experts on Udemy',
          advertiser: 'Udemy',
          active: true,
        },
      ],
    })
    console.log('Created ad slots')
  }

  // ─── SEED SITE SETTINGS ──────────────────────────────────────────────
  await prisma.siteSetting.upsert({
    where: { key: 'monetization_enabled' },
    update: {},
    create: { key: 'monetization_enabled', value: 'false' },
  })
  console.log('Seeded monetization_enabled setting (default: false)')

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
