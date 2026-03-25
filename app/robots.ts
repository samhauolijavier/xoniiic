import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/dashboard/', '/employer-dashboard/', '/settings/', '/messages/'],
      },
    ],
    sitemap: 'https://virtualfreaks.co/sitemap.xml',
  }
}
