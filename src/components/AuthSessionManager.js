"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { performLogout } from '@/lib/logout';
import IdleWarningModal from './IdleWarningModal';

export default function AuthSessionManager() {
  const { user } = useAuth();
  const [showIdleWarning, setShowIdleWarning] = useState(false);

  // Handle idle timeout warning
  const handleIdleWarning = () => {
    setShowIdleWarning(true);
  };

  // Handle immediate logout
  const handleLogoutNow = async () => {
    setShowIdleWarning(false);
    await performLogout('/login');
  };

  // Use idle timeout hook
  const { stayLoggedIn } = useIdleTimeout(
    user,
    handleIdleWarning,
    handleLogoutNow
  );

  // Window close logout is disabled - we only log out after inactivity (2 hours)

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

