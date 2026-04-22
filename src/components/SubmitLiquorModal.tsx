
import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, AlertCircle, CheckCircle, ChevronRight, Camera } from 'lucide-react';
import { Liquor, FlavorProfile } from '../liquorTypes';
import { normalizeLiquorName, levenshteinDistance } from '../utils/stringUtils';
import { generateLiquorData } from '../services/geminiService';
import { hapticImpact } from '../lib/capacitor';

interface SubmitLiquorModalProps {
  onClose: () => void;
  onSubmit: (liquor: Liquor) => void;
  onSelectExisting: (id: string) => void;
  existingLiquors: Liquor[];
  prefillName?: string;
  prefillDetails?: string;
  onOpenScanner?: () => void;
}

type Step = 'input' | 'duplicate-check' | 'loading' | 'manual-entry' | 'review';

export default function SubmitLiquorModal({ onClose, onSubmit, onSelectExisting, existingLiquors, prefillName, prefillDetails, onOpenScanner }: SubmitLiquorModalProps) {
  const [step, setStep] = useState<Step>('input');
  const [inputName, setInputName] = useState(prefillName || '');
  const [inputDetails, setInputDetails] = useState(prefillDetails || '');
  const [similarLiquors, setSimilarLiquors] = useState<Liquor[]>([]);
  const [generatedLiquor, setGeneratedLiquor] = useState<Partial<Liquor> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const firstFocusable = modal.querySelector<HTMLElement>(focusableSelector);
    firstFocusable?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;

      const focusable = modal.querySelectorAll<HTMLElement>(focusableSelector);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, step]);

  // Auto-submit if we have a prefilled name (from barcode scan)
  useEffect(() => {
    if (prefillName && prefillName.trim()) {
      handleInputSubmitDirect(prefillName, prefillDetails || '');
    }
  }, []);

  const handleInputSubmitDirect = async (name: string, details: string) => {
    if (!name.trim()) return;

    const normalizedInput = normalizeLiquorName(name);
    const inputWords = normalizedInput.split(' ');
    const inputPrefix = normalizedInput.slice(0, 2);

    const matches = existingLiquors.filter(b => {
      const normalizedExisting = normalizeLiquorName(b.name);

      // Cheap substring checks first (no Levenshtein needed)
      if (normalizedExisting.includes(normalizedInput) || normalizedInput.includes(normalizedExisting)) return true;

      // Pre-filter: skip Levenshtein unless names share a prefix or word stem
      const existingPrefix = normalizedExisting.slice(0, 2);
      const existingWords = normalizedExisting.split(' ');
      const sharesPrefix = inputPrefix === existingPrefix;
      const sharesWord = inputWords.some(w => w.length > 2 && existingWords.some(ew => ew.startsWith(w.slice(0, 3))));
      if (!sharesPrefix && !sharesWord) return false;

      // Expensive Levenshtein only on pre-filtered candidates
      const distance = levenshteinDistance(normalizedInput, normalizedExisting);
      const threshold = Math.max(3, Math.floor(normalizedExisting.length * 0.2));
      return distance <= threshold;
    });

    if (matches.length > 0) {
      setSimilarLiquors(matches.slice(0, 5));
      setStep('duplicate-check');
    } else {
      generateDataDirect(name, details);
    }
  };

  const handleInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;
    await handleInputSubmitDirect(inputName, inputDetails);
  };

  const generateDataDirect = async (name: string, details: string) => {
    setStep('loading');
    setError(null);
    try {
      const data = await generateLiquorData(`${name} ${details}`);
      setGeneratedLiquor(data);
      setStep('review');
    } catch (err) {
      console.error(err);
      setGeneratedLiquor({
        name: name,
        distillery: '',
        region: '',
        proof: 0,
        age: 'NAS',
        mashBill: '',
        price: 0,
        description: '',
        flavorProfile: {
          sweetness: 5, spice: 5, oak: 5, caramel: 5, vanilla: 5, fruit: 5,
          nutty: 5, floral: 5, smoky: 5, leather: 5, heat: 5, complexity: 5
        },
        type: 'Liquor',
        source: 'community' as const,
        submissionCount: 1,
      });
      setStep('manual-entry');
    }
  };

  const generateData = async () => {
    await generateDataDirect(inputName, inputDetails);
  };

  const handleConfirm = () => {
    if (generatedLiquor && generatedLiquor.name) {
      hapticImpact();
      const newLiquor: Liquor = {
        id: `community-${Date.now()}`,
        name: generatedLiquor.name!,
        distillery: generatedLiquor.distillery || 'Unknown',
        region: generatedLiquor.region || 'Unknown',
        proof: generatedLiquor.proof || 0,
        age: generatedLiquor.age || 'NAS',
        mashBill: generatedLiquor.mashBill || 'Unknown',
        mashBillDetail: generatedLiquor.mashBillDetail,
        price: generatedLiquor.price || 0,
        priceRange: generatedLiquor.priceRange,
        description: generatedLiquor.description || '',
        flavorProfile: generatedLiquor.flavorProfile || {
          sweetness: 0, spice: 0, oak: 0, caramel: 0, vanilla: 0, fruit: 0,
          nutty: 0, floral: 0, smoky: 0, leather: 0, heat: 0, complexity: 0
        },
        type: generatedLiquor.type || 'Liquor',
        source: 'community',
        submissionCount: 1,
      };
      onSubmit(newLiquor);
      onClose();
    }
  };

  const handleFieldChange = (field: keyof Liquor, value: any) => {
    setGeneratedLiquor(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  const handleFlavorChange = (flavor: keyof FlavorProfile, value: number) => {
    setGeneratedLiquor(prev => {
      if (!prev || !prev.flavorProfile) return prev;
      return {
        ...prev,
        flavorProfile: {
          ...prev.flavorProfile,
          [flavor]: value
        }
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-vintage-bg)]/90 backdrop-blur-sm animate-in fade-in duration-300" role="dialog" aria-modal="true" aria-label="Submit a Liquor">
      <div ref={modalRef} className="surface-raised p-6 md:p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-on-surface-muted hover:text-on-surface-accent transition-colors z-10"
          aria-label="Close"
        >
          <X size={24} />
        </button>

        <div>
          <p className="micro-label text-on-surface-accent mb-2">
            <span className="text-on-surface-accent">◆</span> Community Submission
          </p>
          <h2 className="heading-xl text-3xl italic text-on-surface mb-2 leading-tight">Submit a Liquor</h2>
          <p className="text-on-surface-muted font-serif italic mb-5">Help grow the community database.</p>

          {/* Step indicator */}
          <div className="flex items-center gap-1.5 mb-6 max-w-md">
            {(['input', 'duplicate-check', 'loading', 'review'] as const).map((s, i) => {
              const currentIdx = ['input', 'duplicate-check', 'loading', 'review'].indexOf(step);
              return (
                <div
                  key={s}
                  className={`h-[2px] flex-1 transition-colors duration-300 ${
                    i <= currentIdx ? 'bg-on-surface-accent' : 'bg-border-subtle'
                  }`}
                />
              );
            })}
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-900/50 text-red-200 p-4 rounded-lg mb-6 flex items-start gap-3">
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
              <p>{error}</p>
            </div>
          )}

          {step === 'input' && (
            <form onSubmit={handleInputSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-on-surface-muted mb-2">Liquor Name *</label>
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  className="w-full bg-surface-base border border-[var(--color-vintage-border)] text-on-surface p-3 rounded focus:outline-none focus:border-border-accent-strong transition-colors"
                  placeholder="e.g. Elijah Craig Barrel Proof C923"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-on-surface-muted mb-2">Additional Details (Optional)</label>
                <textarea
                  value={inputDetails}
                  onChange={(e) => setInputDetails(e.target.value)}
                  className="w-full bg-surface-base border border-[var(--color-vintage-border)] text-on-surface p-3 rounded focus:outline-none focus:border-border-accent-strong transition-colors h-32"
                  placeholder="Distillery, proof, age, tasting notes, etc. The more you provide, the better the AI can help."
                />
              </div>
              <div className="flex justify-between items-center">
                {onOpenScanner && (
                  <button
                    type="button"
                    onClick={onOpenScanner}
                    className="flex items-center gap-2 text-on-surface-muted hover:text-on-surface-accent transition-colors text-sm"
                  >
                    <Camera size={18} /> Scan Barcode
                  </button>
                )}
                <div className={!onOpenScanner ? 'ml-auto' : ''}>
                  <button
                    type="submit"
                    className="bg-on-surface-accent text-on-surface-invert px-6 py-3 rounded font-semibold tracking-widest uppercase hover:bg-[#B08832] transition-colors flex items-center gap-2"
                  >
                    Next <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </form>
          )}

          {step === 'duplicate-check' && (
            <div className="space-y-6">
              <div className="bg-on-surface-accent/10 border border-border-accent p-4 rounded-lg">
                <h3 className="text-on-surface-accent font-display text-xl mb-2">Wait, did you mean one of these?</h3>
                <p className="text-on-surface/80 text-sm">We found some similar liquors already in the database.</p>
              </div>

              <div className="space-y-3">
                {similarLiquors.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-4 bg-surface-base border border-[var(--color-vintage-border)] rounded hover:border-border-accent-strong/50 transition-colors">
                    <div>
                      <h4 className="text-on-surface font-medium">{b.name}</h4>
                      <p className="text-on-surface-muted text-xs">{b.distillery} &bull; {b.proof} Proof</p>
                    </div>
                    <button
                      onClick={() => onSelectExisting(b.id)}
                      className="text-on-surface-accent text-xs font-semibold tracking-widest uppercase hover:underline"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-4 border-t border-[var(--color-vintage-border)]">
                <button
                  onClick={() => setStep('input')}
                  className="text-on-surface-muted hover:text-on-surface text-sm"
                >
                  Back
                </button>
                <button
                  onClick={generateData}
                  className="bg-surface-base border border-border-accent-strong text-on-surface-accent px-6 py-3 rounded font-semibold tracking-widest uppercase hover:bg-on-surface-accent hover:text-on-surface-invert transition-colors"
                >
                  No, it's not listed
                </button>
              </div>
            </div>
          )}

          {step === 'loading' && (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
              <Loader2 className="w-12 h-12 text-on-surface-accent animate-spin" />
              <div>
                <h3 className="text-xl font-display text-on-surface mb-2">Analyzing Liquor Data</h3>
                <p className="text-on-surface-muted">Consulting the archives...</p>
              </div>
            </div>
          )}

          {step === 'manual-entry' && generatedLiquor && (
            <div className="space-y-6">
              <div className="bg-on-surface-accent/10 border border-border-accent p-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="text-on-surface-accent shrink-0 mt-0.5" size={18} />
                <div>
                  <h3 className="text-on-surface-accent font-medium mb-1">AI Assist Unavailable</h3>
                  <p className="text-on-surface/80 text-sm">
                    These are not AI-enhanced results. Our AI liquor expert is temporarily offline and we're working on fixing it.
                    Please fill in the details manually -- enter what you know and leave the rest as-is.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-on-surface-muted mb-1">Name *</label>
                    <input
                      type="text"
                      value={generatedLiquor.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      className="w-full bg-surface-base border border-[var(--color-vintage-border)] text-on-surface p-2 rounded focus:outline-none focus:border-border-accent-strong"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-on-surface-muted mb-1">Distillery</label>
                    <input
                      type="text"
                      value={generatedLiquor.distillery}
                      onChange={(e) => handleFieldChange('distillery', e.target.value)}
                      className="w-full bg-surface-base border border-[var(--color-vintage-border)] text-on-surface p-2 rounded focus:outline-none focus:border-border-accent-strong"
                      placeholder="e.g. Heaven Hill"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold tracking-widest uppercase text-on-surface-muted mb-1">Proof</label>
                      <input
                        type="number"
                        value={generatedLiquor.proof || ''}
                        onChange={(e) => handleFieldChange('proof', parseFloat(e.target.value) || 0)}
                        className="w-full bg-surface-base border border-[var(--color-vintage-border)] text-on-surface p-2 rounded focus:outline-none focus:border-border-accent-strong"
                        placeholder="e.g. 90"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold tracking-widest uppercase text-on-surface-muted mb-1">Age</label>
                      <input
                        type="text"
                        value={generatedLiquor.age}
                        onChange={(e) => handleFieldChange('age', e.target.value)}
                        className="w-full bg-surface-base border border-[var(--color-vintage-border)] text-on-surface p-2 rounded focus:outline-none focus:border-border-accent-strong"
                        placeholder="e.g. 12 Years"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-on-surface-muted mb-1">Mash Bill</label>
                    <input
                      type="text"
                      value={generatedLiquor.mashBill}
                      onChange={(e) => handleFieldChange('mashBill', e.target.value)}
                      className="w-full bg-surface-base border border-[var(--color-vintage-border)] text-on-surface p-2 rounded focus:outline-none focus:border-border-accent-strong"
                      placeholder="e.g. High Rye"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-on-surface-muted mb-1">Avg Price ($)</label>
                    <input
                      type="number"
                      value={generatedLiquor.price || ''}
                      onChange={(e) => handleFieldChange('price', parseFloat(e.target.value) || 0)}
                      className="w-full bg-surface-base border border-[var(--color-vintage-border)] text-on-surface p-2 rounded focus:outline-none focus:border-border-accent-strong"
                      placeholder="e.g. 35"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-on-surface-muted mb-1">Description</label>
                    <textarea
                      value={generatedLiquor.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      className="w-full bg-surface-base border border-[var(--color-vintage-border)] text-on-surface p-2 rounded focus:outline-none focus:border-border-accent-strong h-32"
                      placeholder="Tasting notes, character, anything notable..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-on-surface-muted mb-2">Flavor Profile (1-10)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                      {Object.entries(generatedLiquor.flavorProfile || {}).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-xs text-on-surface/80 capitalize w-16 shrink-0">{key}</span>
                          <input
                            type="range"
                            min="0"
                            max="10"
                            value={value}
                            onChange={(e) => handleFlavorChange(key as keyof FlavorProfile, parseInt(e.target.value))}
                            aria-label={`${key} flavor intensity`}
                            className="flex-1 flavor-slider"
                          />
                          <span className="text-xs text-on-surface-accent w-4 text-right">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-[var(--color-vintage-border)] gap-4">
                <button
                  onClick={() => { setStep('input'); setGeneratedLiquor(null); }}
                  className="text-on-surface-muted hover:text-on-surface text-sm"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!generatedLiquor.name?.trim()}
                  className="bg-on-surface-accent text-on-surface-invert px-6 py-3 rounded font-semibold tracking-widest uppercase hover:bg-[#B08832] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Submit Manually
                </button>
              </div>
            </div>
          )}

          {step === 'review' && generatedLiquor && (
            <div className="space-y-6">
              <div className="bg-on-surface-accent/10 border border-border-accent p-4 rounded-lg flex gap-3">
                <CheckCircle className="text-on-surface-accent shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="text-on-surface-accent font-medium mb-1">Data Generated</h3>
                  <p className="text-on-surface/80 text-sm">Please review the details below. Fields marked with * were estimated by AI.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-on-surface-muted mb-1">Name</label>
                    <input
                      type="text"
                      value={generatedLiquor.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      className="w-full bg-surface-base border border-[var(--color-vintage-border)] text-on-surface p-2 rounded focus:outline-none focus:border-border-accent-strong"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-on-surface-muted mb-1">Distillery</label>
                    <input
                      type="text"
                      value={generatedLiquor.distillery}
                      onChange={(e) => handleFieldChange('distillery', e.target.value)}
                      className="w-full bg-surface-base border border-[var(--color-vintage-border)] text-on-surface p-2 rounded focus:outline-none focus:border-border-accent-strong"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold tracking-widest uppercase text-on-surface-muted mb-1">Proof</label>
                      <input
                        type="number"
                        value={generatedLiquor.proof}
                        onChange={(e) => handleFieldChange('proof', parseFloat(e.target.value))}
                        className="w-full bg-surface-base border border-[var(--color-vintage-border)] text-on-surface p-2 rounded focus:outline-none focus:border-border-accent-strong"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold tracking-widest uppercase text-on-surface-muted mb-1">Age</label>
                      <input
                        type="text"
                        value={generatedLiquor.age}
                        onChange={(e) => handleFieldChange('age', e.target.value)}
                        className="w-full bg-surface-base border border-[var(--color-vintage-border)] text-on-surface p-2 rounded focus:outline-none focus:border-border-accent-strong"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-on-surface-muted mb-1">Mash Bill</label>
                    <input
                      type="text"
                      value={generatedLiquor.mashBill}
                      onChange={(e) => handleFieldChange('mashBill', e.target.value)}
                      className="w-full bg-surface-base border border-[var(--color-vintage-border)] text-on-surface p-2 rounded focus:outline-none focus:border-border-accent-strong"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-on-surface-muted mb-1">Description</label>
                    <textarea
                      value={generatedLiquor.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      className="w-full bg-surface-base border border-[var(--color-vintage-border)] text-on-surface p-2 rounded focus:outline-none focus:border-border-accent-strong h-32"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-on-surface-muted mb-2">Flavor Profile (1-10)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                      {Object.entries(generatedLiquor.flavorProfile || {}).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-xs text-on-surface/80 capitalize w-16 shrink-0">{key}</span>
                          <input
                            type="range"
                            min="0"
                            max="10"
                            value={value}
                            onChange={(e) => handleFlavorChange(key as keyof FlavorProfile, parseInt(e.target.value))}
                            aria-label={`${key} flavor intensity`}
                            className="flex-1 flavor-slider"
                          />
                          <span className="text-xs text-on-surface-accent w-4 text-right">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-on-surface-muted text-xs font-serif italic">
                Community submissions are stored locally in your browser. You can remove them from your lists at any time.
              </p>

              <div className="flex justify-end pt-6 border-t border-[var(--color-vintage-border)] gap-4">
                <button
                  onClick={() => setStep('input')}
                  className="text-on-surface-muted hover:text-on-surface text-sm"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  className="bg-on-surface-accent text-on-surface-invert px-6 py-3 rounded font-semibold tracking-widest uppercase hover:bg-[#B08832] transition-colors"
                >
                  Confirm & Submit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
