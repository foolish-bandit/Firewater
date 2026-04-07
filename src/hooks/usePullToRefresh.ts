import { useEffect, useRef, useState, useCallback } from 'react';
import { isNative, platform } from '../lib/capacitor';

const THRESHOLD = 80;
const MAX_PULL = 120;

/**
 * Pull-to-refresh for native iOS.
 *
 * Listens for touch gestures on the window when scrolled to top.
 * Injects a small spinner element at the top of the page during pull/refresh.
 * Returns `isRefreshing` so the host component can show additional loading UI.
 *
 * On web (or non-iOS native), this is a no-op.
 */
export function usePullToRefresh(onRefresh: () => Promise<void> | void) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  const refreshingRef = useRef(false);

  const getIndicator = useCallback(() => {
    if (indicatorRef.current) return indicatorRef.current;
    // Inject spin keyframe if not present
    if (!document.getElementById('ptr-spin-style')) {
      const style = document.createElement('style');
      style.id = 'ptr-spin-style';
      style.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
      document.head.appendChild(style);
    }
    const el = document.createElement('div');
    el.id = 'ptr-indicator';
    el.style.cssText =
      'position:fixed;top:0;left:0;right:0;display:flex;align-items:center;justify-content:center;' +
      'height:0;overflow:hidden;z-index:9999;pointer-events:none;transition:none;background:rgba(20,18,16,0.85);';
    el.innerHTML =
      '<div style="width:24px;height:24px;border:2px solid rgba(200,155,60,0.3);border-top-color:#C89B3C;border-radius:50%;"></div>';
    document.body.prepend(el);
    indicatorRef.current = el;
    return el;
  }, []);

  useEffect(() => {
    if (!isNative || platform !== 'ios') return;

    const onTouchStart = (e: TouchEvent) => {
      if (refreshingRef.current) return;
      if (window.scrollY > 0) return;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current || refreshingRef.current) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy < 0) {
        pulling.current = false;
        return;
      }
      const progress = Math.min(dy / MAX_PULL, 1);
      const indicator = getIndicator();
      const h = Math.min(dy * 0.5, 60);
      indicator.style.height = `${h}px`;
      const spinner = indicator.firstElementChild as HTMLElement;
      if (spinner) {
        const rotation = progress * 360;
        spinner.style.transform = `rotate(${rotation}deg)`;
        spinner.style.opacity = `${Math.min(progress * 1.5, 1)}`;
      }
    };

    const onTouchEnd = async () => {
      if (!pulling.current || refreshingRef.current) {
        pulling.current = false;
        return;
      }
      pulling.current = false;
      const indicator = getIndicator();
      const h = parseFloat(indicator.style.height) || 0;
      // Threshold reached — trigger refresh
      if (h >= THRESHOLD * 0.5) {
        refreshingRef.current = true;
        setIsRefreshing(true);
        // Animate spinner
        indicator.style.height = '44px';
        indicator.style.transition = 'height 0.2s ease';
        const spinner = indicator.firstElementChild as HTMLElement;
        if (spinner) {
          spinner.style.animation = 'spin 0.6s linear infinite';
        }
        try {
          await onRefresh();
        } finally {
          refreshingRef.current = false;
          setIsRefreshing(false);
          indicator.style.transition = 'height 0.2s ease';
          indicator.style.height = '0';
          if (spinner) spinner.style.animation = '';
          setTimeout(() => { indicator.style.transition = 'none'; }, 200);
        }
      } else {
        // Snap back
        indicator.style.transition = 'height 0.2s ease';
        indicator.style.height = '0';
        setTimeout(() => { indicator.style.transition = 'none'; }, 200);
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd);

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      if (indicatorRef.current) {
        indicatorRef.current.remove();
        indicatorRef.current = null;
      }
    };
  }, [onRefresh, getIndicator]);

  return { isRefreshing };
}
