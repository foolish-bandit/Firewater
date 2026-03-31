import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle } from 'lucide-react';
import { ToastItem } from '../hooks/useToast';

interface ToastProps {
  message: string;
  visible: boolean;
  onClose: () => void;
}

interface ToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

// Single toast (backward-compatible)
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
            className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] surface-raised text-on-surface px-6 py-3.5 text-sm font-sans tracking-wide elevated-high backdrop-blur-md flex items-center gap-3 border-l-4 border-l-on-surface-accent max-w-[calc(100%-2rem)] gold-glow"
            onClick={onClose}
          >
            <CheckCircle size={16} className="text-on-surface-accent shrink-0" />
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Stacked toasts
export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col-reverse gap-2 items-center pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="surface-raised text-on-surface px-6 py-3 text-sm font-sans tracking-wide shadow-lg backdrop-blur-sm flex items-center gap-3 border-l-[3px] border-l-on-surface-accent max-w-[calc(100vw-2rem)] pointer-events-auto cursor-pointer whitespace-nowrap"
            onClick={() => onDismiss(t.id)}
          >
            <CheckCircle size={16} className="text-on-surface-accent shrink-0" />
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
