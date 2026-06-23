"use client";

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import {
  hasPendingSurveyLink,
  clearPendingSurveyLink,
  isAuthFlowPath,
} from '@/lib/pendingSurveyLink';

export default function PendingSurveyLinkGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [pendingHref, setPendingHref] = useState(null);

  useEffect(() => {
    setActive(hasPendingSurveyLink() && isAuthFlowPath(pathname));
  }, [pathname]);

  const confirmLeave = useCallback(() => {
    const href = pendingHref;
    clearPendingSurveyLink();
    setShowWarning(false);
    setPendingHref(null);
    setActive(false);

    if (href === '__back__') {
      window.history.go(-2);
      return;
    }
    if (href) {
      router.push(href);
    }
  }, [pendingHref, router]);

  const cancelLeave = useCallback(() => {
    setShowWarning(false);
    setPendingHref(null);
  }, []);

  useEffect(() => {
    if (!active) return;

    const onLinkClick = (event) => {
      const anchor = event.target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      let target;
      try {
        target = new URL(href, window.location.origin);
      } catch {
        return;
      }

      if (target.origin !== window.location.origin) return;
      if (isAuthFlowPath(target.pathname)) return;

      event.preventDefault();
      event.stopPropagation();
      setPendingHref(`${target.pathname}${target.search}`);
      setShowWarning(true);
    };

    document.addEventListener('click', onLinkClick, true);
    return () => document.removeEventListener('click', onLinkClick, true);
  }, [active]);

  useEffect(() => {
    if (!active) return;

    const marker = { pendingSurveyLinkGuard: true };
    window.history.pushState(marker, '');

    const onPopState = () => {
      window.history.pushState(marker, '');
      setPendingHref('__back__');
      setShowWarning(true);
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [active]);

  if (!active) return null;

  return (
    <AnimatePresence>
      {showWarning ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={cancelLeave}
            className="fixed inset-0 bg-black/50 z-[200]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="bg-primary/10 px-8 pt-8 pb-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900">Leave without saving?</h3>
                  <button
                    type="button"
                    onClick={cancelLeave}
                    className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="px-8 py-6">
                <p className="text-gray-600 text-base mb-6">
                  If you leave now, your survey won&apos;t be linked to your account when you log in
                  later. Return to the calculator and choose &quot;Log in to Save&quot; again to
                  save it.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={cancelLeave}
                    className="flex-1 cursor-pointer border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-6 py-3 rounded-full font-medium transition-all duration-200"
                  >
                    Stay &amp; Log In
                  </button>
                  <button
                    type="button"
                    onClick={confirmLeave}
                    className="flex-1 cursor-pointer bg-primary hover:bg-primary/90 text-secondary px-6 py-3 rounded-full font-medium transition-all duration-200 hover:shadow-lg"
                  >
                    Leave Anyway
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
