'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Building2,
  ChevronDown,
  Gift,
  Shield,
  Landmark,
  Home,
} from 'lucide-react';
import { saveSurveyReturnPath } from '@/lib/surveyReturnPath';
import { useStateSelector } from '@/states/useStateSelector';

const FAQ_ITEMS = [
  {
    question: 'Who is eligible for a government grant or scheme?',
    answer:
      'Rules vary by program, but most first-home schemes require you to be 18+, an Australian citizen or permanent resident (or buying with one), buying in your own name, and intending to live in the property. Many also require that you have not owned residential property in Australia before, and that the purchase sits under any applicable price or income caps.',
  },
  {
    question: 'Can I combine multiple grants and schemes?',
    answer:
      'Often yes. Eligible buyers can commonly stack a state First Home Owner Grant with the national Home Guarantee Scheme and, separately, use the First Home Super Saver scheme for deposit savings. Shared equity programs usually cannot be combined with every other form of assistance — always check the specific scheme rules before you sign.',
  },
  {
    question: 'Do I need to tell my lender I am using a grant or scheme?',
    answer:
      'Yes. Lenders need to know because schemes like the Home Guarantee Scheme are lodged through participating lenders, and grant funds form part of your deposit evidence. Tell your broker or lender early so your loan structure, LVR, and settlement timeline stay accurate.',
  },
  {
    question: 'Are first-home buyer grants available on existing homes?',
    answer:
      'In most states, the cash First Home Owner Grant is limited to new homes, off-the-plan purchases, substantially renovated homes, or house-and-land packages. Existing (established) homes usually miss the cash grant, but may still qualify for stamp duty concessions or the Home Guarantee Scheme.',
  },
  {
    question: 'Is there a First Home Owner Grant in the ACT?',
    answer:
      'No. The ACT replaced its cash grant with the Home Buyer Concession Scheme, which reduces or removes stamp duty for eligible buyers based on household income, dependents, and property value.',
  },
];

const STATE_GRANT_SUMMARIES = [
  {
    state: 'QLD',
    name: 'Queensland',
    grant: '$30,000',
    cap: 'New home under $750,000',
    notes:
      'One of the strongest cash grants nationally. Eligible buyers may also access first-home stamp duty concessions on new and existing homes within published thresholds.',
  },
  {
    state: 'NSW',
    name: 'New South Wales',
    grant: '$10,000',
    cap: 'New home up to $600,000 (or house-and-land up to $750,000)',
    notes:
      'Cash grant is limited to new builds. Separate First Home Buyers Assistance Scheme can exempt or reduce transfer duty on eligible purchases.',
  },
  {
    state: 'VIC',
    name: 'Victoria',
    grant: '$10,000',
    cap: 'New home up to $750,000',
    notes:
      'Grant covers new, off-the-plan, and substantially renovated homes. Stamp duty exemption or concession may also apply for eligible first-home buyers.',
  },
  {
    state: 'WA',
    name: 'Western Australia',
    grant: '$10,000',
    cap: 'Up to $750,000 south of the 26th parallel; up to $1,000,000 north',
    notes:
      'Additional Home Buyers Assistance and Keystart shared-ownership pathways may help with deposit and settlement costs.',
  },
  {
    state: 'SA',
    name: 'South Australia',
    grant: '$15,000',
    cap: 'No property price cap for the cash grant',
    notes:
      'Eligible first-home buyers of new homes may also receive a stamp duty exemption on qualifying contracts.',
  },
  {
    state: 'TAS',
    name: 'Tasmania',
    grant: '$20,000',
    cap: 'New home (no published price cap)',
    notes:
      'Cash grant applies to new builds and eligible new dwellings. Separate duty relief rules may apply to existing homes depending on contract date and eligibility.',
  },
  {
    state: 'ACT',
    name: 'Australian Capital Territory',
    grant: 'No cash grant',
    cap: 'Home Buyer Concession Scheme instead',
    notes:
      'Support is delivered through stamp duty concessions based on income, dependents, and property value rather than a First Home Owner Grant.',
  },
  {
    state: 'NT',
    name: 'Northern Territory',
    grant: 'Up to $50,000',
    cap: 'HomeGrown Territory Grant (amount varies by property type)',
    notes:
      'New, off-the-plan, and house-and-land purchases can attract the higher grant amount. Existing homes may still qualify for a smaller HomeGrown payment.',
  },
];

