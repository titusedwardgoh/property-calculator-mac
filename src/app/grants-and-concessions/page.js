"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  MapPin,
  FileText,
  Gift,
  CircleDollarSign,
  Calculator,
  ArrowRight,
  BadgeCheck,
  AlertCircle,
} from 'lucide-react';
import { useStateSelector } from '@/states/useStateSelector';
import { saveSurveyReturnPath } from '@/lib/surveyReturnPath';

const featureCards = [
  {
    title: 'Claim Every Concession',
    description:
      'Check if you qualify for thousands in grants or stamp duty reductions before you place an offer.',
    icon: Gift,
  },
  {
    title: 'No Generic Formulas',
    description:
      'We separate owner-occupiers, investors, new builds, and land so your figures reflect reality.',
    icon: FileText,
  },
  {
    title: 'Clear Next Steps',
    description:
      'Know straight away if your scenario is straightforward or if a few extra details will pinpoint the exact figure.',
    icon: CircleDollarSign,
  },
];

const pillars = [
  {
    title: 'Quick eligibility check',
    copy: 'Answer 5 simple questions to see if you qualify for government cash or tax savings.',
    icon: BadgeCheck,
  },
  {
    title: 'Up-to-date state rules',
    copy: 'Powered by the same calculation engine as our main tool — keeping up with current price caps.',
    icon: MapPin,
  },
  {
    title: 'Clear guidance',
    copy: 'If your property needs a few extra details to price accurately, we’ll point you straight to the full survey.',
    icon: Calculator,
  },
];

const STATES = [
  { value: 'NSW', label: 'New South Wales (NSW)' },
  { value: 'VIC', label: 'Victoria (VIC)' },
  { value: 'QLD', label: 'Queensland (QLD)' },
  { value: 'WA', label: 'Western Australia (WA)' },
  { value: 'SA', label: 'South Australia (SA)' },
  { value: 'TAS', label: 'Tasmania (TAS)' },
  { value: 'ACT', label: 'Australian Capital Territory (ACT)' },
  { value: 'NT', label: 'Northern Territory (NT)' },
];

const PROPERTY_CATEGORIES = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'land', label: 'Vacant land' },
];

const BUYER_TYPES = [
  { value: 'owner-occupier', label: 'I plan to live in it' },
  { value: 'investor', label: "It's an investment" },
];

const YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

const inputClassName =
  'w-full cursor-pointer px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white text-gray-900';

function getPropertyTypeOptions(category) {
  if (category === 'land') {
    return [
      { value: 'house-and-land', label: 'House & land package' },
      { value: 'vacant-land-only', label: 'Vacant land only' },
    ];
  }

  return [
    { value: 'existing', label: 'Existing / lived-in home' },
    { value: 'new', label: 'Brand new build' },
    { value: 'off-the-plan', label: 'Off-the-plan' },
  ];
}

function getEdgeCase(state, propertyType) {
  if (state === 'ACT') {
    return {
      title: 'ACT savings depend on your income',
      message:
        'The ACT doesn’t offer a standard first-home grant, but they do offer major stamp duty discounts based on your household income. Check the full calculator to get an exact quote.',
    };
  }

  if (propertyType === 'off-the-plan' && state === 'VIC') {
    return {
      title: 'Off-the-plan needs a few more details',
      message:
        'Off-the-plan discounts in VIC depend on how much construction has been completed. Take the full survey to calculate your savings.',
    };
  }

  return null;
}

/**
 * WA location changes exact amounts, but we can still give a clear yes/no
 * from the shared inputs using the most generous regional caps.
 */
