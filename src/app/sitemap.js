const SITE_URL = 'https://proppers.com.au';

export default function sitemap() {
  const paths = [
    '',
    '/calculator',
    '/about',
    '/stamp-duty',
    '/home-loan',
    '/grants-and-concessions',
    '/guides/stamp-duty',
    '/guides/grants-and-concessions',
    '/guides/choosing-a-home-loan',
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
