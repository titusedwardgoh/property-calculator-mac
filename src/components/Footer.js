"use client";

import React from 'react';
import { Home, Info, HelpCircle, Mail, ExternalLink } from 'lucide-react';
import Link from 'next/link';
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
            <div className="flex items-center gap-2 mb-4">
              <Home className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold text-base-100">PropWiz</h3>
            </div>
            <p className="text-base-100/80 mb-4 max-w-md leading-relaxed">
              Comprehensive property investment calculator for Australian real estate. 
              Calculate stamp duty, LMI, loan repayments, and all associated costs.
            </p>
            <div className="flex gap-4">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-base-100/70 hover:text-primary transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-base-100 mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/about" 
                  onClick={(e) => handleLinkClick(e, '/about')}
                  className="text-base-100/70 hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Info className="w-4 h-4" />
                  <span>About</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/faq" 
                  onClick={(e) => handleLinkClick(e, '/faq')}
                  className="text-base-100/70 hover:text-primary transition-colors flex items-center gap-2"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>FAQ</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  onClick={(e) => handleLinkClick(e, '/contact')}
                  className="text-base-100/70 hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>Contact</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-lg font-semibold text-base-100 mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/privacy" 
                  onClick={(e) => handleLinkClick(e, '/privacy')}
                  className="text-base-100/70 hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  onClick={(e) => handleLinkClick(e, '/terms')}
                  className="text-base-100/70 hover:text-primary transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <a href="#" className="text-base-100/70 hover:text-primary transition-colors">
                  Disclaimer
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-base-100/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-base-100/60 text-sm">
              © 2024 Australian Property Calculator. All rights reserved.
            </p>
            <p className="text-base-100/60 text-sm mt-2 md:mt-0">
              Made to be simple and easy to use 
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
