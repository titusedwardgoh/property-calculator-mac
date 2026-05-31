"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Minus, DollarSign, Download, Mail, Edit, Plus, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
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
import Link from 'next/link';

function CalculatorPageContent() {
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
            isLoadingResume
        }
    );
    
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

    // Fresh calculator visit (not resuming) — show welcome when there is no in-progress data
    useEffect(() => {
        if (authLoading) return;
        if (searchParams.get('resume') === 'true') return;
        if (initialWelcomeCheckedRef.current) return;

        initialWelcomeCheckedRef.current = true;
        hasResumedRef.current = false;

        const state = useFormStore.getState();
        const hasFormData =
            state.propertyPrice ||
            state.propertyAddress ||
            state.selectedState ||
            state.buyerType;

        if (!hasFormData) {
            if (state.propertyAddress) {
                updateFormData('propertyAddress', '');
            }
            updateFormData('showWelcomePage', true);
        }
    }, [authLoading, searchParams, updateFormData]);
    
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
        formData.resetForm();
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
                                    style={{ width: `${(() => {
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
                                    })()}%` }}
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
                                                    Summary of Results
                                                </h2>
                                            </motion.div>

                                            {/* Combined Settlement Summary Card */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                                                className="bg-base-200 border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-8"
                                            >
                                                {/* Settlement Section */}
                                                <div className="space-y-6">
                                                    <div>
                                                        <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-0.5">At Settlement</h3>
                                                        <h4 className="text-xl font-bold text-secondary">Upfront Costs</h4>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        {/* Hero: Net Upfront Costs */}
                                                        <div className="md:col-span-3 border-2 border-primary bg-[#E29578]/5 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[130px]">
                                                            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none text-primary">
                                                                <DollarSign className="w-36 h-36" />
                                                            </div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="p-1.5 bg-primary rounded-lg text-white">
                                                                    <DollarSign className="w-4 h-4" />
                                                                </div>
                                                                <span className="text-xs font-bold uppercase tracking-wider text-primary">Net Upfront Costs</span>
                                                            </div>
                                                            <div>
                                                                <p className="text-3xl md:text-4xl font-black tracking-tight text-secondary">
                                                                    {formatCurrency(totalPurchaseCost)}
                                                                </p>
                                                                <p className="text-xs text-gray-500 mt-1">Total cash required at settlement after grants and concessions</p>
                                                            </div>
                                                        </div>

                                                        {/* Deposit (loan) or Property Price (cash) */}
                                                        <div className="bg-[#fef6e4]/40 border border-[#fef6e4] rounded-xl p-5 flex flex-col justify-between min-h-[105px]">
                                                            <div className="flex items-center gap-2 mb-1.5 text-gray-400">
                                                                <Home className="w-4 h-4" />
                                                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                                                    {hasLoan ? 'Deposit Amount' : 'Property Price'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xl font-bold text-secondary">{formatCurrency(depositOrPriceAmount)}</p>
                                                        </div>

                                                        {/* Gross Stamp Duty */}
                                                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 flex flex-col justify-between min-h-[105px]">
                                                            <div className="flex items-center gap-2 mb-1.5 text-gray-400">
                                                                <DollarSign className="w-4 h-4" />
                                                                <span className="text-[10px] font-bold uppercase tracking-wider">Gross Stamp Duty</span>
                                                            </div>
                                                            <p className="text-xl font-bold text-secondary">{formatCurrency(grossStampDutyAmount)}</p>
                                                        </div>

                                                        {/* Other Costs */}
                                                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 flex flex-col justify-between min-h-[105px]">
                                                            <div className="flex items-center gap-2 mb-1.5 text-gray-400">
                                                                <DollarSign className="w-4 h-4" />
                                                                <span className="text-[10px] font-bold uppercase tracking-wider">Other Costs</span>
                                                            </div>
                                                            <p className="text-xl font-bold text-secondary">{formatCurrency(otherCostsAmount)}</p>
                                                        </div>

                                                        {/* Spanning Row Card 2: Offsets Deducted */}
                                                        <div className="md:col-span-3 bg-[#f2FFE5]/40 border border-[#f2FFE5] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className="p-2 bg-emerald-500 text-white rounded-lg shrink-0">
                                                                    <Minus className="w-4 h-4" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Concessions and Grants Deducted</span>
                                                                    <span className="text-xs text-gray-500">Includes all your eligible state concessions and first home buyer grants</span>
                                                                </div>
                                                            </div>
                                                            <p className={`text-xl md:text-2xl font-bold shrink-0 ${grantsConcessionsTotal > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                                {grantsConcessionsTotal > 0 ? `-${formatCurrency(grantsConcessionsTotal)}` : formatCurrency(0)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Ongoing Ownership Section */}
                                                <div className="space-y-6 pt-6 border-t border-gray-100">
                                                    <div>
                                                        <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-0.5">Post-Settlement</h3>
                                                        <h4 className="text-xl font-bold text-secondary">Ongoing Costs</h4>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {/* Monthly Outflow Component */}
                                                        <div className="bg-base-200 border border-gray-100 rounded-xl p-5 flex flex-col justify-between relative">
                                                            <div>
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Monthly Outflow</span>
                                                                <p className="text-2xl md:text-3xl font-black text-secondary mb-2">
                                                                    {formatCurrency(monthlyCashFlow)}<span className="text-xs font-normal text-gray-400"> /mo</span>
                                                                </p>
                                                            </div>
                                                            <p className="text-[11px] text-gray-500 italic bg-gray-50/50 p-2 rounded border border-gray-100/30">
                                                                Includes council rates, water rates, body corporate fees, and loan repayments.
                                                            </p>
                                                        </div>

                                                        {/* Annual Operating Cost Component */}
                                                        <div className="bg-base-200 border border-gray-100 rounded-xl p-5 flex flex-col justify-between relative">
                                                            <div>
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Annualized Cost</span>
                                                                <p className="text-2xl md:text-3xl font-black text-secondary mb-2">
                                                                    {formatCurrency(annualOperatingCost)}<span className="text-xs font-normal text-gray-400"> /yr</span>
                                                                </p>
                                                            </div>
                                                            <p className="text-[11px] text-gray-500 italic bg-gray-50/50 p-2 rounded border border-gray-100/30">
                                                                Annualised council rates, water rates, body corporate fees, and loan repayments.
                                                            </p>
                                                        </div>
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
                                                            <p className="text-sm text-gray-600 mb-4">Your detailed property matrix has been dispatched to {emailSuccessData?.email}</p>
                                                            
                                                            {emailSuccessData?.testingMode && (
                                                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-left">
                                                                    <p className="text-xs text-yellow-800 font-semibold mb-1">📝 Developer Runtime Notice:</p>
                                                                    <p className="text-[11px] text-yellow-700">{emailSuccessData?.reminder || 'Resend validation protocol pending.'}</p>
                                                                </div>
                                                            )}
                                                            
                                                            {emailSuccessData?.emailExists ? (
                                                                <>
                                                                    <p className="text-xs text-gray-500 mb-4">An identified account vector exists for this address. Sign in to sync your calculation sheets.</p>
                                                                    <Link href={`/login?email=${encodeURIComponent(emailSuccessData.email)}&next=/calculator`} className="inline-block">
                                                                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="bg-secondary hover:bg-secondary/90 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs shadow-sm transition-colors mx-auto cursor-pointer">
                                                                            Sign In to Your Account
                                                                        </motion.button>
                                                                    </Link>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <p className="text-xs text-gray-500 mb-4">Want to track these properties over long horizons? Open a persistent record track.</p>
                                                                    <Link href={`/signup?email=${encodeURIComponent(emailSuccessData.email)}`} className="inline-block">
                                                                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs shadow-sm transition-colors mx-auto cursor-pointer">
                                                                            Create My Account
                                                                        </motion.button>
                                                                    </Link>
                                                                </>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                ) : (
                                                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                                                        <motion.button
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            className="flex items-center cursor-pointer justify-center gap-2 bg-primary hover:bg-primary/95 text-white px-6 py-4 rounded-xl font-bold uppercase tracking-wider text-xs shadow-sm transition-all duration-150"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                            Download Full PDF Report
                                                        </motion.button>
                                                        
                                                        <motion.button
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={handleEmailPDF}
                                                            disabled={isEmailingPDF}
                                                            className="flex items-center cursor-pointer justify-center gap-2 bg-base-200 border-2 border-secondary text-secondary hover:bg-secondary/5 px-6 py-4 rounded-xl font-bold uppercase tracking-wider text-xs shadow-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                    className="flex items-center cursor-pointer justify-center gap-2 bg-white border-2 border-primary text-primary hover:bg-primary/10 px-6 py-3 rounded-lg font-medium shadow-sm transition-colors text-sm w-full sm:w-auto"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                    Review/Edit All Answers
                                                </motion.button>
                                                
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => {
                                                        formData.resetForm();
                                                    }}
                                                    className="flex items-center cursor-pointer justify-center gap-2 bg-white border-2 border-primary text-primary hover:bg-primary/10 px-6 py-3 rounded-lg font-medium shadow-sm transition-colors text-sm w-full sm:w-auto"
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
                                                        const targetUrl = user ? '/dashboard' : '/';
                                                        if (typeof window !== 'undefined' && window.__navigationWarning) {
                                                            window.__navigationWarning.checkNavigation(targetUrl);
                                                        }
                                                    }}
                                                    className="flex items-center cursor-pointer justify-center gap-2 bg-secondary hover:bg-secondary-focus text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-colors text-sm w-full sm:w-auto"
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
