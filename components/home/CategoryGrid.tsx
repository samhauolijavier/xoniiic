import Link from 'next/link'

const categories = [
  {
    name: 'Development',
    slug: 'Development',
    icon: '💻',
    description: 'React, Node.js, Python, Full-Stack',
    gradient: 'from-blue-600 to-purple-600',
    count: '14 skills',
  },
  {
    name: 'Design',
    slug: 'Design',
    icon: '🎨',
    description: 'Figma, UI/UX, Branding, Video',
    gradient: 'from-pink-600 to-rose-500',
    count: '10 skills',
  },
  {
    name: 'Virtual Assistant',
    slug: 'Virtual Assistant',
    icon: '📋',
    description: 'Admin, Customer Support, Research',
    gradient: 'from-emerald-600 to-teal-500',
    count: '8 skills',
  },
  {
    name: 'Writing',
    slug: 'Writing',
    icon: '✍️',
    description: 'Copywriting, SEO, Blog, Technical',
    gradient: 'from-amber-500 to-orange-500',
    count: '7 skills',
  },
  {
    name: 'Marketing',
    slug: 'Marketing',
    icon: '📣',
    description: 'Ads, SEO, Social Media, Analytics',
    gradient: 'from-red-600 to-pink-600',
    count: '8 skills',
  },
  {
    name: 'Other',
    slug: 'Other',
    icon: '🔧',
    description: 'Finance, HR, Teaching, Translation',
    gradient: 'from-violet-600 to-indigo-600',
    count: '8 skills',
  },
]

export function CategoryGrid() {
  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-black text-brand-text mb-4">
          Browse by{' '}
          <span className="gradient-text">Category</span>
        </h2>
        <p className="text-brand-muted text-lg max-w-xl mx-auto">
          Find the perfect talent for any project
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/browse?category=${encodeURIComponent(category.slug)}`}
            className="card p-5 text-center group hover-glow flex flex-col items-center gap-3"
          >
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.gradient} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-200`}>
              {category.icon}
            </div>
            <div>
              <h3 className="font-semibold text-sm text-brand-text group-hover:gradient-text transition-all">
                {category.name}
              </h3>
              <p className="text-xs text-brand-muted mt-0.5 leading-relaxed hidden sm:block">
                {category.description}
              </p>
              <p className="text-xs text-brand-muted mt-1">{category.count}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
