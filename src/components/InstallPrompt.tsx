import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Download } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { storage } from '../lib/storage';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'brrl_install_dismissed';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const dismissedRef = useRef(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      if (!dismissedRef.current) {
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setVisible(true);
      }
    };

    // Check async storage for prior dismissal
    storage.get(DISMISS_KEY).then(val => {
      if (val) {
        dismissedRef.current = true;
      }
    });

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setDeferredPrompt(null);
    dismissedRef.current = true;
    storage.set(DISMISS_KEY, '1');
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[99] w-[calc(100%-2rem)] max-w-sm md:hidden"
        >
          <div className="surface-raised border-l-[3px] border-l-on-surface-accent px-4 py-3 shadow-lg flex items-center gap-3">
            <Download size={18} className="text-on-surface-accent shrink-0" />
            <span className="text-sm text-on-surface font-sans tracking-wide flex-1">
              Install FIREWATER
            </span>
            <button
              onClick={handleInstall}
              className="text-xs font-semibold tracking-widest uppercase bg-on-surface-accent text-on-surface-invert px-3 py-1.5 rounded-sm hover:bg-on-surface-accent/90 transition-colors shrink-0"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="text-on-surface/40 hover:text-on-surface transition-colors shrink-0"
              aria-label="Dismiss install prompt"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
