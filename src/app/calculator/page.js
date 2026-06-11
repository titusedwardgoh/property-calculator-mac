"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Minus, DollarSign, Download, Mail, Edit, Plus, ArrowRight, Loader2, CheckCircle2, ChevronDown, User, Landmark, Award, Info } from 'lucide-react';
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
import { useFormStore } from '../../stores/formStore';
import { getMissingFields, calculateGlobalProgress } from '../../lib/progressCalculation';
import { useSupabaseSync } from '../../hooks/useSupabaseSync';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../states/shared/baseCalculations.js';
import { useStateSelector } from '../../states/useStateSelector.js';
import { formatFieldValue, fieldLabels } from '../../lib/fieldMapping.js';
import Link from 'next/link';
import {
    clearPendingSurveyLink,
    getPendingSurveyLinkPropertyId,
    hasPendingSurveyLink,
    setPendingSurveyLink,
} from '../../lib/pendingSurveyLink';
import { resetSessionAndForm } from '../../lib/sessionManager';

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
    const [isPropertyCardExpanded, setIsPropertyCardExpanded] = useState(false);
    const [isBuyerCardExpanded, setIsBuyerCardExpanded] = useState(false);
    const [isLoanCardExpanded, setIsLoanCardExpanded] = useState(false);
    const [isUpfrontCostsExpanded, setIsUpfrontCostsExpanded] = useState(false);
    const [isOngoingCostsExpanded, setIsOngoingCostsExpanded] = useState(false);
    const [isMonthlyOutflowExpanded, setIsMonthlyOutflowExpanded] = useState(false);
    const [isAnnualizedCostExpanded, setIsAnnualizedCostExpanded] = useState(false);
    const [isMobileOngoingCosts, setIsMobileOngoingCosts] = useState(false);
    const [isGrantsCardExpanded, setIsGrantsCardExpanded] = useState(false);
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

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 639px)');
        const update = () => setIsMobileOngoingCosts(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);

    const monthlyOutflowExpanded = isMobileOngoingCosts ? isMonthlyOutflowExpanded : isOngoingCostsExpanded;
    const annualizedCostExpanded = isMobileOngoingCosts ? isAnnualizedCostExpanded : isOngoingCostsExpanded;

    const toggleMonthlyOutflow = () => {
        if (isMobileOngoingCosts) {
            setIsMonthlyOutflowExpanded((prev) => !prev);
        } else {
            setIsOngoingCostsExpanded((prev) => !prev);
        }
    };

    const toggleAnnualizedCost = () => {
        if (isMobileOngoingCosts) {
            setIsAnnualizedCostExpanded((prev) => !prev);
        } else {
            setIsOngoingCostsExpanded((prev) => !prev);
        }
    };

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
    const showCostsSidebar = !showAdditionalQuestions && ((showReviewPage && missingFields.length === 0) || (allFormsComplete && !editingFromReview));
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
            // Calculate all the values needed for the PDF (same as completion page)
            const calculateStampDuty = () => {
                if (!stateFunctions || !formData.propertyPrice || !formData.selectedState || !formData.propertyType) {
                    return 0;
                }
                return stateFunctions.calculateStampDuty(formData.propertyPrice, formData.selectedState);
            };

            const calculateAllUpfrontCosts = () => {
                if (!formData.buyerDetailsComplete || !stateFunctions?.calculateUpfrontCosts) {
                    const stampDutyAmount = calculateStampDuty();
                    const depositAmount = (formData.loanDetailsComplete && formData.needsLoan === 'yes') ? (parseInt(formData.loanDeposit) || 0) : 0;
                    const settlementFee = (formData.loanDetailsComplete && formData.needsLoan === 'yes') ? (parseInt(formData.loanSettlementFees) || 0) : 0;
                    const establishmentFee = (formData.loanDetailsComplete && formData.needsLoan === 'yes') ? (parseInt(formData.loanEstablishmentFee) || 0) : 0;

                    return {
                        stampDuty: { amount: stampDutyAmount, label: "Stamp Duty" },
                        concessions: [],
                        grants: [],
                        foreignDuty: { amount: 0, applicable: false },
                        netStateDuty: stampDutyAmount,
                        totalUpfrontCosts: stampDutyAmount + depositAmount + settlementFee + establishmentFee
                    };
                }

                const buyerData = {
                    selectedState: formData.selectedState,
                    buyerType: formData.buyerType,
                    isPPR: formData.isPPR,
                    isAustralianResident: formData.isAustralianResident,
                    isFirstHomeBuyer: formData.isFirstHomeBuyer,
                    ownedPropertyLast5Years: formData.ownedPropertyLast5Years,
                    hasPensionCard: formData.hasPensionCard,
                    needsLoan: formData.needsLoan,
                    savingsAmount: formData.savingsAmount,
                    income: formData.income,
                    dependants: formData.dependants,
                    dutiableValue: formData.dutiableValue,
                    constructionStarted: formData.constructionStarted,
                    sellerQuestionsComplete: formData.sellerQuestionsComplete
                };

                const propertyData = {
                    propertyPrice: formData.propertyPrice,
                    propertyType: formData.propertyType,
                    propertyCategory: formData.propertyCategory,
                    isWA: formData.isWA,
                    isWAMetro: formData.isWAMetro,
                    isACT: formData.isACT
                };

                const upfrontCostsResult = stateFunctions.calculateUpfrontCosts(buyerData, propertyData, formData.selectedState);

                const firbFee = parseInt(formData.FIRBFee) || 0;
                upfrontCostsResult.totalUpfrontCosts += firbFee;

                if (formData.loanDetailsComplete && formData.needsLoan === 'yes') {
                    const depositAmount = parseInt(formData.loanDeposit) || 0;
                    const settlementFee = parseInt(formData.loanSettlementFees) || 0;
                    const establishmentFee = parseInt(formData.loanEstablishmentFee) || 0;

                    let additionalCosts = 0;
                    if (formData.sellerQuestionsComplete) {
                        additionalCosts += parseInt(formData.landTransferFee) || 0;
                        additionalCosts += parseInt(formData.legalFees) || 0;
                        additionalCosts += parseInt(formData.buildingAndPestInspection) || 0;
                    }

                    return {
                        ...upfrontCostsResult,
                        totalUpfrontCosts: upfrontCostsResult.totalUpfrontCosts + depositAmount + settlementFee + establishmentFee + additionalCosts
                    };
                }

                if (formData.sellerQuestionsComplete) {
                    const landTransferFee = parseInt(formData.landTransferFee) || 0;
                    const legalFees = parseInt(formData.legalFees) || 0;
                    const buildingAndPest = parseInt(formData.buildingAndPestInspection) || 0;
                    const additionalCosts = landTransferFee + legalFees + buildingAndPest;

                    return {
                        ...upfrontCostsResult,
                        totalUpfrontCosts: upfrontCostsResult.totalUpfrontCosts + additionalCosts
                    };
                }

                return upfrontCostsResult;
            };

            const getMonthlyOngoingCosts = () => {
                const propertyCosts = (formData.COUNCIL_RATES_MONTHLY || 0) +
                    (formData.WATER_RATES_MONTHLY || 0) +
                    (formData.BODY_CORP_MONTHLY || 0);
                const loanCosts = formData.needsLoan === 'yes' ? (formData.MONTHLY_LOAN_REPAYMENT || 0) : 0;
                return propertyCosts + loanCosts;
            };

            const getAnnualOngoingCosts = () => {
                const hasLoan = formData.loanDetailsComplete && formData.needsLoan === 'yes';
                return (hasLoan ? (formData.ANNUAL_LOAN_REPAYMENT || 0) : 0) +
                    (formData.sellerQuestionsComplete ? (parseInt(formData.councilRates) || 0) : 0) +
                    (formData.sellerQuestionsComplete ? (parseInt(formData.waterRates) || 0) : 0) +
                    (formData.sellerQuestionsComplete ? (parseInt(formData.bodyCorp) || 0) : 0);
            };

            const upfrontCosts = calculateAllUpfrontCosts();
            const stampDuty = calculateStampDuty();
            const monthlyCashFlow = getMonthlyOngoingCosts();
            const annualOperatingCost = getAnnualOngoingCosts();

            const calculations = {
                upfrontCosts,
                ongoingCosts: {
                    monthly: monthlyCashFlow,
                    annual: annualOperatingCost,
                },
                stampDuty,
            };

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
                <main className={`container mx-auto max-w-7xl px-3 sm:px-4 pb-4 lg:pb-10 md:pt-35 ${showCostsSidebar ? 'max-md:pt-20' : 'max-md:pt-30'}`}>
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
                        <div className="order-2 md:order-1 md:w-3/5">
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
                                if (allFormsComplete) return (() => {
                                    // Define buyerData and propertyData once in outer scope
                                    const buyerData = {
                                        selectedState: formData.selectedState,
                                        buyerType: formData.buyerType,
                                        isPPR: formData.isPPR,
                                        isAustralianResident: formData.isAustralianResident,
                                        isFirstHomeBuyer: formData.isFirstHomeBuyer,
                                        ownedPropertyLast5Years: formData.ownedPropertyLast5Years,
                                        hasPensionCard: formData.hasPensionCard,
                                        needsLoan: formData.needsLoan,
                                        savingsAmount: formData.savingsAmount,
                                        income: formData.income,
                                        dependants: formData.dependants,
                                        dutiableValue: formData.dutiableValue,
                                        constructionStarted: formData.constructionStarted,
                                        sellerQuestionsComplete: formData.sellerQuestionsComplete
                                    };

                                    const propertyData = {
                                        propertyPrice: formData.propertyPrice,
                                        propertyType: formData.propertyType,
                                        propertyCategory: formData.propertyCategory,
                                        isWA: formData.isWA,
                                        isWAMetro: formData.isWAMetro,
                                        isACT: formData.isACT
                                    };

                                    // Calculate stamp duty
                                    const calculateStampDuty = () => {
                                        if (!stateFunctions || !formData.propertyPrice || !formData.selectedState || !formData.propertyType) {
                                            return 0;
                                        }
                                        return stateFunctions.calculateStampDuty(formData.propertyPrice, formData.selectedState);
                                    };

                                    // Calculate all upfront costs
                                    const calculateAllUpfrontCosts = () => {
                                        if (!formData.buyerDetailsComplete || !stateFunctions?.calculateUpfrontCosts) {
                                            const stampDutyAmount = calculateStampDuty();
                                            const depositAmount = (formData.loanDetailsComplete && formData.needsLoan === 'yes') ? (parseInt(formData.loanDeposit) || 0) : 0;
                                            const settlementFee = (formData.loanDetailsComplete && formData.needsLoan === 'yes') ? (parseInt(formData.loanSettlementFees) || 0) : 0;
                                            const establishmentFee = (formData.loanDetailsComplete && formData.needsLoan === 'yes') ? (parseInt(formData.loanEstablishmentFee) || 0) : 0;

                                            return {
                                                stampDuty: { amount: stampDutyAmount, label: "Stamp Duty" },
                                                concessions: [],
                                                grants: [],
                                                foreignDuty: { amount: 0, applicable: false },
                                                netStateDuty: stampDutyAmount,
                                                totalUpfrontCosts: stampDutyAmount + depositAmount + settlementFee + establishmentFee
                                            };
                                        }

                                        const upfrontCostsResult = stateFunctions.calculateUpfrontCosts(buyerData, propertyData, formData.selectedState);

                                        const firbFee = parseInt(formData.FIRBFee) || 0;
                                        upfrontCostsResult.totalUpfrontCosts += firbFee;

                                        if (formData.loanDetailsComplete && formData.needsLoan === 'yes') {
                                            const depositAmount = parseInt(formData.loanDeposit) || 0;
                                            const settlementFee = parseInt(formData.loanSettlementFees) || 0;
                                            const establishmentFee = parseInt(formData.loanEstablishmentFee) || 0;

                                            let additionalCosts = 0;
                                            if (formData.sellerQuestionsComplete) {
                                                additionalCosts += parseInt(formData.landTransferFee) || 0;
                                                additionalCosts += parseInt(formData.legalFees) || 0;
                                                additionalCosts += parseInt(formData.buildingAndPestInspection) || 0;
                                            }

                                            return {
                                                ...upfrontCostsResult,
                                                totalUpfrontCosts: upfrontCostsResult.totalUpfrontCosts + depositAmount + settlementFee + establishmentFee + additionalCosts
                                            };
                                        }

                                        if (formData.sellerQuestionsComplete) {
                                            const landTransferFee = parseInt(formData.landTransferFee) || 0;
                                            const legalFees = parseInt(formData.legalFees) || 0;
                                            const buildingAndPest = parseInt(formData.buildingAndPestInspection) || 0;
                                            const additionalCosts = landTransferFee + legalFees + buildingAndPest;

                                            return {
                                                ...upfrontCostsResult,
                                                totalUpfrontCosts: upfrontCostsResult.totalUpfrontCosts + additionalCosts
                                            };
                                        }

                                        return upfrontCostsResult;
                                    };

                                    const getMonthlyOngoingCosts = () => {
                                        const propertyCosts = (formData.COUNCIL_RATES_MONTHLY || 0) +
                                            (formData.WATER_RATES_MONTHLY || 0) +
                                            (formData.BODY_CORP_MONTHLY || 0);
                                        const loanCosts = formData.needsLoan === 'yes' ? (formData.MONTHLY_LOAN_REPAYMENT || 0) : 0;
                                        return propertyCosts + loanCosts;
                                    };

                                    const getAnnualOngoingCosts = () => {
                                        const hasLoan = formData.loanDetailsComplete && formData.needsLoan === 'yes';
                                        return (hasLoan ? (formData.ANNUAL_LOAN_REPAYMENT || 0) : 0) +
                                            (formData.sellerQuestionsComplete ? (parseInt(formData.councilRates) || 0) : 0) +
                                            (formData.sellerQuestionsComplete ? (parseInt(formData.waterRates) || 0) : 0) +
                                            (formData.sellerQuestionsComplete ? (parseInt(formData.bodyCorp) || 0) : 0);
                                    };

                                    const upfrontCosts = calculateAllUpfrontCosts();
                                    const stampDuty = calculateStampDuty();
                                    const totalPurchaseCost = upfrontCosts?.totalUpfrontCosts || 0;
                                    const appliedConcessions = upfrontCosts?.concessions || [];
                                    const appliedGrants = upfrontCosts?.grants || [];
                                    const grantsConcessionsTotal = [...appliedConcessions, ...appliedGrants].reduce((sum, item) => sum + (item.amount || 0), 0);
                                    const estimatedNetUpfront = totalPurchaseCost - grantsConcessionsTotal;

                                    const hasLoan = formData.loanDetailsComplete && formData.needsLoan === 'yes';
                                    const depositOrPriceAmount = hasLoan
                                        ? (parseInt(formData.loanDeposit) || 0)
                                        : (parseInt(formData.propertyPrice) || 0);
                                    const grossStampDutyAmount = upfrontCosts?.stampDuty?.amount ?? stampDuty;

                                     const getGrantsAndConcessionsList = () => {
                                         if (!stateFunctions || !formData.selectedState) return [];

                                         const list = [];
                                         const state = formData.selectedState;

                                         const addItem = (name, type, calcFn, takesDuty = false) => {
                                             if (!calcFn) return;
                                             try {
                                                 const result = takesDuty
                                                     ? calcFn(buyerData, propertyData, state, grossStampDutyAmount, formData.dutiableValue, formData.sellerQuestionsComplete)
                                                     : calcFn(buyerData, propertyData, state);
                                                 
                                                 const isEligible = result.eligible || false;
                                                 const amt = result.amount ?? result.concessionAmount ?? 0;
                                                 const reason = result.reason || '';

                                                 list.push({
                                                     name,
                                                     type,
                                                     eligible: isEligible,
                                                     amount: amt,
                                                     reason: reason
                                                 });
                                             } catch (e) {
                                                 console.error(`Error calculating ${name}:`, e);
                                             }
                                         };

                                         if (state === 'NSW') {
                                             addItem('NSW First Home Owners Grant', 'grant', stateFunctions.calculateNSWFirstHomeOwnersGrant);
                                             addItem('NSW First Home Buyers Assistance Scheme', 'concession', stateFunctions.calculateNSWFirstHomeBuyersAssistance, true);
                                         } else if (state === 'VIC') {
                                             addItem('VIC First Home Owners Grant', 'grant', stateFunctions.calculateVICFirstHomeOwnersGrant);
                                             addItem('VIC First Home Buyer Duty Concession', 'concession', stateFunctions.calculateVICFirstHomeBuyerDutyConcession, true);
                                             addItem('VIC PPR Duty Concession', 'concession', stateFunctions.calculateVICPPRConcession, true);
                                             addItem('VIC Pensioner Duty Concession', 'concession', stateFunctions.calculateVICPensionConcession, true);
                                             addItem('VIC Temp Off-The-Plan Concession', 'concession', stateFunctions.calculateVICTempOffThePlanConcession, true);
                                         } else if (state === 'QLD') {
                                             addItem('QLD First Home Owners Grant', 'grant', stateFunctions.calculateQLDFirstHomeOwnersGrant);
                                             addItem('QLD Home Concession', 'concession', stateFunctions.calculateQLDHomeConcession, true);
                                             addItem('QLD First Home Concession', 'concession', stateFunctions.calculateQLDFirstHomeConcession, true);
                                             addItem('QLD First Home New Concession', 'concession', stateFunctions.calculateQLDFirstHomeNewConcession, true);
                                             addItem('QLD First Home Vacant Land Concession', 'concession', stateFunctions.calculateQLDFirstHomeVacantLandConcession, true);
                                         } else if (state === 'SA') {
                                             addItem('SA First Home Owners Grant', 'grant', stateFunctions.calculateSAFirstHomeOwnersGrant);
                                             addItem('SA First Home Buyer Concession', 'concession', stateFunctions.calculateSAFirstHomeBuyerConcession, true);
                                         } else if (state === 'WA') {
                                             addItem('WA First Home Owners Grant', 'grant', stateFunctions.calculateWAFirstHomeOwnersGrant);
                                             addItem('WA First Home Owner Concession', 'concession', stateFunctions.calculateWAFirstHomeOwnerConcession, true);
                                             addItem('WA Off-The-Plan Concession', 'concession', stateFunctions.calculateWAOffThePlanConcession, true);
                                         } else if (state === 'TAS') {
                                             addItem('TAS First Home Owners Grant', 'grant', stateFunctions.calculateTASFirstHomeOwnersGrant);
                                             addItem('TAS First Home Duty Relief', 'concession', stateFunctions.calculateTASFirstHomeDutyRelief, true);
                                         } else if (state === 'ACT') {
                                             addItem('ACT Off-The-Plan Exemption', 'concession', stateFunctions.calculateACTOffThePlanExemption, true);
                                             addItem('ACT Pensioner Concession', 'concession', stateFunctions.calculateACTPensionerConcession, true);
                                             addItem('ACT Owner Occupier Concession', 'concession', stateFunctions.calculateACTOwnerOccupierConcession, true);
                                         } else if (state === 'NT') {
                                             addItem('NT Home-Grown Territory Grant', 'grant', stateFunctions.calculateNTHomeGrownTerritoryGrant);
                                             addItem('NT Fresh Start Grant', 'grant', stateFunctions.calculateNTFreshStartGrant);
                                             addItem('NT House and Land Concession', 'concession', stateFunctions.calculateNTHouseAndLandConcession, true);
                                         }

                                         return list;
                                     };

                                    let otherCostsAmount = 0;
                                    if (hasLoan) {
                                        otherCostsAmount += parseInt(formData.loanSettlementFees) || 0;
                                        otherCostsAmount += parseInt(formData.loanEstablishmentFee) || 0;
                                    }
                                    if (formData.sellerQuestionsComplete) {
                                        otherCostsAmount += parseInt(formData.landTransferFee) || 0;
                                        otherCostsAmount += parseInt(formData.legalFees) || 0;
                                        otherCostsAmount += parseInt(formData.buildingAndPestInspection) || 0;
                                    }
                                    if (formData.buyerDetailsComplete && formData.isAustralianResident === 'no' && formData.FIRBFee) {
                                        otherCostsAmount += parseInt(formData.FIRBFee) || 0;
                                    }

                                    const monthlyCashFlow = getMonthlyOngoingCosts();
                                    const annualOperatingCost = getAnnualOngoingCosts();

                                    const propertyDisplayAddress =
                                        formData.propertyAddress?.trim() ||
                                        [formData.propertyStreetAddress, formData.propertySuburbPostcode]
                                            .filter(Boolean)
                                            .join(', ') ||
                                        'Not specified';
                                const propertyDisplayPrice = parseInt(formData.propertyPrice) || 0;
                                const buyerTypeDisplay = formatFieldValue('buyerType', formData.buyerType);
                                const buyerSavingsAmount = parseInt(formData.savingsAmount) || 0;
                                const buyerSavingsShortfall = totalPurchaseCost - buyerSavingsAmount;
                                const buyerDetailRows = [
                                    'isPPR',
                                    'isAustralianResident',
                                    'isFirstHomeBuyer',
                                    ...(formData.isACT ? ['ownedPropertyLast5Years'] : []),
                                    'hasPensionCard',
                                    ...(formData.isACT ? ['income', 'dependants'] : []),
                                    'needsLoan',
                                ].map((key) => ({
                                    key,
                                    label: fieldLabels[key] || key,
                                    value: formatFieldValue(key, formData[key]),
                                }));

                                const loanTypeDisplay = formatFieldValue('loanType', formData.loanType);
                                const loanAmountDisplay = (() => {
                                    const propertyPrice = parseInt(formData.propertyPrice) || 0;
                                    const deposit = parseInt(formData.loanDeposit) || 0;
                                    const lmiCost = formData.loanLMI === 'yes' ? (formData.LMI_COST || 0) : 0;
                                    const lmiStampDuty = formData.loanLMI === 'yes' ? (formData.LMI_STAMP_DUTY || 0) : 0;
                                    return propertyPrice + lmiCost + lmiStampDuty - deposit;
                                })();
                                const loanDetailRows = [
                                    'loanDeposit',
                                    'loanTerm',
                                    'loanRate',
                                    'loanLMI',
                                    'loanSettlementFees',
                                    'loanEstablishmentFee',
                                ].map((key) => ({
                                    key,
                                    label: fieldLabels[key] || key,
                                    value: formatFieldValue(key, formData[key]),
                                }));
                                if (formData.loanType === 'interest-only' && formData.loanInterestOnlyPeriod) {
                                    loanDetailRows.push({
                                        key: 'loanInterestOnlyPeriod',
                                        label: 'Interest-Only Period',
                                        value: `${formData.loanInterestOnlyPeriod} years`,
                                    });
                                }
                                
                                return (
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key="all-forms-complete"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={{ duration: 0.5, ease: "easeInOut" }}
                                                className="mt-8 md:mt-4 w-full"
                                            >
                                                <div className="max-w-4xl mx-auto space-y-6">
                                                    {/* Page Intro Text */}
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                                                        className="text-center md:text-left mb-2 md:pt-4"
                                                    >
                                                        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-secondary leading-tight">
                                                            Results Summary
                                                        </h2>
                                                    </motion.div>

                                                    {/* Combined Settlement Summary Card */}
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                                                        className="bg-base-200 border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-8 md:space-y-4"
                                                    >
                                                        {/* Property summary */}
                                                        <div className="pb-6 md:pb-4 border-b border-gray-100">
                                                            <div
                                                                className="flex flex-col gap-4 bg-[#fef6e4]/45 border border-[#fef6e4] rounded-xl p-5 cursor-pointer hover:bg-[#fef6e4]/70 transition-all duration-200 select-none shadow-sm"
                                                                onClick={() => setIsPropertyCardExpanded(!isPropertyCardExpanded)}
                                                            >
                                                                {/* Card Header Row */}
                                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <div className="p-2.5 bg-white rounded-lg border border-[#fef6e4] shadow-sm shrink-0">
                                                                            <Home className="w-5 h-5 text-primary" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Property Address</span>
                                                                            <p className="text-base md:text-lg font-bold text-secondary mt-0.5 break-words">
                                                                                {propertyDisplayAddress}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-4 sm:pl-4 shrink-0 justify-between sm:justify-end">
                                                                        <div className="sm:text-right">
                                                                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Property Price</span>
                                                                            <p className="text-2xl md:text-3xl font-black text-secondary mt-0.5 tracking-tight">
                                                                                {formatCurrency(propertyDisplayPrice)}
                                                                            </p>
                                                                        </div>
                                                                        <div className="p-1.5 hover:bg-black/5 rounded-full transition-colors shrink-0">
                                                                            <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isPropertyCardExpanded ? 'rotate-180' : ''}`} />
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Expanded Details Row */}
                                                                <AnimatePresence initial={false}>
                                                                    {isPropertyCardExpanded && (
                                                                        <motion.div
                                                                            initial={{ height: 0, opacity: 0 }}
                                                                            animate={{ height: "auto", opacity: 1 }}
                                                                            exit={{ height: 0, opacity: 0 }}
                                                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                                                            className="overflow-hidden border-t border-[#fef6e4] pt-4 mt-2"
                                                                            onClick={(e) => e.stopPropagation()} // Prevent collapse on detail click
                                                                        >
                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 text-sm text-secondary">
                                                                                {/* State */}
                                                                                <div>
                                                                                    <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">State</span>
                                                                                    <p className="font-semibold text-secondary mt-0.5">{formData.selectedState || 'Not specified'}</p>
                                                                                </div>

                                                                                {/* New/Existing (propertyType) */}
                                                                                <div>
                                                                                    <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">New/Existing</span>
                                                                                    <p className="font-semibold text-secondary mt-0.5">{formatFieldValue('propertyType', formData.propertyType)}</p>
                                                                                </div>

                                                                                {/* Property Type (propertyCategory) */}
                                                                                <div>
                                                                                    <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Property Type</span>
                                                                                    <p className="font-semibold text-secondary mt-0.5">{formatFieldValue('propertyCategory', formData.propertyCategory)}</p>
                                                                                </div>

                                                                                {/* Construction Started (conditional) */}
                                                                                {(formData.propertyType === 'off-the-plan' || formData.propertyType === 'house-and-land') && formData.constructionStarted && (
                                                                                    <div>
                                                                                        <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Construction Started</span>
                                                                                        <p className="font-semibold text-secondary mt-0.5">{formatFieldValue('constructionStarted', formData.constructionStarted)}</p>
                                                                                    </div>
                                                                                )}

                                                                                {/* Dutiable Value (conditional) */}
                                                                                {formData.dutiableValue && (
                                                                                    <div>
                                                                                        <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Dutiable Value</span>
                                                                                        <p className="font-semibold text-secondary mt-0.5">{formatFieldValue('dutiableValue', formData.dutiableValue)}</p>
                                                                                    </div>
                                                                                )}

                                                                                {/* WA Specific Fields */}
                                                                                {formData.selectedState === 'WA' && (
                                                                                    <>
                                                                                        {formData.isWA && (
                                                                                            <div>
                                                                                                <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">WA Region</span>
                                                                                                <p className="font-semibold text-secondary mt-0.5">{formatFieldValue('isWA', formData.isWA)}</p>
                                                                                            </div>
                                                                                        )}
                                                                                        {formData.isWAMetro && (
                                                                                            <div>
                                                                                                <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Metro Area</span>
                                                                                                <p className="font-semibold text-secondary mt-0.5">{formatFieldValue('isWAMetro', formData.isWAMetro)}</p>
                                                                                            </div>
                                                                                        )}
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        </div>

                                                        {/* Buyer summary */}
                                                        <div className="pb-6 md:pb-4 border-b border-gray-100">
                                                            <div
                                                                className="flex flex-col gap-4 bg-[#fef6e4]/45 border border-[#fef6e4] rounded-xl p-5 cursor-pointer hover:bg-[#fef6e4]/70 transition-all duration-200 select-none shadow-sm"
                                                                onClick={() => setIsBuyerCardExpanded(!isBuyerCardExpanded)}
                                                            >
                                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <div className="p-2.5 bg-white rounded-lg border border-[#fef6e4] shadow-sm shrink-0">
                                                                            <User className="w-5 h-5 text-primary" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Buyer Type</span>
                                                                            <p className="text-base md:text-lg font-bold text-secondary mt-0.5">
                                                                                {buyerTypeDisplay}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-4 sm:pl-4 shrink-0 justify-between sm:justify-end">
                                                                        <div className="sm:text-right">
                                                                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Available Savings</span>
                                                                            <p className="text-2xl md:text-3xl font-black text-secondary mt-0.5 tracking-tight">
                                                                                {formatCurrency(buyerSavingsAmount)}
                                                                            </p>
                                                                        </div>
                                                                        <div className="p-1.5 hover:bg-black/5 rounded-full transition-colors shrink-0">
                                                                            <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isBuyerCardExpanded ? 'rotate-180' : ''}`} />
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <AnimatePresence initial={false}>
                                                                    {isBuyerCardExpanded && (
                                                                        <motion.div
                                                                            initial={{ height: 0, opacity: 0 }}
                                                                            animate={{ height: "auto", opacity: 1 }}
                                                                            exit={{ height: 0, opacity: 0 }}
                                                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                                                            className="overflow-hidden border-t border-[#fef6e4] pt-4 mt-2"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 text-sm text-secondary">
                                                                                {buyerDetailRows.map(({ key, label, value }) => (
                                                                                    <div key={key}>
                                                                                        <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
                                                                                        <p className="font-semibold text-secondary mt-0.5">{value}</p>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        </div>

                                                        {/* Loan summary */}
                                                        {hasLoan && (
                                                            <div className="pb-6 md:pb-4 border-b border-gray-100">
                                                                <div
                                                                    className="flex flex-col gap-4 bg-[#fef6e4]/45 border border-[#fef6e4] rounded-xl p-5 cursor-pointer hover:bg-[#fef6e4]/70 transition-all duration-200 select-none shadow-sm"
                                                                    onClick={() => setIsLoanCardExpanded(!isLoanCardExpanded)}
                                                                >
                                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                                        <div className="flex items-center gap-3 min-w-0">
                                                                            <div className="p-2.5 bg-white rounded-lg border border-[#fef6e4] shadow-sm shrink-0">
                                                                                <Landmark className="w-5 h-5 text-primary" />
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Loan Type</span>
                                                                                <p className="text-base md:text-lg font-bold text-secondary mt-0.5">
                                                                                    {loanTypeDisplay}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-4 sm:pl-4 shrink-0 justify-between sm:justify-end">
                                                                            <div className="sm:text-right">
                                                                                <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Loan Amount</span>
                                                                                <p className="text-2xl md:text-3xl font-black text-secondary mt-0.5 tracking-tight">
                                                                                    {formatCurrency(loanAmountDisplay)}
                                                                                </p>
                                                                            </div>
                                                                            <div className="p-1.5 hover:bg-black/5 rounded-full transition-colors shrink-0">
                                                                                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isLoanCardExpanded ? 'rotate-180' : ''}`} />
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <AnimatePresence initial={false}>
                                                                        {isLoanCardExpanded && (
                                                                            <motion.div
                                                                                initial={{ height: 0, opacity: 0 }}
                                                                                animate={{ height: "auto", opacity: 1 }}
                                                                                exit={{ height: 0, opacity: 0 }}
                                                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                                                                className="overflow-hidden border-t border-[#fef6e4] pt-4 mt-2"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            >
                                                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 text-sm text-secondary">
                                                                                    {loanDetailRows.map(({ key, label, value }) => (
                                                                                        <div key={key}>
                                                                                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
                                                                                            <p className="font-semibold text-secondary mt-0.5">{value}</p>
                                                                                        </div>
                                                                                    ))}
                                                                                    {formData.loanLMI === 'yes' && (formData.LMI_COST > 0 || formData.LMI_STAMP_DUTY > 0) && (
                                                                                        <div>
                                                                                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">LMI Premium</span>
                                                                                            <p className="font-semibold text-secondary mt-0.5">
                                                                                                {formatCurrency((formData.LMI_COST || 0) + (formData.LMI_STAMP_DUTY || 0))}
                                                                                            </p>
                                                                                        </div>
                                                                                    )}
                                                                                    {formData.LVR != null && formData.LVR !== '' && (
                                                                                        <div>
                                                                                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">LVR (ex LMI)</span>
                                                                                            <p className="font-semibold text-secondary mt-0.5">
                                                                                                {`${(Number(formData.LVR) * 100).toFixed(1)}%`}
                                                                                            </p>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Settlement Section */}
                                                        <div className="space-y-6">
                                                            <div>
                                                                <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-0.5">At Settlement</h3>
                                                                <h4 className="text-xl font-bold text-secondary">Upfront Costs</h4>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                {/* Hero: Net Upfront Costs */}
                                                                <div
                                                                    onClick={() => setIsUpfrontCostsExpanded(!isUpfrontCostsExpanded)}
                                                                    className={`md:col-span-3 border-2 border-primary bg-[#E29578]/5 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-200 hover:shadow-md select-none ${isUpfrontCostsExpanded ? 'pb-4' : 'min-h-[130px]'}`}
                                                                >
                                                                    <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none text-primary">
                                                                        <DollarSign className="w-36 h-36" />
                                                                    </div>
                                                                    <div className="flex items-center justify-between w-full mb-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="p-1.5 bg-primary rounded-lg text-white">
                                                                                <DollarSign className="w-4 h-4" />
                                                                            </div>
                                                                            <span className="text-xs font-bold uppercase tracking-wider text-primary">Net Upfront Costs</span>
                                                                        </div>
                                                                        <div className="p-1.5 hover:bg-black/5 rounded-full transition-colors shrink-0">
                                                                            <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isUpfrontCostsExpanded ? 'rotate-180' : ''}`} />
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col justify-between">
                                                                        <p className="text-3xl md:text-4xl font-black tracking-tight text-secondary">
                                                                            {formatCurrency(totalPurchaseCost)}
                                                                        </p>
                                                                        <p className="text-xs text-gray-500 mt-1">Total cash required at settlement after grants and concessions</p>
                                                                    </div>

                                                                    <AnimatePresence initial={false}>
                                                                        {isUpfrontCostsExpanded && (
                                                                            <motion.div
                                                                                initial={{ height: 0, opacity: 0 }}
                                                                                animate={{ height: "auto", opacity: 1 }}
                                                                                exit={{ height: 0, opacity: 0 }}
                                                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                                                                className="overflow-hidden border-t border-primary/20 pt-4 mt-4"
                                                                                onClick={(e) => e.stopPropagation()} // Prevent collapse on detail click
                                                                            >
                                                                                <div className="space-y-2 text-sm text-secondary">
                                                                                    {(() => {
                                                                                        const activeConcessions = appliedConcessions.filter(c => c.amount > 0);
                                                                                        const concessionsTotal = activeConcessions.reduce((sum, c) => sum + c.amount, 0);
                                                                                        const hasConcessions = activeConcessions.length > 0;
                                                                                        const netStampDutyVal = Math.max(0, grossStampDutyAmount - concessionsTotal);

                                                                                        const activeGrants = appliedGrants.filter(g => g.amount > 0);
                                                                                        const grantsTotal = activeGrants.reduce((sum, g) => sum + g.amount, 0);
                                                                                        const hasGrants = activeGrants.length > 0;
                                                                                        const totalBeforeGrants = totalPurchaseCost + grantsTotal;

                                                                                        const depositVal = hasLoan
                                                                                            ? (parseInt(formData.loanDeposit) || 0)
                                                                                            : (parseInt(formData.propertyPrice) || 0);

                                                                                        const bankSettlementFee = hasLoan ? (parseInt(formData.loanSettlementFees) || 0) : 0;
                                                                                        const loanEstablishmentFee = hasLoan ? (parseInt(formData.loanEstablishmentFee) || 0) : 0;
                                                                                        const bankLoanFeesSubtotal = bankSettlementFee + loanEstablishmentFee;

                                                                                        const landTransferFee = formData.sellerQuestionsComplete ? (parseInt(formData.landTransferFee) || 0) : 0;
                                                                                        const legalFees = formData.sellerQuestionsComplete ? (parseInt(formData.legalFees) || 0) : 0;
                                                                                        const buildingAndPestFee = formData.sellerQuestionsComplete ? (parseInt(formData.buildingAndPestInspection) || 0) : 0;
                                                                                        const firbFee = (formData.buyerDetailsComplete && formData.isAustralianResident === 'no')
                                                                                            ? (parseInt(formData.FIRBFee) || 0)
                                                                                            : 0;
                                                                                        const otherCostsSubtotal = landTransferFee + legalFees + buildingAndPestFee + firbFee;

                                                                                        const getConcessionLabel = (type) => {
                                                                                            switch (type) {
                                                                                                case 'Pensioner': return 'Pensioner Duty Concession';
                                                                                                case 'First Home Buyer': return 'First Home Buyer Concession';
                                                                                                case 'First Home Owner': return 'First Home Owner Concession';
                                                                                                case 'First Home Duty Relief': return 'First Home Duty Relief';
                                                                                                case 'Off-The-Plan': return 'Off-The-Plan Concession';
                                                                                                case 'Off the Plan Exemption': return 'Off the Plan Exemption';
                                                                                                case 'Pensioner Concession': return 'Pensioner Concession';
                                                                                                case 'Owner Occupier Concession': return 'Owner Occupier Concession';
                                                                                                case 'Temp Off-The-Plan': return 'Temp Off-The-Plan Concession';
                                                                                                case 'Home Concession': return 'Home Concession';
                                                                                                case 'First Home Concession': return 'First Home Concession';
                                                                                                case 'First Home (New) Concession': return 'First Home (New) Concession';
                                                                                                case 'First Home (Vac Land) Concession': return 'First Home (Vac Land) Concession';
                                                                                                case 'House and Land': return 'House and Land Concession';
                                                                                                case 'Home Buyer Concession': return 'Home Buyer Concession';
                                                                                                default: return `Stamp Duty Concession${type ? ` (${type})` : ''}`;
                                                                                            }
                                                                                        };

                                                                                        return (
                                                                                            <div className="divide-y divide-primary/10">
                                                                                                {/* 1. Deposit or Property Price */}
                                                                                                <div className="flex justify-between items-center py-2 text-secondary font-medium">
                                                                                                    <span>{hasLoan ? 'Deposit' : 'Property Price'}</span>
                                                                                                    <span className="font-bold">{formatCurrency(depositVal)}</span>
                                                                                                </div>

                                                                                                {/* 2. Stamp Duty (Gross) & Concessions & Net State Duty */}
                                                                                                {hasConcessions ? (
                                                                                                    <div className="py-2 space-y-1">
                                                                                                        <div className="flex justify-between items-center text-sm text-gray-500 pl-4">
                                                                                                            <span>Stamp Duty (Gross)</span>
                                                                                                            <span className="font-medium pr-12">{formatCurrency(grossStampDutyAmount)}</span>
                                                                                                        </div>
                                                                                                        {activeConcessions.map((c, i) => (
                                                                                                            <div key={i} className="flex justify-between items-center text-sm pl-4">
                                                                                                                <span className="text-gray-500">{getConcessionLabel(c.type)}</span>
                                                                                                                <span className="font-semibold text-green-600 pr-12">-{formatCurrency(c.amount)}</span>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                        <div className="flex justify-between items-center py-1 pt-1.5 border-t border-dashed border-primary/10 font-semibold text-secondary">
                                                                                                            <span>Net State Duty</span>
                                                                                                            <span className="font-bold">{formatCurrency(netStampDutyVal)}</span>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                ) : (
                                                                                                    <div className="flex justify-between items-center py-2 text-secondary font-medium">
                                                                                                        <span>Stamp Duty</span>
                                                                                                        <span className="font-bold">{formatCurrency(grossStampDutyAmount)}</span>
                                                                                                    </div>
                                                                                                )}

                                                                                                {/* 3. Bank & Loan Fees */}
                                                                                                {(() => {
                                                                                                    const hasSettlement = bankSettlementFee > 0;
                                                                                                    const hasEstablishment = loanEstablishmentFee > 0;
                                                                                                    if (hasSettlement && hasEstablishment) {
                                                                                                        return (
                                                                                                            <div className="py-2 space-y-1">
                                                                                                                <div className="flex justify-between items-center text-sm text-gray-500 pl-4">
                                                                                                                    <span>Bank Settlement Fee</span>
                                                                                                                    <span className="font-medium pr-12">{formatCurrency(bankSettlementFee)}</span>
                                                                                                                </div>
                                                                                                                <div className="flex justify-between items-center text-sm text-gray-500 pl-4">
                                                                                                                    <span>Loan Establishment Fee</span>
                                                                                                                    <span className="font-medium pr-12">{formatCurrency(loanEstablishmentFee)}</span>
                                                                                                                </div>
                                                                                                                <div className="flex justify-between items-center py-1 pt-1.5 border-t border-dashed border-primary/10 font-semibold text-secondary">
                                                                                                                    <span>Bank &amp; Loan Fees</span>
                                                                                                                    <span className="font-bold">{formatCurrency(bankLoanFeesSubtotal)}</span>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        );
                                                                                                    } else if (hasSettlement) {
                                                                                                        return (
                                                                                                            <div className="flex justify-between items-center py-2 text-secondary font-medium">
                                                                                                                <span>Bank Settlement Fee</span>
                                                                                                                <span className="font-bold">{formatCurrency(bankSettlementFee)}</span>
                                                                                                            </div>
                                                                                                        );
                                                                                                    } else if (hasEstablishment) {
                                                                                                        return (
                                                                                                            <div className="flex justify-between items-center py-2 text-secondary font-medium">
                                                                                                                <span>Loan Establishment Fee</span>
                                                                                                                <span className="font-bold">{formatCurrency(loanEstablishmentFee)}</span>
                                                                                                            </div>
                                                                                                        );
                                                                                                    }
                                                                                                    return null;
                                                                                                })()}

                                                                                                {/* 4. Other Costs (seller questions + FIRB) */}
                                                                                                {(() => {
                                                                                                    const activeOtherCosts = [
                                                                                                        { label: 'Land Transfer Fee', amount: landTransferFee },
                                                                                                        { label: 'Legal and Conveyancing', amount: legalFees },
                                                                                                        { label: 'Building and Pest Inspection', amount: buildingAndPestFee },
                                                                                                        { label: 'FIRB Application Fee', amount: firbFee },
                                                                                                    ].filter(item => item.amount > 0);

                                                                                                    if (activeOtherCosts.length > 1) {
                                                                                                        return (
                                                                                                            <div className="py-2 space-y-1">
                                                                                                                {activeOtherCosts.map((item, idx) => (
                                                                                                                    <div key={idx} className="flex justify-between items-center text-sm text-gray-500 pl-4">
                                                                                                                        <span>{item.label}</span>
                                                                                                                        <span className="font-medium pr-12">{formatCurrency(item.amount)}</span>
                                                                                                                    </div>
                                                                                                                ))}
                                                                                                                <div className="flex justify-between items-center py-1 pt-1.5 border-t border-dashed border-primary/10 font-semibold text-secondary">
                                                                                                                    <span>Other Costs</span>
                                                                                                                    <span className="font-bold">{formatCurrency(otherCostsSubtotal)}</span>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        );
                                                                                                    } else if (activeOtherCosts.length === 1) {
                                                                                                        return (
                                                                                                            <div className="flex justify-between items-center py-2 text-secondary font-medium">
                                                                                                                <span>{activeOtherCosts[0].label}</span>
                                                                                                                <span className="font-bold">{formatCurrency(activeOtherCosts[0].amount)}</span>
                                                                                                            </div>
                                                                                                        );
                                                                                                    }
                                                                                                    return null;
                                                                                                })()}

                                                                                                {/* 5. Grants and Final Totals */}
                                                                                                <div className="pt-2">
                                                                                                    {hasGrants ? (
                                                                                                        <>
                                                                                                            <div className="flex justify-between items-center py-2 font-bold text-secondary">
                                                                                                                <span>Total (before grants)</span>
                                                                                                                <span>{formatCurrency(totalBeforeGrants)}</span>
                                                                                                            </div>
                                                                                                            {activeGrants.map((g, i) => (
                                                                                                                <div key={i} className="flex justify-between items-center py-1 text-sm pl-4">
                                                                                                                    <span className="text-gray-500">{g.label || 'First Home Owners Grant'}</span>
                                                                                                                    <span className="font-semibold text-green-600 pr-12">-{formatCurrency(g.amount)}</span>
                                                                                                                </div>
                                                                                                            ))}
                                                                                                            <div className="flex justify-between items-center py-2 pt-3 border-t border-primary/20 font-black text-lg text-secondary">
                                                                                                                <span>Total Upfront Costs</span>
                                                                                                                <span>{formatCurrency(totalPurchaseCost)}</span>
                                                                                                            </div>
                                                                                                        </>
                                                                                                    ) : (
                                                                                                        <div className="flex justify-between items-center py-2 font-black text-lg text-secondary">
                                                                                                            <span>Total Upfront Costs</span>
                                                                                                            <span>{formatCurrency(totalPurchaseCost)}</span>
                                                                                                        </div>
                                                                                                    )}
                                                                                                    <div className="pt-3 mt-2 border-t border-primary/20 space-y-2">
                                                                                                        <div className="flex justify-between items-center py-1">
                                                                                                            <span className="text-gray-600">Available Savings</span>
                                                                                                            <span className="font-semibold text-secondary">{formatCurrency(buyerSavingsAmount)}</span>
                                                                                                        </div>
                                                                                                        {buyerSavingsShortfall > 0 ? (
                                                                                                            <div className="flex justify-between items-center py-1">
                                                                                                                <span className="text-red-600 font-medium">Shortfall</span>
                                                                                                                <span className="text-red-600 font-semibold">{formatCurrency(buyerSavingsShortfall)}</span>
                                                                                                            </div>
                                                                                                        ) : (
                                                                                                            <div className="flex justify-between items-center py-1">
                                                                                                                <span className="text-green-600 font-medium">Remaining After Costs</span>
                                                                                                                <span className="text-green-600 font-semibold">{formatCurrency(buyerSavingsAmount - totalPurchaseCost)}</span>
                                                                                                            </div>
                                                                                                        )}
                                                                                                        {buyerSavingsAmount > totalPurchaseCost && hasLoan && (
                                                                                                            <p className="text-xs text-gray-600 italic bg-white/60 rounded-lg px-3 py-2 mt-2 border border-primary/10">
                                                                                                                You have more savings than required upfront. Consider increasing your deposit to reduce interest payments.
                                                                                                            </p>
                                                                                                        )}
                                                                                                        {buyerSavingsShortfall > 0 && (
                                                                                                            <p className="text-xs text-red-600 italic bg-red-50/50 rounded-lg px-3 py-2 mt-2 border border-red-200/60">
                                                                                                                {hasLoan ? (
                                                                                                                    "You have a savings shortfall. Consider reducing your deposit to lower upfront cash required, or look for a lower-priced property."
                                                                                                                ) : (
                                                                                                                    "You have a savings shortfall. Consider obtaining a home loan to cover the gap, or look for a lower-priced property."
                                                                                                                )}
                                                                                                            </p>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    })()}
                                                                                </div>
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Ongoing Ownership Section */}
                                                        <div className="space-y-6 pt-6 md:pt-4 border-t border-gray-100">
                                                            <div>
                                                                <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-0.5">Post-Settlement</h3>
                                                                <h4 className="text-xl font-bold text-secondary">Ongoing Costs</h4>
                                                            </div>

                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                {/* Monthly Outflow Component */}
                                                                <div
                                                                    className="bg-base-200 border border-gray-100 rounded-xl p-5 flex flex-col justify-between relative cursor-pointer select-none"
                                                                    onClick={toggleMonthlyOutflow}
                                                                >
                                                                    <div>
                                                                        <div className="flex items-start justify-between gap-2 mb-1">
                                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Monthly Outflow</span>
                                                                            <div className="p-1 hover:bg-black/5 rounded-full transition-colors shrink-0">
                                                                                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${monthlyOutflowExpanded ? 'rotate-180' : ''}`} />
                                                                            </div>
                                                                        </div>
                                                                        <p className="text-2xl md:text-3xl font-black text-secondary mb-2">
                                                                            {formatCurrency(monthlyCashFlow)}<span className="text-xs font-normal text-gray-400"> /mo</span>
                                                                        </p>
                                                                        <AnimatePresence initial={false}>
                                                                            {monthlyOutflowExpanded && (
                                                                                <motion.div
                                                                                    initial={{ height: 0, opacity: 0 }}
                                                                                    animate={{ height: "auto", opacity: 1 }}
                                                                                    exit={{ height: 0, opacity: 0 }}
                                                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                                                    className="overflow-hidden mb-2"
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                >
                                                                                    <div className="space-y-1.5 text-sm border-t border-gray-100 pt-3">
                                                                                        {hasLoan && (formData.MONTHLY_LOAN_REPAYMENT || 0) > 0 && (
                                                                                            <div className="flex justify-between items-center">
                                                                                                <span className="text-gray-600 pl-4">Loan Repayment</span>
                                                                                                <span className="font-semibold text-secondary pr-4">{formatCurrency(formData.MONTHLY_LOAN_REPAYMENT)}</span>
                                                                                            </div>
                                                                                        )}
                                                                                        {formData.sellerQuestionsComplete && (formData.COUNCIL_RATES_MONTHLY || 0) > 0 && (
                                                                                            <div className="flex justify-between items-center">
                                                                                                <span className="text-gray-600 pl-4">Council Rates</span>
                                                                                                <span className="font-semibold text-secondary pr-4">{formatCurrency(formData.COUNCIL_RATES_MONTHLY)}</span>
                                                                                            </div>
                                                                                        )}
                                                                                        {formData.sellerQuestionsComplete && (formData.WATER_RATES_MONTHLY || 0) > 0 && (
                                                                                            <div className="flex justify-between items-center">
                                                                                                <span className="text-gray-600 pl-4">Water Rates</span>
                                                                                                <span className="font-semibold text-secondary pr-4">{formatCurrency(formData.WATER_RATES_MONTHLY)}</span>
                                                                                            </div>
                                                                                        )}
                                                                                        {formData.sellerQuestionsComplete && (formData.BODY_CORP_MONTHLY || 0) > 0 && (
                                                                                            <div className="flex justify-between items-center">
                                                                                                <span className="text-gray-600 pl-4">Body Corporate</span>
                                                                                                <span className="font-semibold text-secondary pr-4">{formatCurrency(formData.BODY_CORP_MONTHLY)}</span>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </motion.div>
                                                                            )}
                                                                        </AnimatePresence>
                                                                    </div>
                                                                    <p className="text-[11px] text-gray-500 italic bg-gray-50/50 p-2 rounded border border-gray-100/30">
                                                                        Includes council rates, water rates, body corporate fees, and loan repayments.
                                                                    </p>
                                                                </div>

                                                                {/* Annual Operating Cost Component */}
                                                                <div
                                                                    className="bg-base-200 border border-gray-100 rounded-xl p-5 flex flex-col justify-between relative cursor-pointer select-none"
                                                                    onClick={toggleAnnualizedCost}
                                                                >
                                                                    <div>
                                                                        <div className="flex items-start justify-between gap-2 mb-1">
                                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Annualized Cost</span>
                                                                            <div className="p-1 hover:bg-black/5 rounded-full transition-colors shrink-0">
                                                                                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${annualizedCostExpanded ? 'rotate-180' : ''}`} />
                                                                            </div>
                                                                        </div>
                                                                        <p className="text-2xl md:text-3xl font-black text-secondary mb-2">
                                                                            {formatCurrency(annualOperatingCost)}<span className="text-xs font-normal text-gray-400"> /yr</span>
                                                                        </p>
                                                                        <AnimatePresence initial={false}>
                                                                            {annualizedCostExpanded && (
                                                                                <motion.div
                                                                                    initial={{ height: 0, opacity: 0 }}
                                                                                    animate={{ height: "auto", opacity: 1 }}
                                                                                    exit={{ height: 0, opacity: 0 }}
                                                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                                                    className="overflow-hidden mb-2"
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                >
                                                                                    <div className="space-y-1.5 text-sm border-t border-gray-100 pt-3">
                                                                                        {hasLoan && (formData.ANNUAL_LOAN_REPAYMENT || 0) > 0 && (
                                                                                            <div className="flex justify-between items-center">
                                                                                                <span className="text-gray-600 pl-4">Loan Repayment</span>
                                                                                                <span className="font-semibold text-secondary pr-4">{formatCurrency(formData.ANNUAL_LOAN_REPAYMENT)}</span>
                                                                                            </div>
                                                                                        )}
                                                                                        {formData.sellerQuestionsComplete && (parseInt(formData.councilRates) || 0) > 0 && (
                                                                                            <div className="flex justify-between items-center">
                                                                                                <span className="text-gray-600 pl-4">Council Rates</span>
                                                                                                <span className="font-semibold text-secondary pr-4">{formatCurrency(parseInt(formData.councilRates))}</span>
                                                                                            </div>
                                                                                        )}
                                                                                        {formData.sellerQuestionsComplete && (parseInt(formData.waterRates) || 0) > 0 && (
                                                                                            <div className="flex justify-between items-center">
                                                                                                <span className="text-gray-600 pl-4">Water Rates</span>
                                                                                                <span className="font-semibold text-secondary pr-4">{formatCurrency(parseInt(formData.waterRates))}</span>
                                                                                            </div>
                                                                                        )}
                                                                                        {formData.sellerQuestionsComplete && (parseInt(formData.bodyCorp) || 0) > 0 && (
                                                                                            <div className="flex justify-between items-center">
                                                                                                <span className="text-gray-600 pl-4">Body Corporate</span>
                                                                                                <span className="font-semibold text-secondary pr-4">{formatCurrency(parseInt(formData.bodyCorp))}</span>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </motion.div>
                                                                            )}
                                                                        </AnimatePresence>
                                                                    </div>
                                                                    <p className="text-[11px] text-gray-500 italic bg-gray-50/50 p-2 rounded border border-gray-100/30">
                                                                        Annualised council rates, water rates, body corporate fees, and loan repayments.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Grants and Concessions collapsible card */}
                                                        <div className="pb-6 md:pb-4 border-b border-gray-100 pt-6 md:pt-4 border-t border-gray-100">
                                                            <div
                                                                className="flex flex-col gap-4 bg-[#fef6e4]/45 border border-[#fef6e4] rounded-xl p-5 cursor-pointer hover:bg-[#fef6e4]/70 transition-all duration-200 select-none shadow-sm"
                                                                onClick={() => setIsGrantsCardExpanded(!isGrantsCardExpanded)}
                                                            >
                                                                {/* Card Header Row */}
                                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <div className="p-2.5 bg-white rounded-lg border border-[#fef6e4] shadow-sm shrink-0">
                                                                            <Award className="w-5 h-5 text-primary" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Grants and Concessions</span>
                                                                            <p className="text-base md:text-lg font-bold text-secondary mt-0.5 break-words">
                                                                                {(() => {
                                                                                    const list = getGrantsAndConcessionsList();
                                                                                    const eligibleCount = list.filter(x => x.eligible).length;
                                                                                    return eligibleCount > 0 
                                                                                        ? `Eligible for ${eligibleCount} benefit${eligibleCount > 1 ? 's' : ''}` 
                                                                                        : 'No eligible benefits';
                                                                                })()}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-4 sm:pl-4 shrink-0 justify-between sm:justify-end">
                                                                        <div className="sm:text-right">
                                                                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Saved</span>
                                                                            <p className="text-2xl md:text-3xl font-black text-secondary mt-0.5 tracking-tight">
                                                                                {formatCurrency(grantsConcessionsTotal)}
                                                                            </p>
                                                                        </div>
                                                                        <div className="p-1.5 hover:bg-black/5 rounded-full transition-colors shrink-0">
                                                                            <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isGrantsCardExpanded ? 'rotate-180' : ''}`} />
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Expanded Details Row */}
                                                                <AnimatePresence initial={false}>
                                                                    {isGrantsCardExpanded && (
                                                                        <motion.div
                                                                            initial={{ height: 0, opacity: 0 }}
                                                                            animate={{ height: "auto", opacity: 1 }}
                                                                            exit={{ height: 0, opacity: 0 }}
                                                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                                                            className="overflow-hidden border-t border-[#fef6e4] pt-4 mt-2"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <div className="space-y-3 pt-2">
                                                                                <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Grants &amp; Concessions Breakdown</span>
                                                                                {(() => {
                                                                                    const list = getGrantsAndConcessionsList();
                                                                                    const eligibleConcessions = list.filter(x => x.eligible && x.type === 'concession');
                                                                                    if (eligibleConcessions.length > 1) {
                                                                                        return (
                                                                                            <div className="flex gap-2.5 p-3.5 mb-3 rounded-lg border border-amber-200 bg-amber-500/5 text-xs text-amber-900 leading-normal">
                                                                                                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                                                                                <div>
                                                                                                    <span className="font-semibold">Note on concessions:</span> You are eligible for multiple stamp duty concessions. However, state rules dictate that only one concession can be applied per property transaction (typically the one yielding the highest benefit). This has been automatically applied to your total savings calculation.
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    }
                                                                                    return null;
                                                                                })()}
                                                                                <div className="grid grid-cols-1 gap-3">
                                                                                    {getGrantsAndConcessionsList().map((item, idx) => (
                                                                                        <div key={idx} className="flex flex-col gap-1.5 p-3 rounded-lg border border-[#fef6e4] bg-white/40">
                                                                                            <div className="flex items-center justify-between gap-4">
                                                                                                <span className="font-semibold text-secondary text-sm md:text-base">{item.name}</span>
                                                                                                {item.eligible ? (
                                                                                                    <span className="text-green-600 font-bold text-sm md:text-base">
                                                                                                        -{formatCurrency(item.amount)}
                                                                                                    </span>
                                                                                                ) : (
                                                                                                    <span className="text-gray-400 font-medium text-xs md:text-sm">
                                                                                                        Ineligible
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                            <div className="flex items-center gap-2">
                                                                                                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${item.eligible ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                                                                                                    {item.eligible ? 'Eligible' : 'Ineligible'}
                                                                                                </span>
                                                                                                <span className="text-xs text-gray-500">{item.reason}</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                    {getGrantsAndConcessionsList().length === 0 && (
                                                                                        <p className="text-sm text-gray-500 italic text-center py-4">No grants or concessions available for this state.</p>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        </div>

                                                        {/* CTA Action Buttons Component */}
                                                        {showEmailSuccess ? (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 20 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                className="flex flex-col gap-4 pt-2"
                                                            >
                                                                <div className="bg-emerald-50/30 border-2 border-emerald-100 rounded-xl p-6 text-center">
                                                                    <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                                                                    <h3 className="text-lg font-bold text-secondary mb-1">Check your inbox!</h3>
                                                                    <p className="text-sm text-gray-600 mb-4">Your detailed property report has been dispatched to {emailSuccessData?.email}</p>

                                                                    {emailSuccessData?.testingMode && (
                                                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-left">
                                                                            <p className="text-xs text-yellow-800 font-semibold mb-1">📝 Developer Runtime Notice:</p>
                                                                            <p className="text-[11px] text-yellow-700">{emailSuccessData?.reminder || 'Resend validation protocol pending.'}</p>
                                                                        </div>
                                                                    )}

                                                                    {!user && (
                                                                        emailSuccessData?.emailExists ? (
                                                                            <>
                                                                                <p className="text-xs text-gray-500 mb-4">An identified account vector exists for this address. Sign in to sync your calculation sheets.</p>
                                                                                <Link href={`/login?email=${encodeURIComponent(emailSuccessData.email)}&next=/calculator`} className="inline-block">
                                                                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="bg-secondary hover:bg-secondary/90 text-white px-6 py-3 rounded-full font-bold uppercase tracking-wider text-xs shadow-sm transition-colors mx-auto cursor-pointer">
                                                                                        Sign In to Your Account
                                                                                    </motion.button>
                                                                                </Link>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <p className="text-xs text-gray-500 mb-4">Want to track these properties over long horizons? Open a persistent record track.</p>
                                                                                <Link href={`/signup?email=${encodeURIComponent(emailSuccessData.email)}`} className="inline-block">
                                                                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-full font-bold uppercase tracking-wider text-xs shadow-sm transition-colors mx-auto cursor-pointer">
                                                                                        Create My Account
                                                                                    </motion.button>
                                                                                </Link>
                                                                            </>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        ) : (
                                                            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                                                                <motion.button
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    className="flex items-center cursor-pointer justify-center gap-2 min-h-12 bg-primary hover:bg-primary/95 text-white px-6 py-3 rounded-full font-bold uppercase tracking-wider text-xs shadow-sm transition-all duration-150"
                                                                >
                                                                    <Download className="w-4 h-4" />
                                                                    Download Full PDF Report
                                                                </motion.button>

                                                                <motion.button
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    onClick={handleEmailPDF}
                                                                    disabled={isEmailingPDF}
                                                                    className="flex items-center cursor-pointer justify-center gap-2 min-h-12 bg-base-200 border-2 border-secondary text-secondary hover:bg-secondary/5 px-6 py-3 rounded-full font-bold uppercase tracking-wider text-xs shadow-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    {isEmailingPDF ? (
                                                                        <>
                                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                                            Sending...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Mail className="w-4 h-4" />
                                                                            Email Me These Results
                                                                        </>
                                                                    )}
                                                                </motion.button>
                                                            </div>
                                                        )}
                                                    </motion.div>

                                                    {/* Action Control: Edit and Reset Summary Row */}
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                                                        className="flex flex-col sm:flex-row gap-3 justify-center items-center"
                                                    >
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => {
                                                                setShowReviewOverlay(true);
                                                                setTimeout(() => {
                                                                    formData.setShowReviewPage(true);
                                                                    window.scrollTo(0, 0);
                                                                    setShowReviewOverlay(false);
                                                                }, 2000);
                                                            }}
                                                            className="flex items-center cursor-pointer justify-center gap-2 min-h-12 bg-white border-2 border-primary text-primary hover:bg-primary/10 px-6 py-3 rounded-full font-medium shadow-sm transition-colors text-sm w-full sm:w-auto"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                            Review/Edit All Answers
                                                        </motion.button>

                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => {
                                                                setOriginalLoadedState(null);
                                                                resetSessionAndForm(formData.resetForm);
                                                            }}
                                                            className="flex items-center cursor-pointer justify-center gap-2 min-h-12 bg-white border-2 border-primary text-primary hover:bg-primary/10 px-6 py-3 rounded-full font-medium shadow-sm transition-colors text-sm w-full sm:w-auto"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                            Start New Survey
                                                        </motion.button>
                                                    </motion.div>

                                                    {/* Dashboard / Auth Navigation Link Button */}
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                                                        className="flex justify-center pt-2"
                                                    >
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => {
                                                                if (user) {
                                                                    const targetUrl = '/dashboard';
                                                                    if (typeof window !== 'undefined' && window.__navigationWarning) {
                                                                        const canNavigate = window.__navigationWarning.checkNavigation(targetUrl);
                                                                        if (canNavigate) router.push(targetUrl);
                                                                    } else {
                                                                        router.push(targetUrl);
                                                                    }
                                                                    return;
                                                                }
                                                                if (propertyId) {
                                                                    setPendingSurveyLink(propertyId, '/calculator');
                                                                }
                                                                router.push('/login?returnTo=calculator');
                                                            }}
                                                            className="flex items-center cursor-pointer justify-center gap-2 min-h-12 bg-secondary hover:bg-secondary-focus text-white px-6 py-3 rounded-full font-medium shadow-sm transition-colors text-sm w-full sm:w-auto"
                                                        >
                                                            {user ? (
                                                                <>
                                                                    <Home className="w-4 h-4" />
                                                                    Exit to My Dashboard
                                                                    <ArrowRight className="w-4 h-4" />
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Mail className="w-4 h-4" />
                                                                    Log in to Save Progress
                                                                    <ArrowRight className="w-4 h-4" />
                                                                </>
                                                            )}
                                                        </motion.button>
                                                    </motion.div>
                                                </div>
                                            </motion.div>
                                        </AnimatePresence>
                                    );
                                })();
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
