"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useFormStore } from '../stores/formStore';
import { useAuth } from '@/hooks/useAuth';

export default function SurveyHeaderOverlay() {
    const router = useRouter();
    const pathname = usePathname();
    const resetForm = useFormStore(state => state.resetForm);
    const { user } = useAuth();
    const [isNavigatingAway, setIsNavigatingAway] = useState(false);
    const [navigationDestination, setNavigationDestination] = useState(null);

    // Clear loading state when navigation completes (pathname changes away from calculator)
    useEffect(() => {
        if (pathname !== '/calculator' && isNavigatingAway) {
            setIsNavigatingAway(false);
            setNavigationDestination(null);
        }
    }, [pathname, isNavigatingAway]);

    // Expose function to clear loading state when navigation is cancelled
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.__surveyHeaderOverlay = {
                clearLoadingState: () => {
                    setIsNavigatingAway(false);
                    setNavigationDestination(null);
                }
            };
        }
        return () => {
            if (typeof window !== 'undefined') {
                delete window.__surveyHeaderOverlay;
            }
        };
    }, []);

    // Only show overlay when on calculator route
    if (pathname !== '/calculator') {
        return null;
    }

    const handleNavigation = (url) => {
        // Set loading state and destination before checking navigation warning
        setIsNavigatingAway(true);
        setNavigationDestination(url);
        
        // Check if navigation warning should be shown
        if (typeof window !== 'undefined' && window.__navigationWarning) {
            const canNavigate = window.__navigationWarning.checkNavigation(url);
            if (!canNavigate) {
                // Navigation warning will handle showing the modal
                // Keep loading state active - it will show when modal closes and navigation happens
                // The loading overlay will be behind the modal (z-50 vs modal's z-[200])
                // When user confirms/discards, navigation will happen and overlay will be visible
                return;
            }
        }
        // Navigate normally
        router.push(url);
    };

    const handleClose = () => {
        // Navigate to dashboard if logged in, home if not
        const targetUrl = user ? '/dashboard' : '/';
        handleNavigation(targetUrl);
    };

    const handleLogoClick = (e) => {
        e.preventDefault();
        // Navigate to dashboard if logged in, home if not
        const targetUrl = user ? '/dashboard' : '/';
        handleNavigation(targetUrl);
    };

    return (
        <>
        <header className="fixed top-0 left-0 right-0 bg-base-100 backdrop-blur-sm shadow-sm z-[150]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    {/* Home icon - left side */}
                    <Link href="/" onClick={handleLogoClick} className="flex items-center">
                        {/* Mobile: Show Icon2.png */}
                        <div className="w-12 h-12 md:hidden flex items-center">
                            <Image
                                src="/Icon2.png"
                                alt="PropWiz"
                                width={447}
                                height={444}
                                className="w-full h-full object-contain"
                                priority
                            />
                        </div>
                        {/* Desktop: Show Icon3.png */}
                        <div className="hidden md:flex md:items-center md:h-12">
                            <Image
                                src="/Icon3.png"
                                alt="PropWiz"
                                width={447}
                                height={444}
                                className="h-full w-auto object-contain"
                                priority
                            />
                        </div>
                    </Link>
                    
                    {/* Close button - right side */}
                    <button
                        onClick={handleClose}
                        className="focus:outline-none cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors"
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
        </header>

        {/* Loading overlay when navigating away from survey */}
        {isNavigatingAway && (
            <div className="fixed inset-0 bg-base-100 backdrop-blur-lg z-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">
                        {navigationDestination === '/dashboard' 
                            ? 'Returning to dashboard...' 
                            : 'Returning to home...'}
                    </p>
                </div>
            </div>
        )}
    </>
    );
}

