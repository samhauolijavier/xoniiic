import type { Metadata } from 'next'
import { Bebas_Neue, Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { AnnouncementBanner } from '@/components/layout/AnnouncementBanner'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { ActiveTracker } from '@/components/providers/ActiveTracker'

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
  title: 'Virtual Freaks | Find Remote Talent',
  description: 'Connect with top remote talent worldwide. Browse skilled freelancers in development, design, marketing, writing, and more.',
  keywords: 'remote work, freelancers, virtual assistants, hire talent, remote jobs',
  openGraph: {
    title: 'Virtual Freaks | Find Remote Talent',
    description: 'Connect with top remote talent worldwide.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`dark ${syne.variable} ${inter.variable}`}>
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
        </SessionProvider>
      </body>
    </html>
  )
}
