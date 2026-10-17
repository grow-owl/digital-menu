import React from 'react';
import { CallWaiterButton } from '../customer/CallWaiterButton';

interface MenuFloatingActionsProps {
  tableId: string;
}

export const MenuFloatingActions: React.FC<MenuFloatingActionsProps> = ({ tableId }) => {
  return (
    <>
      {/* Floating Call Waiter Button */}
      <CallWaiterButton tableId={tableId} />
    </>
  );
};

