export const metadata = {
  title: 'Choosing a Home Loan Guide (2026) | Proppers',
  description:
    'Learn how to choose a home loan in Australia: repayment types, fixed vs variable rates, loan features, fees, and what to compare before you borrow.',
  alternates: {
    canonical: '/guides/choosing-a-home-loan',
  },
};

export default function ChoosingHomeLoanGuideLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Choosing a Home Loan in Australia',
    description:
      'Repayment types, interest rates, loan features, fees, and comparison tips for Australian home buyers.',
    url: 'https://proppers.com.au/guides/choosing-a-home-loan',
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
