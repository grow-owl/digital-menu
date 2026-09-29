import React from 'react';
import { CallWaiterButton } from '../customer/CallWaiterButton';

interface MenuFloatingActionsProps {
  tableId: string;
}

export const MenuFloatingActions: React.FC<MenuFloatingActionsProps> = ({ tableId }) => {
  return (
    <>
      {/* Floating Call Service Button */}
      <CallWaiterButton tableId={tableId} />
    </>
  );
};

