import { useState, useEffect } from 'react';
import { isNative } from '../lib/capacitor';

/**
 * Returns true when the native keyboard is visible (iOS/Android).
 * Always returns false on web.
 */
export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isNative) return;

    let showHandle: { remove: () => Promise<void> } | null = null;
    let hideHandle: { remove: () => Promise<void> } | null = null;

    import('@capacitor/keyboard').then(({ Keyboard }) => {
      Keyboard.addListener('keyboardWillShow', () => setVisible(true)).then(h => { showHandle = h; });
      Keyboard.addListener('keyboardWillHide', () => setVisible(false)).then(h => { hideHandle = h; });
    });

    return () => {
      showHandle?.remove();
      hideHandle?.remove();
    };
  }, []);

  return visible;
}
