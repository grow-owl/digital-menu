import React from 'react';
import { MenuItem, Category } from '../../types/menu.types';
import { LazyDishCard } from './LazyDishCard';
import { Utensils, AlertCircle, RotateCcw } from 'lucide-react';

interface MenuDishesGridProps {
  tableId: string;
  categories: Category[];
  selectedCategoryId: number | null;
  searchQuery: string;
  menuItemsCount: number;
  filteredItems: MenuItem[];
  visibleCount: number;
  isLoading: boolean;
  fetchError: string | null;
  sentinelRef: React.Ref<HTMLDivElement>;
  onResetFilters: () => void;
  onClearCategory: () => void;
  onRetryFetch: () => void;
  onAddToCart: (item: MenuItem) => void;
  onSelectItem: (item: MenuItem) => void;
}

export const MenuDishesGrid: React.FC<MenuDishesGridProps> = ({
  tableId,
  categories,
  selectedCategoryId,
  searchQuery,
  menuItemsCount,
  filteredItems,
  visibleCount,
  isLoading,
  fetchError,
  sentinelRef,
  onResetFilters,
  onClearCategory,
  onRetryFetch,
  onAddToCart,
  onSelectItem,
}) => {
  return (
    <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-5 max-w-[1560px] mx-auto">
      {/* Active Table Status Banner (Above All Dishes) */}
      <div className="mb-3.5 p-2.5 sm:p-3 bg-gradient-to-r from-[#FAF6F0] via-white to-[#F5ECE1] border border-[#E4D5C3] rounded-2xl flex items-center space-x-3 shadow-2xs">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#9d785e] to-[#87654d] text-white flex items-center justify-center font-black text-xs sm:text-sm shrink-0 shadow-xs">
          {tableId === 'Admin' ? '👑' : `T${tableId}`}
        </div>
        <span className="font-extrabold text-xs sm:text-sm text-[#2A1D13] tracking-tight">
          {tableId === 'Admin' ? 'Admin Menu Inspection • Viewing Customer Side' : `Ordering for Table ${tableId}`}
        </span>
      </div>

      {/* Section Demarcation Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-slate-300">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-6 bg-[#0C831F] rounded-full shadow-sm" />
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>
              {selectedCategoryId
                ? categories.find((c) => c.id === selectedCategoryId)?.name || 'Menu Category'
                : searchQuery
                ? `Search Results for "${searchQuery}"`
                : 'All Dishes'}
            </span>
            <span className="text-xs font-bold font-mono px-2.5 py-0.5 bg-slate-200/90 text-slate-800 rounded-full border border-slate-300/80">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
            </span>
          </h2>
        </div>

        {selectedCategoryId !== null && (
          <button
            onClick={onClearCategory}
            className="text-xs font-bold text-[#0C831F] hover:underline cursor-pointer"
          >
            View All Dishes
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <div
              key={n}
              className="h-48 sm:h-64 bg-white rounded-2xl sm:rounded-3xl animate-pulse border border-slate-200 shadow-sm"
            />
          ))}
        </div>
      ) : fetchError ? (
        <div className="py-16 text-center space-y-4 bg-white rounded-3xl border border-rose-200 p-8 max-w-md mx-auto shadow-sm">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <p className="font-bold text-base text-slate-800">{fetchError}</p>
          <button
            onClick={onRetryFetch}
            className="px-5 py-2.5 bg-[#0C831F] text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 mx-auto shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200 p-8 max-w-lg mx-auto shadow-sm">
          <Utensils className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-extrabold text-lg text-slate-800">
            {menuItemsCount === 0 ? 'No dishes available' : 'No dishes match your active filter'}
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            {menuItemsCount === 0
              ? 'There are currently no items in the menu.'
              : 'Try clearing your dietary filters or searching for another dish.'}
          </p>
          {menuItemsCount > 0 && (
            <button
              onClick={onResetFilters}
              className="px-5 py-2.5 bg-[#0C831F] text-white font-bold text-xs rounded-xl shadow-md transition-transform hover:scale-105 cursor-pointer"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5">
            {filteredItems.slice(0, visibleCount).map((item) => (
              <LazyDishCard
                key={item.id}
                item={item}
                onAdd={(it) => onAddToCart(it)}
                onClick={(it) => onSelectItem(it)}
              />
            ))}
          </div>

          {/* Sentinel Div for Infinite Scroll Batch Loading */}
          {visibleCount < filteredItems.length && (
            <div ref={sentinelRef} className="py-6 text-center flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-[#0C831F] rounded-full animate-ping" />
              <span className="text-[11px] text-[#0C831F] font-mono uppercase font-bold tracking-wider">
                Loading More Dishes ({visibleCount} of {filteredItems.length})...
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
