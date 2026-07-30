"use client";

import { useEffect, useLayoutEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import PropertyDetails from '../../components/PropertyDetails';
import BuyerDetails from '../../components/BuyerDetails';
import LoanDetails from '../../components/LoanDetails';
import SellerQuestions from '../../components/SellerQuestions';
import WelcomePage from '../../components/WelcomePage';
import AdditionalQuestions from '../../components/AdditionalQuestions';
import SurveyHeaderOverlay from '../../components/SurveyHeaderOverlay';
import SurveyLoadingScreen, { SurveyLoadingFallback } from '../../components/SurveyLoadingOverlay';
import NavigationWarning from '../../components/NavigationWarning';
import EmailModal from '../../components/EmailModal';
import ResultsSummary from '../../components/ResultsSummary';
import SurveyFloorPlanProgress from '../../components/SurveyFloorPlanProgress';
import { useFormStore } from '../../stores/formStore';
import { useSupabaseSync } from '../../hooks/useSupabaseSync';
import { useAuth } from '../../hooks/useAuth';
import { useStateSelector } from '../../states/useStateSelector.js';
import {
    clearPendingSurveyLink,
    getPendingSurveyLinkPropertyId,
    hasPendingSurveyLink,
} from '../../lib/pendingSurveyLink';
import { getSurveyReturnPath, saveSurveyReturnPath } from '../../lib/surveyReturnPath';
import { resetSessionAndForm, getSessionId, getDeviceId } from '../../lib/sessionManager';
import { markSurveyAbandoned, isSurveyAbandoned } from '../../lib/abandonedSurvey';
import { blobToBase64 } from '../../lib/generateResultsPdf';
import { buildResultsSummary } from '../../lib/resultsSummary/buildResultsSummary';
import { useWizardStep } from '../../hooks/useWizardStep';
import {
    WIZARD_STEPS,
    buildCalculatorUrl,
    computeStepFromFormState,
    hasStartedSurvey,
    resolveWizardStep,
    SUB_COMPLETE,
} from '../../lib/wizardSteps';
import { EditSessionProvider } from '../../contexts/EditSessionContext';

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
    const resumePropertyId =
        searchParams.get('propertyId') ||
        (typeof window !== 'undefined' ? sessionStorage.getItem('resumePropertyId') : null);
    const wantsResume = searchParams.get('resume') === 'true' && Boolean(resumePropertyId);
    const [isLoadingResume, setIsLoadingResume] = useState(wantsResume);
    const [isReturningToDashboard, setIsReturningToDashboard] = useState(false);
    const [isEmailingPDF, setIsEmailingPDF] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showEmailSuccess, setShowEmailSuccess] = useState(false);
    const resultsSummaryRef = useRef(null);
    const [emailSuccessData, setEmailSuccessData] = useState(null);
    const [emailCooldownUntil, setEmailCooldownUntil] = useState(null);
    const [emailCooldownRemaining, setEmailCooldownRemaining] = useState(0);
    const [isStartingNewSurvey, setIsStartingNewSurvey] = useState(false);
    const hasResumedRef = useRef(false);
    const initialWelcomeCheckedRef = useRef(false);
    const freshStartHandledRef = useRef(false);
    const urlLoadHandledRef = useRef(false);
    const stepRedirectHandledRef = useRef(false);

    const { step, fromReview, navigateToStep } = useWizardStep();

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

    // Capture where the user came from so quit can return there (CTA handlers also set this)
    useEffect(() => {
        if (getSurveyReturnPath()) return;
        try {
            const referrer = document.referrer;
            if (!referrer) return;
            const url = new URL(referrer);
            if (url.origin !== window.location.origin) return;
            saveSurveyReturnPath(url.pathname);
        } catch {
            // Ignore malformed referrers
        }
    }, []);

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

    useEffect(() => {
        if (isStartingNewSurvey && step === WIZARD_STEPS.WELCOME && !isLoadingResume) {
            setIsStartingNewSurvey(false);
        }
    }, [isStartingNewSurvey, step, isLoadingResume]);

    // Show loading overlay immediately on resume navigation (before auth / fetch complete)
    useLayoutEffect(() => {
        if (wantsResume) {
            setIsLoadingResume(true);
        }
    }, [wantsResume]);

    // Resume / view a saved survey from the dashboard
    useEffect(() => {
        if (authLoading || !wantsResume || hasResumedRef.current) {
            return;
        }

        hasResumedRef.current = true;
        setIsLoadingResume(true);
        sessionStorage.setItem('resumePropertyId', resumePropertyId);

        fetch('/api/supabase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'loadPropertyById',
                propertyId: resumePropertyId,
                userId: user?.id,
                sessionId: getSessionId(),
                deviceId: getDeviceId(),
            }),
        })
            .then((res) => res.json())
            .then((result) => {
                if (result.success && result.data) {
                    hydrateFromPropertyRecord(result.data);
                    sessionStorage.removeItem('resumePropertyId');

                    const hydrated = useFormStore.getState();
                    const { step: resumeStep, sub: resumeSub } = resolveWizardStep(
                        searchParams,
                        hydrated,
                        { completionStatus: result.data.completion_status }
                    );

                    const urlStep = searchParams.get('step');
                    const urlSub = searchParams.get('sub');
                    const urlAlreadyCorrect =
                        urlStep === resumeStep &&
                        (urlSub == null ||
                            urlSub === String(resumeSub) ||
                            (urlSub === SUB_COMPLETE && resumeSub === SUB_COMPLETE));

                    if (!urlAlreadyCorrect) {
                        router.replace(
                            buildCalculatorUrl({
                                step: resumeStep,
                                sub: resumeSub,
                                propertyId: resumePropertyId,
                                resume: true,
                                from: searchParams.get('from') === 'review' ? 'review' : undefined,
                            }),
                            { scroll: false }
                        );
                    }

                    setIsResumingSurvey(false);

                    setTimeout(() => {
                        setOriginalLoadedState(useFormStore.getState());
                        setIsLoadingResume(false);
                    }, 800);
                } else {
                    console.error('❌ Resume failed - no data in response:', result);
                    hasResumedRef.current = false;
                    setIsLoadingResume(false);
                }
            })
            .catch((error) => {
                console.error('Error loading survey to resume:', error);
                hasResumedRef.current = false;
                setIsLoadingResume(false);
            });
    }, [
        wantsResume,
        resumePropertyId,
        authLoading,
        user?.id,
        searchParams,
        hydrateFromPropertyRecord,
        setOriginalLoadedState,
        router,
    ]);

    // Strip abandoned propertyId from URL so it cannot rehydrate a discarded survey
    useEffect(() => {
        const urlPropertyId = searchParams.get('propertyId');
        if (!urlPropertyId || !isSurveyAbandoned(urlPropertyId)) return;
        router.replace('/calculator', { scroll: false });
    }, [searchParams, router]);

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

        if (
            state.propertyId &&
            isSurveyAbandoned(state.propertyId) &&
            !searchParams.get('step')
        ) {
            resetSessionAndForm(formData.resetForm);
            return;
        }

        if (hasStartedSurvey(state) && !searchParams.get('step')) {
            const { step: inferredStep, sub: inferredSub } = computeStepFromFormState(state);
            router.replace(
                buildCalculatorUrl({
                    step: inferredStep,
                    sub: inferredSub,
                    propertyId: state.propertyId,
                }),
                { scroll: false }
            );
        }
    }, [authLoading, searchParams, formData.resetForm, router]);

    // Reload survey from URL after refresh (propertyId + step in URL, empty store)
    useEffect(() => {
        const urlPropertyId = searchParams.get('propertyId');
        const urlStep = searchParams.get('step');

        if (authLoading) return;
        if (searchParams.get('resume') === 'true') return;
        if (!urlPropertyId || !urlStep || urlStep === WIZARD_STEPS.WELCOME) return;
        if (isSurveyAbandoned(urlPropertyId)) return;

        const state = useFormStore.getState();
        if (state.isRecalculatingResults) return;
        if (state.propertyId === urlPropertyId && hasStartedSurvey(state)) return;
        if (urlLoadHandledRef.current === urlPropertyId) return;

        urlLoadHandledRef.current = urlPropertyId;
        setIsLoadingResume(true);

        fetch('/api/supabase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'loadPropertyById',
                propertyId: urlPropertyId,
                userId: user?.id,
                sessionId: getSessionId(),
                deviceId: getDeviceId(),
            }),
        })
            .then((res) => res.json())
            .then((result) => {
                if (result.success && result.data) {
                    hydrateFromPropertyRecord(result.data);
                    setIsResumingSurvey(false);
                    setTimeout(() => {
                        setOriginalLoadedState(useFormStore.getState());
                        setIsLoadingResume(false);
                    }, 800);
                } else {
                    console.error('Failed to reload survey from URL:', result.error || result);
                    setIsLoadingResume(false);
                }
            })
            .catch((error) => {
                console.error('Error reloading survey from URL:', error);
                setIsLoadingResume(false);
            });
    }, [
        searchParams,
        authLoading,
        user?.id,
        hydrateFromPropertyRecord,
        setOriginalLoadedState,
        setIsResumingSurvey,
    ]);

    // Keep propertyId in the URL once auto-save creates a record (not on welcome)
    useEffect(() => {
        if (!propertyId || isLoadingResume) return;
        if (step === WIZARD_STEPS.WELCOME) return;
        const urlPropertyId = searchParams.get('propertyId');
        const urlStep = searchParams.get('step');
        if (urlPropertyId === propertyId && urlStep && urlStep !== WIZARD_STEPS.WELCOME) return;

        const rawSub = searchParams.get('sub');
        const sub =
            rawSub === SUB_COMPLETE
                ? SUB_COMPLETE
                : parseInt(rawSub || '1', 10) || 1;

        router.replace(
            buildCalculatorUrl({
                step: urlStep && urlStep !== WIZARD_STEPS.WELCOME ? urlStep : step,
                sub,
                propertyId,
                from: fromReview ? 'review' : undefined,
            }),
            { scroll: false }
        );
    }, [propertyId, isLoadingResume, searchParams, step, fromReview, router]);

    // Sync edit-from-review flag for formStore branch guards (URL → store only)
    useEffect(() => {
        if (fromReview && !formData.editingFromReview) {
            updateFormData('editingFromReview', true);
        }
    }, [fromReview, formData.editingFromReview, updateFormData]);

    // Legacy review URLs → Results
    useEffect(() => {
        if (step !== WIZARD_STEPS.REVIEW) return;
        updateFormData('showSummary', true);
        updateFormData('showReviewPage', false);
        navigateToStep(WIZARD_STEPS.RESULTS, { from: undefined });
    }, [step, updateFormData, navigateToStep]);

    // Redirect invalid step once survey data is available
    useEffect(() => {
        if (authLoading || isLoadingResume) return;
        if (searchParams.get('fresh') === 'true') return;
        if (step !== WIZARD_STEPS.WELCOME) return;
        if (!hasStartedSurvey(formData)) return;
        if (stepRedirectHandledRef.current) return;

        stepRedirectHandledRef.current = true;
        const { step: inferredStep, sub: inferredSub } = computeStepFromFormState(formData);
        router.replace(
            buildCalculatorUrl({
                step: inferredStep,
                sub: inferredSub,
                propertyId,
            }),
            { scroll: false }
        );
    }, [authLoading, isLoadingResume, step, formData, propertyId, searchParams, router]);

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

    const showWelcomePage = step === WIZARD_STEPS.WELCOME && !wantsResume;
    const showResultsSummary = step === WIZARD_STEPS.RESULTS;
    const showResumeLoading = wantsResume && (authLoading || isLoadingResume);
    const isSurveyLoading =
        formData.isRecalculatingResults ||
        formData.isResumingSurvey ||
        isLoadingResume ||
        showResumeLoading ||
        isReturningToDashboard ||
        isStartingNewSurvey;
    const surveyLoadingMessage = formData.isRecalculatingResults
        ? 'Recalculating results...'
        : isReturningToDashboard
            ? 'Returning to dashboard...'
            : formData.isResumingSurvey || isLoadingResume || showResumeLoading
                ? 'Loading your survey...'
                : undefined;
    // Block main content while loading; Results mounts fresh after recalculating so entrance animations replay.
    const blockMainContent =
        isReturningToDashboard ||
        isStartingNewSurvey ||
        isLoadingResume ||
        showResumeLoading ||
        formData.isResumingSurvey ||
        formData.isRecalculatingResults;
    const propertyDetailsComplete = formData.propertyDetailsComplete;
    const buyerDetailsComplete = formData.buyerDetailsComplete;
    const needsLoan = formData.needsLoan;
    const loanDetailsComplete = formData.loanDetailsComplete;
    const sellerQuestionsComplete = formData.sellerQuestionsComplete;
    const allFormsComplete = formData.allFormsComplete;
    const editingFromReview = fromReview || formData.editingFromReview;
    const selectedState = formData.selectedState;
    const isACT = formData.isACT;
    const propertyType = formData.propertyType;

    // Subscribe to the active step fields to ensure re-renders
    const propertyDetailsCurrentStep = formData.propertyDetailsCurrentStep;
    const propertyDetailsActiveStep = formData.propertyDetailsActiveStep;
    const buyerDetailsActiveStep = formData.buyerDetailsActiveStep;
    const loanDetailsActiveStep = formData.loanDetailsActiveStep;
    const sellerQuestionsActiveStep = formData.sellerQuestionsActiveStep;



    // Clear recalculating overlay on Results step (ResultsSummary stays unmounted until this clears).
    useEffect(() => {
        if (step !== WIZARD_STEPS.RESULTS || !formData.isRecalculatingResults) return;
        const timer = setTimeout(() => {
            updateFormData('isRecalculatingResults', false);
        }, 2000);
        return () => clearTimeout(timer);
    }, [step, formData.isRecalculatingResults, updateFormData]);

    const handleStartNewSurvey = useCallback(() => {
        setIsStartingNewSurvey(true);
        requestAnimationFrame(() => {
            setOriginalLoadedState(null);
            resetSessionAndForm(formData.resetForm);
            router.replace('/calculator', { scroll: false });
        });
    }, [formData.resetForm, router, setOriginalLoadedState]);

    const handleSave = async (userSaved = false) => {
        // Save will automatically link to user's account if logged in
        // (user_id is already set in saveToSupabase via getSupabaseUserId)
        // userSaved = true when user explicitly clicks "SAVE" in navigation warning
        // Note: saveToSupabase from useSupabaseSync uses formData from the hook's closure
        console.log('💾 handleSave called with userSaved:', userSaved);
        const result = await saveToSupabase(userSaved);
        if (userSaved && useFormStore.getState().editSessionActive) {
            useFormStore.getState().commitEditSession();
            setOriginalLoadedState(useFormStore.getState());
        }
        if (userSaved && result?.propertyId && typeof window !== 'undefined') {
            const latest = useFormStore.getState();
            sessionStorage.setItem('dashboardSavedPropertyId', String(result.propertyId));
            sessionStorage.setItem(
                'dashboardSavedPropertySnapshot',
                JSON.stringify({
                    id: result.propertyId,
                    property_address: latest.propertyAddress || '',
                    property_price: latest.propertyPrice ?? null,
                    selected_state: latest.selectedState || '',
                    completion_status: latest.allFormsComplete ? 'complete' : 'in_progress',
                    completion_percentage: latest.allFormsComplete ? 100 : null,
                    user_saved: true,
                    is_active: true,
                    inspected: false,
                    updated_at: new Date().toISOString(),
                })
            );
        }
        return result;
    };

    const handleDiscard = () => {
        if (formData.editSessionActive) {
            formData.abortEditSession();
            setOriginalLoadedState(useFormStore.getState());
            return;
        }
        if (!user && formData.propertyId) {
            markSurveyAbandoned(formData.propertyId);
        }
        setOriginalLoadedState(null);
        resetSessionAndForm(formData.resetForm);
    };

    // Silent discard when tab closes during an active edit session
    useEffect(() => {
        const onPageHide = () => {
            if (useFormStore.getState().editSessionActive) {
                useFormStore.getState().abortEditSession();
                setOriginalLoadedState(useFormStore.getState());
            }
        };
        window.addEventListener('pagehide', onPageHide);
        return () => window.removeEventListener('pagehide', onPageHide);
    }, [setOriginalLoadedState]);

    const EMAIL_SUCCESS_DISMISS_MS = 8000;
    const EMAIL_COOLDOWN_MS = 60_000;

    useEffect(() => {
        if (!showEmailSuccess) return undefined;

        const timer = setTimeout(() => {
            setShowEmailSuccess(false);
        }, EMAIL_SUCCESS_DISMISS_MS);

        return () => clearTimeout(timer);
    }, [showEmailSuccess]);

    useEffect(() => {
        if (!emailCooldownUntil) {
            setEmailCooldownRemaining(0);
            return undefined;
        }

        const updateRemaining = () => {
            const remaining = Math.max(0, Math.ceil((emailCooldownUntil - Date.now()) / 1000));
            setEmailCooldownRemaining(remaining);
            if (remaining === 0) {
                setEmailCooldownUntil(null);
            }
        };

        updateRemaining();
        const interval = setInterval(updateRemaining, 1000);
        return () => clearInterval(interval);
    }, [emailCooldownUntil]);

    const handleEmailPDF = async () => {
        if (emailCooldownRemaining > 0) return;

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
        if (emailCooldownUntil && Date.now() < emailCooldownUntil) {
            return;
        }

        setIsEmailingPDF(true);

        try {
            if (!resultsSummaryRef.current?.exportPdfBlob) {
                throw new Error('Results summary is not ready to export');
            }

            const { blob, filename } = await resultsSummaryRef.current.exportPdfBlob();
            const pdfBase64 = await blobToBase64(blob);
            const { propertyDisplayAddress } = buildResultsSummary(formData, stateFunctions);

            const response = await fetch('/api/email-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userEmail,
                    pdfBase64,
                    filename,
                    propertyAddress: propertyDisplayAddress,
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
            setEmailCooldownUntil(Date.now() + EMAIL_COOLDOWN_MS);
        } catch (error) {
            console.error('Error sending email:', error);
            alert(`Failed to send email: ${error.message}. Please check the console for details.`);
        } finally {
            setIsEmailingPDF(false);
        }
    };

    return (
        <EditSessionProvider
            saveToSupabase={saveToSupabase}
            setOriginalLoadedState={setOriginalLoadedState}
        >
        <div className="aurora-page-bg min-h-screen">
            {/* Navigation warning for unsaved changes */}
            {/* Only show if logged in AND property address is set */}
            <NavigationWarning
                hasUnsavedChanges={hasUnsavedChanges()}
                allFormsComplete={formData.allFormsComplete}
                onSave={() => handleSave(true)}
                onDiscard={handleDiscard}
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

            {isSurveyLoading && (
                <SurveyLoadingScreen message={surveyLoadingMessage} />
            )}

            {showWelcomePage && !blockMainContent ? (
                <WelcomePage />
            ) : !blockMainContent ? (
                <main className={`container mx-auto max-w-7xl px-3 sm:px-4 pb-4 lg:pb-10 ${showResultsSummary ? 'md:pt-35 max-md:pt-20' : 'md:pt-35 max-md:pt-30'}`}>
                    {/* Progress Bars - Current Form only on desktop; overall replaced by floor plan */}
                    {!showResultsSummary && (
                    <div className="hidden md:block mb-0 md:w-[57%]">
                        <div className="ml-10 space-y-4 md:pt-2">
                            {/* Spacer replaces removed Overall Progress so content stays lower */}
                            <div aria-hidden="true" className="invisible select-none">
                                <h4 className="mb-2 text-sm font-medium lg:text-base">Overall Progress</h4>
                                <div className="h-1 w-full" />
                            </div>

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

                                                if (step === WIZARD_STEPS.ADDITIONAL) {
                                                    const aqFields = formData.additionalQuestionsFields || [];
                                                    if (aqFields.length === 0) return 0;
                                                    const aqStep = formData.additionalQuestionsStep || 1;
                                                    return Math.round(((aqStep - 1) / aqFields.length) * 100);
                                                }

                                                if (step === WIZARD_STEPS.PROPERTY) {
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

                                                } else if (step === WIZARD_STEPS.BUYER) {
                                                    const currentStep = buyerDetailsActiveStep || 1;
                                                    const totalSteps = isACT ? 10 : 7;

                                                    if (formData.buyerDetailsComplete) {
                                                        progress = 100;
                                                    } else {
                                                        progress = ((currentStep - 1) / totalSteps) * 100;
                                                    }
                                                } else if (step === WIZARD_STEPS.LOAN && !loanDetailsComplete) {
                                                    const currentStep = loanDetailsActiveStep || 1;
                                                    const totalSteps = 7;

                                                    progress = ((currentStep - 1) / totalSteps) * 100;
                                                } else if (step === WIZARD_STEPS.LOAN && loanDetailsComplete) {
                                                    progress = 100;
                                                } else if (step === WIZARD_STEPS.SELLER && !sellerQuestionsComplete) {
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
                        <div className={`order-2 md:order-1 ${showResultsSummary ? 'w-full max-w-6xl mx-auto' : 'md:w-3/5'}`}>
                            {(() => {
                                switch (step) {
                                    case WIZARD_STEPS.PROPERTY:
                                        return <PropertyDetails />;
                                    case WIZARD_STEPS.BUYER:
                                        return <BuyerDetails />;
                                    case WIZARD_STEPS.LOAN:
                                        return <LoanDetails />;
                                    case WIZARD_STEPS.SELLER:
                                        return <SellerQuestions />;
                                    case WIZARD_STEPS.ADDITIONAL:
                                        return <AdditionalQuestions />;
                                    case WIZARD_STEPS.RESULTS:
                                        return (
                                            <ResultsSummary
                                                ref={resultsSummaryRef}
                                                formData={formData}
                                                stateFunctions={stateFunctions}
                                                user={user}
                                                router={router}
                                                propertyId={propertyId}
                                                onEmailPDF={handleEmailPDF}
                                                isEmailingPDF={isEmailingPDF}
                                                showEmailSuccess={showEmailSuccess}
                                                emailSuccessData={emailSuccessData}
                                                emailCooldownRemaining={emailCooldownRemaining}
                                                setOriginalLoadedState={setOriginalLoadedState}
                                                onStartNewSurvey={handleStartNewSurvey}
                                                onSaveSurvey={() => handleSave(true)}
                                            />
                                        );
                                    default:
                                        return null;
                                }
                            })()}
                        </div>

                        {!showResultsSummary &&
                        (step === WIZARD_STEPS.PROPERTY ||
                            step === WIZARD_STEPS.BUYER ||
                            step === WIZARD_STEPS.LOAN ||
                            step === WIZARD_STEPS.SELLER) ? (
                            <div className="order-1 mb-8 hidden md:sticky md:top-40 md:order-2 md:mb-0 md:mt-8 md:flex md:w-2/5 md:justify-end md:pl-16 md:pr-12 lg:pl-24">
                                <SurveyFloorPlanProgress className="shrink-0" />
                            </div>
                        ) : null}
                    </div>
                </main>
            ) : null}

            {/* Email Modal */}
            <EmailModal
                isOpen={showEmailModal}
                onClose={() => setShowEmailModal(false)}
                onEmailSubmit={handleEmailModalSubmit}
                propertyId={propertyId}
            />
        </div>
        </EditSessionProvider>
    )
}

export default function CalculatorPage() {
    return (
        <Suspense fallback={<SurveyLoadingFallback message="Loading calculator..." />}>
            <CalculatorPageContent />
        </Suspense>
    );
}
