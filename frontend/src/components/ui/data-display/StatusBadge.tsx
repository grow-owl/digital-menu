import React from 'react';

export type StatusType = 'VACANT' | 'OCCUPIED' | 'RESERVED' | 'NEEDS_CLEANING' | 'PENDING' | 'PREPARING' | 'READY' | 'SETTLED' | 'CANCELLED';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getColors = () => {
    switch (status.toUpperCase()) {
      case 'VACANT':
      case 'READY':
      case 'SETTLED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'OCCUPIED':
      case 'PREPARING':
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'RESERVED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'NEEDS_CLEANING':
      case 'CANCELLED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getColors()} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
      {status.replace('_', ' ')}
    </span>
  );
};
