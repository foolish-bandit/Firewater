/**
 * Lazy-loaded image component using Intersection Observer.
 *
 * Only loads images when they enter the viewport, reducing initial
 * bandwidth on mobile networks. Supports:
 * - Intersection Observer with configurable rootMargin
 * - Fade-in animation on load
 * - Fallback placeholder while loading
 * - Native loading="lazy" as fallback for older browsers
 */

import React, { useState, useRef, useEffect } from "react";

interface LazyImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  /** Preload margin around viewport (default: 200px) */
  rootMargin?: string;
  /** Width hint for layout stability */
  width?: number;
  /** Height hint for layout stability */
  height?: number;
  /** Callback when image finishes loading */
  onLoad?: () => void;
  /** Fallback element while loading or if src is null */
  fallback?: React.ReactNode;
}

export function LazyImage({
  src,
  alt,
  className = "",
  rootMargin = "200px",
  width,
  height,
  onLoad,
  fallback,
}: LazyImageProps) {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = imgRef.current;
    if (!el || !src) return;

    // Use IntersectionObserver for lazy loading
    if (!("IntersectionObserver" in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [src, rootMargin]);

  if (!src || hasError) {
    return <>{fallback || null}</>;
  }

  return (
    <div ref={imgRef} className={className} style={{ width, height }}>
      {isInView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          width={width}
          height={height}
          onLoad={() => {
            setIsLoaded(true);
            onLoad?.();
          }}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
      {!isLoaded && isInView && !hasError && fallback}
    </div>
  );
}
