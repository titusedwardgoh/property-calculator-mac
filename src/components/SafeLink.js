"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function SafeLink({ 
  href, 
  children, 
  className, 
  hasUnsavedChanges, 
  onSave, 
  onDiscard,
  ...props 
}) {
  const router = useRouter();
  const { user } = useAuth();

  const handleClick = async (e) => {
    if (hasUnsavedChanges && href !== window.location.pathname) {
      e.preventDefault();
      
      if (user) {
        // Logged in: ask to save
        const shouldSave = window.confirm(
          'Do you want to save your current survey progress before leaving?'
        );
        if (shouldSave && onSave) {
          await onSave();
        }
      } else {
        // Not logged in: suggest creating account
        const shouldCreateAccount = window.confirm(
          'You\'ll lose all your progress if you leave now. Create an account to save your progress?'
        );
        if (shouldCreateAccount) {
          router.push('/signup');
          return;
        }
      }
      
      // User chose to leave without saving
      if (onDiscard) {
        onDiscard();
      }
    }
    
    // Navigate normally
    router.push(href);
  };

  return (
    <Link href={href} onClick={handleClick} className={className} {...props}>
      {children}
    </Link>
  );
}

