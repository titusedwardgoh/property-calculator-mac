"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  
  // Hide header when on calculator route (simplified overlay is shown instead)
  const shouldHideHeader = pathname === '/calculator';

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
              {/* Auth buttons */}
              <div className="flex items-center gap-3 mr-4">
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
              className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
            />
            
            {/* Menu drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 bottom-0 left-0 bg-base-100 shadow-xl z-50 md:hidden"
            >
              <div className="flex flex-col h-full">
                {/* Menu header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-base">Menu</h2>
                  <button
                    onClick={closeMenu}
                    className="focus:outline-none"
                    aria-label="Close menu"
                  >
                    <svg className="w-6 h-6 text-base" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

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
                  </ul>
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
} 