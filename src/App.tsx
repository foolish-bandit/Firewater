import { useState, useCallback, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import { List as ListIcon, X, Plus, Menu, Shield, User as UserIcon, Search, Home, ChevronDown, Rss, GitCompareArrows, Sun, Moon } from 'lucide-react';
import { Bourbon } from './data';
import SubmitBourbonModal from './components/SubmitBourbonModal';
import BarcodeScanner, { BarcodeScanResult } from './components/BarcodeScanner';
import { saveUpcMapping } from './services/upcService';
import HomeView from './components/HomeView';
import CatalogView from './components/CatalogView';
import DetailView from './components/DetailView';
import ListsView from './components/ListsView';
import AdminPanel from './components/AdminPanel';
import ProfileView from './components/ProfileView';
import FeedView from './components/FeedView';
import CompareView from './components/CompareView';
import RecommendView from './components/RecommendView';
import UserSearch from './components/UserSearch';
import AuthModal from './components/AuthModal';
import Toast from './components/Toast';
import InstallPrompt from './components/InstallPrompt';
import TermsPage from './components/TermsPage';
import PrivacyPage from './components/PrivacyPage';
import EulaPage from './components/EulaPage';
import AcceptableUsePage from './components/AcceptableUsePage';
import { useBourbonLists } from './hooks/useBourbonLists';
import { useReviews } from './hooks/useReviews';
import { useAuth } from './hooks/useAuth';
import { useCustomBourbons } from './hooks/useCustomBourbons';
import { useToast } from './hooks/useToast';
import { useAdmin } from './hooks/useAdmin';
import { useTheme } from './hooks/useTheme';

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
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  const { user, handleSignIn, handleGoogleSignIn, handleCredentialAuth, handleSignOut, showRulesModal, setShowRulesModal, showAuthModal, setShowAuthModal } = useAuth();
  const { wantToTry, tried, toggleWantToTry, toggleTried } = useBourbonLists(user);
  const { reviews, addReview, editReview, deleteReview, getReviewsForBourbon } = useReviews(user);
  const { allBourbons, handleAddBourbon } = useCustomBourbons();
  const { toast, showToast } = useToast();
  const { isAdmin } = useAdmin(user);

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

  const onAddBourbon = (newBourbon: Bourbon) => {
    const resultId = handleAddBourbon(newBourbon);
    setShowSubmitModal(false);
    navigate(`/bourbon/${resultId}`);
    showToast('Bourbon submitted');
  };

  const handleBarcodeScanResult = (result: BarcodeScanResult) => {
    setShowBarcodeScanner(false);
    if (result.type === 'match') {
      navigate(`/bourbon/${result.bourbonId}`);
    } else if (result.type === 'prefill') {
      const details = [result.brand, result.description].filter(Boolean).join('. ');
      setBarcodePrefill({ name: result.productName, details, upc: result.upc });
      setShowSubmitModal(true);
    } else if (result.type === 'manual-entry') {
      setBarcodePrefill({ name: '', details: '', upc: result.upc });
      setShowSubmitModal(true);
    }
  };

  const handleAddBourbonWithUpc = (newBourbon: Bourbon, upc?: string) => {
    onAddBourbon(newBourbon);
    if (upc) {
      saveUpcMapping(upc, newBourbon.id);
    }
  };


  return (
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

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#1A1816] vintage-border-b px-4 pb-4 elevated-high">
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

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8 pb-24 md:pb-8">
        <Routes>
          <Route path="/" element={
            <HomeView
              user={user}
              bourbons={allBourbons}
              wantToTry={wantToTry}
              tried={tried}
            />
          } />
          <Route path="/feed" element={
            <FeedView user={user} bourbons={allBourbons} />
          } />
          <Route path="/catalog" element={
            <CatalogView
              wantToTry={wantToTry}
              tried={tried}
              toggleWantToTry={toggleWantToTryWithToast}
              toggleTried={toggleTriedWithToast}
              bourbons={allBourbons}
              onOpenSubmit={() => setShowSubmitModal(true)}
              onOpenScanner={() => setShowBarcodeScanner(true)}
            />
          } />
          <Route path="/bourbon/:id" element={
            <DetailView
              wantToTry={wantToTry}
              tried={tried}
              toggleWantToTry={toggleWantToTryWithToast}
              toggleTried={toggleTriedWithToast}
              getReviewsForBourbon={getReviewsForBourbon}
              onAddReview={addReviewWithToast}
              onEditReview={editReview}
              onDeleteReview={deleteReview}
              user={user}
              bourbons={allBourbons}
            />
          } />
          <Route path="/compare" element={
            <CompareView bourbons={allBourbons} />
          } />
          <Route path="/discover" element={
            <RecommendView bourbons={allBourbons} wantToTry={wantToTry} tried={tried} />
          } />
          <Route path="/lists" element={
            <ListsView
              wantToTry={wantToTry}
              tried={tried}
              toggleWantToTry={toggleWantToTryWithToast}
              toggleTried={toggleTriedWithToast}
              bourbons={allBourbons}
              reviews={reviews}
            />
          } />
          <Route path="/admin" element={
            <AdminPanel
              user={user}
              isAdmin={isAdmin}
              bourbons={allBourbons}
            />
          } />
          <Route path="/profile/:userId" element={
            <ProfileView
              user={user}
              bourbons={allBourbons}
            />
          } />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/eula" element={<EulaPage />} />
          <Route path="/acceptable-use" element={<AcceptableUsePage />} />
        </Routes>
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

      {/* Submit Bourbon Modal */}
      {showSubmitModal && (
        <SubmitBourbonModal
          onClose={() => { setShowSubmitModal(false); setBarcodePrefill(null); }}
          onSubmit={(bourbon) => {
            handleAddBourbonWithUpc(bourbon, barcodePrefill?.upc);
            setBarcodePrefill(null);
          }}
          onSelectExisting={(id) => {
            if (barcodePrefill?.upc) saveUpcMapping(barcodePrefill.upc, id);
            setShowSubmitModal(false);
            setBarcodePrefill(null);
            navigate(`/bourbon/${id}`);
          }}
          existingBourbons={allBourbons}
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
          bourbons={allBourbons}
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
              <p className="text-[#EAE4D9]/70 font-serif italic text-lg">Before you ride with us, you gotta know the three rules of what makes a whiskey a true bourbon.</p>
            </div>

            <div className="space-y-8 relative z-10">
              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full vintage-border flex items-center justify-center text-[#C89B3C] font-serif text-xl">1</div>
                <div>
                  <h3 className="font-sans font-semibold text-[#EAE4D9] mb-1 tracking-wide uppercase text-sm">At least 51% corn</h3>
                  <p className="text-sm text-[#EAE4D9]/60 leading-relaxed">The "mash bill" (the mixture of grains used to produce the spirit) must be composed of at least 51% corn.</p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full vintage-border flex items-center justify-center text-[#C89B3C] font-serif text-xl">2</div>
                <div>
                  <h3 className="font-sans font-semibold text-[#EAE4D9] mb-1 tracking-wide uppercase text-sm">New, charred oak containers</h3>
                  <p className="text-sm text-[#EAE4D9]/60 leading-relaxed">Bourbon must be aged in brand-new containers (typically barrels) made of charred oak. It cannot be aged in used barrels.</p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full vintage-border flex items-center justify-center text-[#C89B3C] font-serif text-xl">3</div>
                <div>
                  <h3 className="font-sans font-semibold text-[#EAE4D9] mb-1 tracking-wide uppercase text-sm">Produced in the United States</h3>
                  <p className="text-sm text-[#EAE4D9]/60 leading-relaxed">To be legally labeled as bourbon, the spirit must be produced within the U.S. (including the 50 states, D.C., and Puerto Rico).</p>
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
              onClick={() => navigate('/')}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${location.pathname === '/' ? 'text-[#C89B3C]' : 'text-[#EAE4D9]/40 active:text-[#EAE4D9]/60'}`}
            >
              <Home size={20} />
              <span className="text-[9px] font-semibold tracking-wider uppercase">Home</span>
            </button>
          )}
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
          <button
            onClick={() => navigate('/compare')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${location.pathname === '/compare' ? 'text-[#C89B3C]' : 'text-[#EAE4D9]/40 active:text-[#EAE4D9]/60'}`}
          >
            <GitCompareArrows size={20} />
            <span className="text-[9px] font-semibold tracking-wider uppercase">Compare</span>
          </button>
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

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        visible={toast.visible}
        onClose={() => {}}
      />
    </div>
  );
}
