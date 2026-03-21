import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Admin routes
    if (pathname.startsWith('/admin')) {
      if (token?.role !== 'admin') {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    // Seeker-only routes
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/profile/edit')) {
      if (token?.role !== 'seeker' && token?.role !== 'admin') {
        return NextResponse.redirect(new URL('/browse', req.url))
      }
    }

    // Employer-only routes
    if (pathname.startsWith('/saved')) {
      if (token?.role !== 'employer' && token?.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname

        // Protected routes require authentication
        const protectedPaths = ['/dashboard', '/profile/edit', '/saved', '/admin']
        const isProtected = protectedPaths.some(p => pathname.startsWith(p))

        if (isProtected) return !!token
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/saved/:path*',
    '/admin/:path*',
  ],
}
