'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Building2,
  Globe,
  Sparkles,
  Info,
  DollarSign,
  Percent,
  Coins,
  Scale,
  ChevronDown,
} from 'lucide-react';
import { saveSurveyReturnPath } from '@/lib/surveyReturnPath';
import { useStateSelector } from '@/states/useStateSelector';

// Helper to map UI property type selection to the exact string states calculations expect
const mapPropertyType = (state, type) => {
  if (type === 'established') {
    return state === 'QLD' ? 'existing' : 'established';
  }
  return type; // 'new', 'off-the-plan', 'vacant-land-only', 'house-and-land'
};

const FAQ_ITEMS = [
  {
    question: "How do states calculate stamp duty?",
    answer: "Each Australian state and territory calculates stamp duty using a sliding percentage scale based on the property's purchase price or market value (whichever is higher). As the property price crosses into higher brackets, the marginal tax rate increases. Concessions or complete exemptions are then subtracted based on whether you are a first-home buyer, pensioner, or purchasing vacant land to build on."
  },
  {
    question: "Is stamp duty tax-deductible in Australia?",
    answer: "If you purchase a property as your principal place of residence (owner-occupier), stamp duty is not tax-deductible. If you buy an investment property, you cannot deduct stamp duty as an immediate expense in your tax return either; instead, it is classified as a capital expense. This means it is added to the cost base of the property, which can offset capital gains and reduce your Capital Gains Tax (CGT) liability when you sell the property in the future."
  },
  {
    question: "Can I capitalize my stamp duty into the home loan?",
    answer: "Yes, many lenders allow you to add ('capitalize') stamp duty and other upfront fees into your total home loan amount, provided your Loan-to-Value Ratio (LVR) remains within their acceptable limits (usually up to 95% LVR). Note that doing this will increase your overall debt, your monthly repayments, and will likely trigger Lenders Mortgage Insurance (LMI) since your deposit ratio will drop."
  },
  {
    question: "What happens if I don't pay stamp duty on time?",
    answer: "State revenue offices impose strict payment deadlines, usually between 30 and 90 days from the settlement or contract date. If you fail to pay by the due date, you will face penalty interest charges and potential default fees. The revenue office can also place a caveat or legal charge over your property title, preventing you from selling or refinancing until the debt is cleared."
  },
  {
    question: "How do I apply for first-home buyer stamp duty exemptions?",
    answer: "Your solicitor or conveyancer will guide you through this process during the settlement phase. They will prepare the necessary state-specific application forms (e.g., the Purchaser Declaration form in NSW or the Land Transfer Duty Application in VIC) and submit them to the state's revenue office on your behalf at settlement so the concession is applied automatically."
  }
];

