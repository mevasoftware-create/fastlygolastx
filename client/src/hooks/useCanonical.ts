import { useEffect } from 'react';

/**
 * Custom hook to add canonical URL meta tag to prevent duplicate content issues
 * @param canonicalUrl - The canonical URL for the current page
 */
export function useCanonical(canonicalUrl: string) {
  useEffect(() => {
    // Remove existing canonical link if any
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }

    // Create and add new canonical link
    const link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', canonicalUrl);
    document.head.appendChild(link);

    // Cleanup function to remove the canonical link when component unmounts
    return () => {
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        canonical.remove();
      }
    };
  }, [canonicalUrl]);
}
