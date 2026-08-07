"use client";

import React from 'react';
import { Info, HelpCircle, Mail } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  
  // Check if we're on calculator page and need to intercept navigation
  const handleLinkClick = (e, href) => {
    if (pathname === '/calculator' && typeof window !== 'undefined' && window.__navigationWarning) {
      const canNavigate = window.__navigationWarning.checkNavigation(href);
      if (!canNavigate) {
        e.preventDefault();
        return;
      }
    }
  };
  return (
    <footer className="relative z-20 w-full bg-gray-100 border-t border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          {/* Brand Section */}
          <div className="max-w-sm shrink-0 lg:max-w-xs xl:max-w-sm">
            <Link
              href="/"
              onClick={(e) => handleLinkClick(e, '/')}
              className="inline-flex items-center gap-2 mb-4 hover:opacity-90 transition-opacity"
            >
              <Image
                src="/icon3.png"
                alt="Proppers"
                width={1106}
                height={1106}
                className="w-10 h-10 object-contain"
              />
              <h3 className="text-xl font-bold leading-none">
                <span className="text-primary">Prop</span>
                <span className="text-secondary">pers</span>
              </h3>
            </Link>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Know the true cost of any Australian property before you commit. No spreadsheets, no surprises.
            </p>
          </div>

          {/* Link columns — grouped tighter, pulled away from brand */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-4 sm:gap-x-10 lg:gap-x-12">
          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-secondary mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/about" 
                  onClick={(e) => handleLinkClick(e, '/about')}
                  className="text-gray-600 hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Info className="w-4 h-4" />
                  <span>About</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/faq" 
                  onClick={(e) => handleLinkClick(e, '/faq')}
                  className="text-gray-600 hover:text-primary transition-colors flex items-center gap-2"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>FAQ</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  onClick={(e) => handleLinkClick(e, '/contact')}
                  className="text-gray-600 hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>Contact</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Calculators */}
          <div>
            <h4 className="text-lg font-semibold text-secondary mb-4">Calculators</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/stamp-duty"
                  onClick={(e) => handleLinkClick(e, '/stamp-duty')}
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  Stamp Duty
                </Link>
              </li>
              <li>
                <Link
                  href="/grants-and-concessions"
                  onClick={(e) => handleLinkClick(e, '/grants-and-concessions')}
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  Grants and Concessions
                </Link>
              </li>
              <li>
                <Link
                  href="/home-loan"
                  onClick={(e) => handleLinkClick(e, '/home-loan')}
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  Home Loan
                </Link>
              </li>
            </ul>
          </div>

          {/* Guides */}
          <div>
            <h4 className="text-lg font-semibold text-secondary mb-4">Guides</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/guides/stamp-duty"
                  onClick={(e) => handleLinkClick(e, '/guides/stamp-duty')}
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  Stamp Duty
                </Link>
              </li>
              <li>
                <Link
                  href="/guides/grants-and-concessions"
                  onClick={(e) => handleLinkClick(e, '/guides/grants-and-concessions')}
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  Grants &amp; Concessions
                </Link>
              </li>
              <li>
                <Link
                  href="/guides/choosing-a-home-loan"
                  onClick={(e) => handleLinkClick(e, '/guides/choosing-a-home-loan')}
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  Choosing a Home Loan
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-lg font-semibold text-secondary mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/privacy" 
                  onClick={(e) => handleLinkClick(e, '/privacy')}
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  onClick={(e) => handleLinkClick(e, '/terms')}
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  href="/disclaimer" 
                  onClick={(e) => handleLinkClick(e, '/disclaimer')}
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              © 2025 Proppers. All rights reserved.
            </p>
            <p className="text-gray-500 text-sm mt-2 md:mt-0">
              Built for Australian property buyers 
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