export default function StampDutyGuidePage() {
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 3000], [0, -200]);

  // Example comparison table active state
  const [compState, setCompState] = useState('NSW');

  // FAQ open states
  const [openFaqs, setOpenFaqs] = useState(new Set());

  // Revenue Office Links open state
  const [isRevenueLinksOpen, setIsRevenueLinksOpen] = useState(false);

  // Scroll to section helper
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - 90;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
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

  // Helper to format currency
  const formatCur = (val) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const { stateFunctions: compFunctions } = useStateSelector(compState);

  // Compute example matrix dynamically for the selected comparison state
  const stateMatrixData = useMemo(() => {
    if (!compFunctions || !compFunctions.calculateUpfrontCosts) return [];

    const pricePoints = [500000, 750000, 1000000, 1500000];

    return pricePoints.map((price) => {
      // 1. Owner Occupier + First Home Buyer
      const fhbResult = compFunctions.calculateUpfrontCosts(
        {
          buyerType: 'owner-occupier',
          isPPR: 'yes',
          isAustralianResident: 'yes',
          isFirstHomeBuyer: 'yes',
          needsLoan: 'yes',
          hasPensionCard: 'no',
          sellerQuestionsComplete: false,
        },
        {
          propertyPrice: price,
          propertyType: compState === 'QLD' ? 'existing' : 'established',
          propertyCategory: 'residential',
          isWA: 'south',
          isWAMetro: 'metro',
        },
        compState
      );

      // 2. Next Home Buyer (Owner Occupier, non-FHO)
      const nextHomeResult = compFunctions.calculateUpfrontCosts(
        {
          buyerType: 'owner-occupier',
          isPPR: 'yes',
          isAustralianResident: 'yes',
          isFirstHomeBuyer: 'no',
          needsLoan: 'yes',
          hasPensionCard: 'no',
          sellerQuestionsComplete: false,
        },
        {
          propertyPrice: price,
          propertyType: compState === 'QLD' ? 'existing' : 'established',
          propertyCategory: 'residential',
          isWA: 'south',
          isWAMetro: 'metro',
        },
        compState
      );

      // 3. Property Investor
      const investorResult = compFunctions.calculateUpfrontCosts(
        {
          buyerType: 'investor',
          isPPR: 'no',
          isAustralianResident: 'yes',
          isFirstHomeBuyer: 'no',
          needsLoan: 'yes',
          hasPensionCard: 'no',
          sellerQuestionsComplete: false,
        },
        {
          propertyPrice: price,
          propertyType: compState === 'QLD' ? 'existing' : 'established',
          propertyCategory: 'residential',
          isWA: 'south',
          isWAMetro: 'metro',
        },
        compState
      );

      return {
        price,
        fhbDuty: fhbResult.netStateDuty,
        nextHomeDuty: nextHomeResult.netStateDuty,
        investorDuty: investorResult.netStateDuty,
      };
    });
  }, [compState, compFunctions]);

  return (
    <div className="min-h-screen bg-base-200 text-gray-900">
      {/* Desktop parallax background */}
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
      {/* Mobile static background */}
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
        {/* Hero Section */}
        <section className="relative z-10 w-full bg-base-200 border-b border-gray-200/50 pb-12 pt-16 md:pb-16 md:pt-24">
          <div className="container mx-auto max-w-6xl px-4 text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="h-3.5 w-3.5" /> 2026 Policy Reference &amp; Calculator
              </span>
              <h1 className="text-4xl font-extrabold leading-tight text-gray-900 md:text-6xl">
                What is Stamp Duty and Rates by State?
              </h1>
              <p className="max-w-3xl text-lg leading-relaxed text-gray-600 md:text-xl">
                An expert-guided breakdown of transfer duty rates, concessions, and exemptions.
                Learn about policy exemptions, check payment deadlines, and view rate guidelines across Australia.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content & Tools Grid */}
        <section className="relative z-10 w-full py-12 md:py-16">
          <div className="absolute inset-0 z-0 bg-white/10 backdrop-blur-sm" aria-hidden="true" />
          <div className="relative z-10 container mx-auto max-w-6xl px-4">
            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">

              {/* Left Column: Interactive Widget & Detailed Content */}
              <div className="space-y-6 lg:col-span-8">

                {/* What is Stamp Duty Section */}
                <article id="what-is-stamp-duty" className="prose max-w-none text-gray-700 space-y-6 rounded-3xl border border-white/85 bg-white/90 p-6 md:p-8 shadow-md backdrop-blur-sm">
                  <h2 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                    <span className="text-primary">1.</span> What is Stamp Duty?
                  </h2>
                  <p className="leading-relaxed">
                    Stamp duty in Australia is a tax levied by state and territory governments on the transfer of physical assets, most commonly residential real estate and vacant land. Officially termed **transfer duty** (in states like NSW and Queensland) or **land transfer duty** (in Victoria), this is an upfront settlement fee paid solely by the purchaser.
                  </p>
                  <p className="leading-relaxed">
                    Because this is an upfront cost, the buyer must settle the tax in cash out of their savings unless they are eligible for complete exemptions or choose to capitalized the fee into their overall home loan amount.
                  </p>
                </article>

                {/* How is Stamp Duty Calculated Section */}
                <article id="how-calculated" className="prose max-w-none text-gray-700 space-y-6 rounded-3xl border border-white/85 bg-white/90 p-6 md:p-8 shadow-md backdrop-blur-sm">
                  <h2 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                    <span className="text-primary">2.</span> How is Stamp Duty Calculated?
                  </h2>
                  <p className="leading-relaxed">
                    Instead of a flat percentage rate, stamp duty uses a progressive sliding bracket scale. This means the higher the property&apos;s purchase price or market value, the higher the tax rate applied to each additional bracket.
                  </p>
                  <p className="font-semibold text-gray-800 mb-2">
                    Your final stamp duty calculations depend on several critical factors:
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-gray-900">State / Territory Rules</span>
                        <span className="text-xs text-gray-500">Each jurisdiction administers its own rate brackets, which change frequently with state budgets.</span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-gray-900">Buyer Residency</span>
                        <span className="text-xs text-gray-500">Foreign purchasers face heavy surcharges (typically +7% to +8% on top of normal rates).</span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-gray-900">Buyer Status</span>
                        <span className="text-xs text-gray-500">First-home buyers often pay $0 or discounted concessional rates up to statutory limits.</span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-gray-900">Property Usage</span>
                        <span className="text-xs text-gray-500">Buying an investment property frequently attracts higher rates or excludes you from concessions.</span>
                      </div>
                    </div>
                  </div>
                </article>

                {/* State comparison dynamic matrix */}
                <div id="calculations-matrix" className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-xl backdrop-blur-md">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Live Bracket Calculations Matrix</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Compare stamp duty payable for owner-occupiers vs investors at typical purchase brackets.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1 border border-gray-200">
                      {['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setCompState(st)}
                          className={`cursor-pointer rounded-lg px-3 py-1 text-xs font-bold transition-all ${compState === st
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
                    <table className="w-full text-left text-sm text-gray-700">
                      <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-900">
                        <tr>
                          <th className="px-4 py-3.5">Purchase Value</th>
                          <th className="px-4 py-3.5">First Home Buyer</th>
                          <th className="px-4 py-3.5">Next Home Buyer</th>
                          <th className="px-4 py-3.5 text-right">Investor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium">
                        {stateMatrixData.map((row) => (
                          <tr key={row.price} className="transition-colors hover:bg-primary/5">
                            <td className="px-4 py-4 font-bold text-gray-900">
                              {formatCur(row.price)}
                            </td>
                            <td className="px-4 py-4 text-emerald-600">
                              {row.fhbDuty === 0 ? 'Exempt ($0)' : formatCur(row.fhbDuty)}
                            </td>
                            <td className="px-4 py-4 text-gray-600">
                              {formatCur(row.nextHomeDuty)}
                            </td>
                            <td className="px-4 py-4 text-right text-gray-900">
                              {formatCur(row.investorDuty)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <Info className="w-4 h-4 text-primary shrink-0" />
                    <span>Calculations computed live based on {compState} transfer duty guidelines for FY 2026-27.</span>
                  </div>
                </div>

                {/* Who Pays Stamp Duty & Timing Section */}
                <article id="who-pays-and-when" className="prose max-w-none text-gray-700 space-y-6 rounded-3xl border border-white/85 bg-white/90 p-6 md:p-8 shadow-md backdrop-blur-sm">
                  <h2 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                    <span className="text-primary">3.</span> Who Pays Stamp Duty and When is it Due?
                  </h2>
                  <p className="leading-relaxed">
                    The purchaser is strictly responsible for paying stamp duty. State revenue offices enforce strict payment timelines that begin from either the exchange of contracts or the settlement date.
                  </p>
                  <p className="font-semibold text-gray-800">
                    Deadlines vary by state and territory:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                    <li>**NSW &amp; Victoria**: Stamp duty is usually due within 30 days from the settlement date.</li>
                    <li>**Queensland**: You must pay within 30 days from the date of the contract becoming unconditional.</li>
                    <li>**Western Australia &amp; South Australia**: Paid directly at or shortly before settlement to ensure registration of transfer of land occurs.</li>
                  </ul>
                  <p className="leading-relaxed">
                    Most transactions are handled digitally. Your mortgage broker and conveyancer coordinate with the lender through electronic platforms (such as PEXA) to lodge the necessary declarations and transfer the tax amount from your loan or savings account to the Revenue Office at settlement.
                  </p>
                </article>

                {/* Can You Avoid Stamp Duty? Section */}
                <article id="how-to-reduce" className="prose max-w-none text-gray-700 space-y-6 rounded-3xl border border-white/85 bg-white/90 p-6 md:p-8 shadow-md backdrop-blur-sm">
                  <h2 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                    <span className="text-primary">4.</span> How Can You Avoid or Reduce Stamp Duty?
                  </h2>
                  <p className="leading-relaxed">
                    While you cannot simply refuse to pay, you can qualify for complete exemptions or concessional rates under specific legislation.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary mt-1">1</span>
                      <div>
                        <strong className="text-gray-900">First Home Buyer Schemes:</strong> Almost all states offer assistance. For example, NSW provides full exemptions up to $800k (and partial concessions up to $1M), and Victoria provides full exemptions up to $600k (with concessions up to $750k).
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary mt-1">2</span>
                      <div>
                        <strong className="text-gray-900">Transferring to a Spouse:</strong> Spousal exemptions allow transferring the family residence between spouses or de facto partners without attracting stamp duty.
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary mt-1">3</span>
                      <div>
                        <strong className="text-gray-900">Pensioners &amp; Seniors:</strong> Concessions exist in several states (like Victoria and Tasmania) allowing pensioners a one-off concession on homes below statutory price caps.
                      </div>
                    </li>
                  </ul>
                </article>

                {/* FAQ Section */}
                <div id="faqs" className="space-y-6 rounded-3xl border border-white/85 bg-white/90 p-6 md:p-8 shadow-md backdrop-blur-sm">
                  <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                    <HelpCircle className="w-6 h-6 text-primary" /> Frequently Asked Questions
                  </h2>
                  <div className="space-y-4">
                    {FAQ_ITEMS.map((faq, index) => {
                      const isOpen = openFaqs.has(index);
                      return (
                        <div
                          key={index}
                          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => toggleFaq(index)}
                            className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-primary/5 transition-colors cursor-pointer"
                          >
                            <h3 className="text-base font-bold text-gray-900 pr-4">
                              {faq.question}
                            </h3>
                            <motion.div
                              animate={{ rotate: isOpen ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
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
                                <div className="px-6 pb-5 pt-3 bg-gray-50/50 border-t border-gray-100 text-sm leading-relaxed text-gray-600">
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

              {/* Right Column: CTA Panel & Utilities */}
              <div className="lg:col-span-4 self-stretch">
                <div className="sticky top-24 space-y-6">

                  {/* Table of Contents Navigation Card */}
                  <div className="rounded-3xl border border-white/80 bg-white/95 p-6 text-gray-900 shadow-xl backdrop-blur-sm">
                    <h3 className="mb-3 text-sm font-bold text-gray-900">Guide Sections</h3>
                    <nav className="flex flex-col divide-y divide-gray-100">
                      {[
                        { name: '1. What is Stamp Duty?', id: 'what-is-stamp-duty' },
                        { name: '2. How is Stamp Duty Calculated?', id: 'how-calculated' },
                        { name: '3. Live Calculations Matrix', id: 'calculations-matrix' },
                        { name: '4. Who Pays & When is it Due?', id: 'who-pays-and-when' },
                        { name: '5. How to Reduce Stamp Duty', id: 'how-to-reduce' },
                        { name: '6. Frequently Asked Questions', id: 'faqs' },
                      ].map((sec) => (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => scrollToSection(sec.id)}
                          className="w-full text-left text-xs font-semibold text-gray-600 hover:text-primary transition-colors py-2.5 cursor-pointer flex items-center justify-between group"
                        >
                          <span>{sec.name}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </button>
                      ))}
                    </nav>
                  </div>

                  {/* Main Calculator CTA Card */}
                  <div className="rounded-3xl border border-white/80 bg-white/95 p-6 text-gray-900 shadow-xl backdrop-blur-sm">
                    <h3 className="mb-2 text-xl font-bold">Get your stamp duty estimate</h3>
                    <p className="mb-6 text-sm leading-relaxed text-gray-600">
                      Try our{' '}
                      <Link href="/stamp-duty" className="text-primary underline font-semibold hover:text-primary/80 transition-colors">
                        easy calculator
                      </Link>{' '}
                      to quickly check your rates, or use our comprehensive calculator to include government concessions, bank fees, and other details so you can plan your budget with confidence.
                    </p>

                    <Link
                      href="/calculator"
                      onClick={() => saveSurveyReturnPath('/guides/stamp-duty')}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-medium text-secondary transition-all hover:bg-primary/90 hover:shadow-lg"
                    >
                      Launch Full Calculator
                      <ArrowRight className="h-4 w-4" />
                    </Link>

                    <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span>Concessions &amp; first home grants</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span>Conveyancing, registration &amp; bank fees</span>
                      </div>
                    </div>
                  </div>

                  {/* State Guide Reference Links */}
                  <div className="rounded-2xl border border-white/80 bg-base-200/90 p-5 backdrop-blur-sm space-y-4">
                    <div>
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <Building2 className="h-4 w-4 text-primary" />
                        State Revenue Authorities
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        For more details, consult the official Revenue Office guidelines in your state:
                      </p>
                    </div>

                    <div className="border-t border-gray-200/40 pt-3">
                      <button
                        type="button"
                        onClick={() => setIsRevenueLinksOpen(!isRevenueLinksOpen)}
                        className="w-full flex items-center justify-between py-1 text-xs font-bold text-gray-700 hover:text-primary transition-colors cursor-pointer"
                      >
                        <span>{isRevenueLinksOpen ? 'Hide Official Websites' : 'Show Official Websites'}</span>
                        <motion.div
                          animate={{ rotate: isRevenueLinksOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        </motion.div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isRevenueLinksOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <ul className="space-y-2 text-xs font-semibold text-gray-700 pt-3">
                              <li>
                                <a href="https://www.revenue.nsw.gov.au" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors underline flex items-center justify-between">
                                  <span>NSW Revenue NSW</span> <ArrowRight className="w-3 h-3" />
                                </a>
                              </li>
                              <li>
                                <a href="https://www.sro.vic.gov.au" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors underline flex items-center justify-between">
                                  <span>VIC State Revenue Office</span> <ArrowRight className="w-3 h-3" />
                                </a>
                              </li>
                              <li>
                                <a href="https://www.qro.qld.gov.au" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors underline flex items-center justify-between">
                                  <span>QLD Queensland Revenue Office</span> <ArrowRight className="w-3 h-3" />
                                </a>
                              </li>
                              <li>
                                <a href="https://www.wa.gov.au/organisation/department-of-finance/revenuewa" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors underline flex items-center justify-between">
                                  <span>WA RevenueWA</span> <ArrowRight className="w-3 h-3" />
                                </a>
                              </li>
                              <li>
                                <a href="https://www.revenuesa.sa.gov.au" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors underline flex items-center justify-between">
                                  <span>SA RevenueSA</span> <ArrowRight className="w-3 h-3" />
                                </a>
                              </li>
                              <li>
                                <a href="https://www.sro.tas.gov.au" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors underline flex items-center justify-between">
                                  <span>TAS State Revenue Office</span> <ArrowRight className="w-3 h-3" />
                                </a>
                              </li>
                              <li>
                                <a href="https://www.revenue.act.gov.au" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors underline flex items-center justify-between">
                                  <span>ACT Revenue Office</span> <ArrowRight className="w-3 h-3" />
                                </a>
                              </li>
                              <li>
                                <a href="https://nt.gov.au/industry/taxes-royalties-grants/territory-revenue-office" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors underline flex items-center justify-between">
                                  <span>NT Territory Revenue Office</span> <ArrowRight className="w-3 h-3" />
                                </a>
                              </li>
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Disclaimer Section */}
        <section className="relative z-10 w-full py-8 bg-base-200 border-t border-gray-200/50">
          <div className="relative z-10 container mx-auto max-w-6xl px-4">
            <div className="rounded-2xl border border-primary/20 bg-white px-8 py-6 text-gray-700">
              <h3 className="mb-2 text-sm font-semibold text-primary">Regulatory Disclaimer</h3>
              <p className="text-xs leading-relaxed text-gray-500">
                Proppers estimates transfer duty guidelines based on public state revenue office thresholds for the 2026-27 financial year. Stamp duty legislation, tax brackets, and concession limits are subject to statutory amendments by state governments. Always verify your specific stamp duty and settlement obligations with a licensed conveyancing practitioner or legal professional before signing contracts.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
