import { useState, useRef, useCallback } from 'react';
import { hapticNotification } from '../lib/capacitor';

export interface ToastItem {
  id: number;
  message: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    hapticNotification(type);
    const id = nextId.current++;
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2500);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Backward-compatible single toast for existing consumers
  const toast = toasts.length > 0
    ? { message: toasts[toasts.length - 1].message, visible: true }
    : { message: '', visible: false };

  return { toast, toasts, showToast, dismissToast };
}
