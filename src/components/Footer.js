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
    <footer className="bg-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <Link
              href="/"
              onClick={(e) => handleLinkClick(e, '/')}
              className="inline-flex items-center gap-2 mb-4 hover:opacity-90 transition-opacity"
            >
              <Image
                src="/icon.png"
                alt="PropWiz"
                width={40}
                height={40}
                className="w-10 h-10 object-contain"
              />
              <h3 className="text-xl font-bold text-base-200">PropWiz</h3>
            </Link>
            <p className="text-base-200/80 mb-4 max-w-md leading-relaxed">
              Comprehensive calculator for Australian real estate. 
              Calculate stamp duty, LMI, loan repayments, and all associated costs.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-base-200 mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/about" 
                  onClick={(e) => handleLinkClick(e, '/about')}
                  className="text-base-200/70 hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Info className="w-4 h-4" />
                  <span>About</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/faq" 
                  onClick={(e) => handleLinkClick(e, '/faq')}
                  className="text-base-200/70 hover:text-primary transition-colors flex items-center gap-2"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>FAQ</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  onClick={(e) => handleLinkClick(e, '/contact')}
                  className="text-base-200/70 hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>Contact</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-lg font-semibold text-base-200 mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/privacy" 
                  onClick={(e) => handleLinkClick(e, '/privacy')}
                  className="text-base-200/70 hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  onClick={(e) => handleLinkClick(e, '/terms')}
                  className="text-base-200/70 hover:text-primary transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <a href="#" className="text-base-200/70 hover:text-primary transition-colors">
                  Disclaimer
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-base-200/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-base-200/60 text-sm">
              © 2024 PropWiz. All rights reserved.
            </p>
            <p className="text-base-200/60 text-sm mt-2 md:mt-0">
              Made to be simple and easy to use 
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
