import React, { useState, useEffect, useMemo } from 'react';
import { Search, Star, Heart, CheckCircle, ChevronLeft, List as ListIcon, X, Loader2, MessageSquare, Plus, Camera, AlertCircle } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { BOURBONS, Bourbon, FlavorProfile } from './data';
import SubmitBourbonModal from './components/SubmitBourbonModal';
import BarcodeScanner, { BarcodeScanResult } from './components/BarcodeScanner';
import { normalizeBourbonName } from './utils/stringUtils';
import { saveUpcMapping } from './services/upcService';
import { GoogleGenAI, Type } from '@google/genai';

// --- Types & Helpers ---

type ViewState = 'home' | 'catalog' | 'detail' | 'lists';

interface Review {
  id: string;
  bourbonId: string;
  rating: number;
  text: string;
  date: string;
  userId?: string;
  userName?: string;
  userPicture?: string;
}

function getFlavorVector(profile: FlavorProfile): number[] {
  return [
    profile.sweetness, profile.spice, profile.oak, profile.caramel,
    profile.vanilla, profile.fruit, profile.nutty, profile.floral,
    profile.smoky, profile.leather, profile.heat, profile.complexity
  ];
}

function cosineSimilarity(vecA: number[], vecB: number[]) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function getSimilarBourbons(target: Bourbon, all: Bourbon[], limit = 3): Bourbon[] {
  const targetVec = getFlavorVector(target.flavorProfile);
  const scored = all
    .filter(b => b.id !== target.id)
    .map(b => ({
      bourbon: b,
      score: cosineSimilarity(targetVec, getFlavorVector(b.flavorProfile))
    }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.bourbon);
}

// --- Main App Component ---

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // User Data State
  const [wantToTry, setWantToTry] = useState<string[]>([]);
  const [tried, setTried] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcodePrefill, setBarcodePrefill] = useState<{ name: string; details: string; upc: string } | null>(null);
  const [customBourbons, setCustomBourbons] = useState<Bourbon[]>([]);

  // Load from localStorage
  useEffect(() => {
    const savedWant = localStorage.getItem('bs_wantToTry');
    const savedTried = localStorage.getItem('bs_tried');
    const savedReviews = localStorage.getItem('bs_reviews');
    const savedUser = localStorage.getItem('bs_user');
    const savedCustom = localStorage.getItem('bs_customBourbons');
    if (savedWant) setWantToTry(JSON.parse(savedWant));
    if (savedTried) setTried(JSON.parse(savedTried));
    if (savedReviews) setReviews(JSON.parse(savedReviews));
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedCustom) setCustomBourbons(JSON.parse(savedCustom));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('bs_wantToTry', JSON.stringify(wantToTry));
    localStorage.setItem('bs_tried', JSON.stringify(tried));
    localStorage.setItem('bs_reviews', JSON.stringify(reviews));
    localStorage.setItem('bs_customBourbons', JSON.stringify(customBourbons));
    if (user) {
      localStorage.setItem('bs_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('bs_user');
    }
  }, [wantToTry, tried, reviews, user, customBourbons]);

  const allBourbons = useMemo(() => {
    return [...BOURBONS, ...customBourbons];
  }, [customBourbons]);

  const handleAddBourbon = (newBourbon: Bourbon) => {
    setCustomBourbons(prev => {
      const normalizedNewName = normalizeBourbonName(newBourbon.name);
      const existingIndex = prev.findIndex(b => normalizeBourbonName(b.name) === normalizedNewName);

      if (existingIndex >= 0) {
        // Merge with existing community submission
        const existing = prev[existingIndex];
        const count = (existing.submissionCount || 1);
        const newCount = count + 1;
        
        // Average flavor profile
        const newFlavorProfile = { ...existing.flavorProfile };
        (Object.keys(newFlavorProfile) as Array<keyof FlavorProfile>).forEach(key => {
          newFlavorProfile[key] = Math.round(
            ((existing.flavorProfile[key] * count) + newBourbon.flavorProfile[key]) / newCount
          );
        });

        const updatedBourbon: Bourbon = {
          ...existing,
          flavorProfile: newFlavorProfile,
          submissionCount: newCount,
          source: newCount >= 3 ? 'curated' : 'community'
        };

        const newCustom = [...prev];
        newCustom[existingIndex] = updatedBourbon;
        
        setSelectedId(existing.id);
        return newCustom;
      } else {
        // Add new
        setSelectedId(newBourbon.id);
        return [...prev, newBourbon];
      }
    });
    setShowSubmitModal(false);
    setView('detail');
  };

  // OAuth Message Listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (origin !== window.location.origin) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
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
      const response = await fetch('/api/auth/url');
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

  const toggleWantToTry = (id: string) => {
    if (wantToTry.includes(id)) {
      setWantToTry(prev => prev.filter(x => x !== id));
    } else {
      setWantToTry(prev => [...prev, id]);
      setTried(prev => prev.filter(x => x !== id)); // Remove from tried if adding to want
    }
  };

  const toggleTried = (id: string) => {
    if (tried.includes(id)) {
      setTried(prev => prev.filter(x => x !== id));
    } else {
      setTried(prev => [...prev, id]);
      setWantToTry(prev => prev.filter(x => x !== id)); // Remove from want if adding to tried
    }
  };

  const addReview = (review: Omit<Review, 'id' | 'date' | 'userId' | 'userName' | 'userPicture'>) => {
    const newReview: Review = {
      ...review,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      ...(user && {
        userId: user.id,
        userName: user.name,
        userPicture: user.picture,
      }),
    };
    setReviews(prev => [newReview, ...prev]);
  };

  const handleBarcodeScanResult = (result: BarcodeScanResult) => {
    setShowBarcodeScanner(false);
    if (result.type === 'match') {
      navigateTo('detail', result.bourbonId);
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
    handleAddBourbon(newBourbon);
    if (upc) {
      saveUpcMapping(upc, newBourbon.id);
    }
  };

  const navigateTo = (newView: ViewState, id?: string) => {
    setView(newView);
    if (id) setSelectedId(id);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-[var(--color-vintage-bg)] text-[var(--color-vintage-text)] font-sans selection:bg-[#C89B3C]/30">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[var(--color-vintage-bg)]/95 backdrop-blur-md vintage-border-b">
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigateTo('home')}
          >
            <div className="w-10 h-10 rounded-full vintage-border flex items-center justify-center group-hover:border-[#C89B3C] transition-colors overflow-hidden p-1">
              <img src="/logo.svg" alt="Barrel Book Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-serif text-2xl font-bold tracking-widest text-[#EAE4D9] uppercase">Barrel Book</span>
          </div>
          <div className="flex gap-6 items-center">
            <button 
              onClick={() => navigateTo('catalog')}
              className={`text-xs font-semibold tracking-widest uppercase transition-colors ${view === 'catalog' ? 'text-[#C89B3C]' : 'text-[#EAE4D9]/60 hover:text-[#EAE4D9]'}`}
            >
              Catalog
            </button>
            <button 
              onClick={() => navigateTo('lists')}
              className={`text-xs font-semibold tracking-widest uppercase transition-colors flex items-center gap-2 ${view === 'lists' ? 'text-[#C89B3C]' : 'text-[#EAE4D9]/60 hover:text-[#EAE4D9]'}`}
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
                  onClick={handleSignOut}
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
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
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
            toggleWantToTry={toggleWantToTry}
            toggleTried={toggleTried}
            bourbons={allBourbons}
            onOpenSubmit={() => setShowSubmitModal(true)}
            onOpenScanner={() => setShowBarcodeScanner(true)}
          />
        )}
        {view === 'detail' && selectedId && (
          <DetailView 
            id={selectedId} 
            onBack={() => navigateTo('catalog')}
            onSelectSimilar={(id: string) => navigateTo('detail', id)}
            wantToTry={wantToTry}
            tried={tried}
            toggleWantToTry={toggleWantToTry}
            toggleTried={toggleTried}
            reviews={reviews.filter(r => r.bourbonId === selectedId)}
            onAddReview={addReview}
            bourbons={allBourbons}
          />
        )}
        {view === 'lists' && (
          <ListsView 
            wantToTry={wantToTry} 
            tried={tried} 
            onSelect={(id: string) => navigateTo('detail', id)} 
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
            navigateTo('detail', id);
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
    </div>
  );
}

