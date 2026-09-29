import React, { useState, useEffect, useRef } from 'react';
import { useCartStore } from '../../store/use-cart-store';
import { orderService } from '../../services/order.service';
import { MenuItem } from '../../types/menu.types';
import { OrderConfirmationModal } from './OrderConfirmationModal';
import { DishDetailModal } from '../menu/DishDetailModal';
import { ShoppingBag, X, Plus, Minus, Trash2, Tag, Utensils, Edit2, Sparkles, Gift, Zap, Flame, Leaf, Star, ChefHat, ChevronLeft, ChevronRight, Check, ArrowRight, Award, Phone, CheckCircle2, Coffee, Clock, Loader2 } from 'lucide-react';

import { useToast } from '../feedback/ToastContainer';
import { useAuthStore } from '../../store/use-auth-store';
import { useTableStore } from '../../store/use-table-store';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useBackHandler } from '../../hooks/useBackHandler';
import { motion, AnimatePresence } from 'framer-motion';
import { AI_RECOMMENDED_PAIRINGS, getSpendMoreProgress, getDynamicCartPairings } from '../../services/aiPairingEngine';
import { SILIGURI_MENU_ITEMS } from '../../data/siliguriMenuData';
import { authService } from '../../services/auth.service';


const CART_TIPS = [
  { icon: Utensils, text: 'Dishes are freshly prepared to order for your dining table.' },
  { icon: Coffee, text: 'Pair your meal with our authentic slow-simmered masala chai.' },
  { icon: Clock, text: 'Average kitchen preparation time is 12 to 15 minutes.' },
  { icon: Sparkles, text: 'Add special dietary or spice notes to any item before ordering.' }
];


interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderPlaced?: (orderId: string) => void;
  tableId?: string;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onOrderPlaced,
  tableId = '10',
}) => {
  useBodyScrollLock(isOpen);
  useBackHandler(isOpen, onClose);
  const { showToast } = useToast();
  const { items, addItem, updateQuantity, removeItem, updateSpecialNotes, clearCart, getSubtotal } = useCartStore();
  const user = useAuthStore((state) => state.user);
  const { activeSessionId } = useTableStore();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [guestPhone, setGuestPhone] = useState(user?.phone || '');
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);

  const hasUnavailableItems = items.some((it) => it.menuItem.isAvailable === false);

  // Sync user phone when drawer opens or user changes
  useEffect(() => {
    if (isOpen && user?.phone) {
      setGuestPhone(user.phone);
    }
  }, [isOpen, user?.phone]);

  const handlePhoneInputChange = async (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 10);
    setGuestPhone(clean);

    if (clean.length === 10) {
      setIsCheckingPhone(true);
      try {
        const authData = await authService.loginWithPhone(clean);
        useAuthStore.getState().setAuth(authData.user, authData.token || authData.accessToken, tableId, authData.refreshToken);
        showToast(`Linked: +91 ${clean}`, 'success');
      } catch (err: any) {
        // Continue as guest
      } finally {
        setIsCheckingPhone(false);
      }
    }
  };


  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [tempNote, setTempNote] = useState('');
  const [selectedPairingItem, setSelectedPairingItem] = useState<MenuItem | null>(null);
  const pairingScrollRef = useRef<HTMLDivElement>(null);
  const dynamicPairings = React.useMemo(() => getDynamicCartPairings(items), [items]);

  const scrollPairings = (direction: 'left' | 'right') => {
    if (pairingScrollRef.current) {
      pairingScrollRef.current.scrollBy({
        left: direction === 'left' ? -220 : 220,
        behavior: 'smooth',
      });
    }
  };

  const convertPairingToMenuItem = (rec: (typeof AI_RECOMMENDED_PAIRINGS)[0]): MenuItem => {
    const realItem = SILIGURI_MENU_ITEMS.find((it) => it.id === rec.id);
    if (realItem) return realItem;
    return {
      id: rec.id,
      name: rec.name,
      description: rec.description,
      price: rec.price,
      imageUrl: rec.imageUrl,
      categoryName: rec.category,
      categoryId: 1,
      isVegetarian: true,
      isGlutenFree: false,
      isAvailable: true,
      preparationTimeMinutes: 10,
      rating: 4.8,
    };
  };

  const handleAddPairingDirect = (e: React.MouseEvent, rec: (typeof AI_RECOMMENDED_PAIRINGS)[0]) => {
    e.stopPropagation();
    const menuItem = convertPairingToMenuItem(rec);
    addItem(menuItem, 1);
    showToast(`Added "${rec.name}" to Table Cart!`, 'success');
  };

  const handleOpenPairingModal = (rec: (typeof AI_RECOMMENDED_PAIRINGS)[0] | MenuItem) => {
    if ('category' in rec) {
      setSelectedPairingItem(convertPairingToMenuItem(rec));
    } else {
      setSelectedPairingItem(rec);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setEditingNoteId(null);
    }
  }, [isOpen]);

  // Automatic Free Reward Revocation Guard if subtotal drops below required threshold
  useEffect(() => {
    if (!items.length) return;

    const paidSubtotal = items.reduce(
      (acc, it) => (it.menuItem.price > 0 ? acc + (it.unitPrice ?? it.menuItem.price) * it.quantity : acc),
      0
    );

    const freeItem = items.find((it) => it.menuItem.price === 0);
    if (!freeItem) return;

    const itemId = freeItem.menuItem.id;

    // Tier 3 rewards: id 9907 (Lava Cake), 9908 (Gelato) requires paidSubtotal >= 2000
    if ((itemId === 9907 || itemId === 9908) && paidSubtotal < 2000) {
      removeItem(itemId);
      showToast(`Revoked Free Reward (${freeItem.menuItem.name}): Subtotal is under ₹2,000`, 'info');
      return;
    }

    // Tier 2 rewards: id 9904 (Lime Soda), 9906 (Truffle Dip) requires paidSubtotal >= 1000
    if ((itemId === 9904 || itemId === 9906) && paidSubtotal < 1000) {
      removeItem(itemId);
      showToast(`Revoked Free Reward (${freeItem.menuItem.name}): Subtotal is under ₹1,000`, 'info');
      return;
    }

    // Tier 1 rewards (or any free reward) requires paidSubtotal >= 500
    if (paidSubtotal < 500) {
      removeItem(itemId);
      showToast(`Revoked Free Reward (${freeItem.menuItem.name}): Subtotal is under ₹500 minimum`, 'info');
    }
  }, [items, removeItem, showToast]);

  const subtotal = getSubtotal();
  const gstAmount = subtotal * 0.05; // 5% Indian GST
  const grandTotal = subtotal + gstAmount;

  const handleConfirmSubmit = async (phoneOverride?: string, nameOverride?: string) => {
    try {
      const targetPhone = phoneOverride || user?.phone;
      const targetName = nameOverride || user?.name;

      if (!targetPhone) {
        showToast('A valid 10-digit mobile number is mandatory to place your order.', 'error');
        return;
      }

      if (hasUnavailableItems) {
        showToast('Some dishes in your cart are sold out today. Please remove them before placing your order.', 'error');
        return;
      }

      if (tableId === 'Admin') {
        showToast('Admin Menu Preview: Please scan a table QR code or assign a dining table to send orders to the kitchen.', 'info');
        return;
      }

      const order = await orderService.placeOrder({
        tableId,
        customerPhone: targetPhone,
        customerName: targetName,
        items: items.map((item) => ({
          menuItemId: item.menuItem.id,
          name: item.menuItem.name,
          quantity: item.quantity,
          price: item.unitPrice ?? item.menuItem.price,
          notes: item.specialNotes,
        })),
        subtotal,
        tax: gstAmount,
        discount: 0,
        total: grandTotal,
        sessionId: activeSessionId || undefined,
      });

      setIsConfirmOpen(false);
      clearCart();
      if (onOrderPlaced) {
        onOrderPlaced(order.orderId);
      }
      showToast('Order placed! Kitchen is preparing your dishes.', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to place order', 'error');
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex justify-end"
            onClick={onClose}
          >
            <motion.div
              key="cart-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-full md:max-w-md bg-white md:border-l border-slate-200 h-full flex flex-col justify-between shadow-2xl relative"
            >
          {/* Top Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-c-primary-light border border-c-primary-border/30 rounded-xl">
                <ShoppingBag className="w-5 h-5 text-c-primary" />
              </div>
              <div>
                <h2 className="font-bold text-base text-slate-900">Your Table Cart</h2>
                <p className="text-xs text-slate-500 font-medium">Table {tableId}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>


          {/* Cart Items Scroll Body */}
          <div className="p-4 flex-1 overflow-y-auto space-y-3.5 custom-scrollbar">
            {/* Gamified Tiered Discount & Freebie Unlocker */}

            {items.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Utensils className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="font-bold text-base text-slate-700">Your table cart is empty</p>
                <p className="text-xs text-slate-400">Browse dishes from the menu and add them to your table order</p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.menuItem.id}
                  className="p-3.5 bg-white border border-slate-300 rounded-2xl space-y-2 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h4
                          onClick={() => handleOpenPairingModal(item.menuItem)}
                          className="font-bold text-slate-900 text-sm truncate cursor-pointer hover:text-[#0C831F] transition-colors"
                          title="Click to view & customize"
                        >
                          {item.menuItem.name}
                        </h4>
                        {item.menuItem.price === 0 && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded">
                            FREE GIFT
                          </span>
                        )}
                      </div>

                      {/* Price & Addon Calculation Breakdown */}
                      <div className="mt-0.5 space-y-1">
                        <div className="flex items-baseline space-x-1.5 font-mono text-xs font-bold text-slate-800">
                          {item.menuItem.price === 0 ? (
                            <span className="text-emerald-700 font-bold">₹0.00 (Complimentary)</span>
                          ) : (
                            <>
                              <span className="text-sm font-black text-slate-900">
                                ₹{((item.unitPrice ?? item.menuItem.price) * item.quantity).toFixed(2)}
                              </span>
                              <span className="text-[11px] font-normal text-slate-500 font-sans">
                                (₹{item.unitPrice ?? item.menuItem.price} × {item.quantity})
                              </span>
                            </>
                          )}
                        </div>

                        {/* Add-ons Detail & Quantity Notice — Mobile Optimized Wrap */}
                        {item.addonNames && item.addonNames.length > 0 && (
                          <div className="p-2 sm:p-2.5 bg-[#fdfaf6] border border-[#e8dfd5] rounded-xl space-y-1.5 mt-1.5">
                            <div className="flex items-start space-x-1.5 text-[11px] font-bold text-[#865d38]">
                              <div className="min-w-0 flex-1">
                                <span className="text-[9px] uppercase tracking-wider font-bold text-[#9d785e] block mb-1">
                                  Selected Add-ons:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {item.addonNames.map((addon, aIdx) => (
                                    <span
                                      key={aIdx}
                                      className="inline-flex items-center px-2 py-0.5 rounded-md bg-white border border-[#e3ddd4] text-[#223134] text-[11px] font-semibold shadow-2xs break-words"
                                    >
                                      {addon}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <p className="text-[10px] text-[#8a7561] font-medium flex items-center space-x-1 pt-1 border-t border-[#f0e6db]">
                              <span className="text-[#9d785e] font-bold">✓</span>
                              <span>All {item.quantity} portion{item.quantity > 1 ? 's' : ''} prepared with selected add-ons.</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem(item.menuItem.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4 pointer-events-none" />
                    </button>
                  </div>

                  {/* Unavailable / Sold Out Alert */}
                  {item.menuItem.isAvailable === false && (
                    <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-700 text-xs font-bold shadow-2xs">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse shrink-0" />
                        <span>Sold out today! Remove to order.</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.menuItem.id)}
                        className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-black uppercase hover:bg-rose-700 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {/* Quantity Stepper & Special Instructions */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-1.5 bg-[#9d785e] text-white px-2 py-1 rounded-xl shadow-xs">
                      <button
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                        className="w-7 h-7 sm:w-6 sm:h-6 hover:bg-black/20 rounded-lg flex items-center justify-center transition-colors cursor-pointer active:scale-90"
                        title="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                      <span className="font-mono text-xs sm:text-sm font-black min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => {
                          if (item.menuItem.price === 0) {
                            showToast('Free reward is limited to 1 per table session!', 'info');
                            return;
                          }
                          updateQuantity(item.menuItem.id, item.quantity + 1);
                        }}
                        className={`w-7 h-7 sm:w-6 sm:h-6 hover:bg-black/20 rounded-lg flex items-center justify-center transition-colors cursor-pointer active:scale-90 ${
                          item.menuItem.price === 0 ? 'opacity-40 cursor-not-allowed' : ''
                        }`}
                        title="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* AI-Powered Pairing Suggestions (Dynamically tailored to cart items) */}
            {items.length > 0 && dynamicPairings.length > 0 && (
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs font-black text-slate-800 uppercase tracking-wider">
                    <span>Pairs Perfectly With Your Order</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => scrollPairings('left')}
                      className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-700 flex items-center justify-center transition-all cursor-pointer border border-slate-200"
                      title="Scroll recommendations left"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollPairings('right')}
                      className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-700 flex items-center justify-center transition-all cursor-pointer border border-slate-200"
                      title="Scroll recommendations right"
                    >
                      <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                <div
                  ref={pairingScrollRef}
                  className="flex space-x-3.5 overflow-x-auto pb-3 pt-1 -mx-1 px-1 no-scrollbar scroll-smooth select-none touch-pan-x"
                >
                  {dynamicPairings.map((rec) => {
                    const inCart = items.find((it) => it.menuItem.id === rec.id);
                    return (
                      <div
                        key={rec.id}
                        className="flex-none w-44 sm:w-48 bg-white border border-slate-200/90 hover:border-emerald-500 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                        onClick={() => handleOpenPairingModal(rec)}
                        title="Click to view details & customize"
                      >
                        <div>
                          <div className="h-28 sm:h-32 w-full overflow-hidden bg-slate-100 relative">
                            <img
                              src={rec.imageUrl}
                              alt={rec.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {rec.badge && (
                              <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 bg-[#0C831F] text-white rounded-full shadow-sm tracking-wide">
                                {rec.badge}
                              </span>
                            )}
                          </div>
                          <div className="p-3 pb-1 space-y-1">
                            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 line-clamp-1 leading-snug group-hover:text-[#0C831F] transition-colors">
                              {rec.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 line-clamp-1 leading-normal">
                              {rec.description}
                            </p>
                          </div>
                        </div>

                        {/* Price & Action: Cleanly positioned in dedicated card bottom bar */}
                        <div className="p-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto bg-slate-50/50">
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Price</span>
                            <span className="text-sm font-black text-slate-900 font-mono leading-none">
                              ₹{rec.price}
                            </span>
                          </div>

                          {inCart ? (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center space-x-1.5 bg-[#0C831F] text-white px-2 py-1 rounded-xl shadow-xs"
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateQuantity(rec.id, inCart.quantity - 1);
                                }}
                                className="w-5 h-5 hover:bg-black/20 rounded flex items-center justify-center transition-colors cursor-pointer active:scale-90"
                                title="Decrease quantity"
                              >
                                <Minus className="w-3.5 h-3.5 stroke-[3]" />
                              </button>
                              <span className="font-mono font-black text-xs text-center min-w-[16px]">
                                {inCart.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateQuantity(rec.id, inCart.quantity + 1);
                                }}
                                className="w-5 h-5 hover:bg-black/20 rounded flex items-center justify-center transition-colors cursor-pointer active:scale-90"
                                title="Increase quantity"
                              >
                                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenPairingModal(rec)}
                              className="px-2.5 py-1.5 bg-[#0C831F] hover:bg-[#096918] text-white rounded-xl text-[11px] font-black flex items-center space-x-1 cursor-pointer transition-all active:scale-95 shadow-xs group/btn shrink-0"
                            >
                              <span>View &amp; Add</span>
                              <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pricing Summary & Checkout Section (Seamlessly merged in single scroll flow) */}
            {items.length > 0 && (
              <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3 mt-4">
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Item Subtotal</span>
                    <span className="font-mono text-slate-900 font-bold">₹{subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>GST (5%)</span>
                    <span className="font-mono">₹{gstAmount.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                    <span>To Pay</span>
                    <span className="font-mono text-base text-slate-900 font-black">₹{grandTotal.toFixed(2)}</span>
                  </div>

                  {user?.phone ? (
                    <div className="flex items-center justify-between text-xs bg-emerald-50/90 border border-emerald-300 px-3.5 py-2.5 rounded-2xl text-slate-800 shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-black text-slate-900 text-xs sm:text-sm whitespace-nowrap">
                              +91 {user.phone}
                            </span>
                            {user.name && (
                              <span className="text-[11px] text-slate-500 font-semibold truncate max-w-[120px] whitespace-nowrap">
                                ({user.name})
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-emerald-700 font-medium truncate mt-0.5">
                            Live kitchen order updates enabled
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          useAuthStore.getState().logout();
                          setGuestPhone('');
                        }}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-1.5 text-xs font-black text-slate-900 uppercase tracking-wide">
                          <Phone className="w-3.5 h-3.5 text-c-primary" />
                          <span>Your Mobile Number</span>
                          <span className="text-red-500 text-[10px] font-bold">* Required</span>
                        </label>
                      </div>

                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-xs font-black text-slate-600 font-mono select-none">
                          +91
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          value={guestPhone}
                          onChange={(e) => handlePhoneInputChange(e.target.value)}
                          placeholder="Enter 10-digit mobile number"
                          className="w-full pl-11 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0C831F] font-mono tracking-wider transition-all shadow-sm"
                        />
                        {isCheckingPhone && (
                          <Loader2 className="w-3.5 h-3.5 text-c-primary animate-spin absolute right-2.5" />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {hasUnavailableItems && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse shrink-0" />
                    <span>Your cart contains dishes that are sold out today. Please remove them before proceeding.</span>
                  </div>
                )}

                <button
                  disabled={hasUnavailableItems}
                  onClick={() => {
                    if (tableId === 'Admin') {
                      showToast('Admin Menu Preview: Please scan a table QR code or assign a dining table to send orders to the kitchen.', 'info');
                      return;
                    }
                    if (hasUnavailableItems) {
                      showToast('Please remove sold out items from your cart before sending order.', 'error');
                      return;
                    }
                    if (!user?.phone && guestPhone.length !== 10) {
                      showToast('Please enter your 10-digit mobile number before sending order.', 'error');
                      return;
                    }
                    setIsConfirmOpen(true);
                  }}
                  className={`w-full py-3.5 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-between px-5 ${
                    hasUnavailableItems
                      ? 'bg-rose-600 text-white cursor-not-allowed opacity-90'
                      : 'bg-c-primary hover:bg-c-primary-dark text-white cursor-pointer active:scale-95'
                  }`}
                >
                  <span>{hasUnavailableItems ? 'REMOVE SOLD OUT ITEMS TO ORDER' : 'SEND ORDER TO KITCHEN'}</span>
                  <span className="font-mono text-sm font-black">₹{grandTotal.toFixed(2)}</span>
                </button>
              </div>
            )}
        </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <OrderConfirmationModal
        tableId={tableId}
        isOpen={isConfirmOpen}
        items={items}
        subtotal={subtotal}
        gstAmount={gstAmount}
        grandTotal={grandTotal}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setIsConfirmOpen(false)}
      />

      {/* Dish Detail Modal for Clicked Pairing Item */}
      {selectedPairingItem && (
        <DishDetailModal
          item={selectedPairingItem}
          isOpen={!!selectedPairingItem}
          onClose={() => setSelectedPairingItem(null)}
        />
      )}
    </>
  );
};
export default CartDrawer;
