import { useState, useCallback, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { List as ListIcon, X, Plus, Menu } from 'lucide-react';
import { useState, useCallback } from 'react';
import { List as ListIcon, X, Plus } from 'lucide-react';
import { Bourbon } from './data';
import SubmitBourbonModal from './components/SubmitBourbonModal';
import BarcodeScanner, { BarcodeScanResult } from './components/BarcodeScanner';
import { saveUpcMapping } from './services/upcService';
import HomeView from './components/HomeView';
import CatalogView from './components/CatalogView';
import DetailView from './components/DetailView';
import ListsView from './components/ListsView';
import Toast from './components/Toast';
import { useBourbonLists } from './hooks/useBourbonLists';
import { useReviews } from './hooks/useReviews';
import { useAuth } from './hooks/useAuth';
import { useCustomBourbons } from './hooks/useCustomBourbons';
import { useToast } from './hooks/useToast';

// --- Main App Component ---

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcodePrefill, setBarcodePrefill] = useState<{ name: string; details: string; upc: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const { wantToTry, tried, toggleWantToTry, toggleTried } = useBourbonLists();
  const { user, handleSignIn, handleSignOut, showRulesModal, setShowRulesModal } = useAuth();
  const { reviews, addReview, editReview, deleteReview, getReviewsForBourbon } = useReviews(user);
  const { allBourbons, handleAddBourbon } = useCustomBourbons();
  const { toast, showToast } = useToast();

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

  const navigateTo = (newView: ViewState, id?: string, searchQuery?: string) => {
    setView(newView);
    if (id) setSelectedId(id);
    if (searchQuery) setInitialSearchQuery(searchQuery);
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-[var(--color-vintage-bg)] text-[var(--color-vintage-text)] font-sans selection:bg-[#C89B3C]/30">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[var(--color-vintage-bg)]/95 backdrop-blur-md vintage-border-b" ref={mobileMenuRef}>
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 rounded-full vintage-border flex items-center justify-center group-hover:border-[#C89B3C] transition-colors overflow-hidden p-1">
              <img src="/logo.svg" alt="Barrel Book Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-serif text-2xl font-bold tracking-widest text-[#EAE4D9] uppercase">Barrel Book</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex gap-6 items-center">
            <button
              onClick={() => navigate('/catalog')}
              className={`text-xs font-semibold tracking-widest uppercase transition-colors ${location.pathname === '/catalog' ? 'text-[#C89B3C]' : 'text-[#EAE4D9]/60 hover:text-[#EAE4D9]'}`}
            >
              Catalog
            </button>
            <button
              onClick={() => navigate('/lists')}
              className={`text-xs font-semibold tracking-widest uppercase transition-colors flex items-center gap-2 ${location.pathname === '/lists' ? 'text-[#C89B3C]' : 'text-[#EAE4D9]/60 hover:text-[#EAE4D9]'}`}
            >
              <ListIcon size={14} /> My Lists
            </button>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="text-xs font-semibold tracking-widest uppercase transition-colors flex items-center gap-2 text-[#EAE4D9]/60 hover:text-[#EAE4D9]"
            >
              <Plus size={14} /> Submit
            </button>
            <div className="w-px h-6 bg-[var(--color-vintage-border)] mx-2"></div>
            {user ? (
              <div className="flex items-center gap-4">
                <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full vintage-border" referrerPolicy="no-referrer" />
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
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#1A1816] vintage-border-b px-4 pb-4">
            <button
              onClick={() => navigateTo('catalog')}
              className={`block w-full text-left text-sm font-semibold tracking-widest uppercase transition-colors py-4 border-b border-[var(--color-vintage-border)] ${view === 'catalog' ? 'text-[#C89B3C]' : 'text-[#EAE4D9]/60 hover:text-[#C89B3C]'}`}
            >
              Catalog
            </button>
            <button
              onClick={() => navigateTo('lists')}
              className={`block w-full text-left text-sm font-semibold tracking-widest uppercase transition-colors py-4 border-b border-[var(--color-vintage-border)] ${view === 'lists' ? 'text-[#C89B3C]' : 'text-[#EAE4D9]/60 hover:text-[#C89B3C]'}`}
            >
              My Lists
            </button>
            <button
              onClick={() => { setShowSubmitModal(true); setMobileMenuOpen(false); }}
              className="block w-full text-left text-sm font-semibold tracking-widest uppercase transition-colors py-4 border-b border-[var(--color-vintage-border)] text-[#EAE4D9]/60 hover:text-[#C89B3C]"
            >
              Submit
            </button>
            {user ? (
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full vintage-border" referrerPolicy="no-referrer" />
                  <span className="text-sm text-[#EAE4D9]/60">{user.name}</span>
                </div>
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
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={
            <HomeView
              user={user}
              bourbons={allBourbons}
            />
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
              bourbons={allBourbons}
            />
          } />
          <Route path="/lists" element={
            <ListsView
              wantToTry={wantToTry}
              tried={tried}
              bourbons={allBourbons}
            />
          } />
        </Routes>
        {view === 'home' && (
          <HomeView
            onNavigate={navigateTo}
            user={user}
            bourbons={allBourbons}
          />
        )}
        {view === 'catalog' && (
          <CatalogView
            onSelect={(id: string) => navigateTo('detail', id)}
            wantToTry={wantToTry}
            tried={tried}
            toggleWantToTry={toggleWantToTryWithToast}
            toggleTried={toggleTriedWithToast}
            bourbons={allBourbons}
            onOpenSubmit={() => setShowSubmitModal(true)}
            onOpenScanner={() => setShowBarcodeScanner(true)}
            initialSearchQuery={initialSearchQuery}
            onConsumeSearchQuery={() => setInitialSearchQuery('')}
          />
        )}
        {view === 'detail' && selectedId && (
          <DetailView
            id={selectedId}
            onBack={() => navigateTo('catalog')}
            onSelectSimilar={(id: string) => navigateTo('detail', id)}
            wantToTry={wantToTry}
            tried={tried}
            toggleWantToTry={toggleWantToTryWithToast}
            toggleTried={toggleTriedWithToast}
            reviews={getReviewsForBourbon(selectedId)}
            onAddReview={addReview}
            onEditReview={editReview}
            onDeleteReview={deleteReview}
            user={user}
            onAddReview={addReviewWithToast}
            bourbons={allBourbons}
          />
        )}
        {view === 'lists' && (
          <ListsView
            wantToTry={wantToTry}
            tried={tried}
            onSelect={(id: string) => navigateTo('detail', id)}
            onNavigate={navigateTo}
            bourbons={allBourbons}
          />
        )}
      </main>

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

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-vintage-bg)]/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#1A1816] vintage-border p-6 md:p-10 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none border-[4px] border-[#141210] m-1"></div>
            <button
              onClick={() => setShowRulesModal(false)}
              className="absolute top-6 right-6 text-[#EAE4D9]/40 hover:text-[#C89B3C] transition-colors z-10"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-10 relative z-10">
              <div className="w-16 h-16 rounded-full vintage-border flex items-center justify-center mx-auto mb-6 overflow-hidden p-1">
                <img src="/logo.svg" alt="Barrel Book Logo" className="w-full h-full object-contain" />
              </div>
              <p className="micro-label mb-2 text-[#C89B3C]">The Golden Rules</p>
              <h2 className="font-serif text-4xl font-normal text-[#EAE4D9] mb-4">Welcome to Barrel Book</h2>
              <div className="w-12 h-px bg-[#C89B3C]/50 mx-auto mb-4"></div>
              <p className="text-[#EAE4D9]/70 font-serif italic text-lg">Before you begin your journey, you must know the three rules of what makes a whiskey a true bourbon.</p>
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

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        visible={toast.visible}
        onClose={() => {}}
      />
    </div>
  );
}
