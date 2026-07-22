"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { performLogout } from '@/lib/logout';
import { User, LogOut, ChevronDown, Calculator } from 'lucide-react';
import {
  PUBLIC_HEADER_GLASS_STYLE,
  MOBILE_HEADER_MENU_TOP_CLASS,
  MOBILE_MENU_OVERLAY_STYLE,
} from '@/lib/loggedInHeaderGlassStyle';
import SiteHeaderShell from '@/components/SiteHeaderShell';
import SurveyLoadingOverlay from '@/components/SurveyLoadingOverlay';

const calculatorLinks = [
  {
    href: '/stamp-duty',
    label: 'Stamp Duty Calculator',
    description: 'Estimate state transfer duty and see what banks leave out of settlement costs.',
    icon: Calculator,
  },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCalculatorsOpen, setIsCalculatorsOpen] = useState(false);
  const [isDesktopCalculatorsOpen, setIsDesktopCalculatorsOpen] = useState(false);
  const [isNavigatingToDashboard, setIsNavigatingToDashboard] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const pathname = usePathname();
  const { showLoggedInUI } = useAuth();
  const showLoggedInAuth =
    showLoggedInUI && pathname !== '/reset-password' && pathname !== '/forgot-password';
  const isCalculatorActive = calculatorLinks.some((link) => pathname === link.href);

  // Clear loading state when navigation to dashboard completes
  useEffect(() => {
    if (pathname === '/dashboard' && isNavigatingToDashboard) {
      setIsNavigatingToDashboard(false);
    }
  }, [pathname, isNavigatingToDashboard]);

  useEffect(() => {
    setIsDesktopCalculatorsOpen(false);
    setIsCalculatorsOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await performLogout('/');
  };
  
  // Define public pages where normal header should always show (even when logged in)
  const publicPages = ['/', '/about', '/stamp-duty', '/contact', '/faq', '/privacy', '/terms', '/login', '/signup', '/reset-password', '/forgot-password'];
  const isPublicPage = publicPages.includes(pathname);
  
  // Hide on calculator always; hide on protected routes only after mount so SSR matches first client paint
  const shouldHideHeader =
    pathname === '/calculator' ||
    (hasMounted && showLoggedInUI && !isPublicPage && pathname !== '/calculator');

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsCalculatorsOpen(false);
  };

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  return (
    <>
      <header
        className={`sticky top-0 z-100 relative ${shouldHideHeader ? 'hidden' : ''}`}
        style={PUBLIC_HEADER_GLASS_STYLE}
      >
        <SiteHeaderShell>
          {/* Mobile */}
          <div className="flex md:hidden items-center justify-between">
            <Link href="/" className="flex items-center">
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
              onClick={toggleMenu}
              className="focus:outline-none mr-2"
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

          {/* Desktop — matches SurveyHeaderOverlay column alignment */}
          <div className="relative hidden md:flex min-h-12 w-full items-center">
            <div className="flex w-full flex-row items-center">
              <div className="w-3/5 shrink-0 flex items-center gap-10 lg:gap-12">
                <Link href="/" className="inline-flex items-center">
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
                <nav className="flex items-center gap-8 lg:gap-10 font-medium text-md lg:text-lg">
                  <Link
                    href="/"
                    className={`hover:text-primary transition-colors ${
                      pathname === '/' ? 'underline underline-offset-6 decoration-2' : ''
                    }`}
                  >
                    Home
                  </Link>
                  <div
                    className="relative py-2"
                    onMouseEnter={() => setIsDesktopCalculatorsOpen(true)}
                    onMouseLeave={() => setIsDesktopCalculatorsOpen(false)}
                  >
                    <button
                      type="button"
                      className={`inline-flex items-center gap-1 hover:text-primary transition-colors cursor-pointer ${
                        isCalculatorActive || isDesktopCalculatorsOpen
                          ? 'underline underline-offset-6 decoration-2'
                          : ''
                      }`}
                      aria-haspopup="menu"
                      aria-expanded={isDesktopCalculatorsOpen}
                    >
                      Calculators
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${isDesktopCalculatorsOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isDesktopCalculatorsOpen ? (
                      <div className="absolute left-0 top-full z-50 pt-2">
                        <div
                          role="menu"
                          className="w-[22rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-300 bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.14),0_2px_8px_rgba(15,23,42,0.08)]"
                        >
                          <div className="flex flex-col gap-2">
                            {calculatorLinks.map((link) => {
                              const Icon = link.icon;
                              return (
                                <Link
                                  key={link.href}
                                  href={link.href}
                                  role="menuitem"
                                  onClick={() => setIsDesktopCalculatorsOpen(false)}
                                  className="group rounded-xl bg-gray-100 p-4 transition-colors"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                                      <Icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                      <div className="text-base font-semibold text-gray-900 group-hover:text-primary">
                                        {link.label}
                                      </div>
                                      <p className="mt-1 text-sm leading-relaxed text-gray-500">
                                        {link.description}
                                      </p>
                                    </div>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <Link
                    href="/about"
                    className={`hover:text-primary transition-colors ${
                      pathname === '/about' ? 'underline underline-offset-6 decoration-2' : ''
                    }`}
                  >
                    About
                  </Link>
                  <Link
                    href="/contact"
                    className={`hover:text-primary transition-colors ${
                      pathname === '/contact' ? 'underline underline-offset-6 decoration-2' : ''
                    }`}
                  >
                    Contact
                  </Link>
                </nav>
              </div>
              <div className="w-1/2 shrink-0 -ml-12 flex items-center justify-center">
                <div className="flex w-full max-w-md justify-end pr-12 lg:pr-12">
                  <div className="flex shrink-0 items-center gap-3">
                    {showLoggedInAuth ? (
                      <>
                        <Link
                          href="/dashboard"
                          onClick={() => setIsNavigatingToDashboard(true)}
                          className="px-3 py-2 text-sm font-medium text-primary border border-primary rounded-full hover:bg-primary/10 transition-colors flex items-center gap-2"
                        >
                          <User className="w-4 h-4" />
                          Account
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          onClick={() => {
                            if (pathname === '/reset-password' || pathname === '/forgot-password') {
                              sessionStorage.setItem('fromPasswordReset', 'true');
                            }
                          }}
                          className="px-3 py-2 text-sm font-medium text-primary border border-primary rounded-full hover:bg-primary/10 transition-colors"
                        >
                          Log In
                        </Link>
                        <Link
                          href="/signup"
                          className="px-3 py-2 text-sm font-medium text-secondary bg-primary rounded-full hover:shadow-md hover:bg-primary/90 transition-all duration-200"
                        >
                          Sign Up
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SiteHeaderShell>
      </header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isMenuOpen && !shouldHideHeader && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeMenu}
              className={`fixed ${MOBILE_HEADER_MENU_TOP_CLASS} left-0 right-0 bottom-0 bg-black bg-opacity-50 z-[200] md:hidden`}
            />
            
            {/* Menu drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className={`fixed ${MOBILE_HEADER_MENU_TOP_CLASS} right-0 bottom-0 left-0 shadow-xl z-[200] md:hidden`}
              style={MOBILE_MENU_OVERLAY_STYLE}
            >
              <div className="flex flex-col h-full pt-4">
                {/* Menu items */}
                <nav className="flex-1 px-6 py-4">
                  <ul className="space-y-0">
                    <li>
                      <Link
                        href="/"
                        onClick={closeMenu}
                        className="block px-4 py-4 text-lg font-medium text-base hover:bg-gray-100 transition-colors border-b border-gray-200"
                      >
                        Home
                      </Link>
                    </li>
                    <li className="border-b border-gray-200">
                      <button
                        type="button"
                        onClick={() => setIsCalculatorsOpen((open) => !open)}
                        className="flex w-full items-center justify-between px-4 py-4 text-lg font-medium text-base hover:bg-gray-100 transition-colors"
                        aria-expanded={isCalculatorsOpen}
                      >
                        Calculators
                        <ChevronDown
                          className={`w-5 h-5 transition-transform ${isCalculatorsOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {isCalculatorsOpen ? (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden bg-gray-50"
                          >
                            {calculatorLinks.map((link) => {
                              const Icon = link.icon;
                              return (
                                <li key={link.href}>
                                  <Link
                                    href={link.href}
                                    onClick={closeMenu}
                                    className={`flex items-start gap-3 px-6 py-3 transition-colors hover:bg-gray-100 ${
                                      pathname === link.href ? 'text-primary' : 'text-base-content'
                                    }`}
                                  >
                                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                                      <Icon className="h-4 w-4" />
                                    </span>
                                    <span>
                                      <span className="block text-base font-medium">{link.label}</span>
                                      <span className="mt-0.5 block text-sm text-gray-500">{link.description}</span>
                                    </span>
                                  </Link>
                                </li>
                              );
                            })}
                          </motion.ul>
                        ) : null}
                      </AnimatePresence>
                    </li>
                    <li>
                      <Link
                        href="/about"
                        onClick={closeMenu}
                        className="block px-4 py-4 text-lg font-medium text-base hover:bg-gray-100 transition-colors border-b border-gray-200"
                      >
                        About
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/contact"
                        onClick={closeMenu}
                        className="block px-4 py-4 text-lg font-medium text-base hover:bg-gray-100 transition-colors border-b border-gray-200"
                      >
                        Contact
                      </Link>
                    </li>
                    {showLoggedInAuth ? (
                          // Show Account when logged in (Logout is at bottom), except on reset/forgot password pages
                          <li>
                            <Link
                              href="/dashboard"
                              onClick={() => {
                                closeMenu();
                                setIsNavigatingToDashboard(true);
                              }}
                              className="block px-4 py-4 text-lg font-medium text-base hover:bg-gray-100 transition-colors border-b border-gray-200 flex items-center gap-2"
                            >
                              
                              Account
                            </Link>
                          </li>
                        ) : (
                          // Show Login and Sign Up when not logged in or on reset/forgot password pages
                          <>
                            <li>
                              <Link
                                href="/login"
                                onClick={(e) => {
                                  closeMenu();
                                  // If on reset/forgot password page, set flag to prevent auto-login
                                  if (pathname === '/reset-password' || pathname === '/forgot-password') {
                                    sessionStorage.setItem('fromPasswordReset', 'true');
                                  }
                                }}
                                className="block px-4 py-4 text-lg font-medium text-base hover:bg-gray-100 transition-colors border-b border-gray-200"
                              >
                                Log In
                              </Link>
                            </li>
                            <li>
                              <Link
                                href="/signup"
                                onClick={closeMenu}
                                className="block px-4 py-4 text-lg font-medium text-base hover:bg-gray-100 transition-colors border-b border-gray-200"
                              >
                                Sign Up
                              </Link>
                            </li>
                          </>
                        )}
                  </ul>
                </nav>
                
                {/* Logout at bottom - matches dashboard header style */}
                {showLoggedInAuth && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        closeMenu();
                        handleLogout();
                      }}
                      className="w-full text-left block px-4 py-4 text-lg font-medium text-base hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-5 h-5" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
          </AnimatePresence>

      {/* Loading overlay when navigating to dashboard */}
      {isNavigatingToDashboard && (
        <SurveyLoadingOverlay message="Loading dashboard..." />
      )}
    </>
  );
}