"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { useWindowCloseLogout } from '@/hooks/useWindowCloseLogout';
import { createClient } from '@/lib/supabase/client';
import IdleWarningModal from './IdleWarningModal';

export default function AuthSessionManager() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [showIdleWarning, setShowIdleWarning] = useState(false);

  // Handle idle timeout warning
  const handleIdleWarning = () => {
    setShowIdleWarning(true);
  };

  // Handle immediate logout
  const handleLogoutNow = async () => {
    setShowIdleWarning(false);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      router.push('/login');
    }
  };

  // Use idle timeout hook
  const { stayLoggedIn } = useIdleTimeout(
    user,
    handleIdleWarning,
    handleLogoutNow
  );

  // Use window close logout hook
  useWindowCloseLogout(user);

  // Handle stay logged in from modal
  const handleModalStayLoggedIn = () => {
    stayLoggedIn();
    setShowIdleWarning(false);
  };

  return (
    <IdleWarningModal
      isOpen={showIdleWarning}
      onStayLoggedIn={handleModalStayLoggedIn}
      onLogoutNow={handleLogoutNow}
    />
  );
}

