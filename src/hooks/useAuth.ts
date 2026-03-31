import { useState, useEffect } from 'react';
import { User } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('bs_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('bs_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('bs_user');
    }
  }, [user]);

  // OAuth Message Listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (origin !== window.location.origin) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        // Verify CSRF state parameter
        const expectedState = sessionStorage.getItem('oauth_state');
        const receivedState = event.data.state;

        if (!expectedState || !receivedState || expectedState !== receivedState) {
          console.error('OAuth state mismatch - possible CSRF attack');
          sessionStorage.removeItem('oauth_state');
          return;
        }

        // State verified, clean up
        sessionStorage.removeItem('oauth_state');

        const newUser = event.data.user;
        setUser(newUser);

        // Check if first time
        const hasSeenRules = localStorage.getItem(`bs_seen_rules_${newUser.id}`);
        if (!hasSeenRules) {
          setShowRulesModal(true);
          localStorage.setItem(`bs_seen_rules_${newUser.id}`, 'true');
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleSignIn = async () => {
    try {
      // Generate cryptographically random state for CSRF protection
      const stateArray = new Uint8Array(16);
      crypto.getRandomValues(stateArray);
      const state = Array.from(stateArray, b => b.toString(16).padStart(2, '0')).join('');

      // Store state in sessionStorage for verification after callback
      sessionStorage.setItem('oauth_state', state);

      const response = await fetch(`/api/auth/url?state=${encodeURIComponent(state)}`);
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();

      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
      if (!authWindow) {
        alert('Please allow popups for this site to sign in.');
      }
    } catch (error) {
      console.error('OAuth error:', error);
      alert('Failed to initiate sign in. Please try again.');
    }
  };

  const handleSignOut = () => {
    setUser(null);
  };

  return { user, handleSignIn, handleSignOut, showRulesModal, setShowRulesModal };
}
