import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const isVisibleRef = useRef(false);

  useEffect(() => {
    let ticking = false;
    const toggleVisibility = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          const shouldShow = window.pageYOffset > 300;
          if (isVisibleRef.current !== shouldShow) {
            isVisibleRef.current = shouldShow;
            setIsVisible(shouldShow);
          }
          ticking = false;
        });
      }
    };
    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <Button
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 z-50 h-12 w-12 rounded-full bg-orange-600 hover:bg-orange-700 shadow-lg transition-colors duration-300 hover:scale-110"
      size="icon"
      aria-label="Yukarı çık"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
}
