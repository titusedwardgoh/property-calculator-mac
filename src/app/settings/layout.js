"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { User, Shield } from 'lucide-react';
import SettingsAuroraLayout from '@/components/SettingsAuroraLayout';
import { LOGGED_IN_HEADER_CLEARANCE_MARGIN_CLASS } from '@/lib/loggedInHeaderGlassStyle';

export default function SettingsLayout({ children }) {
    const pathname = usePathname();

    const menuItems = [
        {
            name: 'Profile',
            href: '/settings/account',
            icon: User
        },
        {
            name: 'Security',
            href: '/settings/security',
            icon: Shield
        }
    ];

    return (
        <SettingsAuroraLayout>
            <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${LOGGED_IN_HEADER_CLEARANCE_MARGIN_CLASS} py-8`}>
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Sidebar Navigation */}
                    <aside className="w-full md:w-64 shrink-0 bg-white border border-base-300 rounded-3xl p-5 md:p-6 shadow-sm">
                        {/* Brand / Logo */}
                        <div className="hidden md:block pb-5 mb-5 border-b border-base-300">
                            <span className="font-extrabold text-2xl tracking-tight select-none">
                                <span className="text-accent">Prop</span>
                                <span className="text-primary">Wiz</span>
                            </span>
                        </div>

                        <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-3 hidden md:block">
                                Account
                            </span>
                            <nav className="flex flex-row md:flex-col gap-2 md:gap-1.5 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0 scrollbar-none">
                                {menuItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href || (item.href === '/settings/account' && pathname === '/settings');
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full md:rounded-xl text-sm font-semibold transition-all relative overflow-hidden shrink-0 ${
                                                isActive
                                                    ? 'bg-accent/10 text-accent'
                                                    : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            {/* Accent vertical line on left (desktop only) */}
                                            {isActive && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-r hidden md:block" />
                                            )}
                                            <Icon className={`w-4 h-4 md:w-5 md:h-5 ${isActive ? 'text-accent' : 'text-gray-400'}`} />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex-1 min-w-0 w-full">
                        {children}
                    </main>
                </div>
            </div>
        </SettingsAuroraLayout>
    );
}
