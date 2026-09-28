import React, { useState } from 'react';
import { X, Heart, Star, Plus, Minus, Sparkles, Zap, ShoppingBag, ArrowRight, Flame, Check } from 'lucide-react';
import { useWishlistStore } from '../../store/use-wishlist-store';
import { useCartStore } from '../../store/use-cart-store';
import { useToast } from '../feedback/ToastContainer';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useBackHandler } from '../../hooks/useBackHandler';
import { motion, AnimatePresence } from 'framer-motion';
import { MenuItem } from '../../types/menu.types';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tableId?: string;
  onOpenCart?: () => void;
  onSelectDish?: (item: MenuItem) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  tableId = '10',
  onOpenCart,
  onSelectDish,
}) => {
  useBodyScrollLock(isOpen);
  useBackHandler(isOpen, onClose);

  const { wishlist, toggleWishlist, clearWishlist } = useWishlistStore();
  const { items, addItem, updateQuantity } = useCartStore();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<'all' | 'veg' | 'non-veg'>('all');

  const handleAddToCart = (e: React.MouseEvent, item: MenuItem) => {
    e.stopPropagation();
    const isCustomizable =
      (item as any).options?.length > 0 ||
      (item as any).addons?.length > 0 ||
      (item.customizationGroups && item.customizationGroups.length > 0);

    if (isCustomizable && onSelectDish) {
      onSelectDish(item);
      showToast(`Select portions & add-ons for "${item.name}"`, 'info');
      return;
    }

    addItem(item, 1);
    showToast(`Added "${item.name}" to Table Cart`, 'success');
  };

  const handleRemoveItem = (e: React.MouseEvent, item: MenuItem) => {
    e.stopPropagation();
    toggleWishlist(item);
    showToast(`Removed "${item.name}" from Wishlist`, 'info');
  };

  const handleAddAllToCart = () => {
    let addedCount = 0;
    wishlist.forEach((it) => {
      const existing = items.find((cartIt) => cartIt.menuItem.id === it.id);
      if (!existing) {
        addItem(it, 1);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      showToast(`Added ${addedCount} saved dishes to Table Cart!`, 'success');
    } else {
      showToast('All saved dishes are already in your cart!', 'info');
    }
  };

  const handleProceedToCart = () => {
    onClose();
    if (onOpenCart) {
      onOpenCart();
    }
  };

  const totalWishlistValue = wishlist.reduce((sum, it) => sum + it.price, 0);
  const unaddedItems = wishlist.filter((it) => !items.some((cartIt) => cartIt.menuItem.id === it.id));
  const allInCart = wishlist.length > 0 && unaddedItems.length === 0;

  const vegCount = wishlist.filter((it) => it.isVegetarian).length;
  const nonVegCount = wishlist.filter((it) => !it.isVegetarian).length;

  const displayedList = wishlist.filter((it) => {
    if (filter === 'veg') return it.isVegetarian;
    if (filter === 'non-veg') return !it.isVegetarian;
    return true;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="wishlist-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex justify-end"
          onClick={onClose}
        >
          <motion.div
            key="wishlist-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-full md:max-w-md bg-white md:border-l border-slate-200 h-full flex flex-col justify-between shadow-2xl relative overflow-hidden text-slate-800"
          >
            {/* Top Luxury Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200/90 flex items-center justify-between bg-gradient-to-r from-rose-50/80 via-white to-emerald-50/40 shrink-0">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-rose-100/90 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm shrink-0">
                  <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Saved Wishlist</h2>
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black font-mono">
                      {wishlist.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                    {wishlist.length === 0
                      ? 'No items saved'
                      : `${wishlist.length} ${wishlist.length === 1 ? 'dish' : 'dishes'} bookmarked for Table ${tableId}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {wishlist.length > 0 && (
                  <button
                    onClick={() => {
                      clearWishlist();
                      showToast('Cleared all saved dishes', 'info');
                    }}
                    className="text-[11px] font-bold px-2.5 py-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
                    title="Clear wishlist"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 bg-white hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 transition-colors border border-slate-200 cursor-pointer shadow-2xs active:scale-95"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Dietary Filters (If 2+ items exist) */}
            {wishlist.length > 1 && (
              <div className="px-4 py-2.5 bg-slate-50/90 border-b border-slate-200/80 flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all cursor-pointer ${
                    filter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  All ({wishlist.length})
                </button>
                {vegCount > 0 && (
                  <button
                    onClick={() => setFilter('veg')}
                    className={`px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer ${
                      filter === 'veg'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Veg ({vegCount})</span>
                  </button>
                )}
                {nonVegCount > 0 && (
                  <button
                    onClick={() => setFilter('non-veg')}
                    className={`px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer ${
                      filter === 'non-veg'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white text-rose-800 hover:bg-rose-50 border border-rose-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Non-Veg ({nonVegCount})</span>
                  </button>
                )}
              </div>
            )}

            {/* Content List */}
            <div className="p-3.5 sm:p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
              {wishlist.length === 0 ? (
                <div className="py-16 sm:py-20 text-center space-y-4 bg-gradient-to-b from-rose-50/30 via-white to-emerald-50/20 rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-sm mx-auto my-auto shadow-sm">
                  <div className="w-18 h-18 bg-gradient-to-br from-rose-100 to-rose-50 border-2 border-rose-200 rounded-3xl flex items-center justify-center mx-auto text-rose-500 shadow-md relative">
                    <Heart className="w-9 h-9 fill-rose-500 text-rose-500 animate-pulse" />
                    <Sparkles className="w-4 h-4 text-amber-500 absolute -top-1 -right-1" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-black text-slate-900 tracking-tight">Your Wishlist is Empty</h3>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                      Tap the heart icon on any dish to curate your table favorites and order them together in one tap.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="mt-2 px-6 py-3 bg-[#0C831F] hover:bg-[#096918] text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    Explore Menu Dishes
                  </button>
                </div>
              ) : displayedList.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs font-medium space-y-2">
                  <p>No dishes match the "{filter}" filter.</p>
                  <button
                    onClick={() => setFilter('all')}
                    className="text-xs font-bold text-[#0C831F] underline cursor-pointer"
                  >
                    View all saved dishes
                  </button>
                </div>
              ) : (
                displayedList.map((item) => {
                  const cartItem = items.find((it) => it.menuItem.id === item.id);
                  const inCart = !!cartItem;
                  const originalPrice = Math.round(item.price * 1.22);
                  const discountPercent = Math.round(((originalPrice - item.price) / originalPrice) * 100);
                  const isCustomizable =
                    (item as any).options?.length > 0 ||
                    (item as any).addons?.length > 0 ||
                    (item.customizationGroups && item.customizationGroups.length > 0);

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => {
                        onClose();
                        if (onSelectDish) onSelectDish(item);
                      }}
                      className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-[#0C831F] transition-all shadow-xs hover:shadow-md group cursor-pointer active:scale-[0.99] flex flex-col space-y-2.5 relative"
                    >
                      {/* Top Row: Thumbnail + Info */}
                      <div className="flex items-start space-x-3 min-w-0">
                        {/* Food Image Container */}
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-slate-200/90 bg-slate-100 shrink-0 shadow-2xs">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />

                          {/* Veg / Non-Veg Indicator */}
                          <span
                            className={`absolute top-1.5 left-1.5 w-4 h-4 rounded-md border-2 flex items-center justify-center bg-white/95 backdrop-blur-md shadow-xs ${
                              item.isVegetarian ? 'border-emerald-600' : 'border-rose-600'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.isVegetarian ? 'bg-emerald-600' : 'bg-rose-600'
                              }`}
                            />
                          </span>

                          {/* Special / Bestseller Badge */}
                          {item.isChefSpecial ? (
                            <span className="absolute bottom-1 left-1 right-1 text-center text-[8px] font-black bg-amber-400 text-slate-900 rounded px-1 py-0.5 uppercase shadow-xs truncate">
                              Special
                            </span>
                          ) : item.isBestSeller ? (
                            <span className="absolute bottom-1 left-1 right-1 text-center text-[8px] font-black bg-[#0C831F] text-white rounded px-1 py-0.5 uppercase shadow-xs truncate">
                              Bestseller
                            </span>
                          ) : null}
                        </div>

                        {/* Dish Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between space-y-1">
                          <div>
                            <div className="flex items-start justify-between gap-1.5">
                              <h3 className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-[#0C831F] transition-colors line-clamp-1 leading-snug">
                                {item.name}
                              </h3>

                              {/* Heart Unsave Button */}
                              <button
                                onClick={(e) => handleRemoveItem(e, item)}
                                className="w-7 h-7 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-500 flex items-center justify-center transition-all cursor-pointer shrink-0 -mt-0.5 border border-rose-200/60 active:scale-90"
                                title="Remove from Wishlist"
                              >
                                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                              </button>
                            </div>

                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 leading-relaxed">
                              {item.description}
                            </p>
                          </div>

                          {/* Meta Row: Rating, Prep Time, Category */}
                          <div className="flex items-center flex-wrap gap-1.5 text-[10px] text-slate-500 font-semibold pt-0.5">
                            <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-200/60 font-bold">
                              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                              <span>{item.rating || 4.9}</span>
                            </span>

                            <span className="inline-flex items-center space-x-0.5 text-slate-500">
                              <Zap className="w-3 h-3 text-[#0C831F]" />
                              <span>{item.preparationTimeMinutes || 15}m</span>
                            </span>

                            {item.spiceLevel !== undefined && item.spiceLevel > 0 && (
                              <div className="flex items-center space-x-0.5 text-rose-500" title={`Spice level: ${item.spiceLevel}`}>
                                {Array.from({ length: item.spiceLevel }).map((_, idx) => (
                                  <Flame key={idx} className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                                ))}
                              </div>
                            )}

                            {item.categoryName && (
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold truncate max-w-[80px]">
                                {item.categoryName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Row: Price & Smart Cart Controls */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-baseline space-x-1.5 font-mono">
                          <span className="font-black text-sm text-slate-900">₹{item.price}</span>
                          <span className="text-[10px] text-slate-400 line-through">₹{originalPrice}</span>
                          <span className="text-[9px] text-[#0C831F] font-bold font-sans">
                            {discountPercent}% OFF
                          </span>
                        </div>

                        {/* Cart Action: Attached Ribbon View & Add / Stepper */}
                        <div className="flex items-center -mr-3 sm:-mr-4">
                          {inCart ? (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center space-x-1 sm:space-x-1.5 bg-gradient-to-r from-[#0C831F] to-[#096918] text-white pl-2 pr-2.5 sm:pl-3 sm:pr-3.5 py-1 sm:py-1.5 rounded-l-full sm:rounded-l-2xl shadow-sm border-y border-l border-emerald-500/40 shrink-0"
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateQuantity(item.id, cartItem.quantity - 1);
                                }}
                                className="w-5 h-5 sm:w-6 sm:h-6 hover:bg-black/20 rounded-full flex items-center justify-center transition-colors cursor-pointer active:scale-90"
                                title="Decrease quantity"
                              >
                                <Minus className="w-3.5 h-3.5 stroke-[3]" />
                              </button>
                              <span className="font-mono font-black text-xs sm:text-sm min-w-[16px] text-center">
                                {cartItem.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateQuantity(item.id, cartItem.quantity + 1);
                                }}
                                className="w-5 h-5 sm:w-6 sm:h-6 hover:bg-black/20 rounded-full flex items-center justify-center transition-colors cursor-pointer active:scale-90"
                                title="Increase quantity"
                              >
                                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                                if (onSelectDish) onSelectDish(item);
                              }}
                              className="pl-2.5 sm:pl-3.5 pr-2 sm:pr-3 py-1 sm:py-1.5 rounded-l-full sm:rounded-l-2xl text-[10px] sm:text-xs font-black uppercase tracking-tight transition-all flex items-center space-x-1 sm:space-x-1.5 bg-gradient-to-r from-[#0C831F] to-[#0A6D1A] hover:from-[#0A6D1A] hover:to-[#085514] text-white shadow-xs hover:shadow-md hover:shadow-emerald-700/20 active:scale-95 cursor-pointer shrink-0 group/btn border-y border-l border-emerald-400/40"
                              title="View dish details, chef pairings & add to order"
                            >
                              <span>View &amp; Add</span>
                              <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform stroke-[2.5]" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Bottom Sticky Summary & One-Tap Cart Action */}
            {wishlist.length > 0 && (
              <div className="p-4 pb-6 sm:pb-4 bg-slate-50 border-t border-slate-200 space-y-3 shrink-0">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <div className="flex items-center space-x-1.5">
                    <ShoppingBag className="w-4 h-4 text-[#0C831F]" />
                    <span>Saved Dishes Value ({wishlist.length})</span>
                  </div>
                  <span className="font-mono font-black text-slate-900 text-sm">
                    ₹{totalWishlistValue.toFixed(2)}
                  </span>
                </div>

                {allInCart ? (
                  <button
                    onClick={handleProceedToCart}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-between px-5 cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <ShoppingBag className="w-4 h-4 text-emerald-100" />
                      <span>ALL IN CART • VIEW TABLE CART</span>
                    </div>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>
                ) : (
                  <button
                    onClick={handleAddAllToCart}
                    className="w-full py-3.5 bg-[#0C831F] hover:bg-[#096918] text-white font-black rounded-2xl text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-between px-5 cursor-pointer"
                  >
                    <span>ADD ALL ({unaddedItems.length}) TO TABLE CART</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default WishlistDrawer;
