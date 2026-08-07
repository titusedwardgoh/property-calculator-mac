'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Percent,
  Clock,
  Layers,
  Scale,
} from 'lucide-react';
import { saveSurveyReturnPath } from '@/lib/surveyReturnPath';

const FAQ_ITEMS = [
  {
    question: 'Should I choose a fixed or variable home loan?',
    answer:
      'Fixed rates give repayment certainty for a set period, which helps budgeting, but you may miss rate cuts and face break fees if you refinance early. Variable rates usually offer more features and flexibility to make extra repayments or switch loans, but your repayments can rise when rates go up. A split loan lets you fix part of the balance and leave the rest variable.',
  },
  {
    question: 'Is a shorter loan term always better?',
    answer:
      'A shorter term (for example 20 years) usually means higher monthly repayments but less interest overall. A longer term (for example 30 years) lowers repayments but costs more in interest. Choose the shortest term you can realistically afford, and stress-test repayments as if rates rose by about 2%.',
  },
  {
    question: 'What is a comparison rate?',
    answer:
      'A comparison rate combines the advertised interest rate with most fees into a single annual percentage. It helps you compare the true cost of loans more fairly than looking at the interest rate alone. It still may not capture every fee or feature cost, so check the full product disclosure as well.',
  },
  {
    question: 'Do I need an offset account?',
    answer:
      'An offset account can cut interest if you keep a meaningful balance in it (for example tens of thousands of dollars). If your offset balance would usually stay low, a basic loan with a lower rate may cost less than paying for features you rarely use.',
  },
  {
    question: 'Should I use a mortgage broker?',
    answer:
      'A broker can help you compare lenders and package options, but they may not cover every loan on the market. Ask what lenders they can access, how they are paid, and request written quotes for your situation. Always compare at least two options before you commit.',
  },
];

const COMPARE_ROWS = [
  {
    label: 'Interest rate (per year)',
    detail: 'The rate advertised by the lender on the loan amount.',
  },
  {
    label: 'Comparison rate (per year)',
    detail: 'A single cost figure that includes the interest rate and most fees.',
  },
  {
    label: 'Monthly repayment',
    detail: 'What you would pay each month at the quoted rate and term.',
  },
  {
    label: 'Application fee',
    detail: 'One-off setup cost when the loan starts (also called establishment or upfront fee).',
  },
  {
    label: 'Ongoing fees',
    detail: 'Monthly or annual service fees for administering the loan.',
  },
  {
    label: 'Loan term',
    detail: 'How long you have to repay the loan — shorter usually means less total interest.',
  },
  {
    label: 'Loan features',
    detail: 'Offset, redraw, extra repayments, or line of credit — and any fees attached.',
  },
];

