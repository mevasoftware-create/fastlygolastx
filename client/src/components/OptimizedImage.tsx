import { useState, useRef, useEffect, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError'> {
  src: string;
  alt: string;
  /** Low quality placeholder image (optional - will use blur effect if not provided) */
  placeholderSrc?: string;
  /** Aspect ratio for skeleton placeholder (e.g., "16/9", "4/3", "1/1") */
  aspectRatio?: string;
  /** Custom blur amount for placeholder (default: 20) */
  blurAmount?: number;
  /** Disable lazy loading */
  eager?: boolean;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Fallback image on error */
  fallbackSrc?: string;
  /** Container className */
  containerClassName?: string;
  /** Show loading spinner */
  showSpinner?: boolean;
  /** Callback when image loads */
  onImageLoad?: () => void;
  /** Callback on error */
  onImageError?: () => void;
}

export default function OptimizedImage({
  src,
  alt,
  placeholderSrc,
  aspectRatio,
  blurAmount = 20,
  eager = false,
  rootMargin = '200px',
  fallbackSrc = '/images/placeholder.webp',
  containerClassName,
  showSpinner = true,
  onImageLoad,
  onImageError,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(eager);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (eager || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin,
        threshold: 0.01,
      }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [eager, rootMargin]);

  // Reset state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    setCurrentSrc(src);
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
    onImageLoad?.();
  };

  const handleError = () => {
    if (!hasError && fallbackSrc && currentSrc !== fallbackSrc) {
      setHasError(true);
      setCurrentSrc(fallbackSrc);
    }
    onImageError?.();
  };

  // Calculate aspect ratio style
  const aspectRatioStyle = aspectRatio
    ? { aspectRatio }
    : undefined;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden bg-gray-100',
        containerClassName
      )}
      style={aspectRatioStyle}
    >
      {/* Skeleton/Blur Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]">
          {/* Shimmer effect */}
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"
            style={{
              animation: 'shimmer 1.5s infinite',
            }}
          />
          
          {/* Loading spinner */}
          {showSpinner && isInView && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Low quality placeholder (if provided) */}
      {placeholderSrc && !isLoaded && isInView && (
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-0' : 'opacity-100'
          )}
          style={{ filter: `blur(${blurAmount}px)`, transform: 'scale(1.1)' }}
        />
      )}

      {/* Main Image */}
      {isInView && (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full transition-all duration-500 ease-out',
            isLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-sm scale-105',
            className
          )}
          {...props}
        />
      )}
    </div>
  );
}

// Preload critical images
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

// Preload multiple images
export function preloadImages(srcs: string[]): Promise<void[]> {
  return Promise.all(srcs.map(preloadImage));
}

// Hook for preloading images on mount
export function usePreloadImages(srcs: string[]) {
  useEffect(() => {
    preloadImages(srcs).catch(console.error);
  }, [srcs]);
}
