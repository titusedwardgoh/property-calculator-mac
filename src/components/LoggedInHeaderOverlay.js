"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { LogOut } from 'lucide-react';

export default function LoggedInHeaderOverlay() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNavigatingToDashboard, setIsNavigatingToDashboard] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { user, loading } = useAuth();
    const supabase = createClient();

    // Disable body scroll when menu is open
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (isMenuOpen) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        }
    }, [isMenuOpen]);

    // Clear loading state when navigation to dashboard completes
    useEffect(() => {
        if (pathname === '/dashboard' && isNavigatingToDashboard) {
            setIsNavigatingToDashboard(false);
        }
    }, [pathname, isNavigatingToDashboard]);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            await supabase.auth.signOut();
            router.push('/');
            router.refresh();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Define public pages where normal header should show instead
    const publicPages = ['/', '/about', '/contact', '/faq', '/privacy', '/terms', '/login', '/signup', '/reset-password', '/forgot-password'];
    const isPublicPage = publicPages.includes(pathname);
    
    // Only show overlay when user is logged in AND on protected pages (not public pages, not calculator)
    if (loading || !user || pathname === '/calculator' || isPublicPage) {
        return null;
    }

    return (
        <>
            <header className="fixed top-0 left-0 right-0 bg-base-100 backdrop-blur-sm shadow-sm z-[150]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        {/* Mobile: Logo centered */}
                        <div className="flex-1 flex justify-center md:hidden">
                            <Link href="/dashboard" onClick={() => setIsNavigatingToDashboard(true)} className="flex items-center">
                                <div className="w-12 h-12 flex items-center">
                                    <Image
                                        src="/Icon2.png"
                                        alt="PropWiz"
                                        width={447}
                                        height={444}
                                        className="w-full h-full object-contain"
                                        priority
                                    />
                                </div>
                            </Link>
                        </div>
                        
                        {/* Desktop: Logo on left with nav links */}
                        <div className="hidden md:flex md:items-center md:space-x-2 md:flex-1">
                            <Link href="/dashboard" onClick={() => setIsNavigatingToDashboard(true)} className="flex items-center">
                                <div className="h-12 flex items-center">
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
                            {/* Desktop nav links */}
                            <nav className="flex items-center gap-10 lg:gap-15 font-medium text-md lg:text-lg ml-10 lg:ml-20">
                                <Link
                                    href="/dashboard"
                                    onClick={() => setIsNavigatingToDashboard(true)}
                                    className={`hover:text-primary transition-colors ${
                                        pathname === '/dashboard' ? 'underline underline-offset-6 decoration-2' : ''
                                    }`}
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    href="/settings/account"
                                    className={`hover:text-primary transition-colors ${
                                        pathname.startsWith('/settings') ? 'underline underline-offset-6 decoration-2' : ''
                                    }`}
                                >
                                    Settings
                                </Link>
                            </nav>
                        </div>

                        {/* Desktop: Logout on right */}
                        <div className="hidden md:flex md:items-center md:gap-3">
                            <button
                                onClick={handleLogout}
                                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 cursor-pointer"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>

                        {/* Hamburger button - mobile only */}
                        <button
                            onClick={toggleMenu}
                            className="md:hidden focus:outline-none"
                            aria-label="Toggle menu"
                        >
                            <div className="space-y-1.5">
                                <motion.span
                                    animate={isMenuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                                    className="block h-0.5 w-6 bg-base-content transition-all duration-300"
                                />
                                <motion.span
                                    animate={isMenuOpen ? { opacity: 0 } : { opacity: 1 }}
                                    className="block h-0.5 w-6 bg-base-content transition-all duration-300"
                                />
                                <motion.span
                                    animate={isMenuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                                    className="block h-0.5 w-6 bg-base-content transition-all duration-300"
                                />
                            </div>
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile menu overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={closeMenu}
                            className="fixed top-[73px] left-0 right-0 bottom-0 bg-black bg-opacity-50 z-[200] md:hidden"
                        />
                        
                        {/* Menu drawer */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'tween', duration: 0.3 }}
                            className="fixed top-[73px] right-0 bottom-0 left-0 bg-base-100 shadow-xl z-[200] md:hidden"
                        >
                            <div className="flex flex-col h-full pt-4">
                                {/* Menu items */}
                                <nav className="flex-1 px-6 py-4">
                                    <ul className="space-y-0">
                                        <li>
                                            <Link
                                                href="/dashboard"
                                                onClick={() => {
                                                    closeMenu();
                                                    setIsNavigatingToDashboard(true);
                                                }}
                                                className="block px-4 py-4 text-lg font-medium text-base hover:bg-gray-100 transition-colors border-b border-gray-200"
                                            >
                                                Dashboard
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                href="/settings/account"
                                                onClick={closeMenu}
                                                className="block px-4 py-4 text-lg font-medium text-base hover:bg-gray-100 transition-colors border-b border-gray-200"
                                            >
                                                Settings
                                            </Link>
                                        </li>
                                    </ul>
                                </nav>

                                {/* Logout at bottom */}
                                <div className="px-6 py-4 border-t border-gray-200">
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            closeMenu();
                                        }}
                                        className="w-full text-left block px-4 py-4 text-lg font-medium text-base hover:bg-gray-100 transition-colors flex items-center gap-2"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Loading overlay when navigating to dashboard */}
            {isNavigatingToDashboard && (
                <div className="fixed inset-0 bg-base-100 backdrop-blur-lg z-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading dashboard...</p>
                    </div>
                </div>
            )}
        </>
    );
}

