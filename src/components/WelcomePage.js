import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useFormStore } from '../stores/formStore';

export default function WelcomePage() {
    const formData = useFormStore();
    const updateFormData = useFormStore(state => state.updateFormData);
    const [isExiting, setIsExiting] = useState(false);

    const handleGetStarted = () => {
        setIsExiting(true);
        // Delay the actual navigation to allow exit animation to complete
        setTimeout(() => {
            updateFormData('showWelcomePage', false);
        }, 500); // Match the exit animation duration
    };

    // Handle Enter key press
    useEffect(() => {
        const handleKeyPress = (event) => {
            if (event.key === 'Enter') {
                handleGetStarted();
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, [handleGetStarted]);

    return (
        <div className="mt-40 ml-0 md:ml-10 bg-base-200">
            <main className="container mx-auto px-4 py-4 lg:py-10 max-w-7xl">
                <div className="flex flex-col md:flex-row">
                    {/* Main content area */}
                    <div className="order-2 md:order-1 md:w-3/5">
                        <AnimatePresence>
                            {!isExiting && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.5, ease: "easeInOut" }}
                                    className="flex flex-col mt-8 md:mt-0"
                                >
                            {/* Main heading */}
                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                                className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight text-center md:text-left md:w-5/6"
                            >
                                Let&apos;s figure out what you need to buy your place.
                            </motion.h1>

                            {/* Supporting statement */}
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                                className="lg:text-lg xl:text-xl lg:mb-8 text-gray-500 leading-relaxed mb-8 text-center md:text-left"
                            >
                                No scary spreadsheets, promise.
                            </motion.p>

                            {/* Button and hint container */}
                            <div className="flex flex-col md:flex-row md:items-center md:gap-4">
                                {/* Call to action button */}
                                <motion.button
                                    initial={{ opacity: 0, y: 0 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleGetStarted}
                                    className="bg-primary hover:bg-primary-focus text-secondary px-8 py-3 rounded-full font-medium text-base transition-all duration-200 hover:shadow-lg w-full md:w-auto mx-auto md:mx-0"
                                >
                                    Let&apos;s go
                                </motion.button>

                                {/* Keyboard shortcut hint */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
                                    className="mt-4 md:mt-0 text-sm text-gray-500 text-center md:text-left"
                                >
                                    press Enter
                                    <span className="ml-1 text-xs">⏎</span>
                                </motion.div>
                            </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
}
