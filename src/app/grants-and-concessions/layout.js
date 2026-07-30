export const metadata = {
  title: 'First Home Grant & Concession Calculator | Australia',
  description:
    'Quick estimate of first home owner grants and stamp duty concessions by state. See if you may be eligible, then get your exact figure in the full calculator.',
  alternates: {
    canonical: '/grants-and-concessions',
  },
};

export default function FirstHomeGrantLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Proppers First Home Grant & Concession Estimator',
    url: 'https://proppers.com.au/grants-and-concessions',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0.00',
      priceCurrency: 'AUD',
    },
    abstract:
      'Estimates Australian first home owner grants and stamp duty concessions from key purchase and buyer details.',
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
