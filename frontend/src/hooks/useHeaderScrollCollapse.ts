import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to track scroll direction and control sticky header visibility
 * Features jitter suppression, cooldown protection, and requestAnimationFrame throttling.
 */
export const useHeaderScrollCollapse = () => {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const isHeaderVisibleRef = useRef(true);
  const lastScrollY = useRef(0);
  const accumulatedDistance = useRef(0);
  const scrollDirection = useRef<'up' | 'down'>('up');
  const transitionCooldownRef = useRef(0);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    isHeaderVisibleRef.current = isHeaderVisible;
  }, [isHeaderVisible]);

  useEffect(() => {
    const handleScroll = () => {
      if (rafId.current !== null) return;

      rafId.current = window.requestAnimationFrame(() => {
        rafId.current = null;
        const currentScrollY = Math.max(0, window.scrollY);
        const delta = currentScrollY - lastScrollY.current;

        // Ignore micro-jitter / subpixel bounce
        if (Math.abs(delta) < 3) {
          return;
        }

        const now = Date.now();

        // Always show when near the very top of page
        if (currentScrollY <= 60) {
          if (!isHeaderVisibleRef.current) {
            setIsHeaderVisible(true);
            transitionCooldownRef.current = now + 350;
          }
          accumulatedDistance.current = 0;
          scrollDirection.current = 'up';
          lastScrollY.current = currentScrollY;
          return;
        }

        // If in transition cooldown period, ignore opposite triggers to prevent oscillation
        if (now < transitionCooldownRef.current) {
          lastScrollY.current = currentScrollY;
          return;
        }

        if (delta > 0) {
          // Scrolling DOWN
          if (scrollDirection.current !== 'down') {
            scrollDirection.current = 'down';
            accumulatedDistance.current = 0;
          }
          accumulatedDistance.current += delta;

          // Hide header once scrolled down 45px and past top zone
          if (accumulatedDistance.current >= 45 && currentScrollY > 120 && isHeaderVisibleRef.current) {
            setIsHeaderVisible(false);
            transitionCooldownRef.current = now + 350;
            accumulatedDistance.current = 0;
          }
        } else if (delta < 0) {
          // Scrolling UP
          if (scrollDirection.current !== 'up') {
            scrollDirection.current = 'up';
            accumulatedDistance.current = 0;
          }
          accumulatedDistance.current += Math.abs(delta);

          // Reveal header once scrolled up 40px
          if (accumulatedDistance.current >= 40 && !isHeaderVisibleRef.current) {
            setIsHeaderVisible(true);
            transitionCooldownRef.current = now + 350;
            accumulatedDistance.current = 0;
          }
        }

        lastScrollY.current = currentScrollY;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId.current !== null) {
        window.cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return { isHeaderVisible };
};
