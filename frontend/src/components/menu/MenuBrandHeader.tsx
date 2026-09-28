import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, ShoppingBag, Menu, ChefHat } from 'lucide-react';

interface MenuBrandHeaderProps {
  isHeaderVisible: boolean;
  activeOrderId?: string | null;
  cartItemCount: number;
  onOpenCart: () => void;
  onOpenSidebar: () => void;
}

export const MenuBrandHeader: React.FC<MenuBrandHeaderProps> = ({
  isHeaderVisible,
  activeOrderId,
  cartItemCount,
  onOpenCart,
  onOpenSidebar,
}) => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: isHeaderVisible ? '1fr' : '0fr',
        maxHeight: isHeaderVisible ? '70px' : '0px',
        opacity: isHeaderVisible ? 1 : 0,
        transition:
          'grid-template-rows 300ms cubic-bezier(0.4, 0, 0.2, 1), max-height 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms ease',
        overflow: 'hidden',
        pointerEvents: isHeaderVisible ? 'auto' : 'none',
      }}
    >
      <div style={{ overflow: 'hidden', minHeight: 0 }}>
        <header className="bg-white/95 px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 border-b border-slate-200/90">
          <div className="max-w-[1560px] mx-auto w-full flex items-center justify-between gap-2">
            {/* Left Side: Coffee Emblem + Brand Name */}
            <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0 flex-1">
              <div className="flex w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-[#9d785e] to-[#87654d] border border-[#87654d]/60 items-center justify-center text-white shadow-xs shrink-0">
                <Coffee className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>

              <span className="font-extrabold text-xs sm:text-sm md:text-base text-slate-900 tracking-tight font-serif uppercase whitespace-nowrap">
                Siliguri's Chai Addaa
              </span>
            </div>

            {/* Right Side: Track Order -> Cart -> Navbar Burger */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
              {activeOrderId && (
                <button
                  onClick={() => navigate(`/order/${activeOrderId}`)}
                  className="relative p-2 sm:px-3 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer font-black text-xs shrink-0 active:scale-95"
                  title="Track Active Kitchen Order"
                >
                  <ChefHat className="w-4 h-4 animate-bounce text-emerald-100 shrink-0" />
                  <span className="uppercase tracking-wider text-[10px] sm:text-xs font-black hidden sm:inline">
                    Track Order
                  </span>
                </button>
              )}

              {/* Table Cart Button */}
              <button
                onClick={onOpenCart}
                className="relative p-2 sm:p-2.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-[#0C831F] text-slate-800 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                title="View Active Table Cart"
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-slate-800" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-[#0C831F] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm animate-in zoom-in-75 duration-150">
                    {cartItemCount}
                  </span>
                )}
              </button>

              {/* Navbar Burger Menu Trigger */}
              <button
                onClick={onOpenSidebar}
                className="p-2 sm:p-2.5 text-slate-800 hover:text-slate-950 bg-slate-100 hover:bg-slate-200/90 border border-slate-200 rounded-xl shadow-2xs transition-all shrink-0 cursor-pointer active:scale-95"
                title="Open Dining Menu"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
              </button>
            </div>
          </div>
        </header>
      </div>
    </div>
  );
};
