"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { LogOut, Settings } from 'lucide-react';

export default function LoggedInHeaderOverlay() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, loading } = useAuth();
    const supabase = createClient();

    // Only show overlay when user is logged in AND not on calculator route
    if (loading || !user || pathname === '/calculator') {
        return null;
    }

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

    return (
        <header className="fixed top-0 left-0 right-0 bg-base-100 backdrop-blur-sm shadow-sm z-[150]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Link href="/dashboard" className="flex items-center">
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
                        <nav className="hidden md:flex items-center gap-10 lg:gap-15 font-medium text-md lg:text-lg ml-10 lg:ml-20">
                            <Link
                                href="/dashboard"
                                className={`hover:text-primary transition-colors ${
                                    pathname === '/dashboard' ? 'underline underline-offset-6 decoration-2' : ''
                                }`}
                            >
                                Home
                            </Link>
                        </nav>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Link
                            href="/settings"
                            className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
                        >
                            <Settings className="w-4 h-4" />
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}

