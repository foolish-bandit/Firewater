import React, { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation, Link, Navigate as RouterNavigate } from 'react-router-dom';
import { List as ListIcon, X, Plus, Menu, Shield, User as UserIcon, Search, Home, ChevronDown, Rss, GitCompareArrows, Sun, Moon, WifiOff } from 'lucide-react';
import { Liquor } from './data';
import SubmitLiquorModal from './components/SubmitLiquorModal';
import BarcodeScanner, { BarcodeScanResult } from './components/BarcodeScanner';
import { saveUpcMapping } from './services/upcService';
import HomeView from './components/HomeView';
import CatalogView from './components/CatalogView';
import DetailView from './components/DetailView';
import ListsView from './components/ListsView';
import ProfileView from './components/ProfileView';
import FeedView from './components/FeedView';

const CompareView = React.lazy(() => import('./components/CompareView'));
const RecommendView = React.lazy(() => import('./components/RecommendView'));
const AdminPanel = React.lazy(() => import('./components/AdminPanel'));
import UserSearch from './components/UserSearch';
import AuthModal from './components/AuthModal';
import { ToastStack } from './components/Toast';
import InstallPrompt from './components/InstallPrompt';
import { PageSkeleton } from './components/SkeletonCard';
import TermsPage from './components/TermsPage';
import PrivacyPage from './components/PrivacyPage';
import EulaPage from './components/EulaPage';
import AcceptableUsePage from './components/AcceptableUsePage';
import NotFoundPage from './components/NotFoundPage';
import { useLiquorLists } from './hooks/useLiquorLists';
import { useReviews } from './hooks/useReviews';
import { useAuth } from './hooks/useAuth';
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/react"
import { useCustomLiquors } from './hooks/useCustomLiquors';
import { useToast } from './hooks/useToast';
import { useAdmin } from './hooks/useAdmin';
import { useTheme } from './hooks/useTheme';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { PhotoProvider } from './contexts/PhotoContext';
import ChatBubble from './components/ChatBubble';

