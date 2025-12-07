"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { User, LogOut } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const supabase = createClient();

  // Re-check auth state when pathname changes (e.g., after login redirect)
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // This will trigger the useAuth hook to update via onAuthStateChange
      // We just need to ensure the session is checked
    };
    checkAuth();
  }, [pathname, supabase]);

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
  
  // Define public pages where normal header should always show (even when logged in)
  const publicPages = ['/', '/about', '/contact', '/faq', '/privacy', '/terms', '/login', '/signup'];
  const isPublicPage = publicPages.includes(pathname);
  
  // Hide header only on calculator route (simplified overlay is shown instead)
  // On public pages, always show the normal header (even if logged in)
  // On protected pages (dashboard, settings), LoggedInHeaderOverlay will be shown instead
  const shouldHideHeader = pathname === '/calculator' || (user && !isPublicPage && pathname !== '/calculator');

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Disable body scroll when menu is open
  if (typeof window !== 'undefined') {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  return (
    <>
      <header
        className={`bg-base-100 backdrop-blur-sm shadow-sm sticky top-0 z-100 ${shouldHideHeader ? 'md:invisible md:pointer-events-none md:opacity-0' : ''}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Link href="/" className="flex items-center">
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
              {/* Desktop nav links */}
              <nav className="hidden md:flex items-center gap-10 lg: gap-15 font-medium text-md lg:text-lg ml-10 lg:ml-20">
                <Link
                  href="/"
                  className={`hover:text-primary transition-colors ${
                    pathname === '/' ? 'underline underline-offset-6 decoration-2' : ''
                  }`}
                >
                  Home
                </Link>
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
            
            <div className="flex items-center">
              {/* Auth buttons - desktop only */}
              <div className="hidden md:flex items-center gap-3 mr-4">
                {loading ? (
                  // Show nothing while loading
                  null
                ) : user ? (
                  // Show Account and Logout when logged in
                  <>
                    <Link
                      href="/dashboard"
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
                  // Show Login and Sign Up when not logged in
                  <>
                     <Link
                       href="/login"
                       className="px-3 py-2 text-sm font-medium text-primary border border-primary rounded-full hover:bg-primary/10 transition-colors"
                     >
                       Log In
                     </Link>
                     <Link
                       href="/signup"
                       className="px-3 py-2 text-sm font-medium text-secondary bg-primary rounded-full hover:bg-primary/90 transition-colors"
                     >
                       Sign Up
                     </Link>
                  </>
                )}
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
        </div>
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
                        href="/"
                        onClick={closeMenu}
                        className="block px-4 py-4 text-lg font-medium text-base hover:bg-gray-100 transition-colors border-b border-gray-200"
                      >
                        Home
                      </Link>
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
                    {!loading && (
                      <>
                        {user ? (
                          // Show Account when logged in (Logout is at bottom)
                          <li>
                            <Link
                              href="/dashboard"
                              onClick={closeMenu}
                              className="block px-4 py-4 text-lg font-medium text-base hover:bg-gray-100 transition-colors border-b border-gray-200 flex items-center gap-2"
                            >
                              
                              Account
                            </Link>
                          </li>
                        ) : (
                          // Show Login and Sign Up when not logged in
                          <>
                            <li>
                              <Link
                                href="/login"
                                onClick={closeMenu}
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
                      </>
                    )}
                  </ul>
                </nav>
                
                {/* Logout at bottom - matches dashboard header style */}
                {!loading && user && (
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
    </>
  );
} 