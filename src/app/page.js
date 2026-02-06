"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFormStore } from '../stores/formStore';

export default function HomePage() {
    const router = useRouter();
    const updateFormData = useFormStore(state => state.updateFormData);
    
    const handleGetStarted = () => {
        // Navigate to calculator route (welcome page will show first)
        router.push('/calculator');
    };

    return (
        <div className="min-h-screen bg-base-200">
            {/* Hero Section */}
            <section className="container mx-auto px-4 py-16 md:py-24 lg:py-32">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight"
                    >
                        The Simplest Property Cost Calculator.
                        <span className="block text-primary mt-2">
                            Completely Free, No Account Needed
                        </span>
                    </motion.h1>
                    
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                        className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
                    >
                        Calculate stamp duty, upfront costs, loan repayments, and all associated expenses for any Australian property. Get instant, accurate estimates in minutes.
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
            </section>

            {/* Hook Section */}
            <section className="bg-accent">
                <div className="container mx-auto px-4 py-16 lg:py-10">
                    <div className="grid gap-12 lg:gap-20 md:grid-cols-2 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="flex justify-center"
                        >
                            <div className="w-full max-w-lg">
                                <Image
                                    src="/hook.png"
                                    alt="Person contemplating home buying costs"
                                    width={820}
                                    height={932}
                                    priority
                                    className="w-full h-auto object-contain"
                                />
                            </div>
                        </motion.div>   

                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                            className="max-w-xl"
                        >
                            <p className="text-sm font-semibold tracking-wide uppercase text-primary mb-3">
                                
                            </p>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-5">
                                Tired of guessing how much you need for a home?
                            </h2>
                            <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-10">
                            You could be missing out on thousands of dollars back in your pocket. Don’t budget with multiple tools—get the full financial picture in one place. We calculate every fee and uncover every saving, so you know exactly what you’ll pay and exactly what you’ll keep. Accurate, free, and zero surprises.
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleGetStarted}
                                className="bg-primary hover:bg-primary-focus cursor-pointer text-secondary px-8 py-4 rounded-full font-medium text-lg transition-all duration-200 hover:shadow-lg inline-flex items-center gap-2"
                            >
                                Start Free Calculator
                                <span aria-hidden="true">→</span>
                            </motion.button>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="container mx-auto px-4 py-16 bg-base-100">
                <div className="max-w-6xl mx-auto">
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
                                <div className="w-50 h-50 mx-auto mb-4 flex items-center justify-center relative">
                                    <Image
                                        src={`/hero${step.number}.png`}
                                        alt={`Step ${step.number}`}
                                        width={1024}
                                        height={1024}
                                        className="object-contain"
                                        unoptimized
                                    />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    {step.title}
                                </h3>
                                <p className="text-gray-600">
                                    {step.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Social Proof Section */}
            <section className="px-4 py-16 bg-secondary">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <p className="text-3xl md:text-4xl font-bold text-gray-300 mb-4">
                            Used by thousands of home buyers
                        </p>
                        <p className="text-lg text-primary mb-12">
                            Trusted by first-time buyers, investors, and real estate professionals across Australia
                        </p>
                    </motion.div>

                    {/* Testimonials */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                            {
                                quote: "Finally, a calculator that actually shows me all the hidden costs! This saved me from a costly surprise.",
                                author: "Sarah M.",
                                role: "First Home Buyer"
                            },
                            {
                                quote: "The most comprehensive property calculator I've found. It covers things I didn't even know to consider.",
                                author: "James K.",
                                role: "Property Investor"
                            }
                        ].map((testimonial, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className="bg-base-100 rounded-lg p-6 shadow-sm"
                            >
                                <p className="text-gray-700 italic mb-4">
                                    &quot;{testimonial.quote}&quot;
                                </p>
                                <p className="font-semibold text-gray-900">
                                    {testimonial.author}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {testimonial.role}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Feature Preview Section */}
            <section className="container mx-auto px-4 py-16 bg-base-100">
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
                                className="bg-base-200 rounded-lg p-6 border border-gray-200 hover:border-primary transition-colors"
                            >
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600">
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
            </section>

            {/* Final CTA Section */}
            <section className="px-4 py-16 bg-accent">
                <div className="max-w-3xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Ready to Calculate Your Property Costs?
                        </h2>
                        <p className="text-lg text-gray-600 mb-8">
                            Join thousands of Australians who use our calculator to make informed property decisions
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
            </section>
        </div>
    );
}