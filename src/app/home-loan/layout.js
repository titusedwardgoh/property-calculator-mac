export const metadata = {
  title: 'Australian Home Loan Calculator | Monthly Repayment Estimator',
  description:
    'Estimate monthly home loan repayments, then uncover the full purchase costs banks leave out of repayment calculators.',
  alternates: {
    canonical: '/home-loan',
  },
};

export default function HomeLoanLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Proppers Home Loan Calculator',
    url: 'https://proppers.com.au/home-loan',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0.00',
      priceCurrency: 'AUD',
    },
    abstract:
      'Estimates Australian home loan monthly repayments and connects buyers to full property purchase cost calculations.',
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
