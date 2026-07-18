const SITE_URL = 'https://proppers.com.au';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/dashboard/',
        '/settings/',
        '/admin/',
        '/login/',
        '/signup/',
        '/forgot-password/',
        '/reset-password/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
