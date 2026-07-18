const SITE_URL = 'https://proppers.com.au';

export default function sitemap() {
  const paths = [
    '',
    '/calculator',
    '/about',
    '/faq',
    '/contact',
    '/terms',
    '/privacy',
    '/disclaimer',
  ];

  const lastModified = new Date();

  return paths.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
  }));
}