export default function ChoosingHomeLoanGuidePage() {
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 3000], [0, -200]);
  const [openFaqs, setOpenFaqs] = useState(new Set());

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
                  Choosing a Home Loan
                </h1>
                <p className="text-lg leading-relaxed text-gray-600 md:text-xl">
                  Interest rates, repayment types, fees, and features decide what your mortgage really
                  costs. Use this guide to compare options before you borrow.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                className="rounded-3xl border border-gray-200 bg-white p-6 text-gray-900 shadow-xl md:col-span-6 md:p-8"
              >
                <h2 className="mb-2 text-xl font-bold md:text-2xl">Estimate your repayments</h2>
                <p className="mb-6 text-base leading-relaxed text-gray-600">
                  Try our{' '}
                  <Link
                    href="/home-loan"
                    className="font-semibold text-primary underline transition-colors hover:text-primary/80"
                  >
                    home loan calculator
                  </Link>{' '}
                  for a quick repayment check, or run the full calculator to include stamp duty,
                  grants, and settlement costs with your borrowing plan.
                </p>

                <Link
                  href="/calculator"
                  onClick={() => saveSurveyReturnPath('/guides/choosing-a-home-loan')}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-base font-medium text-secondary transition-all hover:bg-primary/90 hover:shadow-lg"
                >
                  Launch Full Calculator
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span>Repayments, LVR &amp; deposit scenarios</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span>Stamp duty, grants &amp; bank fees included</span>
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
                  id="why-it-matters"
                  className="prose prose-base max-w-none space-y-6 rounded-3xl border border-white/85 bg-white/90 p-6 text-gray-700 shadow-md backdrop-blur-sm md:p-8"
                >
                  <h2 className="flex items-start gap-3 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                    <span className="shrink-0 leading-[1.15] text-primary">1.</span>
                    <span className="leading-[1.15]">Why the Rate Matters</span>
                  </h2>
                  <p className="text-base leading-relaxed md:text-lg">
                    When you shop for a home loan, the interest rate is one of the biggest cost
                    drivers. Even a small difference — for example 0.5% — can add up to thousands of
                    dollars over a 25 or 30 year loan.
                  </p>
                  <p className="text-base leading-relaxed md:text-lg">
                    Rate is not the only factor. Repayment type, loan term, fees, and features all
                    change what you pay and how flexible the loan is if your circumstances change.
                    Compare at least two lenders before you decide.
                  </p>
                </article>

                <article
                  id="repayment-type"
                  className="prose prose-base max-w-none space-y-6 rounded-3xl border border-white/85 bg-white/90 p-6 text-gray-700 shadow-md backdrop-blur-sm md:p-8"
                >
                  <h2 className="flex items-start gap-3 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                    <span className="shrink-0 leading-[1.15] text-primary">2.</span>
                    <span className="leading-[1.15]">Choose Your Repayment Type</span>
                  </h2>

                  <div className="not-prose grid grid-cols-1 gap-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="mb-2 flex items-center gap-2">
                        <Scale className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-bold text-gray-900">Principal and interest</h3>
                      </div>
                      <p className="text-base leading-relaxed text-gray-600">
                        Most buyers choose this structure. Each repayment covers interest plus a
                        portion of the amount you borrowed (the principal). Over the agreed loan term
                        — often 25 or 30 years — you pay the loan down to zero.
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="mb-2 flex items-center gap-2">
                        <Percent className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-bold text-gray-900">Interest-only</h3>
                      </div>
                      <p className="text-base leading-relaxed text-gray-600">
                        For an initial period (for example five years), repayments cover interest
                        only. Your debt does not reduce during that time. Repayments may look lower
                        at first, then rise when you switch to principal and interest. Make sure you
                        can afford the higher repayments later.
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="mb-2 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-bold text-gray-900">Choose the shortest term you can afford</h3>
                      </div>
                      <ul className="space-y-2 text-base leading-relaxed text-gray-600">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          <span>
                            Shorter term (e.g. 20 years): higher repayments, less interest overall.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          <span>
                            Longer term (e.g. 30 years): lower repayments, more interest overall.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          <span>
                            Stress-test your budget as if rates rose by about 2% before you commit.
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </article>

                <article
                  id="interest-rates"
                  className="prose prose-base max-w-none space-y-6 rounded-3xl border border-white/85 bg-white/90 p-6 text-gray-700 shadow-md backdrop-blur-sm md:p-8"
                >
                  <h2 className="flex items-start gap-3 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                    <span className="shrink-0 leading-[1.15] text-primary">3.</span>
                    <span className="leading-[1.15]">Compare Interest Rates</span>
                  </h2>
                  <p className="text-base leading-relaxed md:text-lg">
                    Weigh fixed and variable options against your need for certainty versus
                    flexibility. A partially fixed (split) loan can give you a bit of both.
                  </p>

                  <div className="not-prose overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                    <table className="w-full text-left text-base text-gray-700">
                      <thead className="border-b border-gray-200 bg-gray-50 text-sm font-semibold uppercase tracking-wider text-gray-900">
                        <tr>
                          <th className="px-4 py-3.5">Rate type</th>
                          <th className="px-4 py-3.5">Pros</th>
                          <th className="px-4 py-3.5">Cons</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        <tr>
                          <td className="px-4 py-3.5 font-semibold text-gray-900">Fixed</td>
                          <td className="px-4 py-3.5">
                            Predictable repayments for the fixed period; fewer features can mean a
                            lower cost.
                          </td>
                          <td className="px-4 py-3.5">
                            No benefit if rates fall; break fees may apply if you switch early; extra
                            repayments can be limited.
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3.5 font-semibold text-gray-900">Variable</td>
                          <td className="px-4 py-3.5">
                            More features and flexibility; usually easier to refinance; extra
                            repayments often allowed.
                          </td>
                          <td className="px-4 py-3.5">
                            Repayments can rise or fall; more features can cost more.
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3.5 font-semibold text-gray-900">Split</td>
                          <td className="px-4 py-3.5">
                            Fix part of the loan for certainty and keep part variable for
                            flexibility (e.g. 50/50 or 20/80).
                          </td>
                          <td className="px-4 py-3.5">
                            Two rate structures to manage; features and fees still need careful
                            comparison.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </article>

                <article
                  id="loan-features"
                  className="prose prose-base max-w-none space-y-6 rounded-3xl border border-white/85 bg-white/90 p-6 text-gray-700 shadow-md backdrop-blur-sm md:p-8"
                >
                  <h2 className="flex items-start gap-3 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                    <span className="shrink-0 leading-[1.15] text-primary">4.</span>
                    <span className="leading-[1.15]">Compare Home Loan Features</span>
                  </h2>
                  <p className="text-base leading-relaxed md:text-lg">
                    Features like an offset account, redraw facility, or line of credit can help you
                    pay less interest or access funds later. They can also cost more. Ask whether you
                    will actually use them.
                  </p>
                  <div className="not-prose grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {[
                      {
                        title: 'Offset account',
                        copy: 'Savings linked to your loan reduce the balance you pay interest on. Worth it if you keep a meaningful offset balance; less useful if the balance stays low.',
                      },
                      {
                        title: 'Redraw facility',
                        copy: 'Lets you access extra repayments you have already made. Check redraw fees and any limits before you rely on it.',
                      },
                      {
                        title: 'Extra repayments',
                        copy: 'Paying more than the minimum can cut years off the loan. Confirm the loan allows it without penalty — especially on fixed rates.',
                      },
                      {
                        title: 'Basic vs packaged loans',
                        copy: 'A basic loan with fewer features can be cheaper if you will not use offset, redraw, or package perks. Avoid paying for nice-to-haves.',
                      },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <Layers className="h-4 w-4 text-primary" />
                          <h3 className="text-base font-bold text-gray-900">{item.title}</h3>
                        </div>
                        <p className="text-sm leading-relaxed text-gray-600 md:text-base">
                          {item.copy}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>

                <article
                  id="what-to-compare"
                  className="prose prose-base max-w-none space-y-6 rounded-3xl border border-white/85 bg-white/90 p-6 text-gray-700 shadow-md backdrop-blur-sm md:p-8"
                >
                  <h2 className="flex items-start gap-3 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                    <span className="shrink-0 leading-[1.15] text-primary">5.</span>
                    <span className="leading-[1.15]">What Else to Compare</span>
                  </h2>
                  <p className="text-base leading-relaxed md:text-lg">
                    With a borrowing amount in mind, compare loans from at least two lenders. Look
                    past the headline rate to fees, comparison rate, term, and features. Comparison
                    websites can help, but they are businesses and may promote some products — they
                    may not show every option.
                  </p>

                  <div className="not-prose overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                    <table className="w-full text-left text-base text-gray-700">
                      <thead className="border-b border-gray-200 bg-gray-50 text-sm font-semibold uppercase tracking-wider text-gray-900">
                        <tr>
                          <th className="px-4 py-3.5">Compare</th>
                          <th className="px-4 py-3.5">What it means</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {COMPARE_ROWS.map((row) => (
                          <tr key={row.label}>
                            <td className="px-4 py-3.5 font-semibold text-gray-900">{row.label}</td>
                            <td className="px-4 py-3.5">{row.detail}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>

                <article
                  id="shortlist"
                  className="prose prose-base max-w-none space-y-6 rounded-3xl border border-white/85 bg-white/90 p-6 text-gray-700 shadow-md backdrop-blur-sm md:p-8"
                >
                  <h2 className="flex items-start gap-3 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                    <span className="shrink-0 leading-[1.15] text-primary">6.</span>
                    <span className="leading-[1.15]">How to Shortlist a Loan</span>
                  </h2>
                  <p className="text-base leading-relaxed md:text-lg">
                    A practical process many buyers follow: decide your must-have features (for
                    example the ability to make extra repayments), compare rates and fees across a
                    couple of comparison tools, model repayments at different rates and terms, then
                    ask two lenders for written quotes personalised to your situation before you
                    choose.
                  </p>
                  <div className="not-prose space-y-3">
                    {[
                      'List must-have vs nice-to-have features for your lifestyle.',
                      'Compare interest rate, comparison rate, and fees side by side.',
                      'Model repayments if rates rise by about 2%.',
                      'Get at least two personalised written quotes before you commit.',
                    ].map((step, index) => (
                      <div
                        key={step}
                        className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                          {index + 1}
                        </span>
                        <p className="text-sm leading-relaxed text-gray-700 md:text-base">{step}</p>
                      </div>
                    ))}
                  </div>
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
                        { name: '1. Why the Rate Matters', id: 'why-it-matters' },
                        { name: '2. Choose Your Repayment Type', id: 'repayment-type' },
                        { name: '3. Compare Interest Rates', id: 'interest-rates' },
                        { name: '4. Compare Loan Features', id: 'loan-features' },
                        { name: '5. What Else to Compare', id: 'what-to-compare' },
                        { name: '6. How to Shortlist a Loan', id: 'shortlist' },
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
                This guide summarises general consumer principles for choosing a home loan in
                Australia and is informed by publicly available ASIC MoneySmart guidance. It is not
                personal financial advice. Loan products, rates, fees, and features change frequently.
                Compare current lender disclosures and consider speaking with a licensed mortgage
                broker or credit adviser before you borrow.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
