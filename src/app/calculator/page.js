"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import UpfrontCosts from '../../components/UpfrontCosts';
import OngoingCosts from '../../components/OngoingCosts';
import Summary from '../../components/Summary';
import PropertyDetails from '../../components/PropertyDetails';
import BuyerDetails from '../../components/BuyerDetails';
import LoanDetails from '../../components/LoanDetails';
import SellerQuestions from '../../components/SellerQuestions';
import WelcomePage from '../../components/WelcomePage';
import ReviewSummary from '../../components/ReviewSummary';
import AdditionalQuestions from '../../components/AdditionalQuestions';
import SurveyHeaderOverlay from '../../components/SurveyHeaderOverlay';
import SurveyLoadingScreen, { SurveyLoadingFallback } from '../../components/SurveyLoadingOverlay';
import NavigationWarning from '../../components/NavigationWarning';
import EndOfSurveyPrompt from '../../components/EndOfSurveyPrompt';
import EmailModal from '../../components/EmailModal';
import ResultsSummary from '../../components/ResultsSummary';
import { useFormStore } from '../../stores/formStore';
import { getMissingFields, calculateGlobalProgress } from '../../lib/progressCalculation';
import { useSupabaseSync } from '../../hooks/useSupabaseSync';
import { useAuth } from '../../hooks/useAuth';
import { useStateSelector } from '../../states/useStateSelector.js';
import {
    clearPendingSurveyLink,
    getPendingSurveyLinkPropertyId,
    hasPendingSurveyLink,
} from '../../lib/pendingSurveyLink';
import { resetSessionAndForm } from '../../lib/sessionManager';
import { buildResultsSummary } from '../../lib/resultsSummary/buildResultsSummary';

