import type { Metadata } from 'next'
import { Bebas_Neue, Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { AnnouncementBanner } from '@/components/layout/AnnouncementBanner'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { ActiveTracker } from '@/components/providers/ActiveTracker'
import { ChatBubble } from '@/components/ui/ChatBubble'
import { db } from '@/lib/db'

const syne = Bebas_Neue({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-syne',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://virtualfreaks.co'),
  title: {
    default: 'Virtual Freaks | The Marketplace for Remote Talent',
    template: '%s | Virtual Freaks',
  },
  description: 'Connect with top remote talent worldwide. Browse skilled freelancers in development, design, marketing, virtual assistance, and more — completely free for employers.',
  keywords: 'remote work, freelancers, virtual assistants, hire talent, remote jobs, hire developers, hire designers, virtual freaks, remote talent marketplace',
  authors: [{ name: 'Virtual Freaks' }],
  creator: 'Virtual Freaks',
  openGraph: {
    title: 'Virtual Freaks | The Marketplace for Remote Talent',
    description: 'Connect with top remote talent worldwide. Browse skilled freelancers — completely free for employers.',
    url: 'https://virtualfreaks.co',
    siteName: 'Virtual Freaks',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'Virtual Freaks — The Marketplace for Remote Talent',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Virtual Freaks | The Marketplace for Remote Talent',
    description: 'Connect with top remote talent worldwide. Browse skilled freelancers — completely free for employers.',
    images: ['/api/og'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
}

async function getFaviconUrl(): Promise<string | null> {
  try {
    const setting = await db.siteSetting.findUnique({
      where: { key: 'faviconUrl' },
    })
    return setting?.value || null
  } catch {
    return null
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const faviconUrl = await getFaviconUrl()

  return (
    <html lang="en" className={`dark ${syne.variable} ${inter.variable}`}>
      <head>
        {faviconUrl && <link rel="icon" href={faviconUrl} />}
      </head>
      <body className="bg-brand-bg text-brand-text min-h-screen font-sans">
        <SessionProvider>
          <ActiveTracker />
          <div className="flex flex-col min-h-screen">
            <AnnouncementBanner />
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          <ChatBubble />
        </SessionProvider>
      </body>
    </html>
  )
}
