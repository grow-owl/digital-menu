import React, { useState, useEffect } from 'react';
import { RotateCcw, X, AlertCircle, CheckCircle2, DollarSign, Utensils, Hash, ArrowRight, ShieldAlert } from 'lucide-react';
import { orderService } from '../../services/order.service';
import { useToast } from '../feedback/ToastContainer';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

export interface RefundItemSelection {
  name: string;
  quantity: number;
  maxQuantity: number;
  price: number;
  selected: boolean;
}

export interface OrderRefundModalProps {
  isOpen: boolean;
  order: {
    orderId: string;
    invoiceNumber?: string;
    tableName?: string;
    tableNumber?: string | number;
    customerName?: string;
    customerMobile?: string;
    total: number;
    refundAmount?: number;
    items?: Array<{
      name: string;
      quantity?: number;
      qty?: number;
      price: number;
    }>;
    paymentMethod?: string;
  } | null;
  refundedBy?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_REASONS = [
  'Dish Quality / Temperature Issue',
  'Wrong Dish Delivered',
  'Excessive Kitchen Wait Delay',
  'Billing / Punching Error',
  'Guest Dissatisfaction / Goodwill',
  'Returned Unconsumed Item',
  'Other / Manager Discretion',
];

export const OrderRefundModal: React.FC<OrderRefundModalProps> = ({
  isOpen,
  order,
  refundedBy = 'Cashier / Manager',
  onClose,
  onSuccess,
}) => {
  useBodyScrollLock(isOpen);
  const { showToast } = useToast();

  const [mode, setMode] = useState<'ITEM' | 'CUSTOM' | 'FULL'>('ITEM');
  const [selectedItems, setSelectedItems] = useState<RefundItemSelection[]>([]);
  const [customAmountStr, setCustomAmountStr] = useState<string>('');
  const [selectedReason, setSelectedReason] = useState<string>(PRESET_REASONS[0]);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [refundMethod, setRefundMethod] = useState<string>('ORIGINAL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const originalTotal = Number(order?.total || 0);
  const alreadyRefunded = Number(order?.refundAmount || 0);
  const maxRefundable = Math.max(0, Math.round((originalTotal - alreadyRefunded) * 100) / 100);

  // Initialize items whenever order changes
  useEffect(() => {
    if (order && Array.isArray(order.items)) {
      const itemsList: RefundItemSelection[] = order.items.map((it) => {
        const q = Number(it.quantity ?? it.qty ?? 1);
        return {
          name: it.name,
          quantity: 1,
          maxQuantity: Math.max(1, q),
          price: Number(it.price || 0),
          selected: false,
        };
      });
      setSelectedItems(itemsList);
    } else {
      setSelectedItems([]);
    }

    if (maxRefundable > 0) {
      setCustomAmountStr(String(Math.min(500, maxRefundable)));
    } else {
      setCustomAmountStr('0');
    }
  }, [order, maxRefundable]);

  if (!isOpen || !order) return null;

  // Compute calculated refund amount based on current mode
  let calculatedAmount = 0;
  if (mode === 'FULL') {
    calculatedAmount = maxRefundable;
  } else if (mode === 'CUSTOM') {
    const parsed = parseFloat(customAmountStr);
    calculatedAmount = isNaN(parsed) ? 0 : Math.min(Math.max(0, parsed), maxRefundable);
  } else {
    // ITEM Mode
    calculatedAmount = selectedItems
      .filter((it) => it.selected)
      .reduce((sum, it) => sum + it.price * it.quantity, 0);
    calculatedAmount = Math.min(calculatedAmount, maxRefundable);
  }

  calculatedAmount = Math.round(calculatedAmount * 100) / 100;
  const netRetained = Math.max(0, Math.round((originalTotal - alreadyRefunded - calculatedAmount) * 100) / 100);
  const isFullRefund = alreadyRefunded + calculatedAmount >= originalTotal;

  const handleToggleItem = (index: number) => {
    setSelectedItems((prev) => {
      const copy = [...prev];
      copy[index].selected = !copy[index].selected;
      return copy;
    });
  };

  const handleItemQtyChange = (index: number, newQty: number) => {
    setSelectedItems((prev) => {
      const copy = [...prev];
      copy[index].quantity = Math.max(1, Math.min(newQty, copy[index].maxQuantity));
      return copy;
    });
  };

  const handleSubmitRefund = async () => {
    if (calculatedAmount <= 0) {
      showToast('Please specify an amount or select an item to refund.', 'error');
      return;
    }

    if (calculatedAmount > maxRefundable) {
      showToast(`Refund amount cannot exceed remaining balance of ₹${maxRefundable.toLocaleString('en-IN')}`, 'error');
      return;
    }

    const finalReason = selectedReason === 'Other / Manager Discretion'
      ? (customNotes ? `Manager: ${customNotes}` : 'Manager Discretion')
      : (customNotes ? `${selectedReason} - ${customNotes}` : selectedReason);

    const refundedItemsPayload = mode === 'ITEM'
      ? selectedItems.filter((it) => it.selected).map((it) => ({
          name: it.name,
          quantity: it.quantity,
          price: it.price,
          reason: finalReason,
        }))
      : [];

    setIsSubmitting(true);
    try {
      const res = await orderService.refundOrder(order.orderId, {
        amount: calculatedAmount,
        reason: finalReason,
        refundedBy,
        refundType: isFullRefund ? 'FULL' : 'PARTIAL',
        refundedItems: refundedItemsPayload,
        refundMethod,
      });

      showToast(res.message || `Refund of ₹${calculatedAmount.toLocaleString('en-IN')} issued successfully!`, 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to process refund. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-xl bg-[#0B0F19] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto text-slate-200 font-sans">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#121826] via-[#101725] to-[#121826] border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
              <RotateCcw className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-black text-white font-serif tracking-wide">
                  ISSUE BILL REFUND
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {order.invoiceNumber || order.orderId}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Table: <span className="text-white font-semibold">{order.tableName || order.tableNumber || 'N/A'}</span>
                {order.customerName ? ` • Guest: ${order.customerName}` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[72vh] overflow-y-auto luxury-scrollbar-x">
          
          {/* Financial Summary Card */}
          <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl text-center">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Original Total</span>
              <span className="font-mono font-black text-sm sm:text-base text-white">
                ₹{originalTotal.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="space-y-0.5 border-x border-slate-800 px-1">
              <span className="text-[10px] text-rose-400 font-mono uppercase block">Prev Refunded</span>
              <span className="font-mono font-bold text-sm sm:text-base text-rose-400">
                {alreadyRefunded > 0 ? `₹${alreadyRefunded.toLocaleString('en-IN')}` : '₹0'}
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-emerald-400 font-mono uppercase block">Max Refundable</span>
              <span className="font-mono font-black text-sm sm:text-base text-emerald-400">
                ₹{maxRefundable.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Refund Mode Selection Tabs */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block font-mono">
              Select Refund Scope
            </label>
            <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setMode('ITEM')}
                className={`py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  mode === 'ITEM'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>By Dish / Item</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('CUSTOM')}
                className={`py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  mode === 'CUSTOM'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Custom Amount</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('FULL')}
                className={`py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  mode === 'FULL'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Full Bill (100%)</span>
              </button>
            </div>
          </div>

          {/* Mode 1: By Item / Dish Selection */}
          {mode === 'ITEM' && (
            <div className="space-y-2.5 bg-slate-900/40 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">Select Dish(es) to Refund</span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {selectedItems.filter((it) => it.selected).length} selected
                </span>
              </div>

              {selectedItems.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">No individual item details on this order.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto luxury-scrollbar-x pr-1">
                  {selectedItems.map((it, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleToggleItem(idx)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        it.selected
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-sm'
                          : 'bg-slate-900/80 border-slate-800/90 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                            it.selected
                              ? 'bg-amber-500 border-amber-500 text-slate-950'
                              : 'border-slate-600 bg-slate-800'
                          }`}
                        >
                          {it.selected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-white truncate">{it.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            ₹{it.price.toLocaleString('en-IN')} each
                          </p>
                        </div>
                      </div>

                      {it.selected ? (
                        <div
                          className="flex items-center space-x-2 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {it.maxQuantity > 1 && (
                            <div className="flex items-center space-x-1 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700 text-xs">
                              <span className="text-[10px] text-slate-400">Qty:</span>
                              <select
                                value={it.quantity}
                                onChange={(e) => handleItemQtyChange(idx, parseInt(e.target.value))}
                                className="bg-transparent text-white font-mono font-bold focus:outline-none cursor-pointer"
                              >
                                {Array.from({ length: it.maxQuantity }, (_, i) => i + 1).map((q) => (
                                  <option key={q} value={q} className="bg-slate-900 text-white">
                                    {q}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          <span className="font-mono font-black text-amber-400 text-xs">
                            ₹{(it.price * it.quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ) : (
                        <span className="font-mono text-slate-500 text-xs shrink-0">
                          ₹{(it.price * it.maxQuantity).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Custom Amount */}
          {mode === 'CUSTOM' && (
            <div className="space-y-3 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
              <label className="text-xs font-bold text-slate-300 block">
                Enter Custom Refund Amount (Max ₹{maxRefundable.toLocaleString('en-IN')})
              </label>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-black text-amber-400 font-mono">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  max={maxRefundable}
                  value={customAmountStr}
                  onChange={(e) => setCustomAmountStr(e.target.value)}
                  placeholder="Enter refund rupees"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-8 pr-4 font-mono font-black text-lg text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[100, 250, 500, 1000].filter((a) => a <= maxRefundable).map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCustomAmountStr(String(amt))}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer border border-slate-700"
                  >
                    ₹{amt}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCustomAmountStr(String(Math.round(maxRefundable / 2)))}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer border border-slate-700"
                >
                  Half (50%)
                </button>
                <button
                  type="button"
                  onClick={() => setCustomAmountStr(String(maxRefundable))}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer"
                >
                  Full Balance
                </button>
              </div>
            </div>
          )}

          {/* Mode 3: Full Bill Notice */}
          {mode === 'FULL' && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-1.5 text-xs text-rose-300">
              <div className="flex items-center space-x-2 font-bold text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>100% Full Bill Void &amp; Refund</span>
              </div>
              <p>
                Refunding the entire remaining balance of <span className="font-mono font-bold text-white">₹{maxRefundable.toLocaleString('en-IN')}</span>. The invoice will be stamped as <span className="font-bold text-rose-400">REFUNDED</span> and order status marked as cancelled in audit records.
              </p>
            </div>
          )}

          {/* Refund Reason Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block font-mono">
              Audit Reason for Refund
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {PRESET_REASONS.map((r) => (
                <option key={r} value={r} className="bg-slate-900 text-white">
                  {r}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Additional internal audit notes (optional)"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-600"
            />
          </div>

          {/* Refund Payout Channel */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block font-mono">
              Payout Channel
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: 'ORIGINAL', label: 'Original Mode' },
                { id: 'CASH', label: 'Cash Drawer' },
                { id: 'STORE_CREDIT', label: 'Store Credit' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setRefundMethod(m.id)}
                  className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    refundMethod === m.id
                      ? 'bg-slate-800 border-amber-400 text-amber-400 font-bold'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Outcome Calculation Preview */}
          <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>Bill Gross Total:</span>
              <span>₹{originalTotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-xs text-rose-400 font-mono font-bold">
              <span>Amount Being Refunded:</span>
              <span>- ₹{calculatedAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-mono font-black">
              <span className="text-white">Net Retained by Restaurant:</span>
              <span className={netRetained > 0 ? 'text-emerald-400' : 'text-slate-500'}>
                ₹{netRetained.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center space-x-1.5 pt-1">
              <ArrowRight className="w-3 h-3 text-amber-400" />
              <span>
                Resulting Status:{' '}
                <strong className={isFullRefund ? 'text-rose-400' : 'text-amber-400'}>
                  {isFullRefund ? 'FULLY REFUNDED & VOIDED' : 'PARTIALLY REFUNDED (COMPLETED)'}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-slate-900 border-t border-slate-800 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmitRefund}
            disabled={isSubmitting || calculatedAmount <= 0}
            className={`px-5 py-2.5 font-black text-xs rounded-xl flex items-center space-x-2 transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${
              isFullRefund
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
            }`}
          >
            <RotateCcw className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
            <span>
              {isSubmitting
                ? 'Authorizing Refund...'
                : `Authorize Refund (₹${calculatedAmount.toLocaleString('en-IN')})`}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
