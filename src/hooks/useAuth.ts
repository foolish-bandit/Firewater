import { useState, useEffect } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/react';
import { User } from '../types';
import { setClerkTokenGetter } from '../api';

export function useAuth() {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { getToken } = useClerkAuth();
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Wire up Clerk token getter for API calls
  useEffect(() => {
    setClerkTokenGetter(getToken);
  }, [getToken]);

  // Derive app user from Clerk user
  const user: User | null =
    isLoaded && isSignedIn && clerkUser
      ? {
          id: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress || '',
          name:
            clerkUser.fullName ||
            [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
            'User',
          picture: clerkUser.imageUrl || '',
          display_name: clerkUser.fullName || undefined,
        }
      : null;

  // Check first-time rules modal
  useEffect(() => {
    if (!user) return;
    const hasSeenRules = localStorage.getItem(`bs_seen_rules_${user.id}`);
    if (!hasSeenRules) {
      setShowRulesModal(true);
      localStorage.setItem(`bs_seen_rules_${user.id}`, 'true');
    }
  }, [user?.id]);

  // Clerk components handle sign-in/sign-out; these are kept for interface compat
  const handleSignIn = () => setShowAuthModal(true);
  const handleGoogleSignIn = async () => {};
  const handleCredentialAuth = () => {};
  const handleSignOut = async () => {};

  return {
    user,
    handleSignIn,
    handleGoogleSignIn,
    handleCredentialAuth,
    handleSignOut,
    showRulesModal,
    setShowRulesModal,
    showAuthModal,
    setShowAuthModal,
  };
}
