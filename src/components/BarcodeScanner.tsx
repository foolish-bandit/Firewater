import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Keyboard, Loader2, AlertCircle } from 'lucide-react';
import { Liquor } from '../liquorTypes';
import {
  lookupLocalUpc,
  lookupExternalUpc,
  saveUpcMapping,
  isLikelyLiquor,
  fuzzyMatchLiquor,
  UpcLookupResult,
} from '../services/upcService';

export type BarcodeScanResult = {
  type: 'match';
  liquorId: string;
  upc: string;
} | {
  type: 'prefill';
  upc: string;
  productName: string;
  brand?: string;
  description?: string;
} | {
  type: 'manual-entry';
  upc: string;
}

interface BarcodeScannerProps {
  onResult: (result: BarcodeScanResult) => void;
  onClose: () => void;
  liquors: Liquor[];
}

export default function BarcodeScanner({ onResult, onClose, liquors }: BarcodeScannerProps) {
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [manualUpc, setManualUpc] = useState('');
  const [status, setStatus] = useState<'scanning' | 'processing' | 'error' | 'camera-denied'>('scanning');
  const [errorMessage, setErrorMessage] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<string>('barcode-scanner-' + Date.now());
  const processingRef = useRef(false);

  useEffect(() => {
    if (mode !== 'camera') return;

    let mounted = true;
    const scannerId = containerRef.current;

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode(scannerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 280, height: 150 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (!mounted || processingRef.current) return;
            processingRef.current = true;
            handleScannedCode(decodedText);
          },
          () => {
            // Ignore scan failures (no barcode in frame)
          }
        );
      } catch (err: any) {
        if (!mounted) return;
        console.error('Camera start error:', err);
        if (
          err?.toString().includes('NotAllowedError') ||
          err?.toString().includes('Permission') ||
          err?.toString().includes('denied')
        ) {
          setStatus('camera-denied');
        } else {
          setStatus('error');
          setErrorMessage('Could not access camera. Please try manual entry.');
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [mode]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // Ignore
      }
      scannerRef.current = null;
    }
  };

  const handleScannedCode = async (upc: string) => {
    await stopScanner();
    await processUpc(upc);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const upc = manualUpc.trim();
    if (!upc) return;
    await processUpc(upc);
  };

  const processUpc = async (upc: string) => {
    setStatus('processing');

    // Step 1: Check local mapping
    const localMatch = lookupLocalUpc(upc);
    if (localMatch) {
      const liquor = liquors.find(b => b.id === localMatch);
      if (liquor) {
        onResult({ type: 'match', liquorId: liquor.id, upc });
        return;
      }
    }

    // Step 2: External API lookup
    let externalResult: UpcLookupResult | null = null;
    try {
      externalResult = await lookupExternalUpc(upc);
    } catch {
      // API failure - will fall through to manual entry
    }

    if (externalResult && externalResult.productName) {
      // Check if it's a liquor product
      if (!isLikelyLiquor(externalResult)) {
        setStatus('error');
        setErrorMessage(
          "That doesn't appear to be a liquor. Try scanning the bottle's barcode."
        );
        processingRef.current = false;
        return;
      }

      // Step 3: Fuzzy match against catalog
      const match = fuzzyMatchLiquor(externalResult.productName, liquors);
      if (match) {
        saveUpcMapping(upc, match.id);
        onResult({ type: 'match', liquorId: match.id, upc });
        return;
      }

      // Step 4: No catalog match — pre-fill submission form
      onResult({
        type: 'prefill',
        upc,
        productName: externalResult.productName,
        brand: externalResult.brand,
        description: externalResult.description,
      });
      return;
    }

    // Step 5: API returned nothing — prompt manual entry
    onResult({ type: 'manual-entry', upc });
  };

  const handleRetry = () => {
    setStatus('scanning');
    setErrorMessage('');
    processingRef.current = false;
    if (mode === 'camera') {
      // Re-trigger camera by toggling mode
      setMode('manual');
      setTimeout(() => setMode('camera'), 50);
    }
  };

  const switchToManual = () => {
    stopScanner();
    setMode('manual');
    setStatus('scanning');
    setErrorMessage('');
    processingRef.current = false;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-vintage-bg)]/90 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#1A1816] vintage-border p-6 md:p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none border-[4px] border-[#141210] m-1"></div>
        <button
          onClick={() => { stopScanner(); onClose(); }}
          className="absolute top-6 right-6 text-[#EAE4D9]/40 hover:text-[#C89B3C] transition-colors z-10"
        >
          <X size={24} />
        </button>

        <div className="relative z-10">
          <h2 className="font-display text-3xl text-[#EAE4D9] mb-2">Scan Barcode</h2>
          <p className="text-[#EAE4D9]/60 mb-6">Point your camera at a liquor bottle's UPC barcode.</p>

          {/* Mode Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { if (mode !== 'camera') { setMode('camera'); setStatus('scanning'); processingRef.current = false; } }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold tracking-widest uppercase transition-all border ${
                mode === 'camera'
                  ? 'bg-[#C89B3C] text-[#141210] border-[#C89B3C]'
                  : 'bg-transparent text-[#EAE4D9]/60 border-[#EAE4D9]/20 hover:border-[#C89B3C] hover:text-[#C89B3C]'
              }`}
            >
              <Camera size={14} /> Camera
            </button>
            <button
              onClick={switchToManual}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold tracking-widest uppercase transition-all border ${
                mode === 'manual'
                  ? 'bg-[#C89B3C] text-[#141210] border-[#C89B3C]'
                  : 'bg-transparent text-[#EAE4D9]/60 border-[#EAE4D9]/20 hover:border-[#C89B3C] hover:text-[#C89B3C]'
              }`}
            >
              <Keyboard size={14} /> Manual
            </button>
          </div>

          {/* Processing State */}
          {status === 'processing' && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="w-10 h-10 text-[#C89B3C] animate-spin" />
              <p className="text-[#EAE4D9]/60">Looking up barcode...</p>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-900/20 border border-red-900/50 text-red-200 p-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <p>{errorMessage}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRetry}
                  className="flex-1 bg-[#141210] border border-[#C89B3C] text-[#C89B3C] px-4 py-3 rounded font-semibold tracking-widest uppercase text-xs hover:bg-[#C89B3C] hover:text-[#141210] transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={switchToManual}
                  className="flex-1 bg-[#141210] border border-[#EAE4D9]/20 text-[#EAE4D9]/60 px-4 py-3 rounded font-semibold tracking-widest uppercase text-xs hover:border-[#C89B3C] hover:text-[#C89B3C] transition-colors"
                >
                  Enter Manually
                </button>
              </div>
            </div>
          )}

          {/* Camera Denied State */}
          {status === 'camera-denied' && (
            <div className="space-y-4">
              <div className="bg-[#C89B3C]/10 border border-[#C89B3C]/30 p-4 rounded-lg">
                <h3 className="text-[#C89B3C] font-medium mb-2">Camera Access Denied</h3>
                <p className="text-[#EAE4D9]/60 text-sm">
                  Please allow camera access in your browser settings, or enter the UPC number manually.
                </p>
              </div>
              <button
                onClick={switchToManual}
                className="w-full bg-[#C89B3C] text-[#141210] px-4 py-3 rounded font-semibold tracking-widest uppercase text-xs hover:bg-[#B08832] transition-colors"
              >
                Enter UPC Manually
              </button>
            </div>
          )}

          {/* Camera Scanner */}
          {mode === 'camera' && status === 'scanning' && (
            <div className="space-y-4">
              <div
                id={containerRef.current}
                className="w-full rounded-lg overflow-hidden bg-black/50 min-h-[220px] sm:min-h-[280px]"
              />
              <p className="text-center text-[#EAE4D9]/40 text-xs">
                Position the barcode within the frame
              </p>
            </div>
          )}

          {/* Manual Entry */}
          {mode === 'manual' && status === 'scanning' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-[#EAE4D9]/60 mb-2">
                  UPC Number
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={manualUpc}
                  onChange={(e) => setManualUpc(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-[#141210] border border-[var(--color-vintage-border)] text-[#EAE4D9] p-3 rounded focus:outline-none focus:border-[#C89B3C] transition-colors font-mono text-lg tracking-widest"
                  placeholder="012345678901"
                  autoFocus
                />
                <p className="text-[#EAE4D9]/40 text-xs mt-2">
                  Enter the 12 or 13-digit number below the barcode on the bottle.
                </p>
              </div>
              <button
                type="submit"
                disabled={!manualUpc.trim()}
                className="w-full bg-[#C89B3C] text-[#141210] px-4 py-3 rounded font-semibold tracking-widest uppercase text-xs hover:bg-[#B08832] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Look Up
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
