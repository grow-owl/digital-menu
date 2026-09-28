import { useEffect } from 'react';

let activeLockCount = 0;
let savedBodyOverflow = '';
let savedDocOverflow = '';
let savedBodyTouchAction = '';
let savedBodyOverscroll = '';

/**
 * Custom React hook to prevent background scrolling when any modal/drawer is open.
 * Uses reference counting so nested modals/drawers don't unlock background scrolling prematurely.
 * Works across Desktop, iOS Safari, Android Chrome, and touch viewports.
 */
export const useBodyScrollLock = (isLocked: boolean) => {
  useEffect(() => {
    if (!isLocked) return;

    if (activeLockCount === 0) {
      savedBodyOverflow = document.body.style.overflow;
      savedDocOverflow = document.documentElement.style.overflow;
      savedBodyTouchAction = document.body.style.touchAction;
      savedBodyOverscroll = document.body.style.overscrollBehavior;

      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      document.body.style.overscrollBehavior = 'none';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.overscrollBehavior = 'none';

      document.body.classList.add('modal-open');
      document.documentElement.classList.add('modal-open');
    }

    activeLockCount++;

    return () => {
      activeLockCount = Math.max(0, activeLockCount - 1);
      if (activeLockCount === 0) {
        document.body.style.overflow = savedBodyOverflow;
        document.body.style.touchAction = savedBodyTouchAction;
        document.body.style.overscrollBehavior = savedBodyOverscroll;
        document.documentElement.style.overflow = savedDocOverflow;
        document.documentElement.style.overscrollBehavior = '';

        document.body.classList.remove('modal-open');
        document.documentElement.classList.remove('modal-open');
      }
    };
  }, [isLocked]);
};
