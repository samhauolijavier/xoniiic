interface BadgeProps {
  status: string
  size?: 'sm' | 'md'
}

export function Badge({ status, size = 'md' }: BadgeProps) {
  const configs: Record<string, { label: string; className: string; dot: string }> = {
    open: {
      label: 'Available',
      className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      dot: 'bg-emerald-400',
    },
    'part-time': {
      label: 'Part-time',
      className: 'bg-yellow-50 text-yellow-700 border border-yellow-700/40',
      dot: 'bg-yellow-400',
    },
    unavailable: {
      label: 'Unavailable',
      className: 'bg-red-50 text-red-600 border border-red-200',
      dot: 'bg-red-400',
    },
  }

  const config = configs[status] || configs['unavailable']

  // sm = dot-only indicator (used on avatar thumbnails), md = full label badge
  if (size === 'sm') {
    return (
      <span className={`w-3.5 h-3.5 rounded-full border-2 border-brand-bg flex items-center justify-center ${config.dot}`} title={config.label}>
        <span className="sr-only">{config.label}</span>
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium text-sm px-3 py-1 ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
      {config.label}
    </span>
  )
}

interface RoleBadgeProps {
  role: string
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const configs: Record<string, { label: string; className: string }> = {
    seeker: {
      label: 'Seeker',
      className: 'bg-brand-purple/[0.06] text-brand-purple border border-brand-purple/30',
    },
    employer: {
      label: 'Employer',
      className: 'bg-blue-50 text-blue-700 border border-blue-200',
    },
    admin: {
      label: 'Admin',
      className: 'bg-orange-50 text-orange-700 border border-orange-200',
    },
  }

  const config = configs[role] || configs['seeker']

  return (
    <span className={`inline-flex items-center rounded-full text-xs font-medium px-2 py-0.5 ${config.className}`}>
      {config.label}
    </span>
  )
}
