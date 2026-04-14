"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, Search } from "lucide-react";
import Link from "next/link";

const FAQ_GROUPS = [
  {
    title: "Costs & fees",
    items: [
      {
        id: "stamp-duty",
        question: "What is stamp duty and how is it calculated?",
        answer:
          "Stamp duty is a state government tax on property purchases. The rate varies by state and property value. Our calculator uses current rates for all Australian states and territories, including concessions for first home buyers.",
      },
      {
        id: "lmi",
        question: "What is Lenders Mortgage Insurance (LMI)?",
        answer:
          "LMI is insurance that protects the lender if you default on your loan. It's typically required when your deposit is less than 20% of the property value. Our calculator automatically determines if LMI is needed and calculates the premium based on your loan amount and LVR.",
      },
      {
        id: "fees-included",
        question: "What fees are included in the calculations?",
        answer:
          "Our calculator includes: stamp duty, LMI (if applicable), land transfer fees, mortgage registration fees, legal/conveyancing fees, building and pest inspection costs, and council rates. You can toggle optional fees on/off as needed.",
      },
      {
        id: "accuracy",
        question: "How accurate are the calculations?",
        answer:
          "Our calculations are based on current rates and regulations, but actual costs may vary. We recommend consulting with qualified professionals such as mortgage brokers, conveyancers, and financial advisors for specific advice.",
      },
    ],
  },
  {
    title: "Who it's for",
    items: [
      {
        id: "fhb-concessions",
        question: "Do the calculations include first home buyer concessions?",
        answer:
          "Yes! Our calculator includes first home buyer concessions and exemptions for stamp duty. Simply check the 'First Home Buyer' option and the calculator will apply the relevant concessions for your selected state.",
      },
      {
        id: "investment",
        question: "Can I use this calculator for investment properties?",
        answer:
          "Yes! The calculator works for both owner-occupied and investment properties. Note that some concessions (like first home buyer benefits) only apply to owner-occupied properties.",
      },
      {
        id: "foreign-buyer",
        question: "What if I'm a foreign buyer?",
        answer:
          "Foreign buyers may be subject to additional duties and restrictions. Our calculator includes foreign buyer duty calculations for applicable states. Check the 'Foreign Buyer' option to include these additional costs.",
      },
    ],
  },
  {
    title: "Using the calculator",
    items: [
      {
        id: "loan-summary",
        question: "How do I interpret the loan summary?",
        answer:
          "The loan summary shows your Loan to Value Ratio (LVR), total loan repayments over the loan term, and total interest charged. This helps you understand the full cost of borrowing and compare different scenarios.",
      },
      {
        id: "save",
        question: "Can I save my calculations?",
        answer:
          "Currently, the calculator doesn't save your inputs. We recommend taking screenshots or noting down important figures for your records. Future updates may include save/export functionality.",
      },
      {
        id: "interest-rates",
        question: "Are the interest rates current?",
        answer:
          "The default interest rate is set to 6.5% as an example. You should update this to reflect current market rates or your specific loan offer. Interest rates vary between lenders and loan products.",
      },
    ],
  },
];

function matchesQuery(faq, q) {
  if (!q.trim()) return true;
  const needle = q.trim().toLowerCase();
  return (
    faq.question.toLowerCase().includes(needle) ||
    faq.answer.toLowerCase().includes(needle)
  );
}

export default function FAQPage() {
  const [openItems, setOpenItems] = useState(() => new Set());
  const [query, setQuery] = useState("");

  const filteredGroups = useMemo(() => {
    return FAQ_GROUPS.map((group) => ({
      title: group.title,
      items: group.items.filter((faq) => matchesQuery(faq, query)),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  const toggleItem = (id) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen w-full relative">
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 96% 70% at 12% 30%, rgba(67, 151, 117, 0.28), transparent 70%),
            radial-gradient(ellipse 88% 64% at 60% 24%, rgba(242, 255, 229, 0.5), transparent 72%),
            radial-gradient(ellipse 78% 60% at 84% 72%, rgba(226, 149, 120, 0.22), transparent 74%),
            radial-gradient(ellipse 86% 62% at 28% 82%, rgba(226, 149, 120, 0.14), transparent 76%),
            radial-gradient(ellipse 80% 60% at 78% 42%, rgba(67, 151, 117, 0.14), transparent 75%),
            linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.94) 42%, rgba(242,255,229,0.94) 100%)
          `,
        }}
      />
      <main className="pb-24 relative z-10">
        <section className="container mx-auto px-4 py-16 lg:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex items-center justify-center mb-6"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary">
                <HelpCircle className="w-8 h-8" />
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6"
            >
              Frequently Asked Questions
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto"
            >
              Find answers to common questions our users have asked
              
            </motion.p>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-16">
          <div className="max-w-4xl mx-auto">
            <div className="sticky top-4 z-20 mb-10 rounded-2xl border border-white/20 bg-accent shadow-md px-4 py-3 md:px-5">
              <label htmlFor="faq-search" className="sr-only">
                Search questions
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70 pointer-events-none"
                  aria-hidden
                />
                <input
                  id="faq-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search questions…"
                  className="w-full rounded-xl border border-white/25 bg-white py-3 pl-10 pr-4 text-gray-900 placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {filteredGroups.length === 0 ? (
              <p className="text-center text-gray-600 py-8">
                No questions match your search. Try a different keyword.
              </p>
            ) : (
              <div className="space-y-12">
                {filteredGroups.map((group) => (
                  <motion.div
                    key={group.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                  >
                    <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">
                      {group.title}
                    </h2>
                    <div className="space-y-4">
                      {group.items.map((faq) => (
                        <div
                          key={faq.id}
                          className="bg-primary/30 rounded-2xl border border-primary/25 shadow-sm overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => toggleItem(faq.id)}
                            className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-primary/40 transition-colors cursor-pointer"
                          >
                            <h3 className="text-lg font-semibold text-gray-900 pr-4">
                              {faq.question}
                            </h3>
                            <motion.div
                              animate={{
                                rotate: openItems.has(faq.id) ? 180 : 0,
                              }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                            </motion.div>
                          </button>
                          <AnimatePresence>
                            {openItems.has(faq.id) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden"
                              >
                                <div className="px-6 pb-5 pt-4 bg-base-100 border-t border-primary/25">
                                  <p className="text-gray-600 leading-relaxed">
                                    {faq.answer}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="bg-primary/10 border border-primary/20 rounded-2xl p-6 md:p-8 mt-12"
            >
              <h3 className="text-lg font-semibold text-primary mb-2">
                Still have questions?
              </h3>
              <p className="text-gray-700 mb-6 leading-relaxed">
                If you couldn&apos;t find the answer you&apos;re looking for,
                feel free to contact us.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-focus text-secondary px-6 py-3 rounded-full font-medium transition-all duration-200 hover:shadow-lg"
              >
                Contact Us
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
