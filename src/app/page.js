"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFormStore } from '../stores/formStore';

const testimonials = [
    {
        quote: "I had no idea how much stamp duty I'd actually owe until I used this. Saved me from a very stressful surprise at settlement.",
        author: "Sarah M.",
        role: "First Home Buyer, Melbourne"
    },
    {
        quote: "I've tried every property calculator out there. This is the only one that accounts for LMI, conveyancing, and ongoing costs in one place.",
        author: "James K.",
        role: "Property Investor, Sydney"
    },
    {
        quote: "As a first home buyer I had no idea where to start. PropWiz broke down every cost clearly — I finally felt in control of my budget.",
        author: "Priya S.",
        role: "First Home Buyer, Brisbane"
    },
    {
        quote: "I used three different calculators and got three different answers. PropWiz was the only one that matched what my conveyancer quoted me.",
        author: "David L.",
        role: "Property Investor, Perth"
    },
    {
        quote: "The stamp duty concession calculator alone saved me hours of research. Didn't realise I qualified until PropWiz flagged it.",
        author: "Emma T.",
        role: "First Home Buyer, Adelaide"
    },
    {
        quote: "Clean, fast, and actually accurate. I've recommended it to everyone in my buyers group.",
        author: "Marcus R.",
        role: "Property Investor, Gold Coast"
    }
];

