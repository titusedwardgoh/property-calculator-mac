"use client";

import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            href="/" 
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Calculator</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <HelpCircle className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about the Australian Property Calculator
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-900 pr-4">
                  {faq.question}
                </h3>
                {openItems.has(index) ? (
                  <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                )}
              </button>
              {openItems.has(index) && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-12">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Still have questions?</h3>
          <p className="text-blue-700 mb-4">
            If you couldn&apos;t find the answer you&apos;re looking for, feel free to contact us.
          </p>
          <Link 
            href="/contact" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
} 