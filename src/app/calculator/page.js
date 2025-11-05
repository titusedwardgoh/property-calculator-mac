"use client";

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UpfrontCosts from '../../components/UpfrontCosts';
import OngoingCosts from '../../components/OngoingCosts';
import Summary from '../../components/Summary';
import PropertyDetails from '../../components/PropertyDetails';
import BuyerDetails from '../../components/BuyerDetails';
import LoanDetails from '../../components/LoanDetails';
import SellerQuestions from '../../components/SellerQuestions';
import WelcomePage from '../../components/WelcomePage';
import { useFormStore } from '../../stores/formStore';
import { useSupabaseSync } from '../../hooks/useSupabaseSync';

export default function CalculatorPage() {
    const formData = useFormStore();
    const updateFormData = formData.updateFormData;
    const propertyId = formData.propertyId;
    const setPropertyId = formData.setPropertyId;
    
    // Initialize Supabase sync
    useSupabaseSync(formData, updateFormData, propertyId, setPropertyId);
    
    const showWelcomePage = formData.showWelcomePage;
    const propertyDetailsComplete = formData.propertyDetailsComplete;
    const buyerDetailsComplete = formData.buyerDetailsComplete;
    const needsLoan = formData.needsLoan;
    const showLoanDetails = formData.showLoanDetails;
    const loanDetailsComplete = formData.loanDetailsComplete;
    const showSellerQuestions = formData.showSellerQuestions;
    const sellerQuestionsComplete = formData.sellerQuestionsComplete;
    const allFormsComplete = formData.allFormsComplete;
    const selectedState = formData.selectedState;
    const isACT = formData.isACT;
    const propertyType = formData.propertyType;
    
    // Subscribe to the active step fields to ensure re-renders
    const propertyDetailsCurrentStep = formData.propertyDetailsCurrentStep;
    const propertyDetailsActiveStep = formData.propertyDetailsActiveStep;
    const buyerDetailsActiveStep = formData.buyerDetailsActiveStep;
    const loanDetailsActiveStep = formData.loanDetailsActiveStep;
    const sellerQuestionsActiveStep = formData.sellerQuestionsActiveStep;
    


    return (
        <div className="min-h-screen bg-base-200">
            {showWelcomePage ? (
                <WelcomePage />
            ) : (
                <main className="container mx-auto px-4 py-4 lg:py-10 max-w-7xl">
                {/* Progress Bars - above questions on larger screens */}
                <div className="hidden md:block mb-6 md:w-[57%]">
                    <div className="space-y-4 ml-10">
                        {/* Overall Progress */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <h4 className="text-sm lg:text-base font-medium text-gray-700 mb-2">Overall Progress</h4>
                            <div className="w-full bg-gray-100 h-1">
                                <motion.div 
                                    initial={{ opacity: 0, scaleY: 0 }}
                                    animate={{ opacity: 1, scaleY: 1 }}
                                    transition={{ duration: 0.5, delay: 0.4 }}
                                    className="bg-primary h-1 transition-all duration-300 origin-top"
                                    style={{ width: `${(() => {
                                        if (!propertyDetailsComplete) return 0;
                                        if (!buyerDetailsComplete) return 25;
                                        if (buyerDetailsComplete && needsLoan === 'yes' && !loanDetailsComplete) return 50;
                                        if (buyerDetailsComplete && needsLoan === 'yes' && loanDetailsComplete && !showSellerQuestions) return 75;
                                        if (buyerDetailsComplete && showSellerQuestions && !sellerQuestionsComplete) return 75;
                                        if (buyerDetailsComplete && sellerQuestionsComplete) return 100;
                                        if (buyerDetailsComplete && needsLoan !== 'yes') return 75;
                                        return 0;
                                    })()}%` }}
                                ></motion.div>
                            </div>
                        </motion.div>
                        
                        {/* Current Form Progress */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <h4 className="text-sm lg:text-base font-medium text-gray-700 mb-2">Current Form Progress</h4>
                            <div className="w-full bg-gray-100 h-1">
                                <motion.div 
                                    initial={{ opacity: 0, scaleY: 0 }}
                                    animate={{ opacity: 1, scaleY: 1 }}
                                    transition={{ duration: 0.5, delay: 0.5 }}
                                    className="bg-primary h-1 transition-all duration-300 origin-top"
                                    style={{ width: `${(() => {
                                        let progress = 0;
                                        
                                        if (!propertyDetailsComplete) {
                                            // PropertyDetails progress - calculate based on display step and total steps
                                            const internalStep = propertyDetailsActiveStep || 1;
                                            let displayStep = internalStep;
                                            
                                            // For non-WA states, adjust step numbers to match what user sees
                                            if (selectedState !== 'WA' && internalStep >= 4) {
                                                displayStep = internalStep - 1; // Show 3, 4, 5 instead of 4, 5, 6
                                            }
                                            
                                            const totalSteps = selectedState === 'WA' ? 6 : 5;
                                            
                                            // Check if we're actually on the completion page (step 6 and form complete)
                                            if (internalStep === 6 && formData.propertyDetailsFormComplete) {
                                                progress = 100;
                                            } else {
                                                progress = ((displayStep - 1) / totalSteps) * 100;
                                            }
                                            
                                        } else if (!buyerDetailsComplete || (buyerDetailsComplete && !formData.showLoanDetails && !formData.showSellerQuestions)) {
                                            // BuyerDetails progress - calculate based on current step and total steps
                                            const currentStep = buyerDetailsActiveStep || 1;
                                            const totalSteps = isACT ? 10 : 7;
                                            
                                            // Check if form is complete (on completion page)
                                            if (formData.buyerDetailsComplete && !formData.showLoanDetails && !formData.showSellerQuestions) {
                                                progress = 100;
                                            } else {
                                                progress = ((currentStep - 1) / totalSteps) * 100;
                                            }
                                        } else if (needsLoan === 'yes' && showLoanDetails && !loanDetailsComplete) {
                                            // LoanDetails progress - calculate based on current step and total steps
                                            const currentStep = loanDetailsActiveStep || 1;
                                            const totalSteps = 7;
                                            
                                            progress = ((currentStep - 1) / totalSteps) * 100;
                                        } else if (needsLoan === 'yes' && loanDetailsComplete && !showSellerQuestions) {
                                            // LoanDetails complete - show 100%
                                            progress = 100;
                                        } else if (showSellerQuestions && !sellerQuestionsComplete) {
                                            // SellerQuestions progress - calculate based on current step and total steps
                                            const currentStep = sellerQuestionsActiveStep || 1;
                                            
                                            // Calculate actual steps shown based on property type (same logic as SellerQuestions)
                                            const shouldShowConstructionQuestions = propertyType === 'off-the-plan' || propertyType === 'house-and-land';
                                            const isOffThePlanNonVIC = propertyType === 'off-the-plan' && selectedState !== 'VIC';
                                            
                                            let totalSteps;
                                            if (shouldShowConstructionQuestions) {
                                                if (isOffThePlanNonVIC) {
                                                    // Off-the-plan (non-VIC): Skip dutiable value question (subtract 1)
                                                    totalSteps = 7;
                                                } else {
                                                    // VIC off-the-plan or house-and-land: All questions shown
                                                    totalSteps = 8;
                                                }
                                            } else {
                                                // Construction questions are skipped (subtract 2)
                                                totalSteps = 6;
                                            }
                                            
                                            // Map internal currentStep to actual step position within visible steps
                                            let actualStepPosition;
                                            if (shouldShowConstructionQuestions) {
                                                if (isOffThePlanNonVIC) {
                                                    // Off-the-plan (non-VIC): Skip dutiable value question (case 4)
                                                    if (currentStep <= 3) {
                                                        actualStepPosition = currentStep;
                                                    } else if (currentStep >= 5) {
                                                        actualStepPosition = currentStep - 1; // Adjust for skipped case 4
                                                    } else {
                                                        actualStepPosition = currentStep; // Case 4 shouldn't happen, but fallback
                                                    }
                                                } else {
                                                    // VIC off-the-plan or house-and-land: All questions shown
                                                    actualStepPosition = currentStep;
                                                }
                                            } else {
                                                // Construction questions are skipped (cases 3-4)
                                                if (currentStep <= 2) {
                                                    actualStepPosition = currentStep;
                                                } else if (currentStep >= 5) {
                                                    actualStepPosition = currentStep - 2; // Adjust for skipped cases 3-4
                                                } else {
                                                    actualStepPosition = currentStep; // Cases 3-4 shouldn't happen, but fallback
                                                }
                                            }
                                            
                                            // Check if form is complete (on completion page)
                                            if (formData.sellerQuestionsComplete) {
                                                progress = 100;
                                            } else {
                                                progress = ((actualStepPosition - 1) / totalSteps) * 100;
                                            }
                                        }
                                        
                                        return progress;
                                    })()}%` }}
                                ></motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row">
                    {/* Sidebar with costs - only on larger screens */}
                    <div className="order-1 md:order-2 md:w-2/5 md:flex-shrink-0 md:p-6 md:rounded-r-lg md:mt-10">
                        {/* Summary Component - appears when summary should be shown */}
                        <AnimatePresence>
                            {formData.showSummary && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.5 }}
                                    className="mb-4"
                                >
                                    <Summary />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        
                        {/* Upfront and Ongoing Costs with layout animation */}
                        <motion.div
                            layout
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <AnimatePresence mode="wait">
                                <UpfrontCosts />
                            </AnimatePresence>
                            <div className="mt-3 -mb-5">
                                <AnimatePresence mode="wait">
                                    <OngoingCosts />
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                    
                    {/* Main content area */}
                    <div className="order-2 md:order-1 md:w-3/5">
                        {!propertyDetailsComplete ? (
                            <PropertyDetails />
                        ) : !buyerDetailsComplete ? (
                            <BuyerDetails />
                        ) : buyerDetailsComplete && showLoanDetails && !loanDetailsComplete ? (
                            <LoanDetails />
                        ) : buyerDetailsComplete && loanDetailsComplete && !showSellerQuestions ? (
                            <LoanDetails />
                        ) : buyerDetailsComplete && showSellerQuestions && !sellerQuestionsComplete ? (
                            <SellerQuestions />
                        ) : buyerDetailsComplete && sellerQuestionsComplete && !allFormsComplete ? (
                            <SellerQuestions />
                        ) : buyerDetailsComplete && !showLoanDetails && !showSellerQuestions && !formData.buyerDetailsCurrentStep ? (
                            <BuyerDetails /> // This ensures BuyerDetails completion page remains visible
                        ) : formData.buyerDetailsCurrentStep ? (
                            <BuyerDetails /> // Show BuyerDetails when going back to a specific step
                        ) : allFormsComplete ? (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key="all-forms-complete"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.5, ease: "easeInOut" }}
                                    className="bg-base-100 rounded-lg overflow-hidden mt-15 p-8 text-center"
                                >
                                    <motion.h2 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                                        className="text-3xl md:text-5xl font-base text-gray-800 mb-4 leading-tight"
                                    >
                                        All Forms Complete!
                                    </motion.h2>
                                    <motion.p 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                                        className="md:text-2xl text-gray-500 leading-relaxed mb-8 max-w-lg mx-auto"
                                    >
                                        Thank you for completing all the forms. Your information has been processed.
                                    </motion.p>
                                    
                                    {/* Navigation - Fixed bottom on mobile, normal position on desktop */}
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
                                        className="fixed bottom-0 left-0 right-0 md:relative md:bottom-auto md:left-auto md:right-auto bg-base-100 md:bg-transparent pt-0 pr-4 pb-4 pl-4 md:p-0 md:mt-8 md:px-6 md:pb-8 lg:mt-15 xl:mt-30"
                                    >
                                        <div className="flex flex-col sm:flex-row gap-3 justify-center mx-auto mt-4">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    formData.updateFormData('allFormsComplete', false);
                                                    formData.updateFormData('showSummary', false);
                                                    formData.updateFormData('sellerQuestionsComplete', false);
                                                    // Set the active step to the last step of SellerQuestions
                                                    formData.updateFormData('sellerQuestionsActiveStep', 8);
                                                }}
                                                className="bg-primary px-6 py-3 rounded-full border border-primary font-medium hover:bg-primary hover:border-gray-700 hover:shadow-sm flex-shrink-0 cursor-pointer"
                                            >
                                                ← Back to Seller Questions
                                            </motion.button>
                                            
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    // Reset the entire form
                                                    formData.resetForm();
                                                }}
                                                className="bg-gray-500 hover:bg-gray-600 px-6 py-3 rounded-full border border-gray-500 hover:border-gray-600 font-medium text-white hover:shadow-sm flex-shrink-0 cursor-pointer"
                                            >
                                                Start Over
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            </AnimatePresence>
                        ) : null}
                    </div>
                </div>
            </main>
            )}
        </div>
    )
}
