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
        <nav className="bg-base-100 border-b border-gray-200 sticky top-[73px] z-[140]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex space-x-8">
                    <Link
                        href="/settings/account"
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            pathname === '/settings/account' || pathname === '/settings'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Account
                    </Link>
                    <Link
                        href="/settings/security"
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            pathname === '/settings/security'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Security
                    </Link>
                </div>
            </div>
        </nav>
    );
}

