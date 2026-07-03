"use client";

import { useEffect, useState } from 'react';
import SurveyLoadingOverlay from '@/components/SurveyLoadingOverlay';
import { LOGOUT_OVERLAY_EVENT } from '@/lib/logout';

export default function LogoutOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showOverlay = () => setVisible(true);
    window.addEventListener(LOGOUT_OVERLAY_EVENT, showOverlay);
    return () => window.removeEventListener(LOGOUT_OVERLAY_EVENT, showOverlay);
  }, []);

  if (!visible) return null;

  return (
    <SurveyLoadingOverlay
      message="Logging you out…"
      overlayClassName="!z-[300]"
    />
  );
}
