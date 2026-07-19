export const metadata = {
  title: 'Australian Stamp Duty Calculator | True Buying Cost Estimator',
  description:
    'Calculate your exact state-by-state stamp duty costs, exemptions, and hidden upfront purchasing fees before real estate settlement.',
  alternates: {
    canonical: '/stamp-duty',
  },
};

export default function StampDutyLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Proppers Stamp Duty & Government Cost Estimator',
    url: 'https://proppers.com.au/stamp-duty',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0.00',
      priceCurrency: 'AUD',
    },
    abstract:
      'Calculates local state-by-state stamp duty taxes, registration costs, and hidden transaction variables for Australian property buyers.',
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
