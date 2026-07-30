"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useFormStore } from '../stores/formStore';
import { useAuth } from '@/hooks/useAuth';
import { useWizardStep } from '@/hooks/useWizardStep';
import { shouldReturnToResultsOnClose } from '@/lib/wizardSteps';
import {
    clearSurveyReturnPath,
    getSurveyExitLoadingMessage,
    resolveSurveyExitPath,
} from '@/lib/surveyReturnPath';
import { useEditSession } from '@/contexts/EditSessionContext';
import SiteHeaderShell from '@/components/SiteHeaderShell';
import { PUBLIC_HEADER_GLASS_STYLE } from '@/lib/loggedInHeaderGlassStyle';
import SurveyLoadingOverlay from '@/components/SurveyLoadingOverlay';

export default function SurveyHeaderOverlay() {
    const router = useRouter();
    const pathname = usePathname();
    const allFormsComplete = useFormStore((state) => state.allFormsComplete);
    const editingFromReview = useFormStore((state) => state.editingFromReview);
    const editSessionActive = useFormStore((state) => state.editSessionActive);
    const updateFormData = useFormStore((state) => state.updateFormData);
    const { user } = useAuth();
    const { step, fromReview, navigateToStep, abortEditAndReturnToResults, WIZARD_STEPS } = useWizardStep();
    const { requestDiscardConfirm } = useEditSession();
    const [isNavigatingAway, setIsNavigatingAway] = useState(false);
    const [isExitPending, setIsExitPending] = useState(false);
    const [navigationDestination, setNavigationDestination] = useState(null);
    const navigationTimeoutRef = useRef(null);
    const isNavigatingAwayRef = useRef(false);

    // Update ref when isNavigatingAway changes
    useEffect(() => {
        isNavigatingAwayRef.current = isNavigatingAway;
    }, [isNavigatingAway]);

    // Clear loading state when navigation completes (pathname changes away from calculator)
    useEffect(() => {
        if (pathname !== '/calculator' && isNavigatingAway) {
            setIsNavigatingAway(false);
            setNavigationDestination(null);
            isNavigatingAwayRef.current = false;
            // Clear safety timeout if navigation completed
            if (navigationTimeoutRef.current) {
                clearTimeout(navigationTimeoutRef.current);
                navigationTimeoutRef.current = null;
            }
        }
    }, [pathname, isNavigatingAway]);

    const clearNavigationTimeout = () => {
        if (navigationTimeoutRef.current) {
            clearTimeout(navigationTimeoutRef.current);
            navigationTimeoutRef.current = null;
        }
    };

    const beginNavigatingAway = (url) => {
        clearNavigationTimeout();
        setIsNavigatingAway(true);
        isNavigatingAwayRef.current = true;
        setNavigationDestination(url);

        // Safety timeout if route change never completes
        navigationTimeoutRef.current = setTimeout(() => {
            if (isNavigatingAwayRef.current) {
                console.warn('Navigation timeout: Clearing loading state after 5 seconds');
                setIsNavigatingAway(false);
                setNavigationDestination(null);
                isNavigatingAwayRef.current = false;
                navigationTimeoutRef.current = null;
            }
        }, 5000);
    };

    const clearExitPending = () => {
        setIsExitPending(false);
    };

    // Expose loading helpers for NavigationWarning when user confirms leaving
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.__surveyHeaderOverlay = {
                startLoadingState: (url) => {
                    beginNavigatingAway(url);
                },
                clearLoadingState: () => {
                    setIsNavigatingAway(false);
                    setNavigationDestination(null);
                    isNavigatingAwayRef.current = false;
                    clearNavigationTimeout();
                },
                clearExitPending,
            };
        }
        return () => {
            if (typeof window !== 'undefined') {
                delete window.__surveyHeaderOverlay;
            }
            clearNavigationTimeout();
        };
    }, []);

    // Only show overlay when on calculator route
    if (pathname !== '/calculator') {
        return null;
    }

    const handleNavigation = (url) => {
        if (typeof window !== 'undefined' && window.__navigationWarning) {
            const canNavigate = window.__navigationWarning.checkNavigation(url);
            if (!canNavigate) {
                // Modal blocks exit — keep survey visible behind it
                return;
            }
        }

        beginNavigatingAway(url);
        clearSurveyReturnPath();
        router.push(url);
    };

    const returnToResults = () => {
        updateFormData('showSummary', true);
        updateFormData('editingFromReview', false);
        updateFormData('showReviewPage', false);
        navigateToStep(WIZARD_STEPS.RESULTS, { from: undefined });
    };

    const handleExitSurvey = () => {
        if (
            shouldReturnToResultsOnClose({
                step,
                allFormsComplete,
                fromReview,
                editingFromReview,
            })
        ) {
            if (editSessionActive && step !== WIZARD_STEPS.RESULTS) {
                requestDiscardConfirm(() => {
                    abortEditAndReturnToResults();
                    clearExitPending();
                });
                return;
            }
            returnToResults();
            clearExitPending();
            return;
        }

        const targetUrl = resolveSurveyExitPath(user);
        handleNavigation(targetUrl);
    };

    const isCloseDisabled = isExitPending || isNavigatingAway;

    const handleClose = () => {
        if (isCloseDisabled) return;
        setIsExitPending(true);
        handleExitSurvey();
    };

    const handleLogoClick = (e) => {
        e.preventDefault();
        if (isCloseDisabled) return;
        setIsExitPending(true);
        handleExitSurvey();
    };

    return (
        <>
        <header
            className="fixed top-0 left-0 right-0 z-[150]"
            style={PUBLIC_HEADER_GLASS_STYLE}
        >
            <SiteHeaderShell>
                {/* Mobile */}
                <div className="flex md:hidden items-center justify-between">
                    <Link href="/" onClick={handleLogoClick} className="flex items-center">
                        <div className="w-28 h-9 flex items-center">
                            <Image
                                src="/icon3.png"
                                alt="Proppers"
                                width={1106}
                                height={1106}
                                className="h-full w-auto object-contain object-left"
                                priority
                            />
                        </div>
                    </Link>
                    <button
                        onClick={handleClose}
                        disabled={isCloseDisabled}
                        className={`focus:outline-none mr-2 ${isCloseDisabled ? 'pointer-events-none cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        aria-label="Close survey"
                        aria-disabled={isCloseDisabled}
                    >
                        <svg
                            className="w-6 h-6 text-base-content"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Desktop — X lines up with floor plan right edge */}
                <div className="hidden md:flex min-h-12 w-full items-center">
                    <div className="flex w-full flex-row items-center">
                        <div className="w-3/5 shrink-0">
                            <Link
                                href="/"
                                onClick={handleLogoClick}
                                className="inline-flex items-center"
                            >
                                <div className="flex h-12 items-center">
                                    <Image
                                        src="/icon3.png"
                                        alt="Proppers"
                                        width={1106}
                                        height={1106}
                                        className="h-full w-auto object-contain"
                                        priority
                                    />
                                </div>
                            </Link>
                        </div>
                        <div className="flex w-2/5 shrink-0 items-center justify-end pr-12">
                            <button
                                onClick={handleClose}
                                disabled={isCloseDisabled}
                                className={`flex items-center justify-center px-3 py-2 focus:outline-none ${isCloseDisabled ? 'pointer-events-none cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                aria-label="Close survey"
                                aria-disabled={isCloseDisabled}
                            >
                                <svg
                                    className="w-6 h-6 text-base-content"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </SiteHeaderShell>
        </header>

        {/* Loading overlay when navigating away from survey */}
        {isNavigatingAway && (
            <SurveyLoadingOverlay
                message={getSurveyExitLoadingMessage(navigationDestination)}
                overlayClassName="!z-[200]"
            />
        )}
    </>
    );
}