function assessWAEligibility({
  price,
  propertyType,
  buyerType,
  isAustralianResident,
  isFirstHomeBuyer,
}) {
  const isOwnerOccupier = buyerType === 'owner-occupier';
  if (!isOwnerOccupier || isAustralianResident !== 'yes' || isFirstHomeBuyer !== 'yes') {
    return { eligible: false, supportNames: [] };
  }

  const supportNames = [];

  // Grant: new / OTP / house-and-land, up to the higher North WA cap ($1M)
  const grantEligibleTypes = ['new', 'off-the-plan', 'house-and-land'];
  if (grantEligibleTypes.includes(propertyType) && price > 0 && price <= 1000000) {
    supportNames.push('WA First Home Owners Grant');
  }

  // Concession: vacant land up to $450k; other homes up to the higher non-metro cap ($750k)
  if (propertyType === 'vacant-land-only' && price > 0 && price <= 450000) {
    supportNames.push('WA First Home Owner Concession');
  } else if (
    propertyType !== 'vacant-land-only' &&
    price > 0 &&
    price <= 750000
  ) {
    supportNames.push('WA First Home Owner Concession');
  }

  return {
    eligible: supportNames.length > 0,
    supportNames,
  };
}

function sumGrantAmounts(grants = []) {
  return grants.reduce((total, grant) => total + (Number(grant.amount) || 0), 0);
}

function sumConcessionAmounts(concessions = []) {
  return concessions.reduce((total, item) => total + (Number(item.amount) || 0), 0);
}

function cleanSupportName(text) {
  if (!text) return '';
  return String(text)
    .replace(/^Eligible for\s+/i, '')
    .replace(/\s*-\s*Full exemption$/i, '')
    .trim();
}

function getSupportNames(grants = [], concessions = []) {
  const names = [];

  grants.forEach((grant) => {
    const name = cleanSupportName(grant.reason) || 'First Home Owner Grant';
    if (name && !names.includes(name)) names.push(name);
  });

  concessions.forEach((concession) => {
    const fromReason = cleanSupportName(concession.reason);
    const name =
      fromReason ||
      (concession.type ? `${concession.type} discount` : 'Stamp duty discount');
    if (name && !names.includes(name)) names.push(name);
  });

  return names;
}

