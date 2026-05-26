"use client";

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
    ArrowLeft,
    TrendingUp,
    Users,
    Sparkles
} from 'lucide-react';

const featureCards = [
    {
        title: "Comprehensive Calculations",
        description: "Stamp duty, LMI, ongoing fees, loan costs, and more—modelled with the same engine that powers our calculator experience.",
        icon: "/test8.png",
        objectPosition: "50% 55%",
    },
    {
        title: "Live State Coverage",
        description: "Every state and territory is supported with up-to-date concessions, thresholds, and policy changes monitored weekly.",
        icon: "/test9.png",
        objectPosition: "50% 50%",
    },
    {
        title: "Financial Clarity",
        description: "Uncover hidden costs before they appear at settlement even if you're a first-time buyer, investor, or purchasing interstate.",
        icon: "/test10.png",
        objectPosition: "50% 50%",
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
    const { scrollY } = useScroll();
    const parallaxY = useTransform(scrollY, [0, 3000], [0, -200]);

    return (
        <div className="min-h-screen bg-base-200">
            {/* Desktop parallax background — hidden on mobile */}
            <motion.div
                className="fixed inset-0 z-0 pointer-events-none hidden md:block"
                style={{
                    y: parallaxY,
                    backgroundImage: "url('/test1.jpg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center center',
                    backgroundRepeat: 'no-repeat',
                }}
                aria-hidden="true"
            />
            {/* Mobile static background — hidden on desktop */}
            <div
                className="fixed inset-0 z-0 pointer-events-none md:hidden"
                style={{
                    backgroundImage: "url('/test1.jpg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center center',
                    backgroundRepeat: 'no-repeat',
                }}
                aria-hidden="true"
            />

            <main className="relative">
                <section className="relative z-10 w-full bg-base-200">
                    <div className="container mx-auto px-4 py-16 md:py-24 lg:py-20">
                    <motion.div className="max-w-3xl mx-auto text-center">
                        <motion.h1
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6 capitalize"
                        >
                            Built to remove the guesswork from Australian property costs
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                            className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8"
                        >
                            PropWiz combines verified data, responsive design, and a guided journey so you can plan with confidence—no spreadsheets, no jargon, no paywall.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
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
                    </motion.div>
                    </div>
                </section>

                <section className="relative z-10 w-full py-16">
                    <div className="absolute inset-0 z-0 bg-black/25 backdrop-blur-md" aria-hidden="true" />
                    <div className="relative z-10 container mx-auto px-4 py-16">
                        <div className="grid gap-8 md:grid-cols-3">
                            {featureCards.map((feature, index) => {
                                return (
                                    <motion.div
                                        key={feature.title}
                                        initial={{ opacity: 0, y: 24 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
                                        className="rounded-2xl border border-white/80 bg-base-200 p-8 shadow-lg backdrop-blur-sm"
                                    >
                                        <div className="w-32 h-32 relative overflow-hidden rounded-full bg-primary/10 mb-5">
                                            <img
                                                src={feature.icon}
                                                alt={feature.title}
                                                className="absolute left-0 w-full object-cover"
                                                style={{
                                                    top: '0%',
                                                    height: '100%',
                                                    objectPosition: feature.objectPosition,
                                                }}
                                            />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                                        <p className="text-gray-600 leading-relaxed">{feature.description}</p>
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
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="border border-base-200 rounded-3xl shadow-md p-8 md:p-12"
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
                        <div className="md:flex md:items-start md:justify-between md:gap-12">
                            <div className="max-w-2xl">
                                <h2 className="text-3xl font-bold text-gray-900 mb-4">Why we built it</h2>
                                <p className="text-lg text-gray-600 leading-relaxed">
                                    Property transactions move fast and the true cost changes with every policy shift. We wanted a calculator that stays current, adapts to your unique situation, and highlights the decisions that impact cash flow the most.
                                </p>
                            </div>
                            <div className="mt-8 md:mt-0">
                                <div className="bg-base-200 text-primary rounded-2xl px-6 py-5 font-semibold text-lg">
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
                    </div>
                </section>

                <section className="relative z-10 w-full py-8">
                    <div className="absolute inset-0 z-0 bg-black/25 backdrop-blur-md" aria-hidden="true" />
                    <div className="relative z-10 container mx-auto px-4">
                        <div className="rounded-2xl border border-primary/40 bg-white/90 backdrop-blur-sm px-8 py-6">
                            <h3 className="text-primary font-semibold mb-2">Important disclaimer</h3>
                            <p className="text-gray-800 text-sm leading-relaxed">
                                PropWiz delivers indicative estimates based on current public information. We recommend confirming figures with your conveyancer, lender, or licensed financial advisor before committing to any property purchase.
                            </p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}