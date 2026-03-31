import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  visible: boolean;
  onClose: () => void;
}

export default function Toast({ message, visible, onClose }: ToastProps) {
  return (
    <div role="status" aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-[#1A1816] vintage-border text-[#EAE4D9] px-6 py-3.5 text-sm font-sans tracking-wide elevated-high backdrop-blur-md flex items-center gap-3 border-l-4 border-l-[#C89B3C] max-w-[calc(100%-2rem)] gold-glow"
            onClick={onClose}
          >
            <CheckCircle size={16} className="text-[#C89B3C] shrink-0" />
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