function formatSupportList(names) {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

export default function FirstHomeGrantPage() {
  const router = useRouter();
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 3000], [0, -200]);

  const [price, setPrice] = useState('');
  const [state, setState] = useState('NSW');
  const [propertyCategory, setPropertyCategory] = useState('house');
  const [propertyType, setPropertyType] = useState('existing');
  const [buyerType, setBuyerType] = useState('owner-occupier');
  const [isAustralianResident, setIsAustralianResident] = useState('yes');
  const [isFirstHomeBuyer, setIsFirstHomeBuyer] = useState('yes');
  const [teaserResults, setTeaserResults] = useState(null);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { stateFunctions } = useStateSelector(state);
  const propertyTypeOptions = useMemo(
    () => getPropertyTypeOptions(propertyCategory),
    [propertyCategory]
  );

  const numericPrice = useMemo(
    () => parseInt(String(price).replace(/[^\d]/g, ''), 10) || 0,
    [price]
  );

  const handleCategoryChange = (value) => {
    setPropertyCategory(value);
    const nextTypes = getPropertyTypeOptions(value);
    if (!nextTypes.some((option) => option.value === propertyType)) {
      setPropertyType(nextTypes[0].value);
    }
  };

  const handleMiniCalculate = (e) => {
    e.preventDefault();
    setFormError('');

    if (numericPrice <= 0) {
      setFormError('Please enter a realistic home price.');
      return;
    }

    const edgeCase = getEdgeCase(state, propertyType);
    if (edgeCase) {
      setTeaserResults({
        mode: 'edge',
        edgeCase,
      });
      return;
    }

    if (state === 'WA') {
      const waResult = assessWAEligibility({
        price: numericPrice,
        propertyType,
        buyerType,
        isAustralianResident,
        isFirstHomeBuyer,
      });

      setTeaserResults({
        mode: waResult.eligible ? 'eligible' : 'ineligible',
        supportNames: waResult.supportNames,
        supportLabel: formatSupportList(waResult.supportNames),
        needsConfirm: waResult.eligible,
      });
      return;
    }

    const isOwnerOccupier = buyerType === 'owner-occupier';
    const buyerData = {
      selectedState: state,
      buyerType,
      isPPR: isOwnerOccupier ? 'yes' : 'no',
      isAustralianResident,
      isFirstHomeBuyer,
      hasPensionCard: 'no',
      ownedPropertyLast5Years: '',
      income: '',
      dependants: '',
      needsLoan: 'yes',
      savingsAmount: '',
      dutiableValue: '',
      constructionStarted: 'no',
      sellerQuestionsComplete: false,
    };

    const propertyData = {
      propertyPrice: numericPrice,
      propertyType,
      propertyCategory,
      isWA: '',
      isWAMetro: '',
      isACT: state === 'ACT',
    };

    const upfront = stateFunctions.calculateUpfrontCosts(buyerData, propertyData, state) || {};
    const grantTotal = Math.round(sumGrantAmounts(upfront.grants));
    const concessionTotal = Math.round(sumConcessionAmounts(upfront.concessions));
    const hasSupport = grantTotal > 0 || concessionTotal > 0;
    const supportNames = getSupportNames(upfront.grants || [], upfront.concessions || []);

    setTeaserResults({
      mode: hasSupport ? 'eligible' : 'ineligible',
      supportNames,
      supportLabel: formatSupportList(supportNames),
    });
  };

  const handleProceedToFullSurvey = () => {
    setIsSubmitting(true);
    saveSurveyReturnPath('/grants-and-concessions');
    router.push('/calculator');
  };

  const clearTeaser = () => setTeaserResults(null);

  return (
    <div className="min-h-screen bg-base-200">
      <motion.div
        className="fixed inset-0 z-0 pointer-events-none hidden md:block"
        style={{
          y: parallaxY,
          backgroundImage: "url('/test15.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
        }}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 z-0 pointer-events-none md:hidden"
        style={{
          backgroundImage: "url('/test15.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
        }}
        aria-hidden="true"
      />

      <main className="relative">
        <section className="relative z-10 w-full bg-base-200">
          <div className="container mx-auto px-4 py-16 md:py-24 lg:py-20">
            <div className="grid md:grid-cols-12 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="md:col-span-6 space-y-6 text-center md:text-left"
              >
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                  Find Out How Much You Can Save as a Buyer
                </h1>
                <p className="text-lg md:text-xl text-gray-600">
                  State governments offer thousands of dollars in cash grants and stamp duty discounts — but the rules get messy. Check what you might qualify for in 30 seconds.
                </p>
                <div className="flex justify-center md:justify-start">
                  <Link
                    href="/calculator"
                    onClick={() => saveSurveyReturnPath('/grants-and-concessions')}
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-secondary px-8 py-3.5 rounded-full font-medium text-base hover:shadow-lg transition-all duration-200"
                  >
                    Use Full Calculator
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                className="md:col-span-6 bg-white border border-gray-200 rounded-3xl shadow-xl p-6 md:p-8"
              >
                <form onSubmit={handleMiniCalculate} className="space-y-4">
                  <div>
                    <label htmlFor="fhg-price" className="block text-sm font-semibold text-gray-700 mb-1">
                      Estimated home price
                    </label>
                    <input
                      id="fhg-price"
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. $650,000"
                      value={price}
                      onChange={(e) => {
                        setPrice(e.target.value.replace(/[^\d]/g, ''));
                        clearTeaser();
                      }}
                      className={`${inputClassName} cursor-text`}
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="fhg-category" className="block text-sm font-semibold text-gray-700 mb-1">
                        Property type
                      </label>
                      <select
                        id="fhg-category"
                        value={propertyCategory}
                        onChange={(e) => {
                          handleCategoryChange(e.target.value);
                          clearTeaser();
                        }}
                        className={inputClassName}
                      >
                        {PROPERTY_CATEGORIES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="fhg-state" className="block text-sm font-semibold text-gray-700 mb-1">
                        State or territory
                      </label>
                      <select
                        id="fhg-state"
                        value={state}
                        onChange={(e) => {
                          setState(e.target.value);
                          clearTeaser();
                        }}
                        className={inputClassName}
                      >
                        {STATES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="fhg-build" className="block text-sm font-semibold text-gray-700 mb-1">
                        Home condition
                      </label>
                      <select
                        id="fhg-build"
                        value={propertyType}
                        onChange={(e) => {
                          setPropertyType(e.target.value);
                          clearTeaser();
                        }}
                        className={inputClassName}
                      >
                        {propertyTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="fhg-buyer" className="block text-sm font-semibold text-gray-700 mb-1">
                        What will you do with it?
                      </label>
                      <select
                        id="fhg-buyer"
                        value={buyerType}
                        onChange={(e) => {
                          setBuyerType(e.target.value);
                          clearTeaser();
                        }}
                        className={inputClassName}
                      >
                        {BUYER_TYPES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="fhg-resident" className="block text-sm font-semibold text-gray-700 mb-1">
                        Australian citizen or PR?
                      </label>
                      <select
                        id="fhg-resident"
                        value={isAustralianResident}
                        onChange={(e) => {
                          setIsAustralianResident(e.target.value);
                          clearTeaser();
                        }}
                        className={inputClassName}
                      >
                        {YES_NO.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="fhg-first" className="block text-sm font-semibold text-gray-700 mb-1">
                        First home buyer?
                      </label>
                      <select
                        id="fhg-first"
                        value={isFirstHomeBuyer}
                        onChange={(e) => {
                          setIsFirstHomeBuyer(e.target.value);
                          clearTeaser();
                        }}
                        className={inputClassName}
                      >
                        {YES_NO.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

                  <AnimatePresence initial={false}>
                    {teaserResults ? (
                      <motion.div
                        key={`${teaserResults.mode}-${teaserResults.supportLabel || teaserResults.edgeCase?.title || ''}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-3 pb-1">
                          {teaserResults.mode === 'eligible' ? (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                              <p className="text-sm leading-relaxed text-emerald-900">
                                {teaserResults.needsConfirm ? (
                                  <>
                                    <strong>Yes — you look eligible</strong> for {teaserResults.supportLabel}.
                                    Confirm with the full survey to lock in the exact amount (location and a few
                                    extra details can change the final figure).
                                  </>
                                ) : (
                                  <>
                                    <strong>Great news!</strong> You look likely to qualify for{' '}
                                    {teaserResults.supportLabel}. Use the full tool to double-check price limits
                                    and claim every dollar.
                                  </>
                                )}
                              </p>
                            </div>
                          ) : null}

                          {teaserResults.mode === 'ineligible' ? (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                              <p className="text-sm leading-relaxed text-amber-900">
                                <strong>No — you don&apos;t appear eligible</strong> for typical first-home
                                grants and concessions with these answers. Run the full survey if you want to
                                double-check anything else.
                              </p>
                            </div>
                          ) : null}

                          {teaserResults.mode === 'edge' ? (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                                <div>
                                  <p className="text-sm font-semibold text-amber-950">
                                    {teaserResults.edgeCase.title}
                                  </p>
                                  <p className="mt-1 text-sm leading-relaxed text-amber-900">
                                    {teaserResults.edgeCase.message}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : null}

                          <p className="text-xs leading-relaxed text-gray-500">
                            Quick estimate only — excludes legal fees and individual tax advice.
                          </p>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  {teaserResults ? (
                    <button
                      type="button"
                      onClick={handleProceedToFullSurvey}
                      disabled={isSubmitting}
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-secondary transition-all duration-200 hover:bg-primary/90 hover:shadow-lg disabled:opacity-60"
                    >
                      {isSubmitting ? 'Opening calculator...' : 'Calculate exact savings'}
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="w-full cursor-pointer rounded-xl bg-primary py-3 font-medium text-secondary transition-all duration-200 hover:bg-primary/90 hover:shadow-lg"
                    >
                      Check My Savings
                    </button>
                  )}
                </form>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="relative z-10 w-full py-16">
          <div className="absolute inset-0 z-0 bg-white/20 backdrop-blur-md" aria-hidden="true" />
          <div className="relative z-10 container mx-auto px-4 py-8">
            <div className="grid gap-8 md:grid-cols-3">
              {featureCards.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
                    className="rounded-2xl border border-white/80 bg-base-200 p-8 shadow-lg backdrop-blur-sm text-center md:text-left"
                  >
                    <div className="mb-3 flex flex-col items-center justify-center gap-2 md:flex-row md:items-center md:justify-start md:gap-3">
                      <Icon className="h-6 w-6 shrink-0 text-primary" />
                      <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                    </div>
                    <p className="leading-relaxed text-gray-600">{feature.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative z-10 w-full bg-base-200 py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="rounded-3xl border border-base-200 p-8 shadow-md md:p-12"
              style={{
                background: `
                  radial-gradient(ellipse 98% 74% at 10% 24%, rgba(152, 233, 201, 0.26), transparent 74%),
                  radial-gradient(ellipse 92% 68% at 84% 28%, rgba(255, 186, 160, 0.24), transparent 74%),
                  radial-gradient(ellipse 88% 66% at 82% 82%, rgba(196, 245, 223, 0.20), transparent 76%),
                  radial-gradient(ellipse 94% 72% at 26% 76%, rgba(255, 205, 184, 0.18), transparent 77%),
                  linear-gradient(180deg, rgba(255,255,255,0.995) 0%, rgba(255,255,255,0.985) 56%, rgba(255,255,255,0.97) 100%)
                `,
              }}
            >
              <div className="mx-auto text-center md:mx-0 md:text-left">
                <h2 className="mb-4 text-3xl font-bold text-gray-900">
                  Don&apos;t Pay More Stamp Duty Than You Have To
                </h2>
                <p className="mb-6 text-lg leading-relaxed text-gray-600">
                  Government discounts can shave tens of thousands off the upfront cost of buying a home. We keep things simple when your search is straightforward — and give you detailed answers when it isn&apos;t.
                </p>
              </div>

              <div className="mt-12 grid gap-8 md:grid-cols-3">
                {pillars.map((pillar) => {
                  const Icon = pillar.icon;
                  return (
                    <div
                      key={pillar.title}
                      className="rounded-2xl border border-base-300 bg-base-200/80 p-6 text-center md:text-left"
                    >
                      <div className="mb-3 flex flex-col items-center justify-center gap-2 md:flex-row md:items-center md:justify-start md:gap-3">
                        <Icon className="h-6 w-6 shrink-0 text-primary" />
                        <h3 className="text-lg font-semibold text-gray-900">{pillar.title}</h3>
                      </div>
                      <p className="text-sm leading-relaxed text-gray-600">{pillar.copy}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-10 flex justify-center md:justify-start">
                <Link
                  href="/calculator"
                  onClick={() => saveSurveyReturnPath('/grants-and-concessions')}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-medium text-secondary transition-all duration-200 hover:bg-primary/90 hover:shadow-lg"
                >
                  Run Full Calculator
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="relative z-10 w-full py-8">
          <div className="absolute inset-0 z-0 bg-white/45 backdrop-blur-md" aria-hidden="true" />
          <div className="relative z-10 container mx-auto px-4">
            <div className="rounded-2xl border border-primary/40 bg-white/90 px-8 py-6 backdrop-blur-sm">
              <h3 className="mb-2 font-semibold text-primary">Disclaimer</h3>
              <p className="text-sm leading-relaxed text-gray-800">
                This tool provides estimates only. Government schemes and eligibility limits update frequently, so always confirm details with a qualified conveyancer or professional financial advisor before making a purchase.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
