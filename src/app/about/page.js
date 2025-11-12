"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Calculator,
    Shield,
    DollarSign,
    TrendingUp,
    Users,
    Sparkles
} from 'lucide-react';

const featureCards = [
    {
        title: "Comprehensive Calculations",
        description: "Stamp duty, LMI, ongoing fees, loan costs, and more—modelled with the same engine that powers our calculator experience.",
        icon: Calculator
    },
    {
        title: "Live State Coverage",
        description: "Every state and territory is supported with up-to-date concessions, thresholds, and policy changes monitored weekly.",
        icon: Shield
    },
    {
        title: "Financial Clarity",
        description: "Uncover hidden costs before they appear at settlement even if you're a first-time buyer, investor, or purchasing interstate.",
        icon: DollarSign
    }
];

const pillars = [
    {
        title: "Human-centred design",
        copy: "We speak in plain language, highlight the 'why', and guide you step-by-step so every decision feels confident.",
        icon: Sparkles
    },
    {
        title: "Accuracy you can trust",
        copy: "Our engine mirrors broker-grade workflows, reconciles against government tables, and flags edge cases instantly.",
        icon: TrendingUp
    },
    {
        title: "Built with the community",
        copy: "Thousands of Australians have shaped our roadmap—your feedback powers regular enhancements to the tool.",
        icon: Users
    }
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-base-200">
            <main className="pb-24">
                <section className="container mx-auto px-4 py-16 lg:py-20">
                    <div className="max-w-3xl mx-auto text-center">
                        <motion.h1
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6"
                        >
                            Built to remove the guesswork from Australian property costs
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                            className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8"
                        >
                            Australian Property Calculator combines verified data, responsive design, and a guided journey so you can plan with confidence—no spreadsheets, no jargon, no paywall.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                        >
                            <Link
                                href="/calculator"
                                className="bg-primary hover:bg-primary-focus text-secondary px-8 py-4 rounded-full font-medium text-base transition-all duration-200 hover:shadow-lg w-full sm:w-auto"
                            >
                                Start the free calculator
                            </Link>
                            <p className="text-sm text-gray-500">Instant results in under five minutes</p>
                        </motion.div>
                    </div>
                </section>

                <section className="bg-accent">
                    <div className="container mx-auto px-4 py-16">
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
                                        className="bg-base-100 rounded-2xl border border-base-200 shadow-sm p-8"
                                    >
                                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-5">
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                                        <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="container mx-auto px-4 py-16">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="bg-base-100 border border-base-200 rounded-3xl shadow-sm p-8 md:p-12"
                    >
                        <div className="md:flex md:items-start md:justify-between md:gap-12">
                            <div className="max-w-2xl">
                                <h2 className="text-3xl font-bold text-gray-900 mb-4">Why we built it</h2>
                                <p className="text-lg text-gray-600 leading-relaxed">
                                    Property transactions move fast and the true cost changes with every policy shift. We wanted a calculator that stays current, adapts to your unique situation, and highlights the decisions that impact cash flow the most.
                                </p>
                            </div>
                            <div className="mt-8 md:mt-0">
                                <div className="bg-primary/10 text-primary rounded-2xl px-6 py-5 font-semibold text-lg">
                                    Trusted by thousands of Australians in 2025
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-8 md:grid-cols-3 mt-12">
                            {pillars.map((pillar, index) => {
                                const Icon = pillar.icon;
                                return (
                                    <div key={pillar.title} className="rounded-2xl bg-base-200/80 border border-base-300 p-6">
                                        <Icon className="w-6 h-6 text-primary mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">{pillar.title}</h3>
                                        <p className="text-gray-600 text-sm leading-relaxed">{pillar.copy}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                </section>

                <section className="container mx-auto px-4">
                    <div className="bg-warning/20 border border-warning rounded-2xl p-6 md:p-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Important disclaimer</h3>
                        <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                            Australian Property Calculator delivers indicative estimates based on current public information. We recommend confirming figures with your conveyancer, lender, or licensed financial advisor before committing to any property purchase.
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}