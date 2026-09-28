import React from 'react';
import { LoyaltyPointsModal } from '../customer/LoyaltyPointsModal';
import { OrderHistoryDrawer } from '../customer/OrderHistoryDrawer';
import { OffersDrawer } from '../customer/OffersDrawer';
import { GalleryModal } from '../customer/GalleryModal';
import { FaqModal } from '../customer/FaqModal';
import { CustomerFeedbackModal } from '../customer/CustomerFeedbackModal';

interface MenuCustomerModalsProps {
  isLoyaltyOpen: boolean;
  onCloseLoyalty: () => void;
  onOpenAuth: () => void;
  isHistoryOpen: boolean;
  onCloseHistory: () => void;
  isOffersOpen: boolean;
  onCloseOffers: () => void;
  isGalleryOpen: boolean;
  onCloseGallery: () => void;
  isFaqOpen: boolean;
  onCloseFaq: () => void;
  isFeedbackOpen: boolean;
  onCloseFeedback: () => void;
  activeOrderId?: string | null;
}

export const MenuCustomerModals: React.FC<MenuCustomerModalsProps> = ({
  isLoyaltyOpen,
  onCloseLoyalty,
  onOpenAuth,
  isHistoryOpen,
  onCloseHistory,
  isOffersOpen,
  onCloseOffers,
  isGalleryOpen,
  onCloseGallery,
  isFaqOpen,
  onCloseFaq,
  isFeedbackOpen,
  onCloseFeedback,
  activeOrderId,
}) => {
  return (
    <>
      <LoyaltyPointsModal
        isOpen={isLoyaltyOpen}
        onClose={onCloseLoyalty}
        onOpenAuth={onOpenAuth}
      />
      <OrderHistoryDrawer isOpen={isHistoryOpen} onClose={onCloseHistory} />
      <OffersDrawer isOpen={isOffersOpen} onClose={onCloseOffers} />
      <GalleryModal isOpen={isGalleryOpen} onClose={onCloseGallery} />
      <FaqModal isOpen={isFaqOpen} onClose={onCloseFaq} />
      <CustomerFeedbackModal
        isOpen={isFeedbackOpen}
        onClose={onCloseFeedback}
        orderId={activeOrderId || undefined}
      />
    </>
  );
};
