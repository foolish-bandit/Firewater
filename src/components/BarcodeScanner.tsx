import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Keyboard, Loader2, AlertCircle } from 'lucide-react';
import { Liquor } from '../liquorTypes';
import { isNative } from '../lib/capacitor';
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

/**
 * Capture a photo via @capacitor/camera and decode any barcode in it.
 * Returns the decoded text or null if no barcode found / user cancelled.
 */
async function scanBarcodeNative(): Promise<string | null> {
  const { Camera: CapCamera, CameraResultType, CameraSource } = await import("@capacitor/camera");
  const image = await CapCamera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Camera,
    width: 1600,
    height: 1600,
  });

  if (!image.dataUrl) return null;

  // Convert data URL to File for Html5Qrcode.scanFileV2
  const res = await fetch(image.dataUrl);
  const blob = await res.blob();
  const file = new File([blob], "barcode.jpg", { type: "image/jpeg" });

  const scanner = new Html5Qrcode("native-barcode-decode", /* verbose= */ false);
  try {
    const result = await scanner.scanFileV2(file, /* showImage= */ false);
    return result.decodedText;
  } catch {
    return null; // no barcode detected in photo
  } finally {
    scanner.clear();
  }
}

export default function BarcodeScanner({ onResult, onClose, liquors }: BarcodeScannerProps) {
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [manualUpc, setManualUpc] = useState('');
  const [status, setStatus] = useState<'scanning' | 'processing' | 'error' | 'camera-denied'>('scanning');
  const [errorMessage, setErrorMessage] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<string>('barcode-scanner-' + Date.now());
  const processingRef = useRef(false);

  // ─── Native camera scan (iOS / Android) ──────────────────────────────────
  const handleNativeScan = async () => {
    setStatus('processing');
    try {
      const code = await scanBarcodeNative();
      if (code) {
        await processUpc(code);
      } else {
        setStatus('error');
        setErrorMessage('No barcode detected in the photo. Try again or enter the UPC manually.');
      }
    } catch (err: any) {
      // User cancelled the camera
      if (err?.message?.includes('cancelled') || err?.message?.includes('canceled') || err?.message?.includes('User')) {
        setStatus('scanning');
      } else {
        setStatus('error');
        setErrorMessage('Could not access camera. Please try manual entry.');
      }
    } finally {
      processingRef.current = false;
    }
  };

  // ─── Web camera scan (html5-qrcode live stream) ──────────────────────────
  useEffect(() => {
    if (mode !== 'camera' || isNative) return;

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
      if (isNative) {
        handleNativeScan();
      } else {
        // Re-trigger camera by toggling mode
        setMode('manual');
        setTimeout(() => setMode('camera'), 50);
      }
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
      <div className="surface-raised p-6 md:p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none border-[4px] border-surface-base m-1"></div>
        <button
          onClick={() => { stopScanner(); onClose(); }}
          className="absolute top-6 right-6 text-on-surface-muted hover:text-on-surface-accent transition-colors z-10"
        >
          <X size={24} />
        </button>

        <div className="relative z-10">
          <h2 className="font-display text-3xl text-on-surface mb-2">Scan Barcode</h2>
          <p className="text-on-surface-muted mb-6">
            {isNative
              ? 'Take a photo of a liquor bottle\'s UPC barcode.'
              : 'Point your camera at a liquor bottle\'s UPC barcode.'}
          </p>

          {/* Mode Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                if (mode !== 'camera') {
                  setMode('camera');
                  setStatus('scanning');
                  processingRef.current = false;
                  if (isNative) handleNativeScan();
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold tracking-widest uppercase transition-all border ${
                mode === 'camera'
                  ? 'bg-on-surface-accent text-on-surface-invert border-border-accent-strong'
                  : 'bg-transparent text-on-surface-muted border-on-surface/20 hover:border-border-accent-strong hover:text-on-surface-accent'
              }`}
            >
              <Camera size={14} /> Camera
            </button>
            <button
              onClick={switchToManual}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold tracking-widest uppercase transition-all border ${
                mode === 'manual'
                  ? 'bg-on-surface-accent text-on-surface-invert border-border-accent-strong'
                  : 'bg-transparent text-on-surface-muted border-on-surface/20 hover:border-border-accent-strong hover:text-on-surface-accent'
              }`}
            >
              <Keyboard size={14} /> Manual
            </button>
          </div>

          {/* Processing State */}
          {status === 'processing' && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="w-10 h-10 text-on-surface-accent animate-spin" />
              <p className="text-on-surface-muted">Looking up barcode...</p>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="space-y-4">
              <div className="status-error flex items-start gap-3">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <p>{errorMessage}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRetry}
                  className="flex-1 bg-surface-base border border-border-accent-strong text-on-surface-accent px-4 py-3 rounded font-semibold tracking-widest uppercase text-xs hover:bg-on-surface-accent hover:text-on-surface-invert transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={switchToManual}
                  className="flex-1 bg-surface-base border border-on-surface/20 text-on-surface-muted px-4 py-3 rounded font-semibold tracking-widest uppercase text-xs hover:border-border-accent-strong hover:text-on-surface-accent transition-colors"
                >
                  Enter Manually
                </button>
              </div>
            </div>
          )}

          {/* Camera Denied State */}
          {status === 'camera-denied' && (
            <div className="space-y-4">
              <div className="bg-on-surface-accent/10 border border-border-accent p-4 rounded-lg">
                <h3 className="text-on-surface-accent font-medium mb-2">Camera Access Denied</h3>
                <p className="text-on-surface-muted text-sm">
                  {isNative
                    ? 'Please allow camera access in Settings, or enter the UPC number manually.'
                    : 'Please allow camera access in your browser settings, or enter the UPC number manually.'}
                </p>
              </div>
              <button
                onClick={switchToManual}
                className="btn btn-primary btn-md rounded w-full"
              >
                Enter UPC Manually
              </button>
            </div>
          )}

          {/* Camera Scanner — Web only (html5-qrcode live stream) */}
          {mode === 'camera' && status === 'scanning' && !isNative && (
            <div className="space-y-4">
              <div
                id={containerRef.current}
                className="w-full rounded-lg overflow-hidden bg-black/50 min-h-[220px] sm:min-h-[280px]"
              />
              <p className="text-center text-on-surface-muted text-xs">
                Position the barcode within the frame
              </p>
            </div>
          )}

          {/* Camera Scanner — Native: tap-to-scan button */}
          {mode === 'camera' && status === 'scanning' && isNative && (
            <div className="space-y-4">
              <button
                onClick={handleNativeScan}
                className="w-full py-12 border-2 border-dashed border-border-accent rounded-lg flex flex-col items-center gap-3 hover:bg-on-surface-accent/5 transition-colors"
              >
                <Camera className="w-10 h-10 text-on-surface-accent" />
                <span className="text-on-surface-accent text-xs font-semibold tracking-widest uppercase">
                  Tap to Scan Barcode
                </span>
              </button>
              <p className="text-center text-on-surface-muted text-xs">
                Your camera will open — point it at the barcode
              </p>
            </div>
          )}

          {/* Hidden container for native barcode decoding */}
          {isNative && <div id="native-barcode-decode" className="hidden" />}

          {/* Manual Entry */}
          {mode === 'manual' && status === 'scanning' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-on-surface-muted mb-2">
                  UPC Number
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={manualUpc}
                  onChange={(e) => setManualUpc(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-surface-base border border-[var(--color-vintage-border)] text-on-surface p-3 rounded focus:outline-none focus:border-border-accent-strong transition-colors font-mono text-lg tracking-widest"
                  placeholder="012345678901"
                  autoFocus
                />
                <p className="text-on-surface-muted text-xs mt-2">
                  Enter the 12 or 13-digit number below the barcode on the bottle.
                </p>
              </div>
              <button
                type="submit"
                disabled={!manualUpc.trim()}
                className="btn btn-primary btn-md rounded w-full"
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