function CalculatorPageContent() {
    const router = useRouter();
    const formData = useFormStore();
    const updateFormData = formData.updateFormData;
    const hydrateFromPropertyRecord = formData.hydrateFromPropertyRecord;
    const propertyId = formData.propertyId;
    const setPropertyId = formData.setPropertyId;
    const setIsResumingSurvey = formData.setIsResumingSurvey;
    const { user, loading: authLoading } = useAuth();
    const searchParams = useSearchParams();
    const [isLoadingResume, setIsLoadingResume] = useState(false);
    const [isReturningToDashboard, setIsReturningToDashboard] = useState(false);
    const [showReviewOverlay, setShowReviewOverlay] = useState(false);
    const [isEmailingPDF, setIsEmailingPDF] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showEmailSuccess, setShowEmailSuccess] = useState(false);
    const [emailSuccessData, setEmailSuccessData] = useState(null);
    const hasResumedRef = useRef(false);
    const initialWelcomeCheckedRef = useRef(false);
    const freshStartHandledRef = useRef(false);

    // Get state-specific functions for calculations
    const { stateFunctions } = useStateSelector(formData.selectedState || 'NSW');

    // Initialize Supabase sync
    // Auto-save to database is ALWAYS enabled (for both logged-in and anonymous users)
    // The "save" prompts are about linking records to user's dashboard (user_id)
    const { saveToSupabase, hasUnsavedChanges, loadFromSupabase, setOriginalLoadedState } = useSupabaseSync(
        formData,
        updateFormData,
        propertyId,
        setPropertyId,
        {
            autoSave: true, // Enable auto-save functionality
            enableAutoSave: true, // Always auto-save to database (logged in or not)
            isLoadingResume,
            authUserId: user?.id ?? null,
            authLoading,
        }
    );

    // Dashboard "Start New Survey" — reset on mount even if onClick ran before navigation
    useEffect(() => {
        if (freshStartHandledRef.current) return;
        if (searchParams.get('fresh') !== 'true') return;

        freshStartHandledRef.current = true;
        hasResumedRef.current = false;
        initialWelcomeCheckedRef.current = false;
        setOriginalLoadedState(null);
        resetSessionAndForm(formData.resetForm);
        router.replace('/calculator', { scroll: false });
    }, [searchParams, formData.resetForm, router, setOriginalLoadedState]);

    // Resume / view a saved survey from the dashboard
    useEffect(() => {
        const resumePropertyId =
            searchParams.get('propertyId') || sessionStorage.getItem('resumePropertyId');
        const wantsResume = searchParams.get('resume') === 'true' && resumePropertyId;

        if (authLoading || !wantsResume || hasResumedRef.current) {
            return;
        }

        hasResumedRef.current = true;
        setIsLoadingResume(true);
        sessionStorage.setItem('resumePropertyId', resumePropertyId);
        updateFormData('showWelcomePage', false);

        fetch('/api/supabase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'loadPropertyById',
                propertyId: resumePropertyId,
                userId: user?.id,
            }),
        })
            .then((res) => res.json())
            .then((result) => {
                if (result.success && result.data) {
                    hydrateFromPropertyRecord(result.data);
                    sessionStorage.removeItem('resumePropertyId');

                    setTimeout(() => {
                        setOriginalLoadedState(useFormStore.getState());
                        setIsLoadingResume(false);
                    }, 800);
                } else {
                    console.error('❌ Resume failed - no data in response:', result);
                    hasResumedRef.current = false;
                    setIsLoadingResume(false);
                    updateFormData('showWelcomePage', true);
                }
            })
            .catch((error) => {
                console.error('Error loading survey to resume:', error);
                hasResumedRef.current = false;
                setIsLoadingResume(false);
                updateFormData('showWelcomePage', true);
            });
    }, [searchParams, authLoading, user?.id, hydrateFromPropertyRecord, updateFormData, setOriginalLoadedState]);

    // Fresh calculator visit (not resuming) — show welcome; discard stale dashboard-linked state
    useEffect(() => {
        if (authLoading) return;
        if (searchParams.get('resume') === 'true') return;
        if (searchParams.get('fresh') === 'true') return;
        if (initialWelcomeCheckedRef.current) return;

        initialWelcomeCheckedRef.current = true;
        hasResumedRef.current = false;

        const state = useFormStore.getState();

        // In-memory state from a resumed dashboard survey must not continue without ?resume=true
        if (state.propertyLinkedToUser) {
            resetSessionAndForm(formData.resetForm);
            return;
        }

        const hasFormData =
            state.propertyPrice ||
            state.propertyAddress ||
            state.selectedState ||
            state.buyerType;

        if (!hasFormData) {
            updateFormData('showWelcomePage', true);
        }
    }, [authLoading, searchParams, updateFormData, formData.resetForm]);

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
        const linkPropertyId = hasPendingSurveyLink() ? getPendingSurveyLinkPropertyId() : null;
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

        if (hasPendingSurveyLink() && user) {
            handleLinkToAccount(user.id);
            clearPendingSurveyLink();
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
    const showReviewPage = formData.showReviewPage;
    const showAdditionalQuestions = formData.showAdditionalQuestions;
    const editingFromReview = formData.editingFromReview;
    const missingFields = getMissingFields(formData);
    const showResultsSummary = allFormsComplete && !showReviewPage && !editingFromReview;
    const showCostsSidebar = !showAdditionalQuestions && showReviewPage && missingFields.length === 0;
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
        // Clear baseline so auto-save does not run after reset; then clear form
        setOriginalLoadedState(null);
        resetSessionAndForm(formData.resetForm);
    };

    const handleEndOfSurveyDismiss = () => {
        // User chose not to save - data is still retained in backend
        // Just close the prompt
    };

    const handleEmailPDF = async () => {
        // Check if user is logged in and has email
        if (!user || !user.email) {
            // Show modal for guests
            setShowEmailModal(true);
            return;
        }

        // For logged-in users, proceed with email
        await sendEmailPDF(user.email, false);
    };

    const handleEmailModalSubmit = async (email, emailExists) => {
        setShowEmailModal(false);
        await sendEmailPDF(email, true, emailExists);
    };

    const sendEmailPDF = async (userEmail, isGuest, emailExists = null) => {
        setIsEmailingPDF(true);

        try {
            const { calculations } = buildResultsSummary(formData, stateFunctions);

            // Send to API
            const response = await fetch('/api/email-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userEmail,
                    formData,
                    calculations,
                    isGuest,
                    propertyId,
                }),
            });

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error('Server returned an error. Please check the console for details.');
            }

            const result = await response.json();

            if (!response.ok || result.error) {
                throw new Error(result.error || result.details || 'Failed to send email');
            }

            // Show success state with appropriate CTA
            setEmailSuccessData({
                email: userEmail,
                emailExists: result.emailExists || emailExists,
                testingMode: result.testingMode || false,
                reminder: result.reminder || null,
            });
            setShowEmailSuccess(true);
        } catch (error) {
            console.error('Error sending email:', error);
            alert(`Failed to send email: ${error.message}. Please check the console for details.`);
        } finally {
            setIsEmailingPDF(false);
        }
    };

    return (
        <div className="aurora-page-bg min-h-screen">
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
                <SurveyLoadingScreen message="Loading your survey..." />
            )}

            {isReturningToDashboard && (
                <SurveyLoadingScreen message="Returning to dashboard..." />
            )}

            {showReviewOverlay && (
                <SurveyLoadingScreen message="Let's review your responses" />
            )}

            {showWelcomePage && !isLoadingResume ? (
                <WelcomePage />
            ) : isLoadingResume ? (
                <SurveyLoadingScreen message="Loading your survey..." />
            ) : (
                <main className={`container mx-auto max-w-7xl px-3 sm:px-4 pb-4 lg:pb-10 ${showResultsSummary ? 'md:pt-35 max-md:pt-30' : `md:pt-35 ${showCostsSidebar ? 'max-md:pt-20' : 'max-md:pt-30'}`}`}>
                    {/* Progress Bars - hidden on Results Summary */}
                    {!showResultsSummary && (
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
                                        style={{
                                            width: `${(() => {
                                                if (showReviewPage || editingFromReview) {
                                                    if (showAdditionalQuestions) {
                                                        const aqFields = formData.additionalQuestionsFields || [];
                                                        const frozen = { ...formData };
                                                        aqFields.forEach(k => { frozen[k] = ''; });
                                                        return calculateGlobalProgress(frozen, {});
                                                    }
                                                    if (missingFields.length === 0 && showReviewPage) {
                                                        return calculateGlobalProgress(formData, {});
                                                    }
                                                    const totalSections = needsLoan === 'yes' ? 4 : 3;
                                                    const propertyDone = propertyDetailsComplete || formData.propertyDetailsFormComplete;
                                                    let completeCount = (propertyDone ? 1 : 0) + (buyerDetailsComplete ? 1 : 0) + (sellerQuestionsComplete ? 1 : 0);
                                                    if (needsLoan === 'yes') completeCount += loanDetailsComplete ? 1 : 0;
                                                    return Math.round((completeCount / totalSections) * 100);
                                                }
                                                if (!propertyDetailsComplete) return 0;
                                                if (!buyerDetailsComplete) return 25;
                                                if (buyerDetailsComplete && needsLoan === 'yes' && !loanDetailsComplete) return 50;
                                                if (buyerDetailsComplete && needsLoan === 'yes' && loanDetailsComplete && !showSellerQuestions) return 75;
                                                if (buyerDetailsComplete && showSellerQuestions && !sellerQuestionsComplete) return 75;
                                                if (buyerDetailsComplete && sellerQuestionsComplete) return 100;
                                                if (buyerDetailsComplete && needsLoan !== 'yes') return 75;
                                                return 0;
                                            })()}%`
                                        }}
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
                                        style={{
                                            width: `${(() => {
                                                let progress = 0;

                                                if (showReviewPage && !showAdditionalQuestions) return 0;

                                                if (showReviewPage && showAdditionalQuestions) {
                                                    const aqFields = formData.additionalQuestionsFields || [];
                                                    if (aqFields.length === 0) return 0;
                                                    const aqStep = formData.additionalQuestionsStep || 1;
                                                    return Math.round(((aqStep - 1) / aqFields.length) * 100);
                                                }

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
                                            })()}%`
                                        }}
                                    ></motion.div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                    )}

                    <div className="flex flex-col md:flex-row md:items-start">
                        {/* Sidebar: Summary, Upfront and Ongoing Costs - only when on Review with no missing fields */}
                        {showCostsSidebar && (
                            <div className="order-1 md:order-2 md:w-2/5 md:flex-shrink-0 px-4 pb-4 max-md:pt-0 md:px-6 md:pb-6 md:pt-4 md:mt-4 md:rounded-r-lg">
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
                        )}

                        {/* Main content area - showReviewPage first so user stays on Review when branch resets create gaps */}
                        <div className={`order-2 md:order-1 ${showResultsSummary ? 'w-full max-w-6xl mx-auto' : 'md:w-3/5'}`}>
                            {(() => {
                                if (showReviewPage && showAdditionalQuestions) return <AdditionalQuestions />;
                                if (showReviewPage) return <ReviewSummary />;
                                if (!propertyDetailsComplete) return <PropertyDetails />;
                                if (!buyerDetailsComplete) return <BuyerDetails />;
                                if (buyerDetailsComplete && showLoanDetails && !loanDetailsComplete) return <LoanDetails />;
                                if (buyerDetailsComplete && loanDetailsComplete && !showSellerQuestions) return <LoanDetails />;
                                if (buyerDetailsComplete && showSellerQuestions && !sellerQuestionsComplete) return <SellerQuestions />;
                                if (buyerDetailsComplete && sellerQuestionsComplete && !allFormsComplete && !editingFromReview) return <SellerQuestions />;
                                if (buyerDetailsComplete && !showLoanDetails && !showSellerQuestions && !formData.buyerDetailsCurrentStep) return <BuyerDetails />;
                                if (formData.buyerDetailsCurrentStep) return <BuyerDetails />;
                                if (allFormsComplete) return (
                                    <ResultsSummary
                                        formData={formData}
                                        stateFunctions={stateFunctions}
                                        user={user}
                                        router={router}
                                        propertyId={propertyId}
                                        onEmailPDF={handleEmailPDF}
                                        isEmailingPDF={isEmailingPDF}
                                        showEmailSuccess={showEmailSuccess}
                                        emailSuccessData={emailSuccessData}
                                        setShowReviewOverlay={setShowReviewOverlay}
                                        setOriginalLoadedState={setOriginalLoadedState}
                                    />
                                );
                                return null;
                            })()}
                        </div>
                    </div>
                </main>
            )}

            {/* Email Modal */}
            <EmailModal
                isOpen={showEmailModal}
                onClose={() => setShowEmailModal(false)}
                onEmailSubmit={handleEmailModalSubmit}
                propertyId={propertyId}
            />
        </div>
    )
}

export default function CalculatorPage() {
    return (
        <Suspense fallback={<SurveyLoadingFallback message="Loading calculator..." />}>
            <CalculatorPageContent />
        </Suspense>
    );
}
