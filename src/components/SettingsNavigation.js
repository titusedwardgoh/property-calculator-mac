"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SettingsNavigation() {
    const pathname = usePathname();

    // Only show on settings pages
    if (!pathname?.startsWith('/settings')) {
        return null;
    }

    return (
        <nav className="sticky top-[73px] z-[140] border-b border-white/15 bg-accent">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex space-x-8">
                    <Link
                        href="/settings/account"
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            pathname === '/settings/account' || pathname === '/settings'
                                ? 'border-white text-white'
                                : 'border-transparent text-white/70 hover:border-white/40 hover:text-white'
                        }`}
                    >
                        Account
                    </Link>
                    <Link
                        href="/settings/security"
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            pathname === '/settings/security'
                                ? 'border-white text-white'
                                : 'border-transparent text-white/70 hover:border-white/40 hover:text-white'
                        }`}
                    >
                        Security
                    </Link>
                </div>
            </div>
        </nav>
    );
}

