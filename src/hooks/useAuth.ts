import { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { setToken, clearToken, apiFetch, setRefreshToken } from '../api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Load from localStorage + validate session
  useEffect(() => {
    const savedUser = localStorage.getItem('bs_user');
    if (!savedUser) return;
    const parsed = JSON.parse(savedUser);
    setUser(parsed);

    // Validate that the user still exists on the server and sync profile fields
    apiFetch(`/api/social?scope=profiles&action=get&userId=${parsed.id}`).then(async res => {
      if (res.status === 404) {
        // User no longer exists — clear stale session
        setUser(null);
        localStorage.removeItem('bs_user');
        clearToken();
        return;
      }
      if (res.ok) {
        const profile = await res.json();
        // Sync display_name and avatar_icon from server
        if (profile.display_name !== undefined || profile.avatar_icon !== undefined) {
          setUser(prev => prev ? {
            ...prev,
            display_name: profile.display_name || prev.display_name,
            avatar_icon: profile.avatar_icon || prev.avatar_icon,
          } : prev);
        }
      }
    }).catch(() => { /* offline — trust local data */ });
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
        // Verify CSRF state matches what we sent
        if (oauthStateRef.current && event.data.state !== oauthStateRef.current) {
          console.error('OAuth state mismatch — possible CSRF attack');
          return;
        }
        oauthStateRef.current = null;

        const newUser = event.data.user;
        if (event.data.token) {
          setToken(event.data.token);
        }
        handleNewUser(newUser);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleNewUser = (newUser: User) => {
    setUser(newUser);
    setShowAuthModal(false);

    // Check if first time
    const hasSeenRules = localStorage.getItem(`bs_seen_rules_${newUser.id}`);
    if (!hasSeenRules) {
      setShowRulesModal(true);
      localStorage.setItem(`bs_seen_rules_${newUser.id}`, 'true');
    }
  };

  // Store OAuth CSRF state for verification
  const oauthStateRef = useRef<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      const response = await fetch('/api/auth/url');
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url, state } = await response.json();

      // Store state to verify against callback
      oauthStateRef.current = state;

      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
      if (!authWindow) {
        alert('Please allow popups for this site to sign in.');
      }
    } catch (error) {
      console.error('OAuth error:', error);
      alert('Failed to initiate sign in. Please try again.');
    }
  };

  const handleCredentialAuth = (newUser: User, token?: string, refreshToken?: string) => {
    if (token) {
      setToken(token);
    }
    // Store refresh token for Capacitor native (HttpOnly cookie handles web)
    if (refreshToken) {
      setRefreshToken(refreshToken);
    }
    handleNewUser(newUser);
  };

  const handleSignIn = () => {
    setShowAuthModal(true);
  };

  const handleSignOut = async () => {
    // Clear refresh cookie on the server
    try {
      await fetch('/api/auth/session?action=logout', { method: 'POST', credentials: 'include' });
    } catch {
      // Offline — clear locally anyway
    }
    setUser(null);
    clearToken();
  };

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
