"use client";

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

    // Only show overlay when on calculator route
    if (pathname !== '/calculator') {
        return null;
    }

    const handleNavigation = (url) => {
        // Check if navigation warning should be shown
        if (typeof window !== 'undefined' && window.__navigationWarning) {
            const canNavigate = window.__navigationWarning.checkNavigation(url);
            if (!canNavigate) {
                // Navigation warning will handle showing the modal
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
                        className="focus:outline-none p-2 hover:bg-gray-100 rounded-full transition-colors"
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
    );
}