// --- Main App Component ---

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [barcodePrefill, setBarcodePrefill] = useState<{ name: string; details: string; upc: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showFooterLinks, setShowFooterLinks] = useState(false);
  const [ageVerified, setAgeVerified] = useState(() => localStorage.getItem('bs_age_verified') === 'true');
  const [ageCheckbox, setAgeCheckbox] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    document.body.style.overflow = 'hidden';
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  const handleAgeVerify = () => {
    localStorage.setItem('bs_age_verified', 'true');
    setAgeVerified(true);
  };

  const { user, handleSignIn, handleGoogleSignIn, handleCredentialAuth, handleSignOut, showRulesModal, setShowRulesModal, showAuthModal, setShowAuthModal } = useAuth();
  const { toasts, showToast, dismissToast } = useToast();
  const { wantToTry, tried, toggleWantToTry, toggleTried } = useLiquorLists(user, showToast);
  const { reviews, addReview, editReview, deleteReview, getReviewsForLiquor } = useReviews(user, showToast);
  const { allLiquors, handleAddLiquor } = useCustomLiquors();
  const { isAdmin } = useAdmin(user);
  const isOnline = useOnlineStatus();

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const toggleWantToTryWithToast = useCallback((id: string) => {
    const removing = wantToTry.includes(id);
    toggleWantToTry(id);
    showToast(removing ? 'Removed from wishlist' : 'Added to wishlist');
  }, [wantToTry, toggleWantToTry, showToast]);

  const toggleTriedWithToast = useCallback((id: string) => {
    const removing = tried.includes(id);
    toggleTried(id);
    showToast(removing ? 'Removed from tried' : 'Marked as tried');
  }, [tried, toggleTried, showToast]);

  const addReviewWithToast = useCallback((review: Parameters<typeof addReview>[0]) => {
    addReview(review);
    showToast('Review posted');
  }, [addReview, showToast]);

  const onAddLiquor = (newLiquor: Liquor) => {
    const resultId = handleAddLiquor(newLiquor);
    setShowSubmitModal(false);
    navigate(`/liquor/${resultId}`);
    showToast('Liquor submitted');
  };

  const handleBarcodeScanResult = (result: BarcodeScanResult) => {
    setShowBarcodeScanner(false);
    if (result.type === 'match') {
      navigate(`/liquor/${result.liquorId}`);
    } else if (result.type === 'prefill') {
      const details = [result.brand, result.description].filter(Boolean).join('. ');
      setBarcodePrefill({ name: result.productName, details, upc: result.upc });
      setShowSubmitModal(true);
    } else if (result.type === 'manual-entry') {
      setBarcodePrefill({ name: '', details: '', upc: result.upc });
      setShowSubmitModal(true);
    }
  };

  const handleAddLiquorWithUpc = (newLiquor: Liquor, upc?: string) => {
    onAddLiquor(newLiquor);
    if (upc) {
      saveUpcMapping(upc, newLiquor.id);
    }
  };


  if (!ageVerified) {
    return (
      <div className="min-h-screen bg-[#141210] flex items-center justify-center p-4">
        <div className="bg-[#1A1816] vintage-border p-6 md:p-10 max-w-lg w-full shadow-2xl text-center">
          <div className="w-16 h-16 rounded-full vintage-border flex items-center justify-center mx-auto mb-6 overflow-hidden p-1">
            <img src="/logo.svg" alt="FIREWATER Logo" className="w-full h-full object-contain" />
          </div>
          <p className="micro-label mb-2 text-[#C89B3C]">Age Verification Required</p>
          <h1 className="font-serif text-3xl md:text-4xl font-normal text-[#EAE4D9] mb-4">Welcome to FIREWATER</h1>
          <div className="w-12 h-px bg-[#C89B3C]/50 mx-auto mb-6"></div>
          <p className="text-[#EAE4D9]/70 text-sm leading-relaxed mb-8">
            This website contains information about alcoholic beverages. You must be <strong className="text-[#C89B3C]">21 years of age or older</strong> to access this site. By entering, you agree that you are of legal drinking age in your jurisdiction.
          </p>

          <label className="flex items-center justify-center gap-3 cursor-pointer group mb-8">
            <input
              type="checkbox"
              checked={ageCheckbox}
              onChange={(e) => setAgeCheckbox(e.target.checked)}
              className="w-5 h-5 accent-[#C89B3C] cursor-pointer flex-shrink-0"
            />
            <span className="text-sm text-[#EAE4D9]/80 group-hover:text-[#EAE4D9] transition-colors">
              I confirm that I am <strong className="text-[#C89B3C]">21 years of age or older</strong>
            </span>
          </label>

          <button
            onClick={handleAgeVerify}
            disabled={!ageCheckbox}
            className="w-full bg-transparent vintage-border hover:bg-[#C89B3C] hover:text-[#141210] hover:border-[#C89B3C] text-[#C89B3C] font-semibold tracking-widest uppercase py-4 transition-all duration-300 text-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#C89B3C] disabled:hover:border-[var(--color-vintage-border)]"
          >
            Enter Site
          </button>

          <p className="text-[#EAE4D9]/30 text-xs mt-6">
            Please drink responsibly. If you are not of legal drinking age, please exit this site.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PhotoProvider>
    <div className="min-h-screen bg-[var(--color-vintage-bg)] text-[var(--color-vintage-text)] font-sans selection:bg-[#C89B3C]/30">
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 glass-surface vintage-border-b transition-all duration-300 ${scrolled ? 'shadow-[0_4px_30px_rgba(0,0,0,0.4)]' : ''}`} ref={mobileMenuRef}>
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 rounded-full vintage-border flex items-center justify-center group-hover:border-[#C89B3C] transition-colors overflow-hidden p-1">
              <img src="/logo.svg" alt="FIREWATER Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-serif text-2xl font-bold tracking-widest text-[#EAE4D9] uppercase">FIREWATER</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex gap-6 items-center">
            {user && (
              <button
                onClick={() => navigate('/feed')}
                className={`relative text-xs font-semibold tracking-widest uppercase transition-colors flex items-center gap-2 py-1 ${location.pathname === '/feed' ? 'text-[#C89B3C]' : 'text-[#EAE4D9]/60 hover:text-[#EAE4D9]'}`}
              >
                <Rss size={14} /> Feed
                {location.pathname === '/feed' && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#C89B3C]" />}
              </button>
            )}
            <button
              onClick={() => navigate('/catalog')}
              className={`relative text-xs font-semibold tracking-widest uppercase transition-colors py-1 ${location.pathname === '/catalog' ? 'text-[#C89B3C]' : 'text-[#EAE4D9]/60 hover:text-[#EAE4D9]'}`}
            >
              Catalog
              {location.pathname === '/catalog' && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#C89B3C]" />}
            </button>
            <button
              onClick={() => navigate('/lists')}
              className={`relative text-xs font-semibold tracking-widest uppercase transition-colors flex items-center gap-2 py-1 ${location.pathname === '/lists' ? 'text-[#C89B3C]' : 'text-[#EAE4D9]/60 hover:text-[#EAE4D9]'}`}
            >
              <ListIcon size={14} /> My Lists
              {location.pathname === '/lists' && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#C89B3C]" />}
            </button>
            <button
              onClick={() => navigate('/compare')}
              className={`relative text-xs font-semibold tracking-widest uppercase transition-colors flex items-center gap-2 py-1 ${location.pathname === '/compare' ? 'text-[#C89B3C]' : 'text-[#EAE4D9]/60 hover:text-[#EAE4D9]'}`}
            >
              <GitCompareArrows size={14} /> Compare
              {location.pathname === '/compare' && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#C89B3C]" />}
            </button>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="text-xs font-semibold tracking-widest uppercase transition-colors flex items-center gap-2 text-[#EAE4D9]/60 hover:text-[#EAE4D9]"
            >
              <Plus size={14} /> Submit
            </button>
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className={`relative text-xs font-semibold tracking-widest uppercase transition-colors flex items-center gap-2 py-1 ${location.pathname === '/admin' ? 'text-[#C89B3C]' : 'text-[#EAE4D9]/60 hover:text-[#EAE4D9]'}`}
              >
                <Shield size={14} /> Admin
                {location.pathname === '/admin' && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#C89B3C]" />}
              </button>
            )}
            <button
              onClick={() => setShowUserSearch(true)}
              className="text-[#EAE4D9]/60 hover:text-[#C89B3C] transition-colors"
              title="Find People"
            >
              <Search size={16} />
            </button>
            <button
              onClick={toggleTheme}
              className="text-[#EAE4D9]/60 hover:text-[#C89B3C] transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className="w-px h-6 bg-[var(--color-vintage-border)] mx-2"></div>
            {user ? (
              <div className="flex items-center gap-4">
                <button onClick={() => navigate(`/profile/${user.id}`)} className="group">
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full vintage-border group-hover:border-[#C89B3C] transition-colors" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-8 h-8 rounded-full vintage-border flex items-center justify-center bg-[#C89B3C]/20 text-[#C89B3C] text-xs font-bold group-hover:border-[#C89B3C] transition-colors">
                      {user.name?.charAt(0)?.toUpperCase() || <UserIcon size={14} />}
                    </div>
                  )}
                </button>
                <button
                  onClick={() => { handleSignOut(); showToast('Signed out'); }}
                  className="text-xs font-semibold tracking-widest uppercase text-[#EAE4D9]/60 hover:text-[#EAE4D9] transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="text-xs font-semibold tracking-widest uppercase vintage-border hover:bg-[#C89B3C] hover:text-[#141210] hover:border-[#C89B3C] text-[#C89B3C] px-5 py-2 rounded-full transition-all duration-300"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-[#EAE4D9]"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu backdrop */}
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 top-20 bg-[#141210]/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#1A1816] vintage-border-b px-4 pb-4 elevated-high relative z-50 animate-in slide-in-from-top-2 duration-200">
            <button
              onClick={() => { navigate('/catalog'); setMobileMenuOpen(false); }}
              className={`block w-full text-left text-sm font-semibold tracking-widest uppercase transition-colors py-4 border-b border-[var(--color-vintage-border)] ${location.pathname === '/catalog' ? 'text-[#C89B3C]' : 'text-[#EAE4D9]/60 hover:text-[#C89B3C]'}`}
            >
              Catalog
            </button>
            <button
              onClick={() => { navigate('/lists'); setMobileMenuOpen(false); }}
              className={`block w-full text-left text-sm font-semibold tracking-widest uppercase transition-colors py-4 border-b border-[var(--color-vintage-border)] ${location.pathname === '/lists' ? 'text-[#C89B3C]' : 'text-[#EAE4D9]/60 hover:text-[#C89B3C]'}`}
            >
              My Lists
            </button>
            <button
              onClick={() => { navigate('/compare'); setMobileMenuOpen(false); }}
              className={`block w-full text-left text-sm font-semibold tracking-widest uppercase transition-colors py-4 border-b border-[var(--color-vintage-border)] flex items-center gap-2 ${location.pathname === '/compare' ? 'text-[#C89B3C]' : 'text-[#EAE4D9]/60 hover:text-[#C89B3C]'}`}
            >
              <GitCompareArrows size={14} /> Compare
            </button>
            <button
              onClick={() => { setShowSubmitModal(true); setMobileMenuOpen(false); }}
              className="block w-full text-left text-sm font-semibold tracking-widest uppercase transition-colors py-4 border-b border-[var(--color-vintage-border)] text-[#EAE4D9]/60 hover:text-[#C89B3C]"
            >
              Submit
            </button>
            {isAdmin && (
              <button
                onClick={() => { navigate('/admin'); setMobileMenuOpen(false); }}
                className={`w-full text-left text-sm font-semibold tracking-widest uppercase transition-colors py-4 border-b border-[var(--color-vintage-border)] flex items-center gap-2 ${location.pathname === '/admin' ? 'text-[#C89B3C]' : 'text-[#EAE4D9]/60 hover:text-[#C89B3C]'}`}
              >
                <Shield size={14} /> Admin
              </button>
            )}
            <button
              onClick={() => { setShowUserSearch(true); setMobileMenuOpen(false); }}
              className="block w-full text-left text-sm font-semibold tracking-widest uppercase transition-colors py-4 border-b border-[var(--color-vintage-border)] text-[#EAE4D9]/60 hover:text-[#C89B3C] flex items-center gap-2"
            >
              <Search size={14} /> Find People
            </button>
            <button
              onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
              className="block w-full text-left text-sm font-semibold tracking-widest uppercase transition-colors py-4 border-b border-[var(--color-vintage-border)] text-[#EAE4D9]/60 hover:text-[#C89B3C] flex items-center gap-2"
            >
              {theme === 'dark' ? <><Sun size={14} /> Light Mode</> : <><Moon size={14} /> Dark Mode</>}
            </button>
            {user ? (
              <div className="flex items-center justify-between py-4">
                <button
                  onClick={() => { navigate(`/profile/${user.id}`); setMobileMenuOpen(false); }}
                  className="flex items-center gap-3"
                >
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full vintage-border" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-8 h-8 rounded-full vintage-border flex items-center justify-center bg-[#C89B3C]/20 text-[#C89B3C] text-xs font-bold">
                      {user.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <span className="text-sm text-[#EAE4D9]/60">{user.name}</span>
                </button>
                <button
                  onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                  className="text-sm font-semibold tracking-widest uppercase text-[#EAE4D9]/60 hover:text-[#C89B3C] transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => { handleSignIn(); setMobileMenuOpen(false); }}
                className="block w-full text-left text-sm font-semibold tracking-widest uppercase transition-colors py-4 text-[#C89B3C] hover:text-[#C89B3C]"
              >
                Sign In
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-red-900/80 border-b border-red-700/50 px-4 py-2 text-center">
          <p className="text-sm text-red-100 flex items-center justify-center gap-2">
            <WifiOff size={14} />
            You're offline — changes are saved locally and will sync when you reconnect
          </p>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8 pb-24 md:pb-8">
        <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/" element={
            <HomeView
              user={user}
              liquors={allLiquors}
              wantToTry={wantToTry}
              tried={tried}
            />
          } />
          <Route path="/feed" element={
            user ? <FeedView user={user} liquors={allLiquors} /> : <RouterNavigate to="/" replace />
          } />
          <Route path="/catalog" element={
            <CatalogView
              wantToTry={wantToTry}
              tried={tried}
              toggleWantToTry={toggleWantToTryWithToast}
              toggleTried={toggleTriedWithToast}
              liquors={allLiquors}
              onOpenSubmit={() => setShowSubmitModal(true)}
              onOpenScanner={() => setShowBarcodeScanner(true)}
            />
          } />
          <Route path="/liquor/:id" element={
            <DetailView
              wantToTry={wantToTry}
              tried={tried}
              toggleWantToTry={toggleWantToTryWithToast}
              toggleTried={toggleTriedWithToast}
              getReviewsForLiquor={getReviewsForLiquor}
              onAddReview={addReviewWithToast}
              onEditReview={editReview}
              onDeleteReview={deleteReview}
              user={user}
              liquors={allLiquors}
            />
          } />
          <Route path="/compare" element={
            <CompareView liquors={allLiquors} />
          } />
          <Route path="/discover" element={
            <RecommendView liquors={allLiquors} wantToTry={wantToTry} tried={tried} />
          } />
          <Route path="/lists" element={
            <ListsView
              wantToTry={wantToTry}
              tried={tried}
              toggleWantToTry={toggleWantToTryWithToast}
              toggleTried={toggleTriedWithToast}
              liquors={allLiquors}
              reviews={reviews}
            />
          } />
          <Route path="/admin" element={
            user && isAdmin ? (
              <AdminPanel
                user={user}
                isAdmin={isAdmin}
                liquors={allLiquors}
              />
            ) : <RouterNavigate to="/" replace />
          } />
          <Route path="/profile/:userId" element={
            <ProfileView
              user={user}
              liquors={allLiquors}
            />
          } />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/eula" element={<EulaPage />} />
          <Route path="/acceptable-use" element={<AcceptableUsePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 pb-24 md:pb-10 pt-4">
        <div className="vintage-border-t pt-6">
          {/* Desktop footer */}
          <div className="hidden md:block text-center">
            <div className="flex items-center justify-center gap-6 mb-4">
              <Link to="/terms" className="text-[#EAE4D9]/40 hover:text-[#C89B3C] transition-colors text-xs font-sans font-semibold tracking-widest uppercase">Terms</Link>
              <span className="text-[#EAE4D9]/20">|</span>
              <Link to="/privacy" className="text-[#EAE4D9]/40 hover:text-[#C89B3C] transition-colors text-xs font-sans font-semibold tracking-widest uppercase">Privacy</Link>
              <span className="text-[#EAE4D9]/20">|</span>
              <Link to="/eula" className="text-[#EAE4D9]/40 hover:text-[#C89B3C] transition-colors text-xs font-sans font-semibold tracking-widest uppercase">EULA</Link>
              <span className="text-[#EAE4D9]/20">|</span>
              <Link to="/acceptable-use" className="text-[#EAE4D9]/40 hover:text-[#C89B3C] transition-colors text-xs font-sans font-semibold tracking-widest uppercase">Acceptable Use</Link>
            </div>
            <p className="text-[#EAE4D9]/40 text-xs font-sans tracking-wide">&copy; 2026 FIREWATER. All rights reserved.</p>
          </div>

          {/* Mobile footer */}
          <div className="md:hidden text-center">
            <button
              onClick={() => setShowFooterLinks(prev => !prev)}
              className="text-[#EAE4D9]/40 hover:text-[#C89B3C] transition-colors text-xs font-sans font-semibold tracking-widest uppercase flex items-center gap-2 mx-auto"
            >
              Help & Legal
              <ChevronDown size={14} className={`transition-transform ${showFooterLinks ? 'rotate-180' : ''}`} />
            </button>
            {showFooterLinks && (
              <div className="flex flex-col items-center gap-3 mt-4">
                <Link to="/terms" className="text-[#EAE4D9]/40 hover:text-[#C89B3C] transition-colors text-xs font-sans font-semibold tracking-widest uppercase">Terms</Link>
                <Link to="/privacy" className="text-[#EAE4D9]/40 hover:text-[#C89B3C] transition-colors text-xs font-sans font-semibold tracking-widest uppercase">Privacy</Link>
                <Link to="/eula" className="text-[#EAE4D9]/40 hover:text-[#C89B3C] transition-colors text-xs font-sans font-semibold tracking-widest uppercase">EULA</Link>
                <Link to="/acceptable-use" className="text-[#EAE4D9]/40 hover:text-[#C89B3C] transition-colors text-xs font-sans font-semibold tracking-widest uppercase">Acceptable Use</Link>
              </div>
            )}
            <p className="text-[#EAE4D9]/40 text-xs font-sans tracking-wide mt-4">&copy; 2026 FIREWATER. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Submit Liquor Modal */}
      {showSubmitModal && (
        <SubmitLiquorModal
          onClose={() => { setShowSubmitModal(false); setBarcodePrefill(null); }}
          onSubmit={(liquor) => {
            handleAddLiquorWithUpc(liquor, barcodePrefill?.upc);
            setBarcodePrefill(null);
          }}
          onSelectExisting={(id) => {
            if (barcodePrefill?.upc) saveUpcMapping(barcodePrefill.upc, id);
            setShowSubmitModal(false);
            setBarcodePrefill(null);
            navigate(`/liquor/${id}`);
          }}
          existingLiquors={allLiquors}
          prefillName={barcodePrefill?.name}
          prefillDetails={barcodePrefill?.details}
          onOpenScanner={() => {
            setShowSubmitModal(false);
            setBarcodePrefill(null);
            setShowBarcodeScanner(true);
          }}
        />
      )}

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onResult={handleBarcodeScanResult}
          onClose={() => setShowBarcodeScanner(false)}
          liquors={allLiquors}
        />
      )}

      {/* User Search Modal */}
      {showUserSearch && (
        <UserSearch onClose={() => setShowUserSearch(false)} />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onGoogleSignIn={handleGoogleSignIn}
          onCredentialAuth={handleCredentialAuth}
        />
      )}

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-vintage-bg)]/90 backdrop-blur-md animate-in fade-in duration-300" role="dialog" aria-modal="true" aria-label="Welcome to FIREWATER">
          <div className="bg-[#1A1816] vintage-border p-6 md:p-10 max-w-lg w-full elevated-high relative max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none border-2 border-[#C89B3C]/10 m-1 rounded-sm"></div>
            <button
              onClick={() => setShowRulesModal(false)}
              className="absolute top-6 right-6 text-[#EAE4D9]/40 hover:text-[#C89B3C] transition-colors z-10"
              aria-label="Close"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-10 relative z-10">
              <div className="w-16 h-16 rounded-full vintage-border flex items-center justify-center mx-auto mb-6 overflow-hidden p-1">
                <img src="/logo.svg" alt="FIREWATER Logo" className="w-full h-full object-contain" />
              </div>
              <p className="micro-label mb-2 text-[#C89B3C]">The Golden Rules</p>
              <h2 className="font-serif text-4xl font-normal text-[#EAE4D9] mb-4">Welcome to FIREWATER</h2>
              <div className="w-12 h-px bg-[#C89B3C]/50 mx-auto mb-4"></div>
              <p className="text-[#EAE4D9]/70 font-serif italic text-lg">Before you ride with us, here's what we're all about.</p>
            </div>

            <div className="space-y-8 relative z-10">
              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full vintage-border flex items-center justify-center text-[#C89B3C] font-serif text-xl">1</div>
                <div>
                  <h3 className="font-sans font-semibold text-[#EAE4D9] mb-1 tracking-wide uppercase text-sm">Every spirit welcome</h3>
                  <p className="text-sm text-[#EAE4D9]/60 leading-relaxed">Bourbon, scotch, vodka, gin, rum, tequila, brandy, and beyond — if it's in a bottle and it's got spirit, it belongs here.</p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full vintage-border flex items-center justify-center text-[#C89B3C] font-serif text-xl">2</div>
                <div>
                  <h3 className="font-sans font-semibold text-[#EAE4D9] mb-1 tracking-wide uppercase text-sm">Honest reviews only</h3>
                  <p className="text-sm text-[#EAE4D9]/60 leading-relaxed">Rate what you actually taste. No paid promotions, no fluff. Just straight-shooting reviews from real drinkers.</p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full vintage-border flex items-center justify-center text-[#C89B3C] font-serif text-xl">3</div>
                <div>
                  <h3 className="font-sans font-semibold text-[#EAE4D9] mb-1 tracking-wide uppercase text-sm">Drink responsibly</h3>
                  <p className="text-sm text-[#EAE4D9]/60 leading-relaxed">We're here to appreciate great spirits, not overdo it. Know your limits and enjoy the journey.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full mt-10 bg-transparent vintage-border hover:bg-[#C89B3C] hover:text-[#141210] hover:border-[#C89B3C] text-[#C89B3C] font-sans font-semibold tracking-widest uppercase py-4 transition-all duration-300 relative z-10 text-sm"
            >
              I Understand, Let's Pour
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-surface border-t border-[var(--color-vintage-border)] safe-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-around h-[4.25rem]">
          <button
            onClick={() => navigate('/')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${location.pathname === '/' ? 'text-[#C89B3C]' : 'text-[#EAE4D9]/40 active:text-[#EAE4D9]/60'}`}
          >
            <Home size={20} />
            <span className="text-[9px] font-semibold tracking-wider uppercase">Home</span>
          </button>
          <button
            onClick={() => navigate('/catalog')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${location.pathname === '/catalog' ? 'text-[#C89B3C]' : 'text-[#EAE4D9]/40 active:text-[#EAE4D9]/60'}`}
          >
            <Search size={20} />
            <span className="text-[9px] font-semibold tracking-wider uppercase">Catalog</span>
          </button>
          <button
            onClick={() => navigate('/lists')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${location.pathname === '/lists' ? 'text-[#C89B3C]' : 'text-[#EAE4D9]/40 active:text-[#EAE4D9]/60'}`}
          >
            <ListIcon size={20} />
            <span className="text-[9px] font-semibold tracking-wider uppercase">Lists</span>
          </button>
          {user ? (
            <button
              onClick={() => navigate('/feed')}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${location.pathname === '/feed' ? 'text-[#C89B3C]' : 'text-[#EAE4D9]/40 active:text-[#EAE4D9]/60'}`}
            >
              <Rss size={20} />
              <span className="text-[9px] font-semibold tracking-wider uppercase">Feed</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/compare')}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${location.pathname === '/compare' ? 'text-[#C89B3C]' : 'text-[#EAE4D9]/40 active:text-[#EAE4D9]/60'}`}
            >
              <GitCompareArrows size={20} />
              <span className="text-[9px] font-semibold tracking-wider uppercase">Compare</span>
            </button>
          )}
          <button
            onClick={() => user ? navigate(`/profile/${user.id}`) : handleSignIn()}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${location.pathname.startsWith('/profile') ? 'text-[#C89B3C]' : 'text-[#EAE4D9]/40 active:text-[#EAE4D9]/60'}`}
          >
            <UserIcon size={20} />
            <span className="text-[9px] font-semibold tracking-wider uppercase">{user ? 'Profile' : 'Sign In'}</span>
          </button>
        </div>
      </nav>

      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* Chat Bubble */}
      <ChatBubble />

      {/* Toast Notifications */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <Analytics />
      <SpeedInsights />
    </div>
    </PhotoProvider>
  );
}
