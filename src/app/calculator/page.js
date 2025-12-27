"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import UpfrontCosts from '../../components/UpfrontCosts';
import OngoingCosts from '../../components/OngoingCosts';
import Summary from '../../components/Summary';
import PropertyDetails from '../../components/PropertyDetails';
import BuyerDetails from '../../components/BuyerDetails';
import LoanDetails from '../../components/LoanDetails';
import SellerQuestions from '../../components/SellerQuestions';
import WelcomePage from '../../components/WelcomePage';
import SurveyHeaderOverlay from '../../components/SurveyHeaderOverlay';
import NavigationWarning from '../../components/NavigationWarning';
import EndOfSurveyPrompt from '../../components/EndOfSurveyPrompt';
import { useFormStore } from '../../stores/formStore';
import { useSupabaseSync } from '../../hooks/useSupabaseSync';
import { useAuth } from '../../hooks/useAuth';

function CalculatorPageContent() {
    const formData = useFormStore();
    const updateFormData = formData.updateFormData;
    const propertyId = formData.propertyId;
    const setPropertyId = formData.setPropertyId;
    const setIsResumingSurvey = formData.setIsResumingSurvey;
    const { user, loading: authLoading } = useAuth();
    const searchParams = useSearchParams();
    const [isLoadingResume, setIsLoadingResume] = useState(false);
    const [isReturningToDashboard, setIsReturningToDashboard] = useState(false);
    const hasResumedRef = useRef(false);
    
    // Initialize Supabase sync
    // Auto-save to database is ALWAYS enabled (for both logged-in and anonymous users)
    // The "save" prompts are about linking records to user's dashboard (user_id)
    const { saveToSupabase, hasUnsavedChanges, loadFromSupabase } = useSupabaseSync(
        formData, 
        updateFormData, 
        propertyId, 
        setPropertyId,
        { 
            autoSave: true, // Enable auto-save functionality
            enableAutoSave: true // Always auto-save to database (logged in or not)
        }
    );
    
    // Handle resume functionality
    useEffect(() => {
        const resumePropertyId = sessionStorage.getItem('resumePropertyId');
        const shouldResume = searchParams.get('resume') === 'true' && resumePropertyId;
        
        // Wait for auth to finish loading before attempting resume
        if (authLoading) {
            return;
        }
        
        // Prevent multiple resume attempts
        if (shouldResume && !isLoadingResume && !hasResumedRef.current) {
            hasResumedRef.current = true;
            setIsLoadingResume(true);
            setIsResumingSurvey(true);
            
            // Immediately hide welcome page while loading
            updateFormData('showWelcomePage', false);
            
            // Load the property data
            fetch('/api/supabase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'loadPropertyById',
                    propertyId: resumePropertyId,
                    userId: user?.id, // Will be undefined if not logged in, server will get from session
                }),
            })
            .then(res => res.json())
            .then(result => {
                console.log('📥 Resume API response:', result);
                if (result.success && result.data) {
                    const record = result.data;
                    console.log('📋 Loaded record data:', {
                        id: record.id,
                        is_active: record.is_active,
                        parent_id: record.parent_id,
                        user_saved: record.user_saved,
                        hasPropertyDetails: !!record.property_details,
                        hasBuyerDetails: !!record.buyer_details,
                        propertyPrice: record.property_price,
                        propertyAddress: record.property_address,
                        message: result.message
                    });
                    
                    setPropertyId(record.id);
                    
                    // First, set the top-level fields
                    if (record.property_price !== null && record.property_price !== undefined) {
                        updateFormData('propertyPrice', record.property_price);
                    }
                    if (record.property_address) {
                        updateFormData('propertyAddress', record.property_address);
                    }
                    if (record.selected_state) {
                        updateFormData('selectedState', record.selected_state);
                    }
                    
                    // Then merge all sections back into form data
                    // Handle nested objects properly
                    const sectionsToMerge = [
                        { data: record.property_details, name: 'property_details' },
                        { data: record.buyer_details, name: 'buyer_details' },
                        { data: record.loan_details, name: 'loan_details' },
                        { data: record.seller_questions, name: 'seller_questions' },
                        { data: record.calculated_values, name: 'calculated_values' }
                    ];
                    
                    sectionsToMerge.forEach(({ data, name }) => {
                        if (data && typeof data === 'object') {
                            Object.entries(data).forEach(([key, value]) => {
                                if (value !== null && value !== undefined) {
                                    updateFormData(key, value);
                                }
                            });
                        }
                    });
                    
                    // Ensure welcome page is hidden
                    updateFormData('showWelcomePage', false);
                    
                    console.log('✅ Form data updated from resume');
                    
                    // Clear resume flag from sessionStorage
                    sessionStorage.removeItem('resumePropertyId');
                } else {
                    console.error('❌ Resume failed - no data in response:', result);
                    // If resume fails, show welcome page
                    updateFormData('showWelcomePage', true);
                    hasResumedRef.current = false; // Allow retry
                }
            })
            .catch(error => {
                console.error('Error loading survey to resume:', error);
                // If error, show welcome page
                updateFormData('showWelcomePage', true);
                hasResumedRef.current = false; // Allow retry
            })
            .finally(() => {
                setIsLoadingResume(false);
            });
        } else if (!shouldResume) {
            // Reset ref when not resuming (allows resume again if user navigates back)
            hasResumedRef.current = false;
            
            // When NOT resuming, only show welcome page if there's no form data
            // Don't reset if we're just navigating (might have unsaved data)
            // Only run this check once on initial mount when not resuming
            const hasFormData = formData.propertyPrice || 
                               formData.propertyAddress || 
                               formData.selectedState || 
                               formData.buyerType;
        
            // Only show welcome page if there's no form data and we haven't already set it
            // This prevents showing welcome page when user has unsaved changes or is resuming
            if (!hasFormData) {
                // Ensure address is cleared when starting fresh survey
                if (formData.propertyAddress) {
                    updateFormData('propertyAddress', '');
                }
                updateFormData('showWelcomePage', true);
            }
        }
    }, [searchParams, authLoading, user?.id, isLoadingResume, setIsResumingSurvey, updateFormData]); // Removed formData to prevent infinite loop
    
    // Safety check: Stop resuming if all forms are complete
    useEffect(() => {
      if (formData.isResumingSurvey && formData.allFormsComplete) {
        setTimeout(() => {
          formData.setIsResumingSurvey(false);
        }, 200);
      }
    }, [formData.isResumingSurvey, formData.allFormsComplete]);
    
    // Define handleLinkToAccount before useEffect that uses it
    const handleLinkToAccount = useCallback(async (userId) => {
        // When anonymous user logs in/creates account, link existing record to their account
        const linkPropertyId = typeof window !== 'undefined' ? sessionStorage.getItem('linkPropertyIdAfterAuth') : null;
        const targetPropertyId = linkPropertyId || propertyId;
        
        if (targetPropertyId) {
            try {
                const response = await fetch('/api/supabase', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'linkPropertyToUser',
                        propertyId: targetPropertyId
                    })
                });

                const result = await response.json();

                if (!response.ok) {
                    console.error('Error linking property to account:', result.error);
                    return;
                }

                console.log('✅ Property linked to account:', result.message);
                
                // If we linked a property that wasn't the current one, reload the page to get the updated data
                if (linkPropertyId && linkPropertyId !== propertyId) {
                    window.location.reload();
                }
            } catch (error) {
                console.error('❌ Error linking property to account:', error);
            }
        }
    }, [propertyId]);
    
    // Check if user just logged in and needs to link a property
    useEffect(() => {
      if (typeof window === 'undefined') return;
      
      const linkPropertyId = sessionStorage.getItem('linkPropertyIdAfterAuth');
      if (linkPropertyId && user) {
        // User logged in and there's a property to link - link it via API
        handleLinkToAccount(user.id);
        sessionStorage.removeItem('linkPropertyIdAfterAuth');
      }
    }, [user, handleLinkToAccount]);
    
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
    


    const handleSave = async (userSaved = false) => {
        // Save will automatically link to user's account if logged in
        // (user_id is already set in saveToSupabase via getSupabaseUserId)
        // userSaved = true when user explicitly clicks "SAVE" in navigation warning
        // Note: saveToSupabase from useSupabaseSync uses formData from the hook's closure
        console.log('💾 handleSave called with userSaved:', userSaved);
        await saveToSupabase(userSaved);
    };

    const handleDiscard = () => {
        // Clear form data when discarding
        formData.resetForm();
    };

    const handleEndOfSurveyDismiss = () => {
        // User chose not to save - data is still retained in backend
        // Just close the prompt
    };

    return (
        <div className="min-h-screen bg-base-200">
            {/* Navigation warning for unsaved changes */}
            {/* Only show if logged in AND property address is set */}
            <NavigationWarning
                hasUnsavedChanges={hasUnsavedChanges()}
                allFormsComplete={formData.allFormsComplete}
                onSave={() => handleSave(true)} // Set user_saved = true when user clicks SAVE
                onDiscard={handleDiscard}
                onLinkToAccount={handleLinkToAccount}
                propertyAddress={formData.propertyAddress}
                propertyId={propertyId}
                onReturningToDashboard={() => {
                    setIsReturningToDashboard(true);
                    setTimeout(() => {
                        setIsReturningToDashboard(false);
                    }, 2000);
                }}
            />
            
            {/* End of survey save prompt - now handled by NavigationWarning when user tries to navigate */}
            
            {/* Simplified header overlay - always shown on calculator route */}
            <SurveyHeaderOverlay />
            
            {/* Loading overlay during resume auto-advance */}
            {formData.isResumingSurvey && (
                <div className="fixed inset-0 bg-base-100 backdrop-blur-lg z-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading your survey...</p>
                    </div>
                </div>
            )}
            
            {/* Loading overlay when returning to dashboard */}
            {isReturningToDashboard && (
                <div className="fixed inset-0 bg-base-100 backdrop-blur-lg z-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-600">Returning to dashboard...</p>
                    </div>
                </div>
            )}
            
            {showWelcomePage && !isLoadingResume ? (
                <WelcomePage />
            ) : isLoadingResume ? (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading your survey...</p>
                    </div>
                </div>
            ) : (
                <main className="container mx-auto px-4 py-4 lg:py-10 max-w-7xl">
                {/* Progress Bars - above questions on larger screens */}
                <div className="hidden md:block mb-0 md:w-[57%]">
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
                                        <div className="flex flex-col gap-3 justify-center mx-auto mt-4">
                                            <div className="flex flex-col sm:flex-row gap-3 justify-center sm:inline-flex">
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
                                                    Start New Survey
                                                </motion.button>
                                            </div>
                                            
                                            <div className="flex flex-col sm:flex-row gap-3 justify-center sm:inline-flex">
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => {
                                                        // Trigger navigation warning by attempting to navigate
                                                        const targetUrl = user ? '/dashboard' : '/';
                                                        if (typeof window !== 'undefined' && window.__navigationWarning) {
                                                            window.__navigationWarning.checkNavigation(targetUrl);
                                                        }
                                                    }}
                                                    className="bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-full font-medium hover:shadow-sm flex-shrink-0 cursor-pointer w-full md:max-w-sm sm:w-full"
                                                >
                                                    Exit Survey
                                                </motion.button>
                                            </div>
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

export default function CalculatorPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-base-200 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading calculator...</p>
                </div>
            </div>
        }>
            <CalculatorPageContent />
        </Suspense>
    );
}
