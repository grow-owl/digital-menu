import { useEffect } from 'react';

/**
 * Intercepts mobile phone back button (and browser back button)
 * when a modal or drawer is open so pressing 'Back' closes the modal
 * instead of navigating away from the page.
 */
export const useBackHandler = (isOpen: boolean, onClose: () => void) => {
  useEffect(() => {
    if (!isOpen) return;

    // Push a synthetic history state when modal opens
    const stateKey = `modal_open_${Date.now()}`;
    window.history.pushState({ modalState: stateKey }, '');

    const handlePopState = (e: PopStateEvent) => {
      // Close the modal/drawer when user presses mobile back button
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // If modal closed via UI close button (not back button), clean up history state if needed
    };
  }, [isOpen, onClose]);
};
