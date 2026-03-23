'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { VFLogo } from '@/components/ui/Logo'

interface NavNotification {
  id: string
  type: string
  title: string
  message: string
  actionUrl: string | null
  read: boolean
  createdAt: string
}

function notifTypeIcon(type: string): string {
  switch (type) {
    case 'message': return '\u{1F4AC}'
    case 'contact_request': return '\u{1F44B}'
    case 'profile_view': return '\u{1F441}\uFE0F'
    case 'job_interest': return '\u{1F4CB}'
    case 'badge_earned': return '\u{1F3C6}'
    case 'subscription': return '\u{1F4B3}'
    case 'report_filed': return '\u{1F6A9}'
    case 'report_resolved': return '\u2705'
    case 'review_received': return '\u2B50'
    default: return '\u{1F4E2}'
  }
}

function notifTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export function Navbar() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false)
  const [fontSize, setFontSize] = useState('1.5rem')
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadMsgCount, setUnreadMsgCount] = useState(0)
  const [isPremium, setIsPremium] = useState(false)
  const [monetizationEnabled, setMonetizationEnabled] = useState(false)
  const [recentNotifs, setRecentNotifs] = useState<NavNotification[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notifDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false)
      }
    }
    if (dropdownOpen || notifDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen, notifDropdownOpen])

  // Fetch site settings (logo + font size + monetization)
  useEffect(() => {
    fetch('/api/site-settings')
      .then((r) => r.text())
      .then((text) => {
        if (!text) return
        const data = JSON.parse(text)
        if (data.brandFontSize) setFontSize(data.brandFontSize)
        if (data.monetization_enabled !== undefined) {
          setMonetizationEnabled(data.monetization_enabled === 'true')
        }
      })
      .catch(() => {})
  }, [])

  // Fetch unread notification count and poll every 30 seconds
  useEffect(() => {
    if (!session) {
      setUnreadCount(0)
      return
    }

    const fetchUnread = () => {
      fetch('/api/notifications?unread=true&limit=5')
        .then((r) => r.json())
        .then((data) => {
          if (typeof data.unreadCount === 'number') setUnreadCount(data.unreadCount)
          else if (typeof data.count === 'number') setUnreadCount(data.count)
          if (Array.isArray(data.notifications)) setRecentNotifs(data.notifications)
        })
        .catch(() => {})
      fetch('/api/messages/unread-count')
        .then((r) => r.json())
        .then((data) => {
          if (typeof data.count === 'number') setUnreadMsgCount(data.count)
        })
        .catch(() => {})
    }

    fetchUnread()
    intervalRef.current = setInterval(fetchUnread, 30000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [session])

  // Fetch recent notifs when dropdown opens
  const fetchRecentNotifs = useCallback(() => {
    fetch('/api/notifications?limit=5')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.notifications)) setRecentNotifs(data.notifications)
        if (typeof data.unreadCount === 'number') setUnreadCount(data.unreadCount)
      })
      .catch(() => {})
  }, [])

  const handleNotifBellClick = () => {
    const newState = !notifDropdownOpen
    setNotifDropdownOpen(newState)
    setDropdownOpen(false)
    if (newState) fetchRecentNotifs()
  }

  const handleMarkAllReadDropdown = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'PATCH' })
      setRecentNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {
      // silent
    }
  }

  const handleNotifClick = async (n: NavNotification) => {
    if (!n.read) {
      fetch(`/api/notifications/${n.id}/read`, { method: 'PATCH' }).catch(() => {})
      setRecentNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
      setUnreadCount((c) => Math.max(0, c - 1))
    }
    setNotifDropdownOpen(false)
    if (n.actionUrl) router.push(n.actionUrl)
  }

  // Fetch premium status for seekers and employers
  useEffect(() => {
    const user = session?.user as { role?: string } | undefined
    if (!session) {
      setIsPremium(false)
      return
    }
    if (user?.role === 'seeker') {
      fetch('/api/premium/status')
        .then((r) => r.json())
        .then((data) => setIsPremium(data.premium ?? false))
        .catch(() => {})
    } else if (user?.role === 'employer') {
      fetch('/api/employer-premium/status')
        .then((r) => r.json())
        .then((data) => setIsPremium(data.isPartner ?? false))
        .catch(() => {})
    }
  }, [session])

  const user = session?.user as { id: string; role: string; username?: string | null; name?: string | null; email?: string | null } | undefined

  const baseSeekerLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/profile/edit', label: 'My Profile' },
  ]

  const showPremiumLinks = monetizationEnabled

  const roleLinks = {
    seeker: isPremium || !showPremiumLinks
      ? baseSeekerLinks
      : [...baseSeekerLinks, { href: '/premium', label: '\u2605 Premium' }],
    employer: isPremium || !showPremiumLinks
      ? [
          { href: '/employer-dashboard', label: 'Dashboard' },
          { href: '/browse', label: 'Browse Talent' },
          { href: '/saved', label: 'Saved' },
          { href: '/employer-profile', label: 'Company Profile' },
        ]
      : [
          { href: '/employer-dashboard', label: 'Dashboard' },
          { href: '/browse', label: 'Browse Talent' },
          { href: '/employer-profile', label: 'Company Profile' },
          { href: '/verified-partner', label: '\u{1F6E1}\uFE0F Partner' },
        ],
    admin: [
      { href: '/admin', label: 'Dashboard' },
      { href: '/admin/branding', label: 'Branding' },
      { href: '/admin/employers', label: '\u{1F454} Employers' },
      { href: '/admin/leads', label: '\u{1F4CB} Leads' },
      { href: '/browse', label: 'Browse' },
    ],
  }

  const links = user ? (roleLinks[user.role as keyof typeof roleLinks] || []) : []

  return (
    <nav className="sticky top-0 z-50 bg-brand-bg/90 backdrop-blur-xl border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <VFLogo size={34} />
            <span className="hidden sm:block gradient-text" style={{ fontFamily: 'var(--font-syne)', fontWeight: 400, letterSpacing: '0.08em', fontSize, lineHeight: '1' }}>
              Virtual Freaks
            </span>
          </Link>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-brand-card animate-pulse" />
            ) : session ? (
              <>
                {user?.role !== 'admin' && (
                  <div className="hidden md:flex items-center gap-2">
                    {links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`text-sm transition-colors px-3 py-1.5 rounded-lg hover:bg-brand-card ${
                          (link.href === '/premium' && !isPremium)
                            ? 'text-amber-400 hover:text-amber-300 font-medium'
                            : link.href === '/verified-partner' && !isPremium
                            ? 'text-purple-400 hover:text-purple-300 font-medium'
                            : 'text-brand-muted hover:text-brand-text'
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                    <Link
                      href="/activity"
                      className="text-sm transition-colors px-3 py-1.5 rounded-lg hover:bg-brand-card text-brand-muted hover:text-brand-text"
                    >
                      Activity
                    </Link>
                  </div>
                )}

                {/* Messages Icon */}
                <Link
                  href="/messages"
                  className="relative p-2 rounded-xl bg-brand-card border border-brand-border hover:border-brand-purple transition-all"
                  aria-label="Messages"
                >
                  <svg
                    className="w-5 h-5 text-brand-muted"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.75}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                    />
                  </svg>
                  {unreadMsgCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold leading-none">
                      {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
                    </span>
                  )}
                </Link>

                {/* Notification Bell with Dropdown */}
                <div className="relative" ref={notifDropdownRef}>
                  <button
                    onClick={handleNotifBellClick}
                    className="relative p-2 rounded-xl bg-brand-card border border-brand-border hover:border-brand-purple transition-all"
                    aria-label="Notifications"
                  >
                    <svg
                      className="w-5 h-5 text-brand-muted"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.75}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-orange text-white text-xs flex items-center justify-center font-bold leading-none">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {notifDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-brand-card border border-brand-border rounded-xl shadow-card z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-brand-border flex items-center justify-between">
                        <p className="text-sm font-semibold text-brand-text">Notifications</p>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllReadDropdown}
                            className="text-xs text-brand-purple hover:underline"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto">
                        {recentNotifs.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <p className="text-brand-muted text-sm">No notifications yet</p>
                          </div>
                        ) : (
                          recentNotifs.map((n) => (
                            <button
                              key={n.id}
                              onClick={() => handleNotifClick(n)}
                              className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-brand-border/50 transition-colors border-b border-brand-border/50 last:border-b-0 ${
                                !n.read ? 'bg-brand-purple/5' : ''
                              }`}
                            >
                              <span className="text-lg flex-shrink-0 mt-0.5">{notifTypeIcon(n.type)}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {!n.read && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-purple flex-shrink-0" />
                                  )}
                                  <p className={`text-xs truncate ${!n.read ? 'font-bold text-brand-text' : 'font-medium text-brand-muted'}`}>
                                    {n.title}
                                  </p>
                                </div>
                                <p className="text-xs text-brand-muted truncate mt-0.5">{n.message}</p>
                              </div>
                              <span className="text-[10px] text-brand-muted flex-shrink-0 mt-0.5">
                                {notifTimeAgo(n.createdAt)}
                              </span>
                            </button>
                          ))
                        )}
                      </div>

                      <div className="px-4 py-2.5 border-t border-brand-border">
                        <Link
                          href="/notifications"
                          onClick={() => setNotifDropdownOpen(false)}
                          className="block text-center text-xs text-brand-purple hover:underline font-medium"
                        >
                          View all notifications
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => { setDropdownOpen(!dropdownOpen); setNotifDropdownOpen(false) }}
                    className="flex items-center gap-2 p-1.5 rounded-xl bg-brand-card border border-brand-border hover:border-brand-purple transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-purple to-brand-orange flex items-center justify-center text-white font-bold text-xs">
                      {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <svg
                      className={`w-4 h-4 text-brand-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-brand-card border border-brand-border rounded-xl shadow-card z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-brand-border">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-brand-text truncate">{user?.name || 'User'}</p>
                          {isPremium && user?.role === 'seeker' && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex-shrink-0">{'\u2605'}</span>
                          )}
                          {isPremium && user?.role === 'employer' && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-brand-purple/20 text-purple-400 font-bold flex-shrink-0">{'\u{1F6E1}\uFE0F'}</span>
                          )}
                        </div>
                        <p className="text-xs text-brand-muted truncate">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        {links.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setDropdownOpen(false)}
                            className={`block px-4 py-2 text-sm hover:bg-brand-border transition-all ${
                              (link.href === '/premium' && !isPremium)
                                ? 'text-amber-400 hover:text-amber-300'
                                : link.href === '/verified-partner' && !isPremium
                                ? 'text-purple-400 hover:text-purple-300'
                                : 'text-brand-muted hover:text-brand-text'
                            }`}
                          >
                            {link.label}
                          </Link>
                        ))}
                        {isPremium && user?.role === 'seeker' && (
                          <Link
                            href="/premium"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-amber-400 hover:text-amber-300 hover:bg-brand-border transition-all"
                          >
                            <span>{'\u2605'}</span>
                            <span>Premium</span>
                          </Link>
                        )}
                        {isPremium && user?.role === 'employer' && (
                          <Link
                            href="/verified-partner"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-purple-400 hover:text-purple-300 hover:bg-brand-border transition-all"
                          >
                            <span>{'\u{1F6E1}\uFE0F'}</span>
                            <span>Verified Partner</span>
                          </Link>
                        )}
                        <Link
                          href="/activity"
                          onClick={() => setDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-brand-muted hover:text-brand-text hover:bg-brand-border transition-all"
                        >
                          Activity
                        </Link>
                        <Link
                          href="/messages"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center justify-between px-4 py-2 text-sm text-brand-muted hover:text-brand-text hover:bg-brand-border transition-all"
                        >
                          <span>Messages</span>
                          {unreadMsgCount > 0 && (
                            <span className="w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold leading-none">
                              {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
                            </span>
                          )}
                        </Link>
                        <Link
                          href="/notifications"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center justify-between px-4 py-2 text-sm text-brand-muted hover:text-brand-text hover:bg-brand-border transition-all"
                        >
                          <span>Notifications</span>
                          {unreadCount > 0 && (
                            <span className="w-4 h-4 rounded-full bg-brand-orange text-white text-xs flex items-center justify-center font-bold leading-none">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-brand-muted hover:text-brand-text hover:bg-brand-border transition-all"
                        >
                          Settings
                        </Link>
                        {user?.role === 'seeker' && user?.username && (
                          <Link
                            href={`/talent/${user.username}`}
                            onClick={() => setDropdownOpen(false)}
                            className="block px-4 py-2 text-sm text-brand-muted hover:text-brand-text hover:bg-brand-border transition-all"
                          >
                            Public Profile
                          </Link>
                        )}
                        <button
                          onClick={() => { signOut(); setDropdownOpen(false) }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-brand-border transition-all"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/leaderboard" className="hidden md:block text-sm text-brand-muted hover:text-brand-text transition-colors px-3 py-1.5">
                  Leaderboard
                </Link>
                <Link href="/login" className="text-sm text-brand-muted hover:text-brand-text transition-colors px-3 py-1.5">
                  Log in
                </Link>
                <Link href="/register" className="btn-primary text-sm py-1.5 px-4">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-brand-muted hover:text-brand-text"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-brand-border py-4 space-y-1">
            <Link href="/browse" className="block px-4 py-3 text-sm text-brand-muted" onClick={() => setMobileOpen(false)}>
              Browse Talent
            </Link>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-4 py-3 text-sm ${
                  link.href === '/premium' && !isPremium ? 'text-amber-400 font-medium' : 'text-brand-muted'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {isPremium && user?.role === 'seeker' && (
              <Link
                href="/premium"
                className="block px-4 py-3 text-sm text-amber-400"
                onClick={() => setMobileOpen(false)}
              >
                {'\u2605'} Premium
              </Link>
            )}
            {session && (
              <>
                <Link
                  href="/messages"
                  className="flex items-center justify-between px-4 py-3 text-sm text-brand-muted"
                  onClick={() => setMobileOpen(false)}
                >
                  <span>Messages</span>
                  {unreadMsgCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold leading-none">
                      {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/notifications"
                  className="flex items-center justify-between px-4 py-3 text-sm text-brand-muted"
                  onClick={() => setMobileOpen(false)}
                >
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-brand-orange text-white text-xs flex items-center justify-center font-bold leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/settings"
                  className="block px-4 py-3 text-sm text-brand-muted"
                  onClick={() => setMobileOpen(false)}
                >
                  Settings
                </Link>
              </>
            )}
            {!session && (
              <>
                <Link href="/login" className="block px-4 py-3 text-sm text-brand-muted" onClick={() => setMobileOpen(false)}>
                  Log in
                </Link>
                <Link href="/register" className="block px-4 py-3 text-sm text-brand-purple font-medium" onClick={() => setMobileOpen(false)}>
                  Register
                </Link>
              </>
            )}
            {session && (
              <button
                onClick={() => { signOut(); setMobileOpen(false) }}
                className="block w-full text-left px-4 py-3 text-sm text-red-400"
              >
                Sign Out
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
