"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Home, TrendingUp, CircleDollarSign, ArrowRight, ChevronDown } from 'lucide-react';
import { useStateSelector } from '@/states/useStateSelector';
import { formatCurrency } from '@/states/shared/baseCalculations';
import { saveSurveyReturnPath } from '@/lib/surveyReturnPath';

const featureCards = [
    {
        title: "Are You Overpaying?",
        description: "First home buyer? Owner-occupier? Investor? Missing your exemption means handing the government money you don't owe.",
        icon: Home,
    },
    {
        title: "The Rate Isn't Flat",
        description: "Every dollar over a threshold gets taxed differently. Miss this and your estimate is wrong — not close, wrong.",
        icon: TrendingUp,
    },
    {
        title: "The Number Banks Don't Show You",
        description: "Registration fees. Transfer titles. The real settlement number is bigger than the sticker price.",
        icon: CircleDollarSign,
    }
];

const faqs = [
    {
        question: "What is stamp duty and how is it calculated?",
        answer: "Stamp duty (or land transfer duty) is a tax charged by state and territory governments when you buy property. It's calculated on either the purchase price of the property or its current market value, whichever is higher. Each state uses a sliding scale where higher-priced properties pay higher rates."
    },
    {
        question: "Are first home buyers exempt from stamp duty?",
        answer: (
            <>
                In many Australian states and territories, first home buyers are eligible for full exemptions or discounted rates on stamp duty, provided the purchase price falls under specific state thresholds (e.g., $800,000 in NSW or $600,000 in VIC for full exemptions). Rules vary significantly depending on where you are buying. See our{' '}
                <Link href="/grants-and-concessions" className="text-primary font-medium underline underline-offset-2 hover:text-primary/80">
                    grants and concessions guide
                </Link>
                {' '}for state-by-state details.
            </>
        ),
    },
    {
        question: "When do I need to pay stamp duty?",
        answer: "Payment deadlines differ by state. In general, stamp duty must be paid either on or before settlement day, or within a set period after signing contracts (typically 30 to 90 days depending on the state). Your conveyancer or solicitor will usually manage this payment as part of the settlement process."
    },
    {
        question: "What additional government fees should I expect?",
        answer: "On top of transfer duty, most states charge mandatory Transfer Registration Fees and Mortgage Registration Fees to register the title change. These fees are usually flat or variable administrative costs charged by the land registry office."
    },
    {
        question: "Is stamp duty different for investors vs owner-occupiers?",
        answer: "Yes. Many state revenue offices offer principal place of residence (PPR) concessions for buyers who intend to live in the home. Investors typically pay standard duty rates without PPR discounts and may also face additional surcharges if purchasing as a foreign buyer."
    }
];

const STATES = [
    { value: 'NSW', label: 'New South Wales (NSW)' },
    { value: 'VIC', label: 'Victoria (VIC)' },
    { value: 'QLD', label: 'Queensland (QLD)' },
    { value: 'WA', label: 'Western Australia (WA)' },
    { value: 'SA', label: 'South Australia (SA)' },
    { value: 'TAS', label: 'Tasmania (TAS)' },
    { value: 'ACT', label: 'ACT' },
    { value: 'NT', label: 'Northern Territory (NT)' },
];

