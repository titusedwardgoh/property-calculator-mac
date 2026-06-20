import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useFormStore } from '../stores/formStore';
import { createNewSession } from '../lib/sessionManager';
import { useWizardStep } from '../hooks/useWizardStep';
import Image from 'next/image';
import SurveyLoadingOverlay, { SURVEY_LOADING_TEXT_CLASS } from '@/components/SurveyLoadingOverlay';

const LOADING_QUESTIONS_MS = 1500;
const HERE_WE_GO_MS = 1500;

export default function WelcomePage() {
    const resetForm = useFormStore(state => state.resetForm);
    const { navigateToStep, WIZARD_STEPS } = useWizardStep();
    const [isExiting, setIsExiting] = useState(false);
    const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
    const [overlayPhase, setOverlayPhase] = useState('loading'); // 'loading' | 'here'
    const transitionTimeoutsRef = useRef([]);

    const clearTransitionTimeouts = useCallback(() => {
        transitionTimeoutsRef.current.forEach(clearTimeout);
        transitionTimeoutsRef.current = [];
    }, []);

    const handleGetStarted = useCallback(() => {
        if (showLoadingOverlay) return;

        setShowLoadingOverlay(true);
        setOverlayPhase('loading');
        setIsExiting(true);
        resetForm();
        createNewSession();

        clearTransitionTimeouts();

        transitionTimeoutsRef.current.push(
            setTimeout(() => {
                setOverlayPhase('here');
            }, LOADING_QUESTIONS_MS)
        );

        transitionTimeoutsRef.current.push(
            setTimeout(() => {
                navigateToStep(WIZARD_STEPS.PROPERTY, { sub: 1 });
            }, LOADING_QUESTIONS_MS + HERE_WE_GO_MS)
        );
    }, [
        showLoadingOverlay,
        resetForm,
        navigateToStep,
        WIZARD_STEPS,
        clearTransitionTimeouts,
    ]);

    useEffect(() => () => clearTransitionTimeouts(), [clearTransitionTimeouts]);

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
        <div className="ml-0 md:ml-10 bg-transparent">
            {showLoadingOverlay && (
                <SurveyLoadingOverlay>
                    <div className="flex min-h-[3rem] flex-col items-center justify-center">
                        <AnimatePresence mode="wait">
                            {overlayPhase === 'loading' ? (
                                <motion.p
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className={SURVEY_LOADING_TEXT_CLASS}
                                >
                                    Loading questions
                                </motion.p>
                            ) : (
                                <motion.p
                                    key="here"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className={SURVEY_LOADING_TEXT_CLASS}
                                >
                                    Here we go!
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>
                </SurveyLoadingOverlay>
            )}
            <main className="container mx-auto max-w-7xl px-3 sm:px-4 max-md:pt-30 md:pt-35 pb-4 lg:pb-10">
                {/* Spacer — matches survey progress bars height so heading aligns with step questions */}
                <div className="hidden md:block mb-0 md:w-[57%]" aria-hidden="true">
                    <div className="space-y-4 ml-10">
                        <div>
                            <h4 className="text-sm lg:text-base font-medium text-gray-700 mb-2 invisible">
                                Overall Progress
                            </h4>
                            <div className="w-full h-1" />
                        </div>
                        <div>
                            <h4 className="text-sm lg:text-base font-medium text-gray-700 mb-2 invisible">
                                Current Form Progress
                            </h4>
                            <div className="w-full h-1" />
                        </div>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row">
                    {/* Main content area — mt-15 matches PropertyDetails wrapper */}
                    <div className="order-2 md:order-1 md:w-3/5 mt-15">
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
                                    className="bg-primary cursor-pointer hover:bg-primary-focus text-secondary px-8 py-3 rounded-full font-medium text-base transition-all duration-200 hover:shadow-lg w-full md:w-auto mx-auto md:mx-0"
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
                    
                    {/* Image section - hidden on mobile, shown on md+ */}
                    <div className="order-1 md:order-2 md:w-1/2 md:-mt-10 md:-ml-12 flex items-center justify-center mb-8 md:mb-0 hidden md:flex">
                        <AnimatePresence>
                            {!isExiting && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.5, ease: "easeInOut" }}
                                    className="relative w-full max-w-md"
                                >
                                    <Image
                                        src="/welcome.png"
                                        alt="Property planning illustration"
                                        width={500}
                                        height={500}
                                        priority
                                        className="object-contain "
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
}
