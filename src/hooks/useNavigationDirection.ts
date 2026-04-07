import { useRef } from 'react';
import { useLocation } from 'react-router-dom';

function segmentCount(path: string): number {
  return path.split('/').filter(Boolean).length;
}

/**
 * Returns 'forward' or 'back' based on route depth comparison.
 * More segments = deeper = forward. Fewer = back.
 * Same depth defaults to 'forward'.
 */
export function useNavigationDirection(): 'forward' | 'back' {
  const { pathname } = useLocation();
  const prevPath = useRef(pathname);
  const direction = useRef<'forward' | 'back'>('forward');

  if (pathname !== prevPath.current) {
    const prevDepth = segmentCount(prevPath.current);
    const currDepth = segmentCount(pathname);
    direction.current = currDepth < prevDepth ? 'back' : 'forward';
    prevPath.current = pathname;
  }

  return direction.current;
}
