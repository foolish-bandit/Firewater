
import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, CheckCircle, ChevronRight, Camera } from 'lucide-react';
import { Bourbon, FlavorProfile } from '../bourbonTypes';
import { normalizeBourbonName, levenshteinDistance } from '../utils/stringUtils';
import { generateBourbonData } from '../services/geminiService';

interface SubmitBourbonModalProps {
  onClose: () => void;
  onSubmit: (bourbon: Bourbon) => void;
  onSelectExisting: (id: string) => void;
  existingBourbons: Bourbon[];
  prefillName?: string;
  prefillDetails?: string;
  onOpenScanner?: () => void;
}

type Step = 'input' | 'duplicate-check' | 'loading' | 'review';

export default function SubmitBourbonModal({ onClose, onSubmit, onSelectExisting, existingBourbons, prefillName, prefillDetails, onOpenScanner }: SubmitBourbonModalProps) {
  const [step, setStep] = useState<Step>('input');
  const [inputName, setInputName] = useState(prefillName || '');
  const [inputDetails, setInputDetails] = useState(prefillDetails || '');
  const [similarBourbons, setSimilarBourbons] = useState<Bourbon[]>([]);
  const [generatedBourbon, setGeneratedBourbon] = useState<Partial<Bourbon> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-submit if we have a prefilled name (from barcode scan)
  useEffect(() => {
    if (prefillName && prefillName.trim()) {
      handleInputSubmitDirect(prefillName, prefillDetails || '');
    }
  }, []);

  const handleInputSubmitDirect = async (name: string, details: string) => {
    if (!name.trim()) return;

    const normalizedInput = normalizeBourbonName(name);
    const matches = existingBourbons.filter(b => {
      const normalizedExisting = normalizeBourbonName(b.name);
      const distance = levenshteinDistance(normalizedInput, normalizedExisting);
      const threshold = Math.max(3, Math.floor(normalizedExisting.length * 0.2));
      return distance <= threshold || normalizedExisting.includes(normalizedInput) || normalizedInput.includes(normalizedExisting);
    });

    if (matches.length > 0) {
      setSimilarBourbons(matches.slice(0, 5));
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
      const data = await generateBourbonData(`${name} ${details}`);
      setGeneratedBourbon(data);
      setStep('review');
    } catch (err) {
      console.error(err);
      setError('Failed to generate bourbon data. Please try again.');
      setStep('input');
    }
  };

  const generateData = async () => {
    await generateDataDirect(inputName, inputDetails);
  };

  const handleConfirm = () => {
    if (generatedBourbon && generatedBourbon.name) {
      const newBourbon: Bourbon = {
        id: `community-${Date.now()}`,
        name: generatedBourbon.name!,
        distillery: generatedBourbon.distillery || 'Unknown',
        region: generatedBourbon.region || 'Unknown',
        proof: generatedBourbon.proof || 0,
        age: generatedBourbon.age || 'NAS',
        mashBill: generatedBourbon.mashBill || 'Unknown',
        mashBillDetail: generatedBourbon.mashBillDetail,
        price: generatedBourbon.price || 0,
        priceRange: generatedBourbon.priceRange,
        description: generatedBourbon.description || '',
        flavorProfile: generatedBourbon.flavorProfile || {
          sweetness: 0, spice: 0, oak: 0, caramel: 0, vanilla: 0, fruit: 0,
          nutty: 0, floral: 0, smoky: 0, leather: 0, heat: 0, complexity: 0
        },
        type: generatedBourbon.type || 'Bourbon',
        source: 'community',
        submissionCount: 1,
      };
      onSubmit(newBourbon);
      onClose();
    }
  };

  const handleFieldChange = (field: keyof Bourbon, value: any) => {
    setGeneratedBourbon(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  const handleFlavorChange = (flavor: keyof FlavorProfile, value: number) => {
    setGeneratedBourbon(prev => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-vintage-bg)]/90 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#1A1816] vintage-border p-6 md:p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none border-[4px] border-[#141210] m-1"></div>
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-[#EAE4D9]/40 hover:text-[#C89B3C] transition-colors z-10"
        >
          <X size={24} />
        </button>

        <div className="relative z-10">
          <h2 className="font-serif text-3xl text-[#EAE4D9] mb-2">Submit a Bourbon</h2>
          <p className="text-[#EAE4D9]/60 mb-6">Help grow the community database.</p>

          {error && (
            <div className="bg-red-900/20 border border-red-900/50 text-red-200 p-4 rounded-lg mb-6 flex items-start gap-3">
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
              <p>{error}</p>
            </div>
          )}

          {step === 'input' && (
            <form onSubmit={handleInputSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-[#EAE4D9]/60 mb-2">Bourbon Name *</label>
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  className="w-full bg-[#141210] border border-[var(--color-vintage-border)] text-[#EAE4D9] p-3 rounded focus:outline-none focus:border-[#C89B3C] transition-colors"
                  placeholder="e.g. Elijah Craig Barrel Proof C923"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-[#EAE4D9]/60 mb-2">Additional Details (Optional)</label>
                <textarea
                  value={inputDetails}
                  onChange={(e) => setInputDetails(e.target.value)}
                  className="w-full bg-[#141210] border border-[var(--color-vintage-border)] text-[#EAE4D9] p-3 rounded focus:outline-none focus:border-[#C89B3C] transition-colors h-32"
                  placeholder="Distillery, proof, age, tasting notes, etc. The more you provide, the better the AI can help."
                />
              </div>
              <div className="flex justify-between items-center">
                {onOpenScanner && (
                  <button
                    type="button"
                    onClick={onOpenScanner}
                    className="flex items-center gap-2 text-[#EAE4D9]/60 hover:text-[#C89B3C] transition-colors text-sm"
                  >
                    <Camera size={18} /> Scan Barcode
                  </button>
                )}
                <div className={!onOpenScanner ? 'ml-auto' : ''}>
                  <button
                    type="submit"
                    className="bg-[#C89B3C] text-[#141210] px-6 py-3 rounded font-semibold tracking-widest uppercase hover:bg-[#B08832] transition-colors flex items-center gap-2"
                  >
                    Next <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </form>
          )}

          {step === 'duplicate-check' && (
            <div className="space-y-6">
              <div className="bg-[#C89B3C]/10 border border-[#C89B3C]/30 p-4 rounded-lg">
                <h3 className="text-[#C89B3C] font-serif text-xl mb-2">Wait, did you mean one of these?</h3>
                <p className="text-[#EAE4D9]/80 text-sm">We found some similar bourbons already in the database.</p>
              </div>

              <div className="space-y-3">
                {similarBourbons.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-4 bg-[#141210] border border-[var(--color-vintage-border)] rounded hover:border-[#C89B3C]/50 transition-colors">
                    <div>
                      <h4 className="text-[#EAE4D9] font-medium">{b.name}</h4>
                      <p className="text-[#EAE4D9]/50 text-xs">{b.distillery} • {b.proof} Proof</p>
                    </div>
                    <button
                      onClick={() => onSelectExisting(b.id)}
                      className="text-[#C89B3C] text-xs font-semibold tracking-widest uppercase hover:underline"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-4 border-t border-[var(--color-vintage-border)]">
                <button
                  onClick={() => setStep('input')}
                  className="text-[#EAE4D9]/60 hover:text-[#EAE4D9] text-sm"
                >
                  Back
                </button>
                <button
                  onClick={generateData}
                  className="bg-[#141210] border border-[#C89B3C] text-[#C89B3C] px-6 py-3 rounded font-semibold tracking-widest uppercase hover:bg-[#C89B3C] hover:text-[#141210] transition-colors"
                >
                  No, it's not listed
                </button>
              </div>
            </div>
          )}

          {step === 'loading' && (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
              <Loader2 className="w-12 h-12 text-[#C89B3C] animate-spin" />
              <div>
                <h3 className="text-xl font-serif text-[#EAE4D9] mb-2">Analyzing Bourbon Data</h3>
                <p className="text-[#EAE4D9]/60">Consulting the archives...</p>
              </div>
            </div>
          )}

          {step === 'review' && generatedBourbon && (
            <div className="space-y-6">
              <div className="bg-[#C89B3C]/10 border border-[#C89B3C]/30 p-4 rounded-lg flex gap-3">
                <CheckCircle className="text-[#C89B3C] shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="text-[#C89B3C] font-medium mb-1">Data Generated</h3>
                  <p className="text-[#EAE4D9]/80 text-sm">Please review the details below. Fields marked with * were estimated by AI.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-[#EAE4D9]/60 mb-1">Name</label>
                    <input
                      type="text"
                      value={generatedBourbon.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      className="w-full bg-[#141210] border border-[var(--color-vintage-border)] text-[#EAE4D9] p-2 rounded focus:outline-none focus:border-[#C89B3C]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-[#EAE4D9]/60 mb-1">Distillery</label>
                    <input
                      type="text"
                      value={generatedBourbon.distillery}
                      onChange={(e) => handleFieldChange('distillery', e.target.value)}
                      className="w-full bg-[#141210] border border-[var(--color-vintage-border)] text-[#EAE4D9] p-2 rounded focus:outline-none focus:border-[#C89B3C]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold tracking-widest uppercase text-[#EAE4D9]/60 mb-1">Proof</label>
                      <input
                        type="number"
                        value={generatedBourbon.proof}
                        onChange={(e) => handleFieldChange('proof', parseFloat(e.target.value))}
                        className="w-full bg-[#141210] border border-[var(--color-vintage-border)] text-[#EAE4D9] p-2 rounded focus:outline-none focus:border-[#C89B3C]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold tracking-widest uppercase text-[#EAE4D9]/60 mb-1">Age</label>
                      <input
                        type="text"
                        value={generatedBourbon.age}
                        onChange={(e) => handleFieldChange('age', e.target.value)}
                        className="w-full bg-[#141210] border border-[var(--color-vintage-border)] text-[#EAE4D9] p-2 rounded focus:outline-none focus:border-[#C89B3C]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-[#EAE4D9]/60 mb-1">Mash Bill</label>
                    <input
                      type="text"
                      value={generatedBourbon.mashBill}
                      onChange={(e) => handleFieldChange('mashBill', e.target.value)}
                      className="w-full bg-[#141210] border border-[var(--color-vintage-border)] text-[#EAE4D9] p-2 rounded focus:outline-none focus:border-[#C89B3C]"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-[#EAE4D9]/60 mb-1">Description</label>
                    <textarea
                      value={generatedBourbon.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      className="w-full bg-[#141210] border border-[var(--color-vintage-border)] text-[#EAE4D9] p-2 rounded focus:outline-none focus:border-[#C89B3C] h-32"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-[#EAE4D9]/60 mb-2">Flavor Profile (1-10)</label>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {Object.entries(generatedBourbon.flavorProfile || {}).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-xs text-[#EAE4D9]/80 capitalize">{key}</span>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={value}
                            onChange={(e) => handleFlavorChange(key as keyof FlavorProfile, parseInt(e.target.value))}
                            className="w-12 bg-[#141210] border border-[var(--color-vintage-border)] text-[#EAE4D9] p-1 rounded text-center text-xs focus:outline-none focus:border-[#C89B3C]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-[var(--color-vintage-border)] gap-4">
                <button
                  onClick={() => setStep('input')}
                  className="text-[#EAE4D9]/60 hover:text-[#EAE4D9] text-sm"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  className="bg-[#C89B3C] text-[#141210] px-6 py-3 rounded font-semibold tracking-widest uppercase hover:bg-[#B08832] transition-colors"
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
