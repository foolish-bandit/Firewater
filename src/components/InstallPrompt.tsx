import { useState, useEffect, useCallback } from 'react';
import { X, Download } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'brrl_install_dismissed';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

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
    localStorage.setItem(DISMISS_KEY, '1');
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
          <div className="bg-[#1A1816] vintage-border border-l-[3px] border-l-[#C89B3C] px-4 py-3 shadow-lg flex items-center gap-3">
            <Download size={18} className="text-[#C89B3C] shrink-0" />
            <span className="text-sm text-[#EAE4D9] font-sans tracking-wide flex-1">
              Install BRRL Book
            </span>
            <button
              onClick={handleInstall}
              className="text-xs font-semibold tracking-widest uppercase bg-[#C89B3C] text-[#141210] px-3 py-1.5 rounded-sm hover:bg-[#C89B3C]/90 transition-colors shrink-0"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="text-[#EAE4D9]/40 hover:text-[#EAE4D9] transition-colors shrink-0"
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
