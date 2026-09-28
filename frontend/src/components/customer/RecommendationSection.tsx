import React, { useRef } from 'react';
import { MenuItem } from '../../types/menu.types';
import { Sparkles, Check, ArrowRight, Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCartStore } from '../../store/use-cart-store';

interface RecommendationSectionProps {
  title: string;
  icon?: React.ReactNode;
  items: MenuItem[];
  onItemClick: (item: MenuItem) => void;
  variant?: 'chef' | 'popular';
}

export const RecommendationSection: React.FC<RecommendationSectionProps> = ({
  title,
  icon = <Sparkles className="w-4 h-4 text-emerald-600" />,
  items,
  onItemClick,
  variant = 'chef',
}) => {
  const { items: cartItems, addItem, updateQuantity, removeItem } = useCartStore();
  const scrollRailRef = useRef<HTMLDivElement>(null);

  const scrollRail = (dir: 'left' | 'right') => {
    if (scrollRailRef.current) {
      scrollRailRef.current.scrollBy({
        left: dir === 'left' ? -260 : 260,
        behavior: 'smooth',
      });
    }
  };

  const getQuantityInCart = (itemId: number) => {
    const existing = cartItems.find((it) => it.menuItem.id === itemId);
    return existing ? existing.quantity : 0;
  };

  if (items.length === 0) return null;

  const isChef = variant === 'chef';

  return (
    <div className="px-2.5 sm:px-6 lg:px-8 max-w-[1560px] mx-auto my-2.5 sm:my-4">
      <div
        className={`rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 shadow-lg space-y-2 sm:space-y-2.5 border transition-all ${
          isChef
            ? 'bg-gradient-to-br from-[#1b1305] via-[#241a08] to-[#120d04] border-amber-500/35 shadow-amber-950/20'
            : 'bg-gradient-to-br from-[#061c10] via-[#0b2617] to-[#041209] border-emerald-500/35 shadow-emerald-950/20'
        }`}
      >
        {/* Section Header with Accent and Item Count */}
        <div
          className={`flex items-center justify-between pb-1.5 sm:pb-2 border-b ${
            isChef ? 'border-amber-500/20' : 'border-emerald-500/20'
          }`}
        >
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <span
              className={`p-1 sm:p-1.5 rounded-lg sm:rounded-xl border shadow-xs flex items-center justify-center ${
                isChef
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/35'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35'
              }`}
            >
              {icon}
            </span>
            <h3
              className={`text-[11px] sm:text-sm font-black uppercase tracking-wide truncate ${
                isChef ? 'text-amber-100' : 'text-emerald-100'
              }`}
            >
              {title}
            </h3>
          </div>
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            <span
              className={`text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                isChef
                  ? 'bg-amber-500/15 text-amber-200 border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30'
              }`}
            >
              {items.length} specials
            </span>
            <div className="flex items-center space-x-1 sm:space-x-1.5">
              <button
                type="button"
                onClick={() => scrollRail('left')}
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-xs ${
                  isChef
                    ? 'bg-amber-950/60 border-amber-500/40 text-amber-200 hover:bg-amber-500/30'
                    : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/30'
                }`}
                title="Scroll recommendations left"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={() => scrollRail('right')}
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-xs ${
                  isChef
                    ? 'bg-amber-950/60 border-amber-500/40 text-amber-200 hover:bg-amber-500/30'
                    : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/30'
                }`}
                title="Scroll recommendations right"
              >
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Scroll Rail — 2 Cards Visible by Default on Mobile */}
        <div
          ref={scrollRailRef}
          className="flex space-x-2.5 sm:space-x-3.5 overflow-x-auto pb-2 pt-1 px-0.5 no-scrollbar scroll-smooth snap-x snap-mandatory select-none"
        >
          {items.map((item) => {
            const qty = getQuantityInCart(item.id);
            const originalPrice = Math.round(item.price * 1.22);
            const discountPercent = Math.round(((originalPrice - item.price) / originalPrice) * 100);

            return (
              <div
                key={item.id}
                className={`flex-none snap-start w-[calc(50vw-22px)] max-w-[172px] sm:max-w-none sm:w-56 bg-white border rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer shadow-[0_3px_12px_rgba(0,0,0,0.12)] sm:shadow-[0_4px_14px_rgba(0,0,0,0.18)] transition-all duration-200 group relative flex flex-col justify-between hover:-translate-y-1 ${
                  isChef
                    ? 'border-amber-500/30 hover:border-amber-400 hover:shadow-[0_8px_24px_rgba(245,158,11,0.2)]'
                    : 'border-emerald-500/30 hover:border-[#0C831F] hover:shadow-[0_8px_24px_rgba(12,131,31,0.2)]'
                }`}
                onClick={() => onItemClick(item)}
              >
                {/* 1. Top Image Div — Sleek Height for Mobile 2-Card Symmetry */}
                <div className="relative h-24 sm:h-36 w-full bg-slate-100 border-b border-slate-200 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Veg / Non-veg dot & Special Badge */}
                  <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex items-center space-x-1 sm:space-x-1.5 z-10">
                    <span
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-md border-2 flex items-center justify-center bg-white/95 backdrop-blur-md shadow-xs ${
                        item.isVegetarian ? 'border-emerald-600' : 'border-rose-600'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                          item.isVegetarian ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                      />
                    </span>

                    {item.isChefSpecial ? (
                      <span className="text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 shadow-xs flex items-center space-x-0.5 tracking-tight">
                        <Sparkles className="w-2.5 h-2.5 text-slate-950" />
                        <span>CHEF</span>
                      </span>
                    ) : item.isBestSeller ? (
                      <span className="text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-600 text-white shadow-xs tracking-tight">
                        SPECIAL
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* 2. Lower Content Div — Streamlined Hierarchy */}
                <div className="p-2 sm:p-3.5 space-y-1 sm:space-y-1.5 flex-1 flex flex-col justify-between bg-white">
                  <div className="space-y-0.5 sm:space-y-1">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 sm:line-clamp-2 leading-tight group-hover:text-c-primary transition-colors min-h-[16px] sm:min-h-[34px]">
                      {item.name}
                    </h4>
                    {/* Hide description on mobile to keep 2-card view clean and uncluttered */}
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed hidden sm:block">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-slate-100 gap-1">
                    <div className="flex flex-col min-w-0 pr-0.5 shrink-0">
                      <div className="flex items-baseline space-x-1 flex-wrap">
                        <span className="font-mono text-xs sm:text-sm font-black text-slate-900 leading-tight">
                          ₹{item.price}
                        </span>
                        <span className="font-mono text-[9px] sm:text-[10px] text-slate-400 line-through leading-tight">
                          ₹{originalPrice}
                        </span>
                      </div>
                      {discountPercent > 0 && (
                        <span className="text-[8px] sm:text-[9px] text-[#0C831F] font-bold uppercase tracking-tight leading-none mt-0.5">
                          {discountPercent}% OFF
                        </span>
                      )}
                    </div>

                    {qty > 0 ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center space-x-0.5 sm:space-x-1 bg-[#0C831F] text-white px-1 sm:px-1.5 py-0.5 rounded-lg sm:rounded-xl shadow-xs shrink-0"
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.id, qty - 1);
                          }}
                          className="w-4.5 h-4.5 sm:w-6 sm:h-6 hover:bg-black/20 rounded flex items-center justify-center transition-colors cursor-pointer active:scale-90"
                          title="Decrease quantity"
                        >
                          <Minus className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                        </button>
                        <span className="font-mono font-black text-[10px] sm:text-xs min-w-[14px] sm:min-w-[16px] text-center">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.id, qty + 1);
                          }}
                          className="w-4.5 h-4.5 sm:w-6 sm:h-6 hover:bg-black/20 rounded flex items-center justify-center transition-colors cursor-pointer active:scale-90"
                          title="Increase quantity"
                        >
                          <Plus className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onItemClick(item)}
                        className="px-2 sm:px-2.5 py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-tight transition-all flex items-center space-x-0.5 sm:space-x-1 bg-[#0C831F] hover:bg-[#096918] text-white shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer shrink-0 group/btn"
                        title="View dish details & add to order"
                      >
                        <span className="hidden sm:inline">View &amp; </span>
                        <span>Add</span>
                        <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 group-hover/btn:translate-x-0.5 transition-transform shrink-0" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default RecommendationSection;