export default function HomePage() {
    const router = useRouter();
    const updateFormData = useFormStore(state => state.updateFormData);

    const [activeIndex, setActiveIndex] = useState(0);
    const [visibleCount, setVisibleCount] = useState(1);
    const autoScrollRef = useRef(null);
    const isHovering = useRef(false);

    const { scrollY } = useScroll();
    const parallaxY = useTransform(scrollY, [0, 3000], [0, -200]);

    useEffect(() => {
        const update = () => {
            if (window.innerWidth >= 1024) setVisibleCount(3);
            else if (window.innerWidth >= 768) setVisibleCount(2);
            else setVisibleCount(1);
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    const totalSlides = testimonials.length;
    const maxIndex = totalSlides - visibleCount;

    const goNext = () => setActiveIndex(i => (i >= maxIndex ? 0 : i + 1));
    const goPrev = () => setActiveIndex(i => (i <= 0 ? maxIndex : i - 1));

    const startAutoScroll = () => {
        if (autoScrollRef.current) clearInterval(autoScrollRef.current);
        autoScrollRef.current = setInterval(() => {
            if (!isHovering.current) {
                setActiveIndex(i => (i >= maxIndex ? 0 : i + 1));
            }
        }, 3500);
    };

    useEffect(() => {
        startAutoScroll();
        return () => clearInterval(autoScrollRef.current);
    }, [visibleCount]);

    useEffect(() => {
        setActiveIndex(i => Math.min(i, maxIndex));
    }, [visibleCount]);

    const handleGetStarted = () => {
        // Navigate to calculator route (welcome page will show first)
        router.push('/calculator');
    };

    return (
        <div className="min-h-screen bg-base-200">
            {/* Desktop parallax background — hidden on mobile */}
            <motion.div
                className="fixed inset-0 z-0 pointer-events-none hidden md:block"
                style={{
                    y: parallaxY,
                    backgroundImage: "url('/test6.jpg')",
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
                    backgroundImage: "url('/test6.jpg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center center',
                    backgroundRepeat: 'no-repeat',
                }}
                aria-hidden="true"
            />

            {/* Hero Section */}
            <section className="relative z-10 w-full bg-base-200">
                <div className="container mx-auto px-4 py-16 md:py-24 lg:py-">
                    <div className="max-w-4xl mx-auto text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="text-4xl md:text-5xl lg:text-6xl font-bold text-secondary mb-6 leading-tight"
                    >
                        Know Exactly What Your Next Property Will Cost.
                        <span className="block text-primary mt-2">
                            Free, Instant, No Account Needed
                        </span>
                    </motion.h1>
                    
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                        className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
                    >
                        Stamp duty, LMI, conveyancing, loan repayments — we calculate every cost Australian buyers actually face. No surprises, no spreadsheets, no sign-up required.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                    >
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleGetStarted}
                            className="bg-primary cursor-pointer hover:bg-primary-focus text-secondary px-8 py-4 rounded-full font-medium text-lg transition-all duration-200 hover:shadow-lg w-full sm:w-auto"
                        >
                            Start Free Calculator
                        </motion.button>
                        
                        <p className="text-sm text-gray-500">
                            Takes less than 5 minutes
                        </p>
                    </motion.div>
                    </div>
                </div>
            </section>

            {/* Hook Section */}
            <section className="relative z-10">
                <div
                    className="absolute inset-0 z-0 bg-black/25 backdrop-blur-md"
                    aria-hidden="true"
                />
                <div className="relative z-10 container mx-auto px-4 py-16 lg:py-32">
                        <div className="grid gap-12 lg:gap-20 md:grid-cols-2 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -40 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                className="flex justify-center"
                            >
                                <div className="w-full mx-auto">
                                    <Image
                                        src="/test7.png"
                                        alt="Person contemplating home buying costs"
                                        width={1080}
                                        height={1080}
                                        priority
                                        unoptimized
                                        className="faded-image w-full h-auto object-contain xl:scale-90 xl:origin-center"
                                    />
                                </div>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, x: 40 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                                className="max-w-xl text-center md:text-left"
                            >
                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">
                                    Stop guessing. Start knowing.
                                </h2>
                                <p className="text-lg md:text-xl text-white/90 leading-relaxed mb-10">
                                    Most buyers underestimate what they&apos;ll actually spend — and overpay as a result. PropWiz gives you a complete picture of every fee, concession, and cost before you commit. One tool. Every number. Zero surprises.
                                </p>
                                <div className="flex justify-center md:justify-start">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleGetStarted}
                                        className="bg-primary hover:bg-primary-focus cursor-pointer text-white px-8 py-4 rounded-full font-medium text-lg transition-all duration-200 hover:shadow-lg inline-flex items-center gap-2"
                                    >
                                        Start Free Calculator
                                        <span aria-hidden="true">→</span>
                                    </motion.button>
                                </div>
                            </motion.div>
                        </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="relative z-10 px-4 py-16 overflow-hidden">
                <div
                    className="absolute inset-0 z-0"
                    style={{
                        background: `
                            radial-gradient(ellipse 98% 74% at 10% 24%, rgba(152, 233, 201, 0.26), transparent 74%),
                            radial-gradient(ellipse 92% 68% at 84% 28%, rgba(255, 186, 160, 0.24), transparent 74%),
                            radial-gradient(ellipse 88% 66% at 82% 82%, rgba(196, 245, 223, 0.20), transparent 76%),
                            radial-gradient(ellipse 94% 72% at 26% 76%, rgba(255, 205, 184, 0.18), transparent 77%),
                            linear-gradient(180deg, rgba(255,255,255,0.995) 0%, rgba(255,255,255,0.985) 56%, rgba(255,255,255,0.97) 100%)
                        `,
                    }}
                />
                <div className="max-w-6xl mx-auto relative z-10">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12"
                    >
                        How It Works
                    </motion.h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                number: 1,
                                title: "Enter Property Details",
                                description: "Provide basic information about your property including address, price, and property type."
                            },
                            {
                                number: 2,
                                title: "Answer Simple Questions",
                                description: "Tell us about your buyer situation, loan requirements, and residency status."
                            },
                            {
                                number: 3,
                                title: "Get Instant Results",
                                description: "Receive a comprehensive breakdown of all costs including stamp duty, LMI, ongoing fees, and more."
                            }
                        ].map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className="text-center"
                            >
                                <div className="w-55 h-55 mx-auto mb-4 relative overflow-hidden rounded-full bg-gray-100">
                                    <img
                                        src={
                                            step.number === 1
                                                ? '/test2.jpg'
                                                : step.number === 2
                                                  ? '/test4.jpg'
                                                  : '/test5.jpg'
                                        }
                                        alt={`Step ${step.number}`}
                                        className="absolute left-0 w-full object-cover"
                                        style={
                                            step.number === 1
                                                ? { top: '0%', height: '100%', objectPosition: '60% 32%' }
                                                : step.number === 2
                                                  ? { top: '0%', height: '100%', objectPosition: '60% 30%' }
                                                  : { top: '0%', height: '100%', objectPosition: '60% 50%' }
                                        }
                                    />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                                <p className="text-gray-600">{step.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Social Proof Section */}
            <section className="relative z-10 px-4 py-16">
                <div
                    className="absolute inset-0 z-0 bg-black/25 backdrop-blur-md"
                    aria-hidden="true"
                />
                <div className="relative z-10 max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-center mb-12"
                        >
                            <p className="text-3xl md:text-4xl font-bold text-white mb-4">
                                Built for Australian property buyers
                            </p>
                            <p className="text-lg text-white/90 leading-relaxed">
                                From first home buyers navigating stamp duty concessions to investors comparing loan structures — PropWiz handles the numbers so you don&apos;t have to.
                            </p>
                        </motion.div>

                        {/* Carousel row */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => { goPrev(); startAutoScroll(); }}
                                className="flex-shrink-0 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                                aria-label="Previous"
                            >
                                ←
                            </button>

                            <div className="flex-1 overflow-hidden">
                                <motion.div
                                    className="flex"
                                    animate={{ x: `calc(-${activeIndex * (100 / visibleCount)}% - ${activeIndex * (16 / visibleCount)}px)` }}
                                    transition={{ duration: 0.45, ease: "easeInOut" }}
                                    style={{ gap: '16px' }}
                                    onMouseEnter={() => { isHovering.current = true; }}
                                    onMouseLeave={() => { isHovering.current = false; }}
                                >
                                    {testimonials.map((testimonial, index) => (
                                        <div
                                            key={index}
                                            className="flex-shrink-0"
                                            style={{ width: `calc(${100 / visibleCount}% - ${16 * (visibleCount - 1) / visibleCount}px)` }}
                                        >
                                            <div className="bg-base-200 rounded-lg p-6 shadow-sm h-full flex flex-col">
                                                <p className="text-gray-700 italic mb-4">
                                                    &quot;{testimonial.quote}&quot;
                                                </p>
                                                <div className="mt-auto">
                                                    <p className="font-semibold text-gray-900">
                                                        {testimonial.author}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {testimonial.role}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            </div>

                            <button
                                onClick={() => { goNext(); startAutoScroll(); }}
                                className="flex-shrink-0 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                                aria-label="Next"
                            >
                                →
                            </button>
                        </div>

                        <div className="flex justify-center gap-2 mt-6">
                            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => { setActiveIndex(i); startAutoScroll(); }}
                                    className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                                        i === activeIndex ? 'bg-primary' : 'bg-white/30'
                                    }`}
                                    aria-label={`Go to slide ${i + 1}`}
                                />
                            ))}
                        </div>
                </div>
            </section>

            {/* Feature Preview Section */}
            <section className="relative z-10 w-full bg-gray-50">
                <div className="container mx-auto px-4 py-16">
                    <div className="max-w-6xl mx-auto">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12"
                    >
                        What You Get
                    </motion.h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Free Features */}
                        {[
                            {
                                title: "Comprehensive Cost Breakdown",
                                description: "See all upfront costs, ongoing expenses, and hidden fees in one place"
                            },
                            {
                                title: "Accurate Stamp Duty Calculations",
                                description: "State-specific calculations including all concessions and exemptions"
                            },
                            {
                                title: "Loan Cost Estimates",
                                description: "Calculate LMI, loan repayments, and interest costs"
                            },
                            {
                                title: "State-Specific Rules",
                                description: "Automatic calculations for your state's unique regulations and schemes"
                            },
                            {
                                title: "Instant Results",
                                description: "Get your complete breakdown in minutes, not hours"
                            },
                            {
                                title: "No Account Required",
                                description: "Start calculating immediately without any sign-up or commitment"
                            }
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.05 }}
                                className="rounded-xl bg-white p-6 cursor-pointer shadow-md border border-gray-200 border-l-4 border-l-primary hover:shadow-lg transition-shadow"
                            >
                                <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center md:text-left">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 text-center md:text-left">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Paid Features Teaser */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="hidden mt-12 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-8 border border-primary/20"
                    >
                        <h3 className="text-2xl font-bold text-gray-900 text-center mb-6">
                            Coming Soon
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                {
                                    title: "Save Your Calculations",
                                    description: "Create an account to save and compare multiple properties"
                                },
                                {
                                    title: "Export to PDF",
                                    description: "Download your results as a professional report"
                                },
                                {
                                    title: "Advanced Analytics",
                                    description: "Compare scenarios and get investment insights"
                                }
                            ].map((feature, index) => (
                                <div key={index} className="text-center opacity-75">
                                    <h4 className="font-semibold text-gray-900 mb-1">
                                        {feature.title}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                    </div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="relative z-10 w-full bg-white border-t border-gray-200/50">
                <div className="container mx-auto px-4 pt-20 pb-16 md:pt-24 md:pb-20">
                    <div className="max-w-3xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Ready to See the Full Picture?
                        </h2>
                        <p className="text-lg text-gray-600 mb-8">
                            Get a complete breakdown of every cost before you sign anything. Free, instant, and built for Australia.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleGetStarted}
                                className="bg-primary cursor-pointer hover:bg-primary-focus text-secondary px-8 py-4 rounded-full font-medium text-lg transition-all duration-200 hover:shadow-lg w-full sm:w-auto"
                            >
                                Start Free Calculator
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => router.push('/login')}
                                className="px-20 py-4 rounded-full font-medium text-lg border-2 border-primary text-primary cursor-pointer hover:bg-base-100/30 transition-all duration-200 w-full sm:w-auto"
                            >
                                Log In
                            </motion.button>
                        </div>
                    </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
}