// --- Home View ---

function HomeView({ onNavigate, user, bourbons }: any) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Pass search query to catalog via some state or just navigate and let user type again?
      // For now, let's just navigate to catalog. Ideally we'd pass the query.
      // Since we don't have a global search context yet, we'll just go to catalog.
      onNavigate('catalog'); 
    }
  };

  const handleRandom = () => {
    const randomBourbon = bourbons[Math.floor(Math.random() * bourbons.length)];
    onNavigate('detail', randomBourbon.id);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-12 animate-in fade-in duration-700">
      <div className="text-center space-y-6">
        <div className="w-24 h-24 rounded-full vintage-border flex items-center justify-center mx-auto mb-8 overflow-hidden p-2">
          <img src="/logo.svg" alt="Barrel Book Logo" className="w-full h-full object-contain opacity-80" />
        </div>
        <h1 className="font-serif text-6xl md:text-8xl font-normal text-[#EAE4D9] tracking-wide">Barrel Book</h1>
        <p className="text-[#EAE4D9]/60 max-w-xl mx-auto text-xl font-serif italic">The definitive archive of American Whiskey.</p>
      </div>

      <div className="w-full max-w-2xl space-y-8">
        {/* Search */}
        <div className="bg-[#1A1816] vintage-border p-1 relative group hover:border-[#C89B3C]/50 transition-colors">
          <button 
            onClick={() => onNavigate('catalog')}
            className="w-full flex items-center gap-4 px-6 py-4 text-left"
          >
            <Search className="h-6 w-6 text-[#C89B3C]" />
            <span className="text-xl font-serif italic text-[#EAE4D9]/40">Search the archives...</span>
          </button>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => onNavigate('catalog')}
            className="p-6 bg-[#1A1816] vintage-border hover:border-[#C89B3C] hover:bg-[#1A1816]/80 transition-all group text-left"
          >
            <div className="mb-3 text-[#C89B3C] group-hover:scale-110 transition-transform origin-left">
              <ListIcon size={24} />
            </div>
            <h3 className="font-serif text-xl text-[#EAE4D9] mb-1">Browse Catalog</h3>
            <p className="text-xs text-[#EAE4D9]/40 uppercase tracking-widest">Explore All</p>
          </button>

          <button 
            onClick={handleRandom}
            className="p-6 bg-[#1A1816] vintage-border hover:border-[#C89B3C] hover:bg-[#1A1816]/80 transition-all group text-left"
          >
            <div className="mb-3 text-[#C89B3C] group-hover:scale-110 transition-transform origin-left">
              <Star size={24} />
            </div>
            <h3 className="font-serif text-xl text-[#EAE4D9] mb-1">Random Pour</h3>
            <p className="text-xs text-[#EAE4D9]/40 uppercase tracking-widest">Feeling Lucky</p>
          </button>

          {user ? (
            <button 
              onClick={() => onNavigate('lists')}
              className="p-6 bg-[#1A1816] vintage-border hover:border-[#C89B3C] hover:bg-[#1A1816]/80 transition-all group text-left"
            >
              <div className="mb-3 text-[#C89B3C] group-hover:scale-110 transition-transform origin-left">
                <Heart size={24} />
              </div>
              <h3 className="font-serif text-xl text-[#EAE4D9] mb-1">My Lists</h3>
              <p className="text-xs text-[#EAE4D9]/40 uppercase tracking-widest">Your Collection</p>
            </button>
          ) : (
             <button 
              onClick={() => onNavigate('lists')} // Will prompt sign in or show empty state
              className="p-6 bg-[#1A1816] vintage-border hover:border-[#C89B3C] hover:bg-[#1A1816]/80 transition-all group text-left opacity-60 hover:opacity-100"
            >
              <div className="mb-3 text-[#EAE4D9]/40 group-hover:text-[#C89B3C] transition-colors">
                <Heart size={24} />
              </div>
              <h3 className="font-serif text-xl text-[#EAE4D9] mb-1">My Lists</h3>
              <p className="text-xs text-[#EAE4D9]/40 uppercase tracking-widest">Sign In to Track</p>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Catalog View ---

function CatalogView({ onSelect, wantToTry, tried, toggleWantToTry, toggleTried, bourbons, onOpenSubmit, onOpenScanner }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [aiResults, setAiResults] = useState<string[] | null>(null);
  const [searchFallback, setSearchFallback] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  
  const [maxPrice, setMaxPrice] = useState<number>(150);
  const [minProof, setMinProof] = useState<number>(80);

  const categories = ['All', 'High Proof', 'Wheated', 'Rye', 'Single Barrel', 'Under $50'];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setAiResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
        You are a bourbon expert. A user is searching for: "${searchQuery}".
        Here is our catalog of bourbons:
        ${JSON.stringify(bourbons.map((b: Bourbon) => ({ id: b.id, name: b.name, description: b.description, flavorProfile: b.flavorProfile })))}
        
        Return a JSON array of bourbon IDs (strings) that best match the query, ordered by relevance. Limit to top 6.
      `;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      
      const ids = JSON.parse(response.text || '[]');
      setAiResults(ids);
      setSearchFallback(false);
    } catch (error) {
      console.error("AI Search failed, falling back to text search", error);
      setSearchFallback(true);
      // Fallback to text search
      const lowerQ = searchQuery.toLowerCase();
      const matches = bourbons.filter((b: Bourbon) => 
        b.name.toLowerCase().includes(lowerQ) || 
        b.description.toLowerCase().includes(lowerQ)
      ).map((b: Bourbon) => b.id);
      setAiResults(matches);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setAiResults(null);
    setSearchFallback(false);
  };

  const filteredBourbons = useMemo(() => {
    let result = bourbons;
    
    // AI/Text Search Filter
    if (aiResults) {
      result = aiResults.map((id: string) => bourbons.find((b: Bourbon) => b.id === id)).filter(Boolean) as Bourbon[];
    }

    // Category Filter
    if (activeCategory !== 'All') {
      switch (activeCategory) {
        case 'High Proof':
          result = result.filter((b: Bourbon) => b.proof >= 100);
          break;
        case 'Wheated':
          result = result.filter((b: Bourbon) => b.mashBill.toLowerCase().includes('wheat'));
          break;
        case 'Rye':
          result = result.filter((b: Bourbon) => b.mashBill.toLowerCase().includes('rye') && !b.mashBill.toLowerCase().includes('wheat'));
          break;
        case 'Single Barrel':
          result = result.filter((b: Bourbon) => b.type.toLowerCase().includes('single barrel') || b.name.toLowerCase().includes('single barrel'));
          break;
        case 'Under $50':
          result = result.filter((b: Bourbon) => b.price < 50);
          break;
      }
    }
    
    return result.filter((b: Bourbon) => b.price <= maxPrice && b.proof >= minProof);
  }, [aiResults, maxPrice, minProof, bourbons, activeCategory]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Search & Filters Header */}
      <div className="bg-[#1A1816] vintage-border p-6 space-y-6 relative">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none border-[2px] border-[#141210] m-1"></div>
        
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between relative z-10">
           <h2 className="font-serif text-3xl text-[#EAE4D9]">The Catalog</h2>
           
           <form onSubmit={handleSearch} className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-[#C89B3C]" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-[#141210] border border-[#EAE4D9]/20 py-2 pl-10 pr-20 text-[#EAE4D9] placeholder-[#EAE4D9]/40 focus:outline-none focus:border-[#C89B3C] transition-all font-serif italic text-sm rounded-sm"
            />
            <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="flex items-center p-1 text-[#EAE4D9]/40 hover:text-[#C89B3C] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onOpenScanner}
                className="flex items-center p-1 text-[#EAE4D9]/40 hover:text-[#C89B3C] transition-colors"
                title="Scan barcode"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 relative z-10 border-t border-[#EAE4D9]/10 pt-4">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 text-xs font-semibold tracking-widest uppercase transition-all border ${
                activeCategory === cat 
                  ? 'bg-[#C89B3C] text-[#141210] border-[#C89B3C]' 
                  : 'bg-transparent text-[#EAE4D9]/60 border-[#EAE4D9]/20 hover:border-[#C89B3C] hover:text-[#C89B3C]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Advanced Filters Toggle (could be collapsible, keeping simple for now) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 z-10 relative pt-4 border-t border-[#EAE4D9]/10">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="micro-label text-[#EAE4D9]">Max Price</label>
              <span className="font-mono text-xs text-[#C89B3C]">${maxPrice}</span>
            </div>
            <input 
              type="range" 
              min="20" max="500" step="10"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[#C89B3C] h-1 bg-[#141210] rounded-none appearance-none cursor-pointer"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="micro-label text-[#EAE4D9]">Min Proof</label>
              <span className="font-mono text-xs text-[#C89B3C]">{minProof}</span>
            </div>
            <input 
              type="range" 
              min="80" max="140" step="1"
              value={minProof}
              onChange={(e) => setMinProof(Number(e.target.value))}
              className="w-full accent-[#C89B3C] h-1 bg-[#141210] rounded-none appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* AI Fallback Notice */}
      {searchFallback && aiResults && (
        <div className="bg-[#C89B3C]/10 border border-[#C89B3C]/30 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-[#C89B3C] shrink-0 mt-0.5" size={18} />
          <p className="text-[#EAE4D9]/80 text-sm flex-1">
            <span className="text-[#C89B3C] font-medium">AI search is temporarily unavailable.</span>{' '}
            Showing basic text matches instead. We're working on it.
          </p>
          <button
            onClick={() => setSearchFallback(false)}
            className="text-[#EAE4D9]/40 hover:text-[#C89B3C] transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Results */}
      {isSearching ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 text-amber-600">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-stone-400 animate-pulse">Consulting the experts...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBourbons.length > 0 ? (
            filteredBourbons.map((bourbon: Bourbon) => (
              <BourbonCard 
                key={bourbon.id} 
                bourbon={bourbon} 
                onClick={() => onSelect(bourbon.id)}
                isWanted={wantToTry.includes(bourbon.id)}
                isTried={tried.includes(bourbon.id)}
                onToggleWant={(e: any) => { e.stopPropagation(); toggleWantToTry(bourbon.id); }}
                onToggleTried={(e: any) => { e.stopPropagation(); toggleTried(bourbon.id); }}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-20 space-y-6">
              <div className="w-16 h-16 rounded-full vintage-border flex items-center justify-center mx-auto text-[#EAE4D9]/40">
                <Search size={24} />
              </div>
              <div>
                <h3 className="text-xl font-serif text-[#EAE4D9] mb-2">No bourbons found</h3>
                <p className="text-[#EAE4D9]/60 max-w-md mx-auto mb-6">We couldn't find any matches for your search criteria. Try adjusting your filters or search terms.</p>
                <button 
                  onClick={onOpenSubmit}
                  className="bg-[#C89B3C] text-[#141210] px-6 py-3 rounded font-semibold tracking-widest uppercase hover:bg-[#B08832] transition-colors inline-flex items-center gap-2"
                >
                  <Plus size={16} /> Add it to the database
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Bourbon Card ---

function BourbonCard({ bourbon, onClick, isWanted, isTried, onToggleWant, onToggleTried }: any) {
  return (
    <div
      onClick={onClick}
      className="group bg-[#1A1816] vintage-border overflow-hidden cursor-pointer hover:border-[#C89B3C] hover:shadow-[0_0_30px_rgba(200,155,60,0.1)] transition-all duration-500 flex flex-col h-full relative"
    >
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none border-[2px] border-[#141210] m-1 z-10"></div>
      <div className="p-6 flex-1 flex flex-col relative z-20 bg-[#1A1816]">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-serif text-2xl font-normal text-[#EAE4D9] group-hover:text-[#C89B3C] transition-colors leading-tight flex-1 mr-3">{bourbon.name}</h3>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={onToggleWant}
              className={`p-2 rounded-full transition-all duration-300 ${isWanted ? 'bg-[#C89B3C]/20 text-[#C89B3C] border border-[#C89B3C]/50' : 'bg-[#141210]/80 text-[#EAE4D9]/40 hover:text-[#C89B3C] border border-transparent hover:border-[#C89B3C]/30'}`}
              title="Want to Try"
            >
              <Heart size={16} className={isWanted ? "fill-current" : ""} />
            </button>
            <button
              onClick={onToggleTried}
              className={`p-2 rounded-full transition-all duration-300 ${isTried ? 'bg-[#C89B3C]/20 text-[#C89B3C] border border-[#C89B3C]/50' : 'bg-[#141210]/80 text-[#EAE4D9]/40 hover:text-[#C89B3C] border border-transparent hover:border-[#C89B3C]/30'}`}
              title="Tried"
            >
              <CheckCircle size={16} className={isTried ? "fill-current" : ""} />
            </button>
          </div>
        </div>
        <p className="micro-label text-[#C89B3C] mb-3">{bourbon.distillery}</p>
        <div className="flex items-center gap-3 mb-4">
          {bourbon.source === 'community' && (
            <span className="px-2 py-0.5 bg-[#C89B3C]/20 text-[8px] font-sans font-semibold tracking-widest uppercase text-[#C89B3C] border border-[#C89B3C]/30 rounded-sm">
              Community
            </span>
          )}
          <span className="px-3 py-1 bg-[#141210]/90 text-[10px] font-sans font-semibold tracking-widest uppercase text-[#C89B3C] vintage-border">
            {bourbon.proof} Proof
          </span>
          <span className="font-serif text-lg text-[#EAE4D9] italic ml-auto">${bourbon.price}</span>
        </div>
        <div className="w-8 h-px bg-[#EAE4D9]/10 mb-4"></div>
        <p className="text-sm text-[#EAE4D9]/60 line-clamp-3 flex-1 font-serif italic leading-relaxed">{bourbon.description}</p>
      </div>
    </div>
  );
}

// --- Detail View ---

function DetailView({ id, onBack, onSelectSimilar, wantToTry, tried, toggleWantToTry, toggleTried, reviews, onAddReview, bourbons }: any) {
  const bourbon = bourbons.find((b: Bourbon) => b.id === id);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  if (!bourbon) return <div>Not found</div>;

  const similar = useMemo(() => getSimilarBourbons(bourbon, bourbons), [bourbon, bourbons]);
  const isWanted = wantToTry.includes(id);
  const isTried = tried.includes(id);

  const flavorData = Object.entries(bourbon.flavorProfile).map(([key, value]) => ({
    subject: key.charAt(0).toUpperCase() + key.slice(1),
    A: value,
    fullMark: 10,
  }));

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    onAddReview({ bourbonId: id, rating, text: reviewText });
    setRating(0);
    setReviewText('');
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc: number, r: Review) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : null;

  return (
    <div className="space-y-12 animate-in slide-in-from-right-8 duration-500">
      <button 
        onClick={onBack}
        className="flex items-center gap-3 text-[#EAE4D9]/60 hover:text-[#C89B3C] transition-colors group font-sans font-semibold tracking-widest uppercase text-xs"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-2 transition-transform" />
        <span>Back to Catalog</span>
      </button>

      <div className="space-y-10">
          <div>
            <div className="flex items-start justify-between gap-6 mb-4">
              <div className="flex flex-col gap-2">
                {bourbon.source === 'community' && (
                  <span className="self-start px-2 py-1 bg-[#C89B3C]/20 text-[10px] font-sans font-semibold tracking-widest uppercase text-[#C89B3C] border border-[#C89B3C]/30 rounded-sm">
                    Community Submission
                  </span>
                )}
                <h1 className="font-serif text-5xl md:text-6xl font-normal text-[#EAE4D9] leading-none">{bourbon.name}</h1>
              </div>
              <div className="flex items-center gap-4">
                {avgRating && (
                  <div className="flex items-center gap-2 bg-[#1A1816] vintage-border px-4 py-2">
                    <Star size={18} className="fill-[#C89B3C] text-[#C89B3C]" />
                    <span className="font-serif text-xl italic text-[#EAE4D9]">{avgRating}</span>
                  </div>
                )}
              </div>
            </div>
            <p className="micro-label text-[#C89B3C] mb-6">{bourbon.distillery}</p>
            <div className="grid grid-cols-2 gap-4 max-w-sm">
              <button
                onClick={() => toggleWantToTry(id)}
                className={`flex items-center justify-center gap-3 py-4 vintage-border transition-all duration-300 font-sans font-semibold tracking-widest uppercase text-xs ${isWanted ? 'bg-[#C89B3C]/10 border-[#C89B3C]/50 text-[#C89B3C]' : 'bg-transparent text-[#EAE4D9]/60 hover:text-[#C89B3C] hover:border-[#C89B3C]/30'}`}
              >
                <Heart size={16} className={isWanted ? "fill-current" : ""} />
                {isWanted ? 'Wanted' : 'Want to Try'}
              </button>
              <button
                onClick={() => toggleTried(id)}
                className={`flex items-center justify-center gap-3 py-4 vintage-border transition-all duration-300 font-sans font-semibold tracking-widest uppercase text-xs ${isTried ? 'bg-[#C89B3C]/10 border-[#C89B3C]/50 text-[#C89B3C]' : 'bg-transparent text-[#EAE4D9]/60 hover:text-[#C89B3C] hover:border-[#C89B3C]/30'}`}
              >
                <CheckCircle size={16} className={isTried ? "fill-current" : ""} />
                {isTried ? 'Tried It' : 'Mark Tried'}
              </button>
            </div>
          </div>

          <div className="w-16 h-px bg-[#C89B3C]/50"></div>

          <p className="text-[#EAE4D9]/70 text-lg leading-relaxed font-serif italic">{bourbon.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatBox label="Region" value={bourbon.region} />
            <StatBox label="Proof" value={bourbon.proof} />
            <StatBox label="Age" value={bourbon.age} />
            <StatBox label="Price" value={`$${bourbon.price}`} />
          </div>

          <div className="bg-[#1A1816] vintage-border p-8 relative">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none border-[1px] border-[#141210] m-1"></div>
            <h3 className="micro-label text-[#C89B3C] mb-3 relative z-10">Mash Bill</h3>
            <p className="text-[#EAE4D9] font-serif text-xl italic relative z-10">{bourbon.mashBill}</p>
          </div>

          {/* Flavor Profile Chart */}
          <div className="bg-[#1A1816] vintage-border p-8 relative">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none border-[1px] border-[#141210] m-1"></div>
            <h3 className="micro-label text-[#C89B3C] mb-8 relative z-10">Flavor Profile</h3>
            <div className="h-[350px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={flavorData}>
                  <PolarGrid stroke="rgba(234, 228, 217, 0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(234, 228, 217, 0.5)', fontSize: 11, fontFamily: 'Montserrat', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                  <Radar name={bourbon.name} dataKey="A" stroke="#C89B3C" fill="#C89B3C" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
      </div>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#C89B3C]/30 to-transparent my-16"></div>

      {/* Similar Bourbons */}
      <div className="space-y-8">
        <div className="text-center mb-10">
          <p className="micro-label text-[#C89B3C] mb-2">Explore</p>
          <h2 className="font-serif text-4xl font-normal text-[#EAE4D9]">Similar Taste Profiles</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {similar.map(b => (
            <BourbonCard 
              key={b.id} 
              bourbon={b} 
              onClick={() => onSelectSimilar(b.id)}
              isWanted={wantToTry.includes(b.id)}
              isTried={tried.includes(b.id)}
              onToggleWant={(e: any) => { e.stopPropagation(); toggleWantToTry(b.id); }}
              onToggleTried={(e: any) => { e.stopPropagation(); toggleTried(b.id); }}
            />
          ))}
        </div>
      </div>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#C89B3C]/30 to-transparent my-16"></div>

      {/* Reviews Section */}
      <div className="space-y-10">
        <div className="text-center mb-10">
          <p className="micro-label text-[#C89B3C] mb-2">Thoughts</p>
          <h2 className="font-serif text-4xl font-normal text-[#EAE4D9]">Community Reviews</h2>
        </div>
        
        <div className="bg-[#1A1816] vintage-border p-8 relative">
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none border-[1px] border-[#141210] m-1"></div>
          <h3 className="font-serif text-2xl text-[#EAE4D9] mb-6 relative z-10">Leave a Review</h3>
          <form onSubmit={handleSubmitReview} className="space-y-6 relative z-10">
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star 
                    size={32} 
                    className={`transition-colors ${star <= rating ? 'fill-[#C89B3C] text-[#C89B3C]' : 'text-[#141210] hover:text-[#C89B3C]/50'}`} 
                  />
                </button>
              ))}
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What did you think of this pour?"
              className="w-full bg-[#141210] vintage-border p-5 text-[#EAE4D9] placeholder-[#EAE4D9]/30 focus:outline-none focus:border-[#C89B3C] min-h-[120px] font-serif italic text-lg resize-none"
            />
            <button 
              type="submit"
              disabled={rating === 0}
              className="px-8 py-3 bg-transparent vintage-border hover:bg-[#C89B3C] hover:text-[#141210] hover:border-[#C89B3C] disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#C89B3C] disabled:hover:border-[rgba(234,228,217,0.15)] text-[#C89B3C] font-sans font-semibold tracking-widest uppercase text-sm transition-all duration-300"
            >
              Post Review
            </button>
          </form>
        </div>

        <div className="space-y-6">
          {reviews.length === 0 ? (
            <p className="text-[#EAE4D9]/40 italic font-serif text-center py-8">No reviews yet. Be the first to review!</p>
          ) : (
            reviews.map((review: Review) => (
              <div key={review.id} className="bg-[#1A1816] vintage-border p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#EAE4D9]/10 pb-4">
                  <div className="flex items-center gap-3">
                    {review.userPicture && (
                      <img src={review.userPicture} alt={review.userName || ''} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                    )}
                    {review.userName && (
                      <span className="text-sm font-sans text-[#EAE4D9]/60">{review.userName}</span>
                    )}
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          size={16}
                          className={star <= review.rating ? 'fill-[#C89B3C] text-[#C89B3C]' : 'text-[#141210]'}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="micro-label text-[#EAE4D9]/40">{new Date(review.date).toLocaleDateString()}</span>
                </div>
                {review.text && <p className="text-[#EAE4D9]/80 font-serif italic leading-relaxed">{review.text}</p>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="bg-[#1A1816] vintage-border p-5 flex flex-col items-center justify-center text-center relative">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none border-[1px] border-[#141210] m-1"></div>
      <span className="micro-label text-[#C89B3C] mb-2 relative z-10">{label}</span>
      <span className="font-serif text-2xl text-[#EAE4D9] relative z-10">{value}</span>
    </div>
  );
}

// --- Lists View ---

function ListsView({ wantToTry, tried, onSelect, bourbons }: any) {
  const wantBourbons = wantToTry.map((id: string) => bourbons.find((b: Bourbon) => b.id === id)).filter(Boolean);
  const triedBourbons = tried.map((id: string) => bourbons.find((b: Bourbon) => b.id === id)).filter(Boolean);

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="text-center space-y-4 py-8">
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-amber-50">My Barrel Book</h1>
        <p className="text-stone-400 max-w-2xl mx-auto text-lg">Track your whiskey journey.</p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-stone-800 pb-4">
          <Heart className="text-rose-500" size={24} />
          <h2 className="font-serif text-2xl font-bold text-stone-100">Want to Try ({wantBourbons.length})</h2>
        </div>
        
        {wantBourbons.length === 0 ? (
          <div className="bg-stone-900 border border-stone-800 border-dashed rounded-2xl p-12 text-center text-stone-500">
            Your wishlist is empty. Explore the catalog to find new pours.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wantBourbons.map((b: any) => (
              <ListCard key={b.id} bourbon={b} onClick={() => onSelect(b.id)} />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-stone-800 pb-4">
          <CheckCircle className="text-emerald-500" size={24} />
          <h2 className="font-serif text-2xl font-bold text-stone-100">Tried ({triedBourbons.length})</h2>
        </div>
        
        {triedBourbons.length === 0 ? (
          <div className="bg-stone-900 border border-stone-800 border-dashed rounded-2xl p-12 text-center text-stone-500">
            You haven't marked any bourbons as tried yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {triedBourbons.map((b: any) => (
              <ListCard key={b.id} bourbon={b} onClick={() => onSelect(b.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ListCard({ bourbon, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-4 bg-stone-900 border border-stone-800 rounded-xl p-3 cursor-pointer hover:bg-stone-800 transition-colors"
    >
      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center border border-stone-700 shrink-0">
        <span className="font-serif text-2xl text-stone-500 font-bold">{bourbon.name.charAt(0)}</span>
      </div>
      <div>
        <h4 className="font-serif font-bold text-stone-200">{bourbon.name}</h4>
        <p className="text-xs text-stone-500">{bourbon.distillery}</p>
      </div>
    </div>
  );
}
