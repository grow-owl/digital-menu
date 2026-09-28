import React from 'react';

interface MenuFloatingCartBarProps {
  itemCount: number;
  grandTotal: number;
  onOpenCart: () => void;
}

export const MenuFloatingCartBar: React.FC<MenuFloatingCartBarProps> = ({
  itemCount,
  grandTotal,
  onOpenCart,
}) => {
  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:w-96 z-40">
      <button
        onClick={onOpenCart}
        className="w-full py-3.5 px-5 sm:px-6 bg-[#0C831F] hover:bg-[#096918] text-white font-black rounded-2xl text-xs sm:text-sm transition-all duration-150 shadow-[0_8px_30px_rgba(12,131,31,0.5)] flex items-center justify-between border-2 border-emerald-400 active:scale-95 cursor-pointer"
      >
        <div className="flex items-center space-x-2.5">
          <span className="w-6 h-6 sm:w-7 sm:h-7 bg-white text-[#0C831F] rounded-full text-xs flex items-center justify-center font-black shrink-0 shadow-sm">
            {itemCount}
          </span>
          <span className="tracking-wide uppercase font-black text-white text-xs sm:text-sm">
            View Table Cart
          </span>
        </div>
        <div className="flex items-center space-x-1.5 font-mono font-black text-sm sm:text-base text-white shrink-0">
          <span>₹{grandTotal.toFixed(2)}</span>
          <span className="text-white/80">➔</span>
        </div>
      </button>
    </div>
  );
};
