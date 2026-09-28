import React from 'react';
import { CallWaiterButton } from '../customer/CallWaiterButton';
import { WaterRefillButton } from '../customer/WaterRefillButton';

interface MenuFloatingActionsProps {
  tableId: string;
}

export const MenuFloatingActions: React.FC<MenuFloatingActionsProps> = ({ tableId }) => {
  return (
    <>
      {/* Floating 1-Tap Water Refill (Directly above Call Waiter) */}
      <WaterRefillButton tableId={tableId} />

      {/* Floating Call Waiter Button */}
      <CallWaiterButton tableId={tableId} />
    </>
  );
};
