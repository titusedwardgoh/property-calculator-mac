"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function FAQPage() {
  const [openItems, setOpenItems] = useState(new Set());

  const toggleItem = (index) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  const faqs = [
    {
      question: "What is stamp duty and how is it calculated?",
      answer: "Stamp duty is a state government tax on property purchases. The rate varies by state and property value. Our calculator uses current rates for all Australian states and territories, including concessions for first home buyers."
    },
    {
      question: "What is Lenders Mortgage Insurance (LMI)?",
      answer: "LMI is insurance that protects the lender if you default on your loan. It's typically required when your deposit is less than 20% of the property value. Our calculator automatically determines if LMI is needed and calculates the premium based on your loan amount and LVR."
    },
    {
      question: "Do the calculations include first home buyer concessions?",
      answer: "Yes! Our calculator includes first home buyer concessions and exemptions for stamp duty. Simply check the 'First Home Buyer' option and the calculator will apply the relevant concessions for your selected state."
    },
    {
      question: "What fees are included in the calculations?",
      answer: "Our calculator includes: stamp duty, LMI (if applicable), land transfer fees, mortgage registration fees, legal/conveyancing fees, building and pest inspection costs, and council rates. You can toggle optional fees on/off as needed."
    },
    {
      question: "How accurate are the calculations?",
      answer: "Our calculations are based on current rates and regulations, but actual costs may vary. We recommend consulting with qualified professionals such as mortgage brokers, conveyancers, and financial advisors for specific advice."
    },
    {
      question: "Can I use this calculator for investment properties?",
      answer: "Yes! The calculator works for both owner-occupied and investment properties. Note that some concessions (like first home buyer benefits) only apply to owner-occupied properties."
    },
    {
      question: "What if I'm a foreign buyer?",
      answer: "Foreign buyers may be subject to additional duties and restrictions. Our calculator includes foreign buyer duty calculations for applicable states. Check the 'Foreign Buyer' option to include these additional costs."
    },
    {
      question: "How do I interpret the loan summary?",
      answer: "The loan summary shows your Loan to Value Ratio (LVR), total loan repayments over the loan term, and total interest charged. This helps you understand the full cost of borrowing and compare different scenarios."
    },
    {
      question: "Can I save my calculations?",
      answer: "Currently, the calculator doesn't save your inputs. We recommend taking screenshots or noting down important figures for your records. Future updates may include save/export functionality."
    },
    {
      question: "Are the interest rates current?",
      answer: "The default interest rate is set to 6.5% as an example. You should update this to reflect current market rates or your specific loan offer. Interest rates vary between lenders and loan products."
    }
  ];

  return (
    <div className="min-h-screen bg-base-200">
      <main className="pb-24">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 lg:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex items-center justify-center mb-6"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary">
                <HelpCircle className="w-8 h-8" />
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6"
            >
              Frequently Asked Questions
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-12"
            >
              Find answers to common questions about the Australian Property Calculator
            </motion.p>
          </div>
        </section>

        {/* FAQ Items */}
        <section className="container mx-auto px-4 pb-16">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-base-200 transition-colors cursor-pointer"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 pr-4">
                      {faq.question}
                    </h3>
                    <motion.div
                      animate={{ rotate: openItems.has(index) ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {openItems.has(index) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5">
                          <p className="text-gray-600 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            {/* Contact Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              className="bg-primary/10 border border-primary/20 rounded-2xl p-6 md:p-8 mt-12"
            >
              <h3 className="text-lg font-semibold text-primary mb-2">Still have questions?</h3>
              <p className="text-gray-700 mb-6 leading-relaxed">
                If you couldn&apos;t find the answer you&apos;re looking for, feel free to contact us.
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
