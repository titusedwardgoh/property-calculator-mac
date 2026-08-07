export const metadata = {
  title: 'First Home Buyer Grants & Concessions Guide (2026) | Proppers',
  description:
    'Compare Australian first-home buyer grants, Home Guarantee Scheme rules, First Home Super Saver, and state stamp duty concessions.',
  alternates: {
    canonical: '/guides/grants-and-concessions',
  },
};

export default function GrantsGuideLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'First Home Buyer Grants & Concessions in Australia',
    description:
      'Federal and state first-home buyer grants, deposit schemes, and stamp duty concessions explained.',
    url: 'https://proppers.com.au/guides/grants-and-concessions',
    author: {
      '@type': 'Organization',
      name: 'Proppers',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
