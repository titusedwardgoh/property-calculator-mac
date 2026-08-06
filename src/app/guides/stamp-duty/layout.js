export const metadata = {
  title: 'Australian Stamp Duty Rates & Rules Guide (2026) | Proppers',
  description:
    'Explore state-by-state land transfer duty brackets, First Home Buyer exemption caps, foreign purchaser surcharges, and property tax policy rules.',
  alternates: {
    canonical: '/guides/stamp-duty',
  },
};

export default function StampDutyGuideLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Australian Stamp Duty Rates & State Policy Rules',
    description:
      'State-by-state land transfer duty brackets, First Home Buyer exemption caps, and foreign purchaser surcharges.',
    url: 'https://proppers.com.au/guides/stamp-duty',
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
