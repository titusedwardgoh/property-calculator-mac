"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useFormStore } from '../stores/formStore';
import { useAuth } from '@/hooks/useAuth';
import { useWizardStep } from '@/hooks/useWizardStep';
import { shouldReturnToResultsOnClose } from '@/lib/wizardSteps';
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

    // Expose function to clear loading state when navigation is cancelled
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.__surveyHeaderOverlay = {
                clearLoadingState: () => {
                    setIsNavigatingAway(false);
                    setNavigationDestination(null);
                    isNavigatingAwayRef.current = false;
                    // Clear safety timeout when manually clearing loading state
                    if (navigationTimeoutRef.current) {
                        clearTimeout(navigationTimeoutRef.current);
                        navigationTimeoutRef.current = null;
                    }
                }
            };
        }
        return () => {
            if (typeof window !== 'undefined') {
                delete window.__surveyHeaderOverlay;
            }
            // Cleanup timeout on unmount
            if (navigationTimeoutRef.current) {
                clearTimeout(navigationTimeoutRef.current);
            }
        };
    }, []);

    // Only show overlay when on calculator route
    if (pathname !== '/calculator') {
        return null;
    }

    const handleNavigation = (url) => {
        // Clear any existing timeout
        if (navigationTimeoutRef.current) {
            clearTimeout(navigationTimeoutRef.current);
            navigationTimeoutRef.current = null;
        }
        
        // Set loading state and destination before checking navigation warning
        setIsNavigatingAway(true);
        isNavigatingAwayRef.current = true;
        setNavigationDestination(url);
        
        // Set safety timeout to auto-clear loading state after 5 seconds if navigation doesn't complete
        navigationTimeoutRef.current = setTimeout(() => {
            if (isNavigatingAwayRef.current) {
                console.warn('Navigation timeout: Clearing loading state after 5 seconds');
                setIsNavigatingAway(false);
                setNavigationDestination(null);
                isNavigatingAwayRef.current = false;
                navigationTimeoutRef.current = null;
            }
        }, 5000);
        
        // Check if navigation warning should be shown
        if (typeof window !== 'undefined' && window.__navigationWarning) {
            const canNavigate = window.__navigationWarning.checkNavigation(url);
            if (!canNavigate) {
                // Navigation warning will handle showing the modal
                // Keep loading state active - it will show when modal closes and navigation happens
                // The loading overlay will be behind the modal (z-50 vs modal's z-[200])
                // When user confirms/discards, navigation will happen and overlay will be visible
                // Safety timeout will clear it if navigation doesn't happen
                return;
            }
        }
        // Navigate normally
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
                });
                return;
            }
            returnToResults();
            return;
        }

        const targetUrl = user ? '/dashboard' : '/';
        handleNavigation(targetUrl);
    };

    const handleClose = () => {
        handleExitSurvey();
    };

    const handleLogoClick = (e) => {
        e.preventDefault();
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
                                src="/icon2.png"
                                alt="PropWiz"
                                width={447}
                                height={444}
                                className="w-full h-full object-contain object-left"
                                priority
                            />
                        </div>
                    </Link>
                    <button
                        onClick={handleClose}
                        className="focus:outline-none mr-2 cursor-pointer"
                        aria-label="Close survey"
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

                {/* Desktop — mirror WelcomePage columns so X aligns with illustration right edge */}
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
                                        src="/icon2.png"
                                        alt="PropWiz"
                                        width={447}
                                        height={444}
                                        className="h-full w-auto object-contain"
                                        priority
                                    />
                                </div>
                            </Link>
                        </div>
                        <div className="w-1/2 shrink-0 -ml-12 flex items-center justify-center">
                            <div className="flex w-full max-w-md justify-end pr-12 lg:pr-12">
                                <button
                                    onClick={handleClose}
                                    className="flex cursor-pointer items-center justify-center px-3 py-2 focus:outline-none"
                                    aria-label="Close survey"
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
                </div>
            </SiteHeaderShell>
        </header>

        {/* Loading overlay when navigating away from survey */}
        {isNavigatingAway && (
            <SurveyLoadingOverlay
                message={
                    navigationDestination === '/dashboard'
                        ? 'Returning to dashboard...'
                        : 'Returning to home...'
                }
            />
        )}
    </>
    );
}