export default function StampDutyPage() {
    const router = useRouter();
    const { scrollY } = useScroll();
    const parallaxY = useTransform(scrollY, [0, 3000], [0, -200]);

    const [price, setPrice] = useState('');
    const [state, setState] = useState('NSW');
    const [teaserResults, setTeaserResults] = useState(null);
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openFaqIndex, setOpenFaqIndex] = useState(null);

    const { stateFunctions } = useStateSelector(state);

    const numericPrice = useMemo(
        () => parseInt(String(price).replace(/[^\d]/g, ''), 10) || 0,
        [price]
    );

    const handleMiniCalculate = (e) => {
        e.preventDefault();
        setFormError('');

        if (numericPrice <= 0) {
            setFormError('Enter a valid purchase price.');
            return;
        }

        const duty = Math.round(
            stateFunctions.calculateStampDuty(numericPrice, state) || 0
        );

        setTeaserResults({
            duty,
            price: numericPrice,
            state,
        });
    };

    const handleProceedToFullSurvey = () => {
        setIsSubmitting(true);
        saveSurveyReturnPath('/stamp-duty');
        router.push('/calculator');
    };

    const handleResetTeaser = () => {
        setTeaserResults(null);
        setFormError('');
    };

    const toggleFaq = (index) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    return (
        <div className="min-h-screen bg-base-200">
            <motion.div
                className="fixed inset-0 z-0 pointer-events-none hidden md:block"
                style={{
                    y: parallaxY,
                    backgroundImage: "url('/test13.jpg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center center',
                    backgroundRepeat: 'no-repeat',
                }}
                aria-hidden="true"
            />
            <div
                className="fixed inset-0 z-0 pointer-events-none md:hidden"
                style={{
                    backgroundImage: "url('/test13.jpg')",
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
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                className="md:col-span-6 space-y-6 text-center md:text-left"
                            >
                                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                                    Australian Base Stamp Duty Calculator
                                </h1>
                                <p className="text-lg md:text-xl text-gray-600">
                                Want a quick figure? Use our quick tool for an estimate. For a complete breakdown of true out-of-pocket costs at settlement, try our full calculator.
                                </p>
                                <div className="flex justify-center md:justify-start">
                                    <Link
                                        href="/calculator"
                                        onClick={() => saveSurveyReturnPath('/stamp-duty')}
                                        className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-secondary px-8 py-3.5 rounded-full font-medium text-base hover:shadow-lg transition-all duration-200"
                                    >
                                        Full Calculator
                                        <ArrowRight className="w-5 h-5" />
                                    </Link>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                                className="md:col-span-6 bg-white border border-gray-200 rounded-3xl shadow-xl p-6 md:p-8"
                            >
                                {!teaserResults ? (
                                    <form onSubmit={handleMiniCalculate} className="space-y-4">
                                        <div>
                                            <label htmlFor="stamp-duty-price" className="block text-sm font-semibold text-gray-700 mb-1">
                                                Target Purchase Price (AUD)
                                            </label>
                                            <input
                                                id="stamp-duty-price"
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="e.g. 750000"
                                                value={price}
                                                onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ''))}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white text-gray-900"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="stamp-duty-state" className="block text-sm font-semibold text-gray-700 mb-1">
                                                State or Territory
                                            </label>
                                            <select
                                                id="stamp-duty-state"
                                                value={state}
                                                onChange={(e) => setState(e.target.value)}
                                                className="w-full cursor-pointer px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white text-gray-900"
                                            >
                                                {STATES.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        {formError ? (
                                            <p className="text-sm text-red-600">{formError}</p>
                                        ) : null}
                                        <button
                                            type="submit"
                                            className="w-full cursor-pointer bg-primary hover:bg-primary/90 text-secondary font-medium py-3 rounded-xl transition-all duration-200 hover:shadow-lg"
                                        >
                                            Calculate Base Stamp Duty
                                        </button>
                                    </form>
                                ) : (
                                    <div className="space-y-6 text-gray-900">
                                        <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-2">
                                            <h3 className="font-bold text-xl">Estimated Stamp Duty</h3>
                                            <button
                                                type="button"
                                                onClick={handleResetTeaser}
                                                className="text-sm text-primary hover:underline"
                                            >
                                                Edit inputs
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between gap-4">
                                                <span className="text-gray-600">Purchase price ({teaserResults.state}):</span>
                                                <span className="font-semibold">{formatCurrency(teaserResults.price)}</span>
                                            </div>
                                            <div className="flex justify-between gap-4">
                                                <span className="text-gray-600">Transfer stamp duty:</span>
                                                <span className="font-semibold">{formatCurrency(teaserResults.duty)}*</span>
                                            </div>
                                        </div>
                                        <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                                            <p className="text-sm text-orange-900 leading-relaxed">
                                                <strong>Important:</strong> This is only base stamp duty. Find out if you qualify for state concessions, first home grants, and calculate the hidden settlement fees banks don&apos;t show you.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleProceedToFullSurvey}
                                            disabled={isSubmitting}
                                            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-secondary font-medium py-4 rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-60"
                                        >
                                            {isSubmitting ? 'Opening calculator...' : 'Calculate true buying costs now'}
                                            <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
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
                                        transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
                                        className="rounded-2xl border border-white/80 bg-base-200 p-8 shadow-lg backdrop-blur-sm text-center md:text-left"
                                    >
                                        <div className="flex flex-col md:flex-row items-center md:items-center justify-center md:justify-start gap-2 md:gap-3 mb-3">
                                            <Icon className="w-6 h-6 text-primary shrink-0" />
                                            <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                                        </div>
                                        <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* FAQ Accordion Section */}
                <section className="relative z-10 w-full bg-base-200 py-16">
                    <div className="container mx-auto px-4">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="border border-base-200 rounded-3xl shadow-md p-6 md:p-12"
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
                            <div className="grid gap-10 md:grid-cols-12 md:gap-12 lg:gap-16">
                                <div className="text-center md:col-span-4 md:text-left">
                                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                                        Frequently Asked Questions
                                    </h2>
                                    <p className="text-base md:text-lg text-gray-600">
                                        Everything you need to know about stamp duty, concessions, and property purchasing fees across Australia.
                                    </p>
                                </div>

                                <div className="md:col-span-8 space-y-4">
                                    {faqs.map((faq, index) => {
                                        const isOpen = openFaqIndex === index;
                                        return (
                                            <div
                                                key={index}
                                                className="border border-gray-200/80 rounded-2xl bg-white/80 overflow-hidden backdrop-blur-sm transition-all duration-200"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => toggleFaq(index)}
                                                    className="w-full flex items-center justify-between p-5 text-left font-semibold text-gray-900 hover:text-primary transition-colors duration-150 cursor-pointer"
                                                >
                                                    <span className="text-base md:text-lg pr-4">{faq.question}</span>
                                                    <ChevronDown
                                                        className={`w-5 h-5 shrink-0 text-gray-500 transition-transform duration-300 ${
                                                            isOpen ? 'rotate-180 text-primary' : ''
                                                        }`}
                                                    />
                                                </button>
                                                <AnimatePresence initial={false}>
                                                    {isOpen && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                        >
                                                            <div className="px-5 pb-5 pt-1 text-gray-600 text-sm md:text-base leading-relaxed border-t border-gray-100">
                                                                {faq.answer}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}

                                    <div className="pt-8 flex flex-col items-center md:items-start text-center md:text-left">
                                        <p className="text-gray-600 mb-4 font-medium">
                                            Ready to get an exact calculation including exemptions and hidden fees?
                                        </p>
                                        <Link
                                            href="/calculator"
                                            onClick={() => saveSurveyReturnPath('/stamp-duty')}
                                            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-secondary px-8 py-3.5 rounded-full font-medium text-base hover:shadow-lg transition-all duration-200"
                                        >
                                            Get Your Exact Number
                                            <ArrowRight className="w-5 h-5" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                <section className="relative z-10 w-full py-8">
                    <div className="absolute inset-0 z-0 bg-white/45 backdrop-blur-md" aria-hidden="true" />
                    <div className="relative z-10 container mx-auto px-4">
                        <div className="rounded-2xl border border-primary/40 bg-white/90 backdrop-blur-sm px-8 py-6">
                            <h3 className="text-primary font-semibold mb-2">Regulatory disclaimer</h3>
                            <p className="text-gray-800 text-sm leading-relaxed">
                                Proppers gives estimates only. Always confirm stamp duty, fees, and any concessions with a conveyancer or advisor before you buy.
                            </p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
