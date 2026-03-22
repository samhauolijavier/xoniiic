export const dynamic = "force-dynamic"
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AdminPremiumToggle } from './AdminPremiumToggle'
import { MonetizationToggle } from './MonetizationToggle'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const user = session.user as { id: string; role: string }
  if (user.role !== 'admin') redirect('/')

  const [userCount, seekerCount, employerCount, skillCount, adCount, contactCount, monetizationSetting] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: 'seeker' } }),
    db.user.count({ where: { role: 'employer' } }),
    db.skill.count(),
    db.adSlot.count(),
    db.contactRequest.count(),
    db.siteSetting.findUnique({ where: { key: 'monetization_enabled' } }),
  ])

  const monetizationEnabled = monetizationSetting?.value === 'true'

  const recentUsers = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, name: true, email: true, role: true, active: true, premium: true, createdAt: true },
  })

  const stats = [
    { label: 'Total Users', value: userCount, icon: '👥', color: 'from-blue-600 to-purple-600' },
    { label: 'Freelancers', value: seekerCount, icon: '🧑‍💻', color: 'from-purple-600 to-pink-600' },
    { label: 'Employers', value: employerCount, icon: '🏢', color: 'from-amber-500 to-orange-500' },
    { label: 'Skills', value: skillCount, icon: '⚡', color: 'from-emerald-600 to-teal-500' },
    { label: 'Ad Slots', value: adCount, icon: '📢', color: 'from-rose-600 to-pink-600' },
    { label: 'Contact Requests', value: contactCount, icon: '💌', color: 'from-indigo-600 to-blue-600' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-text">
            Admin <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-brand-muted mt-1">Platform overview and management</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link href="/admin/ads" className="btn-secondary text-sm">Manage Ads</Link>
          <Link href="/admin/skills" className="btn-primary text-sm">Manage Skills</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-4">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-lg mb-3`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-black gradient-text">{stat.value}</div>
            <div className="text-xs text-brand-muted mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Monetization Toggle */}
      <div className="mb-8">
        <MonetizationToggle initialEnabled={monetizationEnabled} />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { href: '/browse', label: 'Browse Talent', desc: 'View public talent listing', icon: '🔍' },
          { href: '/admin/skills', label: 'Skill Library', desc: 'Add, edit, disable skills', icon: '⚡' },
          { href: '/admin/ads', label: 'Ad Management', desc: 'Manage advertising slots', icon: '📢' },
          { href: '/admin/branding', label: 'Branding', desc: 'Logo, hero, banner, social, SEO, footer', icon: '🎨' },
          { href: '/admin/employers', label: 'Employers', desc: 'Verify employer accounts', icon: '👔' },
          { href: '/admin/reports', label: 'Reports', desc: 'Review user-submitted reports', icon: '🚩' },
          { href: '/admin/founding-members', label: 'Founding Members', desc: 'Manage founding member badges (#1-250)', icon: '👑' },
          { href: '/admin/leads', label: 'Lead List', desc: 'View and export all registered users', icon: '👥' },
        ].map((link) => (
          <Link key={link.href} href={link.href} className="card p-5 hover-glow group">
            <div className="text-2xl mb-2">{link.icon}</div>
            <h3 className="font-semibold text-brand-text group-hover:gradient-text">{link.label}</h3>
            <p className="text-sm text-brand-muted mt-1">{link.desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent Users */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-brand-text mb-4">Recent Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-left text-brand-muted border-b border-brand-border">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Role</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Premium</th>
                <th className="pb-3 font-medium">Joined</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {recentUsers.map((u) => (
                <tr key={u.id} className="text-brand-text hover:bg-brand-border/20 transition-colors">
                  <td className="py-3">{u.name || '-'}</td>
                  <td className="py-3 text-brand-muted">{u.email}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.role === 'admin' ? 'bg-orange-900/40 text-orange-400' :
                      u.role === 'employer' ? 'bg-blue-900/40 text-blue-400' :
                      'bg-purple-900/40 text-purple-400'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      u.active ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'
                    }`}>
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3">
                    {u.premium ? (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-amber-900/40 text-amber-400 font-medium">
                        ★ Premium
                      </span>
                    ) : (
                      <span className="text-xs text-brand-muted">Free</span>
                    )}
                  </td>
                  <td className="py-3 text-brand-muted text-xs">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    {u.role === 'seeker' && (
                      <AdminPremiumToggle userId={u.id} isPremium={u.premium} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
