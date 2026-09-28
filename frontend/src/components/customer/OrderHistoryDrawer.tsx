import React, { useState, useEffect } from 'react';
import { X, History, Utensils, CalendarClock, ChevronRight, Loader } from 'lucide-react';
import { orderService } from '../../services/order.service';
import { useAuthStore } from '../../store/use-auth-store';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useBackHandler } from '../../hooks/useBackHandler';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const getOrderBadge = (order: any) => {
  if (order.paymentStatus === 'REFUNDED') {
    return { label: 'REFUNDED & VOID', style: 'text-rose-700 bg-rose-50 border-rose-200' };
  }
  if (order.paymentStatus === 'PARTIALLY_REFUNDED' || (order.refundAmount && order.refundAmount > 0)) {
    return { label: `PARTIALLY REFUNDED (-₹${order.refundAmount})`, style: 'text-amber-700 bg-amber-50 border-amber-300' };
  }
  if (order.paymentStatus === 'PAID') {
    return { label: 'PAID & SETTLED', style: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  }
  const s = String(order.status || '').toLowerCase();
  if (s === 'served' || s === 'completed') {
    return { label: 'FOOD SERVED', style: 'text-blue-700 bg-blue-50 border-blue-200' };
  }
  if (s === 'ready') {
    return { label: 'READY TO SERVE', style: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  }
  if (s === 'preparing') {
    return { label: 'PREPARING', style: 'text-amber-700 bg-amber-50 border-amber-200' };
  }
  return { label: 'ORDER PLACED', style: 'text-slate-600 bg-slate-100 border-slate-200' };
};

export const OrderHistoryDrawer: React.FC<OrderHistoryDrawerProps> = ({ isOpen, onClose }) => {
  useBodyScrollLock(isOpen);
  useBackHandler(isOpen, onClose);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
    }
  }, [isOpen]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      if (user?.phone) {
        const data = await orderService.getOrdersByPhone(user.phone);
        setOrders(data);
      } else {
        const tableIdMatch = window.location.pathname.match(/\/table\/(\d+)/);
        const currentTable = tableIdMatch ? tableIdMatch[1] : (localStorage.getItem('aura_current_table_id') || '5');
        const data = await orderService.getOrdersByTable(currentTable);
        setOrders(data);
      }
    } catch (error) {
      console.error('Failed to load orders', error);
    } finally {
      setLoading(false);
    }
  };

  // Render with AnimatePresence

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="history-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex justify-end"
          onClick={onClose}
        >
          <motion.div
            key="history-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-full md:max-w-md bg-white md:border-l border-slate-200 h-full flex flex-col shadow-2xl relative text-slate-800"
          >
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-300 flex items-center justify-center text-purple-700 shadow-sm">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Order History</h2>
              <p className="text-xs text-slate-500">Your past dining sessions &amp; receipts</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-20"><Loader className="w-8 h-8 animate-spin text-[#0C831F]" /></div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20 text-slate-500 text-sm space-y-2">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                <Utensils className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-700">No past orders found</p>
              <p className="text-xs text-slate-400">Items you order during this session will show up here.</p>
            </div>
          ) : (() => {
            // Group orders sharing the same invoiceNumber into a single combined receipt group
            const groupedMap = new Map<string, any>();
            orders.forEach((order) => {
              const groupKey = order.invoiceNumber ? `INV-${order.invoiceNumber}` : (order.orderId || String(order._id));
              if (!groupedMap.has(groupKey)) {
                groupedMap.set(groupKey, {
                  groupKey,
                  invoiceNumber: order.invoiceNumber,
                  tableId: order.tableId,
                  createdAt: order.createdAt,
                  paymentStatus: order.paymentStatus,
                  paymentMethod: order.paymentMethod,
                  refundAmount: order.refundAmount || 0,
                  refundReason: order.refundReason,
                  ordersCount: 1,
                  allOrderIds: [order.orderId || order._id],
                  allItems: [...(order.items || [])],
                  subtotal: order.subtotal || 0,
                  tax: order.tax || 0,
                  discount: order.discount || 0,
                  total: order.total || 0,
                  firstOrder: order,
                });
              } else {
                const group = groupedMap.get(groupKey);
                group.ordersCount += 1;
                group.allOrderIds.push(order.orderId || order._id);
                group.allItems.push(...(order.items || []));
                group.subtotal += order.subtotal || 0;
                group.tax += order.tax || 0;
                group.discount += order.discount || 0;
                group.total += order.total || 0;
                group.refundAmount = (group.refundAmount || 0) + (order.refundAmount || 0);
                if (order.refundReason) group.refundReason = order.refundReason;
              }
            });

            const receiptGroups = Array.from(groupedMap.values());

            return receiptGroups.map((receiptGroup) => {
              const badge = getOrderBadge(receiptGroup.firstOrder);
              const isMultiOrder = receiptGroup.ordersCount > 1;
              const displayTitle = receiptGroup.invoiceNumber 
                ? `Invoice #${receiptGroup.invoiceNumber}`
                : `Order #${receiptGroup.allOrderIds[0]}`;

              return (
                <div 
                  key={receiptGroup.groupKey} 
                  onClick={() => setSelectedReceipt(receiptGroup)}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 hover:bg-white transition-all group cursor-pointer shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <CalendarClock className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-700">{new Date(receiptGroup.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full border ${badge.style}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm text-[#0C831F]">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-extrabold text-slate-900 group-hover:text-c-primary transition-colors truncate">{displayTitle}</p>
                      <p className="text-xs text-slate-600 font-medium line-clamp-1 mt-0.5">
                        {receiptGroup.allItems.slice(0, 3).map((it: any) => it.name).join(', ')}
                        {receiptGroup.allItems.length > 3 ? ` +${receiptGroup.allItems.length - 3} more` : ''}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {isMultiOrder ? `${receiptGroup.ordersCount} Combined Orders` : `1 Order`} • {receiptGroup.allItems.length} Item(s)
                      </p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                    <span className="font-mono font-black text-[#0C831F] text-sm">₹{receiptGroup.total.toLocaleString('en-IN')}</span>
                    <div className="flex items-center space-x-1 text-xs text-[#0C831F] group-hover:underline font-bold">
                      <span>View Receipt</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>

        {/* Digital Receipt Modal */}
        {selectedReceipt && (
          <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedReceipt(null)}>
            <div className="bg-white text-slate-900 rounded-3xl max-w-sm w-full p-6 space-y-4 font-mono text-xs shadow-2xl relative border border-slate-200 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setSelectedReceipt(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-1 border-b border-slate-200 pb-3">
                <h3 className="font-extrabold text-lg text-slate-900 tracking-wider font-sans">SILIGURI'S CHAI ADDAA</h3>
                <p className="text-[10px] text-slate-500 font-sans">Combined Dining Session Receipt</p>
              </div>

              <div className="space-y-1 bg-slate-50 p-3 rounded-xl text-[11px] border border-slate-200 font-sans">
                {selectedReceipt.invoiceNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Invoice #:</span>
                    <span className="font-bold text-slate-900">{selectedReceipt.invoiceNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Order ID(s):</span>
                  <span className="font-bold text-[10px] text-slate-900">{selectedReceipt.allOrderIds?.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Table #:</span>
                  <span className="font-bold text-slate-900">Table {selectedReceipt.tableId || '7'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span className="text-slate-900">{new Date(selectedReceipt.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment:</span>
                  <span className={`font-bold uppercase ${selectedReceipt.paymentStatus === 'PAID' ? 'text-emerald-700 font-extrabold' : 'text-amber-600 font-extrabold'}`}>
                    {selectedReceipt.paymentStatus === 'PAID' 
                      ? `${selectedReceipt.paymentMethod || 'CASH'} (PAID)` 
                      : 'DINING IN PROGRESS (UNPAID)'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                <div className="grid grid-cols-12 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200 pb-1">
                  <span className="col-span-7">Item</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-3 text-right">Price</span>
                </div>
                {selectedReceipt.allItems?.map((it: any, i: number) => (
                  <div key={i} className="grid grid-cols-12 text-xs py-1 border-b border-slate-100">
                    <span className="col-span-7 font-medium text-slate-800">{it.name}</span>
                    <span className="col-span-2 text-center text-slate-500">{it.quantity || it.qty || 1}</span>
                    <span className="col-span-3 text-right font-bold text-slate-900">₹{((it.quantity || 1) * (it.price || 0)).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-200 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>₹{(selectedReceipt.subtotal || 0).toLocaleString('en-IN')}</span>
                </div>
                {selectedReceipt.pointsDiscount && selectedReceipt.pointsDiscount > 0 ? (
                  <div className="flex justify-between text-[#0C831F] font-bold">
                    <span>Points Discount ({selectedReceipt.pointsRedeemed || 0} PTS)</span>
                    <span className="font-mono">-₹{(selectedReceipt.pointsDiscount || 0).toLocaleString('en-IN')}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-slate-600">
                  <span>GST Tax</span>
                  <span>₹{(selectedReceipt.tax || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-900">
                  <span>GROSS TOTAL</span>
                  <span className={selectedReceipt.paymentStatus === 'REFUNDED' ? 'line-through text-slate-400' : 'text-slate-900'}>
                    ₹{(selectedReceipt.total || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                {selectedReceipt.pointsEarned && selectedReceipt.pointsEarned > 0 ? (
                  <div className="flex justify-between text-[11px] text-amber-800 bg-amber-50 border border-amber-200 p-1.5 rounded-lg font-bold font-sans mt-1">
                    <span>Chai Adda Points Earned:</span>
                    <span className="font-mono font-black">+{selectedReceipt.pointsEarned} PTS</span>
                  </div>
                ) : null}

                {selectedReceipt.refundAmount !== undefined && selectedReceipt.refundAmount > 0 && (
                  <div className="pt-2 border-t border-dashed border-slate-300 space-y-1 font-sans">
                    <div className="flex justify-between text-xs text-rose-600 font-bold font-mono">
                      <span>{selectedReceipt.paymentStatus === 'REFUNDED' ? 'Full Refund Void:' : 'Partial Refund Issued:'}</span>
                      <span>- ₹{selectedReceipt.refundAmount.toLocaleString('en-IN')}</span>
                    </div>
                    {selectedReceipt.refundReason && (
                      <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 p-1.5 rounded-lg">
                        Reason: {selectedReceipt.refundReason}
                      </p>
                    )}
                    {selectedReceipt.paymentStatus !== 'REFUNDED' && (
                      <div className="flex justify-between text-xs font-black text-[#0C831F] pt-1 border-t border-slate-200 font-mono">
                        <span>NET SETTLED:</span>
                        <span>₹{Math.max(0, (selectedReceipt.total || 0) - selectedReceipt.refundAmount).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default OrderHistoryDrawer;