const sumConcession = (result) =>
  (result?.concessions || []).reduce((sum, item) => sum + (item.amount || 0), 0);

const sumGrant = (result) =>
  (result?.grants || []).reduce((sum, item) => sum + (item.amount || 0), 0);

export default function GrantsAndConcessionsGuidePage() {
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 3000], [0, -200]);

  const [compState, setCompState] = useState('QLD');
  const [openFaqs, setOpenFaqs] = useState(new Set());
  const [isOfficialLinksOpen, setIsOfficialLinksOpen] = useState(false);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - 90,
        behavior: 'smooth',
      });
    }
  };

  const toggleFaq = (index) => {
    setOpenFaqs((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const formatCur = (val) =>
    new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      maximumFractionDigits: 0,
    }).format(val || 0);

  const { stateFunctions: compFunctions } = useStateSelector(compState);

  const stateMatrixData = useMemo(() => {
    if (!compFunctions?.calculateUpfrontCosts) return [];

    const pricePoints = [500000, 600000, 750000, 1000000];
    const buyer = {
      buyerType: 'owner-occupier',
      isPPR: 'yes',
      isAustralianResident: 'yes',
      isFirstHomeBuyer: 'yes',
      needsLoan: 'yes',
      hasPensionCard: 'no',
      sellerQuestionsComplete: false,
    };

    return pricePoints.map((price) => {
      const baseProperty = {
        propertyPrice: price,
        propertyCategory: 'residential',
        isWA: 'south',
        isWAMetro: 'metro',
      };

      const newHome = compFunctions.calculateUpfrontCosts(
        buyer,
        { ...baseProperty, propertyType: 'new' },
        compState
      );
      const existingHome = compFunctions.calculateUpfrontCosts(
        buyer,
        { ...baseProperty, propertyType: 'existing' },
        compState
      );

      return {
        price,
        grantNew: sumGrant(newHome),
        dutySavedNew: sumConcession(newHome),
        dutySavedExisting: sumConcession(existingHome),
      };
    });
  }, [compState, compFunctions]);

  return (
    <div className="min-h-screen bg-base-200 text-gray-900">
      <motion.div
        className="fixed inset-0 z-0 pointer-events-none hidden md:block"
        style={{
          y: parallaxY,
          backgroundImage: "url('/test17.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
        }}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 z-0 pointer-events-none md:hidden"
        style={{
          backgroundImage: "url('/test17.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
        }}
        aria-hidden="true"
      />

      <main className="relative z-10">
        <section className="relative z-10 w-full bg-base-200">
          <div className="container mx-auto px-4 py-16 md:px-16 md:py-24 lg:px-24 lg:py-24">
            <div className="grid items-center gap-12 md:grid-cols-12">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="space-y-6 text-center md:col-span-6 md:text-left"
              >
                <h1 className="text-4xl font-bold leading-tight text-gray-900 md:text-5xl">
                  First-Home Buyer Grants &amp; Concessions
                </h1>
                <p className="text-lg leading-relaxed text-gray-600 md:text-xl">
                  A clear guide to cash grants, deposit schemes, stamp duty concessions, and how
                  federal and state support can stack when you buy your first home in Australia.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                className="rounded-3xl border border-gray-200 bg-white p-6 text-gray-900 shadow-xl md:col-span-6 md:p-8"
              >
                <h2 className="mb-2 text-xl font-bold md:text-2xl">Check what you could claim</h2>
                <p className="mb-6 text-base leading-relaxed text-gray-600">
                  Try our{' '}
                  <Link
                    href="/grants-and-concessions"
                    className="font-semibold text-primary underline transition-colors hover:text-primary/80"
                  >
                    grants calculator
                  </Link>{' '}
                  for a quick eligibility read, or run the full calculator for grants, duty
                  concessions, bank fees, and settlement costs together.
                </p>

                <Link
                  href="/calculator"
                  onClick={() => saveSurveyReturnPath('/guides/grants-and-concessions')}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-base font-medium text-secondary transition-all hover:bg-primary/90 hover:shadow-lg"
                >
                  Launch Full Calculator
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span>State First Home Owner Grants</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span>Stamp duty concessions &amp; exemptions</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="relative z-10 w-full py-12 md:py-16">
          <div className="absolute inset-0 z-0 bg-white/10 backdrop-blur-sm" aria-hidden="true" />
          <div className="relative z-10 container mx-auto max-w-6xl px-4">
            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-8">
                <article
                  id="what-are-grants"
                  className="prose prose-base max-w-none space-y-6 rounded-3xl border border-white/85 bg-white/90 p-6 text-gray-700 shadow-md backdrop-blur-sm md:p-8"
                >
                  <h2 className="flex items-start gap-3 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                    <span className="shrink-0 leading-[1.15] text-primary">1.</span>
                    <span className="leading-[1.15]">What Are Grants &amp; Concessions?</span>
                  </h2>
                  <p className="text-base leading-relaxed md:text-lg">
                    First-home buyer support in Australia comes in three main forms: cash grants paid
                    toward a new home, stamp duty concessions that reduce or remove transfer duty,
                    and deposit schemes that help you buy with a smaller deposit (often without
                    lender&apos;s mortgage insurance).
                  </p>
                  <p className="text-base leading-relaxed md:text-lg">
                    Federal programs such as the Home Guarantee Scheme and First Home Super Saver
                    sit alongside state First Home Owner Grants and duty concessions. Eligibility,
                    property type, and price caps decide what you can claim — and several programs
                    can be used together if you meet each set of rules.
                  </p>
                </article>

                <article
                  id="national-schemes"
                  className="prose prose-base max-w-none space-y-6 rounded-3xl border border-white/85 bg-white/90 p-6 text-gray-700 shadow-md backdrop-blur-sm md:p-8"
                >
                  <h2 className="flex items-start gap-3 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                    <span className="shrink-0 leading-[1.15] text-primary">2.</span>
                    <span className="leading-[1.15]">National Schemes</span>
                  </h2>

                  <div className="grid grid-cols-1 gap-4 not-prose">
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="mb-2 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-bold text-gray-900">Home Guarantee Scheme</h3>
                      </div>
                      <p className="text-base leading-relaxed text-gray-600">
                        Housing Australia can guarantee part of your loan so eligible buyers purchase
                        with a deposit from 5% (First Home Guarantee) or 2% (Family Home Guarantee for
                        eligible single parents or guardians), without paying LMI. Places are
                        uncapped for FY 2026-27, and income caps have been removed. You still need to
                        meet lender credit criteria and live in the home.
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="mb-2 flex items-center gap-2">
                        <Landmark className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-bold text-gray-900">First Home Super Saver</h3>
                      </div>
                      <p className="text-base leading-relaxed text-gray-600">
                        The FHSS scheme lets eligible first-home buyers withdraw up to $50,000 of
                        voluntary super contributions (plus associated earnings) toward a deposit.
                        You can release up to $15,000 of personal contributions from any one financial
                        year. Apply for an ATO determination before you sign a contract, then request
                        release through your fund after signing.
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="mb-2 flex items-center gap-2">
                        <Home className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-bold text-gray-900">Help to Buy</h3>
                      </div>
                      <p className="text-base leading-relaxed text-gray-600">
                        Help to Buy is a national shared equity scheme for eligible buyers (singles
                        under $100,000 income and couples under $160,000) to buy with a 2% deposit.
                        The government can contribute up to 40% for a new home or 30% for an existing
                        home, then takes a matching equity stake. Plan an exit strategy before you
                        enter — you share capital growth (and losses) with the government.
                      </p>
                    </div>
                  </div>
                </article>

                <div
                  id="grants-matrix"
                  className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-xl backdrop-blur-md"
                >
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="flex items-start gap-3 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                        <span className="shrink-0 leading-[1.15] text-primary">3.</span>
                        <span className="leading-[1.15]">Live Grants &amp; Concessions Matrix</span>
                      </h2>
                      <p className="mt-1 text-sm text-gray-500 md:text-base">
                        Estimated first-home support for an Australian-resident owner-occupier using
                        the same calculation engine as our calculator.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1">
                      {['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setCompState(st)}
                          className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-bold transition-all ${
                            compState === st
                              ? 'bg-primary text-secondary shadow-sm'
                              : 'text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                    <table className="w-full text-left text-base text-gray-700">
                      <thead className="border-b border-gray-200 bg-gray-50 text-sm font-semibold uppercase tracking-wider text-gray-900">
                        <tr>
                          <th className="px-4 py-3.5">Purchase Value</th>
                          <th className="px-4 py-3.5">Cash Grant (New)</th>
                          <th className="px-4 py-3.5">Duty Saved (New)</th>
                          <th className="px-4 py-3.5 text-right">Duty Saved (Existing)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {stateMatrixData.map((row) => (
                          <tr key={row.price} className="hover:bg-gray-50/80">
                            <td className="px-4 py-3.5 font-semibold text-gray-900">
                              {formatCur(row.price)}
                            </td>
                            <td className="px-4 py-3.5">{formatCur(row.grantNew)}</td>
                            <td className="px-4 py-3.5">{formatCur(row.dutySavedNew)}</td>
                            <td className="px-4 py-3.5 text-right font-semibold text-gray-900">
                              {formatCur(row.dutySavedExisting)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 text-sm text-gray-500">
                    Cash grants usually apply to new homes only. ACT shows $0 cash grant because
                    support is delivered through duty concessions. Figures exclude LMI savings from
                    the Home Guarantee Scheme.
                  </p>
                </div>

                <article
                  id="state-grants"
                  className="prose prose-base max-w-none space-y-6 rounded-3xl border border-white/85 bg-white/90 p-6 text-gray-700 shadow-md backdrop-blur-sm md:p-8"
                >
                  <h2 className="flex items-start gap-3 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                    <span className="shrink-0 leading-[1.15] text-primary">4.</span>
                    <span className="leading-[1.15]">State First Home Owner Grants</span>
                  </h2>
                  <p className="text-base leading-relaxed md:text-lg">
                    Most states and territories still offer a one-off, tax-free First Home Owner
                    Grant (or equivalent) for eligible buyers of new homes. Typical common rules
                    include being 18+, holding Australian citizenship or permanent residency, not
                    having owned a home before, and living in the property for a minimum period after
                    settlement.
                  </p>

                  <div className="not-prose grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {STATE_GRANT_SUMMARIES.map((item) => (
                      <div
                        key={item.state}
                        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <h3 className="text-base font-bold text-gray-900">{item.name}</h3>
                          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                            {item.state}
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{item.grant}</p>
                        <p className="mt-1 text-sm font-semibold text-gray-600">{item.cap}</p>
                        <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.notes}</p>
                      </div>
                    ))}
                  </div>
                </article>

                <article
                  id="duty-concessions"
                  className="prose prose-base max-w-none space-y-6 rounded-3xl border border-white/85 bg-white/90 p-6 text-gray-700 shadow-md backdrop-blur-sm md:p-8"
                >
                  <h2 className="flex items-start gap-3 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                    <span className="shrink-0 leading-[1.15] text-primary">5.</span>
                    <span className="leading-[1.15]">Stamp Duty Concessions</span>
                  </h2>
                  <p className="text-base leading-relaxed md:text-lg">
                    Stamp duty concessions can be worth more than the cash grant. NSW, VIC, QLD, WA,
                    SA, TAS, and the ACT all offer first-home or owner-occupier duty relief with
                    different price caps and taper bands. Investors generally pay full duty.
                  </p>
                  <p className="text-base leading-relaxed md:text-lg">
                    For brackets, payment timing, and how duty is calculated, see our{' '}
                    <Link
                      href="/guides/stamp-duty"
                      className="font-semibold text-primary underline transition-colors hover:text-primary/80"
                    >
                      stamp duty guide
                    </Link>
                    .
                  </p>
                  <div className="not-prose grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      'NSW: exemption or concession under First Home Buyers Assistance Scheme',
                      'VIC: full exemption under $600k, concession to $750k for eligible FHBs',
                      'QLD: first-home and home concessions on eligible dwellings',
                      'WA: FHB exemption thresholds for homes and vacant land',
                      'SA: duty exemption for eligible new-home first buyers',
                      'ACT: Home Buyer Concession Scheme replaces a cash grant',
                    ].map((line) => (
                      <div
                        key={line}
                        className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                      >
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                        <p className="text-sm leading-relaxed text-gray-700 md:text-base">{line}</p>
                      </div>
                    ))}
                  </div>
                </article>

                <article
                  id="how-to-claim"
                  className="prose prose-base max-w-none space-y-6 rounded-3xl border border-white/85 bg-white/90 p-6 text-gray-700 shadow-md backdrop-blur-sm md:p-8"
                >
                  <h2 className="flex items-start gap-3 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                    <span className="shrink-0 leading-[1.15] text-primary">6.</span>
                    <span className="leading-[1.15]">How to Claim Support</span>
                  </h2>
                  <p className="text-base leading-relaxed md:text-lg">
                    Your conveyancer or solicitor usually lodges First Home Owner Grant and stamp
                    duty concession applications with the state revenue office around settlement.
                    Home Guarantee Scheme places are arranged through a participating lender. FHSS
                    release is handled with the ATO and your super fund before and after you sign a
                    contract.
                  </p>
                  <p className="text-base leading-relaxed md:text-lg">
                    Disclose every grant and scheme in your loan application so the lender can
                    verify deposit sources, place guarantees correctly, and avoid delays at
                    unconditional approval or settlement.
                  </p>
                </article>

                <div
                  id="faqs"
                  className="space-y-6 rounded-3xl border border-white/85 bg-white/90 p-6 shadow-md backdrop-blur-sm md:p-8"
                >
                  <h2 className="flex items-start gap-3 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                    <span className="shrink-0 leading-[1.15] text-primary">7.</span>
                    <span className="leading-[1.15]">Frequently Asked Questions</span>
                  </h2>
                  <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    {FAQ_ITEMS.map((faq, index) => {
                      const isOpen = openFaqs.has(index);
                      return (
                        <div key={faq.question}>
                          <button
                            type="button"
                            onClick={() => toggleFaq(index)}
                            className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left"
                          >
                            <span className="text-base font-semibold text-gray-900 md:text-lg">
                              {faq.question}
                            </span>
                            <motion.div
                              animate={{ rotate: isOpen ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown className="h-5 w-5 shrink-0 text-gray-400" />
                            </motion.div>
                          </button>
                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
                                <div className="border-t border-gray-100 bg-gray-50/50 px-6 pb-5 pt-3 text-sm leading-relaxed text-gray-600 md:text-base">
                                  {faq.answer}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="self-stretch lg:col-span-4">
                <div className="sticky top-24 space-y-6">
                  <div className="hidden rounded-3xl border border-white/80 bg-white/95 p-6 text-gray-900 shadow-xl backdrop-blur-sm md:block">
                    <h3 className="mb-3 text-base font-bold text-gray-900">Guide Sections</h3>
                    <nav className="flex flex-col divide-y divide-gray-100">
                      {[
                        { name: '1. What Are Grants & Concessions?', id: 'what-are-grants' },
                        { name: '2. National Schemes', id: 'national-schemes' },
                        { name: '3. Live Grants Matrix', id: 'grants-matrix' },
                        { name: '4. State First Home Grants', id: 'state-grants' },
                        { name: '5. Stamp Duty Concessions', id: 'duty-concessions' },
                        { name: '6. How to Claim Support', id: 'how-to-claim' },
                        { name: '7. Frequently Asked Questions', id: 'faqs' },
                      ].map((sec) => (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => scrollToSection(sec.id)}
                          className="group flex w-full cursor-pointer items-center justify-between py-2.5 text-left text-sm font-semibold text-gray-600 transition-colors hover:text-primary"
                        >
                          <span>{sec.name}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-gray-400 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                        </button>
                      ))}
                    </nav>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-white/80 bg-base-200/90 p-5 backdrop-blur-sm">
                    <div>
                      <h4 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                        <Gift className="h-4 w-4 text-primary" />
                        Official Scheme Links
                      </h4>
                      <p className="mt-1 text-sm leading-relaxed text-gray-500">
                        Confirm eligibility and lodge applications through the administering body:
                      </p>
                    </div>

                    <div className="border-t border-gray-200/40 pt-3">
                      <button
                        type="button"
                        onClick={() => setIsOfficialLinksOpen(!isOfficialLinksOpen)}
                        className="flex w-full cursor-pointer items-center justify-between py-1 text-sm font-bold text-gray-700 transition-colors hover:text-primary"
                      >
                        <span>
                          {isOfficialLinksOpen ? 'Hide Official Websites' : 'Show Official Websites'}
                        </span>
                        <motion.div
                          animate={{ rotate: isOfficialLinksOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-500" />
                        </motion.div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isOfficialLinksOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <ul className="space-y-2 pt-3 text-sm font-semibold text-gray-700">
                              <li>
                                <a
                                  href="https://www.housingaustralia.gov.au/home-guarantee-scheme"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between underline transition-colors hover:text-primary"
                                >
                                  <span>Home Guarantee Scheme</span> <ArrowRight className="h-3 w-3" />
                                </a>
                              </li>
                              <li>
                                <a
                                  href="https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/super/withdrawing-and-using-your-super/first-home-super-saver-scheme"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between underline transition-colors hover:text-primary"
                                >
                                  <span>First Home Super Saver (ATO)</span>{' '}
                                  <ArrowRight className="h-3 w-3" />
                                </a>
                              </li>
                              <li>
                                <a
                                  href="https://www.revenue.nsw.gov.au"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between underline transition-colors hover:text-primary"
                                >
                                  <span>NSW Revenue</span> <ArrowRight className="h-3 w-3" />
                                </a>
                              </li>
                              <li>
                                <a
                                  href="https://www.sro.vic.gov.au"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between underline transition-colors hover:text-primary"
                                >
                                  <span>VIC State Revenue Office</span>{' '}
                                  <ArrowRight className="h-3 w-3" />
                                </a>
                              </li>
                              <li>
                                <a
                                  href="https://www.qro.qld.gov.au"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between underline transition-colors hover:text-primary"
                                >
                                  <span>QLD Revenue Office</span> <ArrowRight className="h-3 w-3" />
                                </a>
                              </li>
                              <li>
                                <a
                                  href="https://www.wa.gov.au/organisation/department-of-finance/revenuewa"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between underline transition-colors hover:text-primary"
                                >
                                  <span>WA RevenueWA</span> <ArrowRight className="h-3 w-3" />
                                </a>
                              </li>
                              <li>
                                <a
                                  href="https://www.revenuesa.sa.gov.au"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between underline transition-colors hover:text-primary"
                                >
                                  <span>SA RevenueSA</span> <ArrowRight className="h-3 w-3" />
                                </a>
                              </li>
                              <li>
                                <a
                                  href="https://www.sro.tas.gov.au"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between underline transition-colors hover:text-primary"
                                >
                                  <span>TAS State Revenue Office</span>{' '}
                                  <ArrowRight className="h-3 w-3" />
                                </a>
                              </li>
                              <li>
                                <a
                                  href="https://www.revenue.act.gov.au"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between underline transition-colors hover:text-primary"
                                >
                                  <span>ACT Revenue Office</span> <ArrowRight className="h-3 w-3" />
                                </a>
                              </li>
                              <li>
                                <a
                                  href="https://nt.gov.au/industry/taxes-royalties-grants/territory-revenue-office"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between underline transition-colors hover:text-primary"
                                >
                                  <span>NT Territory Revenue Office</span>{' '}
                                  <ArrowRight className="h-3 w-3" />
                                </a>
                              </li>
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/80 bg-white/95 p-5 shadow-md backdrop-blur-sm">
                    <h4 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                      <Building2 className="h-4 w-4 text-primary" />
                      Related guide
                    </h4>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                      Need the duty brackets behind these concessions?
                    </p>
                    <Link
                      href="/guides/stamp-duty"
                      className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary transition-colors hover:text-primary/80"
                    >
                      Stamp duty guide <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 w-full border-t border-gray-200/50 bg-base-200 py-8">
          <div className="relative z-10 container mx-auto max-w-6xl px-4">
            <div className="rounded-2xl border border-primary/20 bg-white px-8 py-6 text-gray-700">
              <h3 className="mb-2 text-base font-semibold text-primary">Regulatory Disclaimer</h3>
              <p className="text-sm leading-relaxed text-gray-800">
                Proppers estimates grants and concessions from publicly available federal and state
                scheme rules for the 2026-27 financial year. Grant amounts, price caps, income tests,
                and stamp duty concessions change frequently. Always confirm eligibility with the
                relevant revenue office, Housing Australia, the ATO, your lender, and a licensed
                conveyancer before relying on these figures in a purchase.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
