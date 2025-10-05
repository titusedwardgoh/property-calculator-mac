"use client";

import { useEffect } from 'react';
import UpfrontCosts from '../components/UpfrontCosts';
import OngoingCosts from '../components/OngoingCosts';
import PropertyDetails from '../components/PropertyDetails';
import BuyerDetails from '../components/BuyerDetails';
import LoanDetails from '../components/LoanDetails';
import SellerQuestions from '../components/SellerQuestions';
import { useFormStore } from '../stores/formStore';

export default function Page() {
    const formData = useFormStore();
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
    
    // Subscribe to the active step fields to ensure re-renders
    const propertyDetailsCurrentStep = formData.propertyDetailsCurrentStep;
    const propertyDetailsActiveStep = formData.propertyDetailsActiveStep;
    const buyerDetailsActiveStep = formData.buyerDetailsActiveStep;
    const loanDetailsActiveStep = formData.loanDetailsActiveStep;
    const sellerQuestionsActiveStep = formData.sellerQuestionsActiveStep;
    


    return (
        <div className="min-h-screen bg-base-200">
            <main className="container mx-auto px-4 py-4 lg:py-10 max-w-7xl">
                {/* Progress Bars - above questions on larger screens */}
                <div className="hidden md:block mb-6 md:max-w-[710px]">
                    <div className="space-y-4 ml-10">
                        {/* Overall Progress */}
                        <div>
                            <h4 className="text-sm lg:text-base font-medium text-gray-700 mb-2">Overall Progress</h4>
                            <div className="w-full bg-gray-100 h-1">
                                <div 
                                    className="bg-primary h-1 transition-all duration-300"
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
                                ></div>
                            </div>
                        </div>
                        
                        {/* Current Form Progress */}
                        <div>
                            <h4 className="text-sm lg:text-base font-medium text-gray-700 mb-2">Current Form Progress</h4>
                            <div className="w-full bg-gray-100 h-1">
                                <div 
                                    className="bg-primary h-1 transition-all duration-300"
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
                                            const totalSteps = 7;
                                            
                                            // Check if form is complete (on completion page)
                                            if (formData.sellerQuestionsComplete) {
                                                progress = 100;
                                            } else {
                                                progress = ((currentStep - 1) / totalSteps) * 100;
                                            }
                                        }
                                        
                                        return progress;
                                    })()}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row">
                    {/* Sidebar with costs - only on larger screens */}
                    <div className="order-1 md:order-2 md:w-2/5 md:flex-shrink-0 md:p-6 md:rounded-r-lg md:mt-10">
                        <UpfrontCosts />
                        <div className="mt-3 -mb-5">   
                        <OngoingCosts />
                        </div>
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
                            <div className="bg-base-100 rounded-lg overflow-hidden mt-15 p-8 text-center">
                                <h2 className="text-3xl md:text-5xl font-base text-gray-800 mb-4 leading-tight">
                                    All Forms Complete!
                                </h2>
                                <p className="md:text-2xl text-gray-500 leading-relaxed mb-8 max-w-lg mx-auto">
                                    Thank you for completing all the forms. Your information has been processed.
                                </p>
                            </div>
                        ) : null}
                    </div>
                </div>
            </main>
        </div>
    )
}