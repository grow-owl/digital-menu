import React from 'react';
import { MenuItem } from '../../types/menu.types';
import { Star, Sparkles, Flame, Zap, Check, ArrowRight, Plus, Minus } from 'lucide-react';
import { useCartStore } from '../../store/use-cart-store';
import { motion } from 'framer-motion';

interface DishCardProps {
  item: MenuItem;
  onAdd?: (item: MenuItem) => void;
  onClick: (item: MenuItem) => void;
}

export const DishCard: React.FC<DishCardProps> = ({ item, onAdd, onClick }) => {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const { items, addItem, updateQuantity, removeItem } = useCartStore();

  const cartItem = items.find((it) => it.menuItem.id === item.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  // Original price calculation for strikethrough retail discount feel
  const originalPrice = Math.round(item.price * 1.22);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      onClick={() => onClick(item)}
      className={`bg-white border rounded-xl overflow-hidden cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-md group relative transition-all duration-200 ${
        item.isAvailable === false
          ? 'border-slate-200 opacity-80 hover:border-slate-300'
          : 'border-slate-200 hover:border-emerald-600 hover:-translate-y-0.5'
      }`}
    >
      {/* Top Image Box */}
      <div className="relative h-28 sm:h-44 w-full bg-slate-100 border-b border-slate-200 overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-slate-200/70 animate-pulse" />
        )}
        <img
          src={item.imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'}
          alt={item.name}
          loading="lazy"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (item.name.toLowerCase().includes('mineral water') || item.id === 95) {
              target.src = '/images/mineral_water_bottle.jpg';
            } else {
              target.src = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80';
            }
            setImageLoaded(true);
          }}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Out of Stock Overlay */}
        {item.isAvailable === false && (
          <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px] flex flex-col items-center justify-center p-2 text-center z-20">
            <span className="px-2.5 py-1 bg-rose-600 text-white text-[9px] sm:text-[10px] font-black tracking-wider uppercase rounded-md shadow-md border border-rose-400">
              SOLD OUT TODAY
            </span>
            <span className="text-[9px] text-white/90 font-medium mt-1">Not available</span>
          </div>
        )}

        {/* Veg / Non-Veg Indicator & Special Badges (Top Left) */}
        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex items-center space-x-1 z-10">
          <span
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-2 flex items-center justify-center bg-white/95 backdrop-blur-md shadow-xs ${
              item.isVegetarian ? 'border-emerald-600' : 'border-rose-600'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                item.isVegetarian ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            />
          </span>

          {item.isChefSpecial && (
            <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 flex items-center space-x-0.5 shadow-xs">
              <Sparkles className="w-2.5 h-2.5 text-slate-950" />
              <span>SPECIAL</span>
            </span>
          )}

          {item.isBestSeller && !item.isChefSpecial && (
            <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white shadow-xs">
              POPULAR
            </span>
          )}
        </div>
      </div>

      {/* Dish Content Body */}
      <div className="p-2 sm:p-3 space-y-1.5 flex-1 flex flex-col justify-between bg-white">
        <div className="space-y-1">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1 leading-snug">
            {item.name}
          </h3>

          {/* Maintained space gap without showing short description text */}
          <div className="h-7 sm:h-8" aria-hidden="true" />

          {cartItem?.addonNames && cartItem.addonNames.length > 0 && (
            <div className="flex items-center space-x-1 text-[9px] sm:text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              <Sparkles className="w-2.5 h-2.5 text-emerald-700 shrink-0" />
              <span className="truncate">Custom: {cartItem.addonNames.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Metadata Row: Prep Time and Spice */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
          <span className="inline-flex items-center space-x-1 font-medium">
            <Zap className="w-2.5 h-2.5 text-emerald-600" />
            <span>{item.preparationTimeMinutes || 15} mins prep</span>
          </span>

          {item.spiceLevel !== undefined && item.spiceLevel > 0 && (
            <div className="flex items-center space-x-0.5 shrink-0" title={`Spice: ${item.spiceLevel}/3`}>
              {Array.from({ length: item.spiceLevel }).map((_, i) => (
                <Flame key={i} className="w-2.5 h-2.5 text-amber-600 fill-amber-600" />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Row: Price & Clean Action Button */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
          <div className="flex flex-col min-w-0 pr-1">
            <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono leading-tight">
              ₹{item.price}
            </span>
            <span className="text-[9px] text-emerald-700 font-semibold uppercase tracking-tight leading-none mt-0.5">
              Fresh
            </span>
          </div>

          <div className="shrink-0">
            {item.isAvailable === false ? (
              <span className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[9px] sm:text-[10px] rounded-lg uppercase tracking-tight flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Sold Out</span>
              </span>
            ) : quantity > 0 ? (
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center space-x-1 bg-emerald-700 text-white px-1.5 py-1 rounded-lg shadow-xs"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateQuantity(item.id, quantity - 1);
                  }}
                  className="w-5 h-5 hover:bg-emerald-800 rounded flex items-center justify-center transition-colors cursor-pointer"
                  title="Decrease"
                >
                  <Minus className="w-3 h-3 stroke-[2.5]" />
                </button>
                <span className="font-mono font-bold text-xs min-w-[14px] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateQuantity(item.id, quantity + 1);
                  }}
                  className="w-5 h-5 hover:bg-emerald-800 rounded flex items-center justify-center transition-colors cursor-pointer"
                  title="Increase"
                >
                  <Plus className="w-3 h-3 stroke-[2.5]" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onClick(item)}
                className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                title="View & Add"
              >
                <span>Add</span>
                <Plus className="w-3 h-3 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
export default DishCard;
