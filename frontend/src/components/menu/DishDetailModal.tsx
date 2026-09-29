import React, { useState, useEffect } from 'react';
import { MenuItem, CustomizationOption } from '../../types/menu.types';
import { X, Plus, Minus, Sparkles, Trash2 } from 'lucide-react';
import { useToast } from '../feedback/ToastContainer';
import { useCartStore } from '../../store/use-cart-store';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useBackHandler } from '../../hooks/useBackHandler';
import { getSmartAddonsForDish } from '../../services/aiPairingEngine';

interface DishDetailModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (item: MenuItem, quantity: number, notes?: string) => void;
}

export const DishDetailModal: React.FC<DishDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  useBodyScrollLock(isOpen);
  useBackHandler(isOpen, onClose);
  const { showToast } = useToast();
  const { items, addItem, updateQuantity, updateItemConfiguration, removeItem } = useCartStore();

  const [selectedCustomizations, setSelectedCustomizations] = useState<{ [groupId: string]: CustomizationOption }>({});
  const [selectedAddonQuantities, setSelectedAddonQuantities] = useState<{ [id: string]: number }>({});

  const cartItem = items.find((it) => it.menuItem.id === item?.id);
  const isUpdating = !!cartItem;
  const [customQuantity, setCustomQuantity] = useState(1);

  useEffect(() => {
    if (isOpen && item) {
      const currentInCart = items.find((it) => it.menuItem.id === item.id);
      if (currentInCart) {
        setCustomQuantity(currentInCart.quantity);

        // Restore addon quantities from the cart item's addonNames
        const restoredQtys: { [id: string]: number } = {};
        if (currentInCart.addonNames && currentInCart.addonNames.length > 0) {
          const addons = getSmartAddonsForDish(item);
          currentInCart.addonNames.forEach((addonStr) => {
            // Try to match "Nx Name (+₹...)" or "Name (+₹...)"
            const multiMatch = addonStr.match(/^(\d+)x\s+(.+?)\s+\(/);
            const singleMatch = addonStr.match(/^(.+?)\s+\(/);
            const qty = multiMatch ? parseInt(multiMatch[1], 10) : 1;
            const name = multiMatch ? multiMatch[2] : singleMatch ? singleMatch[1] : null;
            if (name) {
              const matched = addons.find(
                (ad) => ad.name.toLowerCase().trim() === name.toLowerCase().trim()
              );
              if (matched) {
                restoredQtys[matched.id] = qty;
              }
            }
          });
        }
        setSelectedAddonQuantities(restoredQtys);
      } else {
        setCustomQuantity(1);
        setSelectedAddonQuantities({});
      }
    }
  }, [isOpen, item?.id]);

  if (!isOpen || !item) return null;

  const displayQuantity = customQuantity;

  const smartAddons = getSmartAddonsForDish(item);

  const handleAddonIncrement = (addonId: string) => {
    setSelectedAddonQuantities((prev) => ({
      ...prev,
      [addonId]: (prev[addonId] || 0) + 1,
    }));
  };

  const handleAddonDecrement = (addonId: string) => {
    setSelectedAddonQuantities((prev) => {
      const current = prev[addonId] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[addonId];
        return next;
      }
      return { ...prev, [addonId]: current - 1 };
    });
  };

  const handleSelectOption = (groupId: string, option: CustomizationOption) => {
    setSelectedCustomizations((prev) => ({ ...prev, [groupId]: option }));
  };

  const extraCost = Object.values(selectedCustomizations).reduce((acc, opt) => acc + (opt.price || 0), 0);
  const addonsCost = smartAddons.reduce((sum, ad) => {
    const qty = selectedAddonQuantities[ad.id] || 0;
    return sum + (ad.price * qty);
  }, 0);

  const unitPrice = item.price + extraCost + addonsCost;
  const totalPrice = unitPrice * displayQuantity;

  const chosenAddonNames = smartAddons
    .filter((ad) => (selectedAddonQuantities[ad.id] || 0) > 0)
    .map((ad) => {
      const qty = selectedAddonQuantities[ad.id];
      return qty > 1 ? `${qty}x ${ad.name} (+₹${ad.price * qty})` : `${ad.name} (+₹${ad.price})`;
    });

  const formatAddonName = (name: string) => {
    return name.replace(/\((\d+)\s+([a-zA-Z]+)\)/g, '($1\u00A0$2)');
  };

  const getCombinedNotes = () => {
    if (chosenAddonNames.length > 0) {
      return `Add-ons: ${chosenAddonNames.join(', ')}`;
    }
    return '';
  };

  const handleAdd = () => {
    if (item.isAvailable === false) {
      showToast(`"${item.name}" is sold out today and cannot be added.`, 'error');
      return;
    }
    const finalNotes = getCombinedNotes();
    if (isUpdating) {
      updateItemConfiguration(item.id, displayQuantity, unitPrice, finalNotes, chosenAddonNames);
      showToast(`Updated ${displayQuantity}x "${item.name}" with add-ons in Table Cart`, 'success');
    } else {
      addItem(item, displayQuantity, finalNotes, unitPrice, chosenAddonNames);
      showToast(`Added ${displayQuantity}x "${item.name}" to Table Cart`, 'success');
    }
    if (onAddToCart) {
      onAddToCart(item, displayQuantity, finalNotes);
    }
    onClose();
  };

  const handleRemoveFromCart = () => {
    if (!item) return;
    removeItem(item.id);
    showToast(`Removed "${item.name}" from Table Cart`, 'info');
    onClose();
  };

  const handleIncrement = () => {
    const nextQty = customQuantity + 1;
    setCustomQuantity(nextQty);
    if (isUpdating && item) {
      updateQuantity(item.id, nextQty);
    }
  };

  const handleDecrement = () => {
    const nextQty = customQuantity - 1;
    if (isUpdating && item) {
      if (nextQty <= 0) {
        removeItem(item.id);
        showToast(`Removed "${item.name}" from Table Cart`, 'info');
        onClose();
        return;
      }
      updateQuantity(item.id, nextQty);
    }
    setCustomQuantity(Math.max(1, nextQty));
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border-t md:border border-slate-200 rounded-t-3xl md:rounded-3xl w-full max-w-full md:max-w-lg flex flex-col shadow-2xl relative animate-in slide-in-from-bottom-5 md:zoom-in-95 duration-200 max-h-[92dvh] md:max-h-[88vh] overflow-hidden text-slate-800"
      >
        {/* Close Trigger */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-2 bg-white/90 text-slate-700 hover:text-slate-900 rounded-full border border-slate-200 shadow-md transition-all cursor-pointer"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Image Box */}
        <div className="relative h-44 sm:h-56 w-full shrink-0 bg-slate-100 overflow-hidden">
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />

          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center space-x-2">
            <span
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center bg-white shadow-sm ${
                item.isVegetarian ? 'border-emerald-600' : 'border-rose-600'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  item.isVegetarian ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              />
            </span>

            {item.isChefSpecial && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#F7D046] text-slate-900 flex items-center space-x-1 shadow-sm">
                <Sparkles className="w-3 h-3 text-slate-900" />
                <span>Special</span>
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
          {item.isAvailable === false && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2.5 text-rose-800 text-xs font-bold shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse shrink-0" />
              <span>This dish is currently SOLD OUT today and cannot be added to your order.</span>
            </div>
          )}
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">{item.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{item.categoryName}</p>
              </div>
              <span className="font-mono text-xl sm:text-2xl font-black text-slate-900 shrink-0">₹{totalPrice}</span>
            </div>

            <p className="text-xs text-slate-600 mt-2 leading-relaxed">{item.description}</p>
          </div>

          {/* Item Category & Diet Tag */}
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-medium">
              <span
                className={`w-3.5 h-3.5 rounded border flex items-center justify-center bg-white ${
                  item.isVegetarian ? 'border-emerald-600' : 'border-rose-600'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    item.isVegetarian ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                />
              </span>
              <span className={item.isVegetarian ? 'text-emerald-800 font-semibold' : 'text-rose-800 font-semibold'}>
                {item.isVegetarian ? 'Vegetarian' : 'Non-Veg'}
              </span>
            </div>
          </div>

          {/* Key Ingredients */}
          {item.ingredients && item.ingredients.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Key Ingredients</h3>
              <div className="flex flex-wrap gap-1.5">
                {item.ingredients.map((ing, i) => (
                  <span key={i} className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium">
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Smart Add-ons & High-Margin Pairings */}
          {smartAddons.length > 0 && (
            <div className="p-3 sm:p-3.5 bg-gradient-to-br from-[#FCFBF8] via-[#F8F3EC] to-[#F3ECE1] border border-[#E5D7C7] rounded-xl sm:rounded-2xl space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#3B2818] uppercase tracking-wider">
                  Add-ons &amp; Chef Pairings
                </span>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                {smartAddons.map((addon) => {
                  const qty = selectedAddonQuantities[addon.id] || 0;
                  const isAdded = qty > 0;

                  return (
                    <div
                      key={addon.id}
                      className={`p-2.5 sm:p-3 rounded-xl border text-xs flex items-center justify-between gap-2.5 transition-all ${
                        isAdded
                          ? 'bg-[#FAF4EC] border-[#A2734C] text-[#2D1E12] shadow-xs ring-1 ring-[#A2734C]/25'
                          : 'bg-white hover:bg-[#FDFBF8] border-[#E8DACB] text-slate-800 hover:border-[#C4A482]'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
                            isAdded ? 'bg-[#9D6A38]' : 'bg-[#D6C4B2]'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                              {formatAddonName(addon.name)}
                            </span>
                            {addon.reason && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-[#F5E8D7] text-[#7A4B1A] border border-[#DFC8B0] rounded-md tracking-tight whitespace-nowrap">
                                {addon.reason}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Add Button with +₹Price or Stepper */}
                      {qty === 0 ? (
                        <button
                          type="button"
                          onClick={() => handleAddonIncrement(addon.id)}
                          className="px-3 py-1.5 bg-[#FAF3EA] hover:bg-[#8B5A2B] text-[#8B5A2B] hover:text-white border border-[#D4BFAB] hover:border-[#8B5A2B] font-bold font-mono rounded-lg text-xs shadow-2xs transition-all flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
                          title={`Add for ₹${addon.price}`}
                        >
                          <span>+₹{addon.price}</span>
                        </button>
                      ) : (
                        <div className="flex items-center space-x-1.5 bg-[#8B5A2B] text-white px-2 py-1 rounded-lg shadow-sm shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAddonDecrement(addon.id)}
                            className="w-5 h-5 hover:bg-black/20 rounded flex items-center justify-center transition-colors cursor-pointer active:scale-90"
                            title="Decrease add-on quantity"
                          >
                            <Minus className="w-3 h-3 stroke-[3]" />
                          </button>
                          <span className="font-mono font-black text-xs min-w-[16px] text-center">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddonIncrement(addon.id)}
                            className="w-5 h-5 hover:bg-black/20 rounded flex items-center justify-center transition-colors cursor-pointer active:scale-90"
                            title="Increase add-on quantity"
                          >
                            <Plus className="w-3 h-3 stroke-[3]" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Customization Groups */}
          {item.customizationGroups && item.customizationGroups.map((group) => (
            <div key={group.id} className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-800 uppercase tracking-wider">
                <span>{group.title}</span>
                {group.required && <span className="text-[10px] text-rose-600 font-bold">Required</span>}
              </div>

              <div className="space-y-1.5">
                {group.options.map((option) => {
                  const isSelected = selectedCustomizations[group.id]?.id === option.id;

                  return (
                    <div
                      key={option.id}
                      onClick={() => handleSelectOption(group.id, option)}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-c-primary-light border-c-primary-border text-emerald-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <span>{option.name}</span>
                      <span className="font-mono">{option.price > 0 ? `+₹${option.price}` : 'Free'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col space-y-2 shrink-0">
          {item.isAvailable === false ? (
            <div className="w-full py-3.5 px-4 bg-rose-100/90 border border-rose-300 text-rose-800 font-black rounded-2xl text-xs sm:text-sm uppercase tracking-wider text-center flex items-center justify-center space-x-2 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
              <span>SOLD OUT TODAY • NOT AVAILABLE</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2.5">
              {/* Optional Remove from Cart button when item is already in cart */}
              {isUpdating && (
                <button
                  type="button"
                  onClick={handleRemoveFromCart}
                  className="w-10 h-10 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0 shadow-2xs"
                  title="Remove from Cart"
                >
                  <Trash2 className="w-4 h-4 stroke-[2.5] pointer-events-none" />
                </button>
              )}

              {/* Portion Stepper */}
              <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm shrink-0">
                <button
                  onClick={handleDecrement}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer active:scale-90"
                  title="Decrease portion"
                >
                  <Minus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
                <span className="font-mono font-black text-sm px-3 min-w-[28px] text-center text-slate-900">
                  {displayQuantity}
                </span>
                <button
                  onClick={handleIncrement}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer active:scale-90"
                  title="Increase portion"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>

              {/* Action Button */}
              <button
                onClick={handleAdd}
                className="flex-1 py-3.5 px-4 sm:px-5 bg-c-primary hover:bg-c-primary-dark text-white font-black rounded-2xl text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-between cursor-pointer min-w-0"
              >
                <span className="truncate mr-2">
                  <span className="sm:hidden">{isUpdating ? 'DONE' : 'ADD TO CART'}</span>
                  <span className="hidden sm:inline">{isUpdating ? 'DONE • IN CART' : 'ADD TO TABLE CART'}</span>
                </span>
                <span className="font-mono text-sm sm:text-base font-black shrink-0">₹{totalPrice}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default DishDetailModal;
