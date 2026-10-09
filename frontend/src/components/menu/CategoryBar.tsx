import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Utensils, ChevronDown, Coffee, Flame, CupSoda, Sparkles, IceCream, Check } from 'lucide-react';
import { Category } from '../../types/menu.types';

interface CategoryBarProps {
  categories: Category[];
  selectedCategoryId: number | null;
  onSelectCategory: (id: number | null) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  isHeaderVisible?: boolean;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  searchQuery = '',
  onSearchChange,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const selectedCategoryName = categories.find((c) => c.id === selectedCategoryId)?.name;

  const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('chai') || n.includes('tea') || n.includes('coffee') || n.includes('brew')) {
      return <Coffee className="w-3.5 h-3.5 text-[#9d785e]" />;
    }
    if (n.includes('fries') || n.includes('pakora') || n.includes('appetiser')) {
      return <Flame className="w-3.5 h-3.5 text-orange-500" />;
    }
    if (n.includes('boba') || n.includes('shake') || n.includes('matcha')) {
      return <CupSoda className="w-3.5 h-3.5 text-purple-500" />;
    }
    if (n.includes('cooler') || n.includes('lassi') || n.includes('mojito') || n.includes('soda')) {
      return <Sparkles className="w-3.5 h-3.5 text-sky-500" />;
    }
    if (n.includes('dessert') || n.includes('ice cream')) {
      return <IceCream className="w-3.5 h-3.5 text-pink-500" />;
    }
    return <Utensils className="w-3.5 h-3.5 text-emerald-600" />;
  };

  return (
    <div className="w-full bg-white/95 backdrop-blur-md">
      <div className="max-w-[1560px] mx-auto px-2.5 sm:px-6 lg:px-8 py-2 space-y-2">

        {/* Quick Search Bar + Custom Cafe Category Dropdown */}
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder="Search dishes..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 focus:border-[#0C831F] focus:bg-white rounded-xl text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none shadow-2xs transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange && onSearchChange('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 p-0.5 rounded-full cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Custom Styled Category Dropdown - Matches the App's UI 100% */}
          <div className="relative shrink-0 sm:hidden">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(true)}
              className={`h-9 px-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer border select-none active:scale-95 ${
                selectedCategoryId !== null
                  ? 'bg-[#0C831F] text-white border-[#0C831F]'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
              }`}
              title="Select Menu Category"
            >
              <Coffee className={`w-3.5 h-3.5 shrink-0 ${selectedCategoryId !== null ? 'text-white' : 'text-[#9d785e]'}`} />
              <span className="whitespace-nowrap font-bold text-xs max-w-[105px] truncate">
                {selectedCategoryName || 'Categories'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180' : ''
                } ${selectedCategoryId !== null ? 'text-white' : 'text-slate-500'}`}
              />
            </button>

            {/* Custom Cafe-Themed Bottom Sheet Modal rendered via Portal */}
            {isDropdownOpen && typeof document !== 'undefined' && createPortal(
              <div className="fixed inset-0 z-[9999] flex flex-col justify-end select-none">
                {/* Mobile Backdrop */}
                <div
                  className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
                  onClick={() => setIsDropdownOpen(false)}
                />

                {/* Bottom Sheet Container */}
                <div className="relative z-10 w-full bg-white border-t border-slate-200 rounded-t-3xl shadow-2xl p-4 space-y-2.5 animate-in slide-in-from-bottom duration-250 max-h-[80vh] flex flex-col">
                  {/* Sheet Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#9d785e] to-[#87654d] text-white flex items-center justify-center shadow-xs">
                        <Coffee className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-black text-sm text-slate-900 block leading-tight">Select Menu Category</span>
                        <span className="text-[10px] text-slate-500 font-medium">Explore dishes by category</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsDropdownOpen(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors active:scale-90"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* List of Categories */}
                  <div className="overflow-y-auto custom-scrollbar space-y-1.5 py-1 flex-1 pr-1 max-h-[60vh] touch-pan-y overscroll-contain">
                    {/* All Dishes */}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectCategory(null);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full p-3 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer text-left ${
                        selectedCategoryId === null
                          ? 'bg-emerald-50 text-[#0C831F] font-black border border-emerald-400 shadow-2xs'
                          : 'text-slate-800 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#0C831F] flex items-center justify-center shrink-0">
                          <Utensils className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold block">All Dishes</span>
                          <span className="text-[10px] text-slate-400 font-normal">All 32 menu items</span>
                        </div>
                      </div>
                      {selectedCategoryId === null && (
                        <Check className="w-4 h-4 text-[#0C831F] stroke-[2.5]" />
                      )}
                    </button>

                    {/* All 10 Categories */}
                    {categories.map((category) => {
                      const isSelected = selectedCategoryId === category.id;
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => {
                            onSelectCategory(category.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full p-3 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer text-left ${
                            isSelected
                              ? 'bg-emerald-50 text-[#0C831F] font-black border border-emerald-400 shadow-2xs'
                              : 'text-slate-800 hover:bg-slate-50 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                              {getCategoryIcon(category.name)}
                            </div>
                            <div>
                              <span className="text-xs font-bold block">{category.name}</span>
                              {category.description && (
                                <span className="text-[10px] text-slate-400 font-normal line-clamp-1">{category.description}</span>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-[#0C831F] stroke-[2.5]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>

          {searchQuery && (
            <span className="hidden sm:inline-block text-[10px] font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg whitespace-nowrap shrink-0">
              Filtered
            </span>
          )}
        </div>

        {/* Desktop / Tablet Category Pills Rail (Hidden on mobile to eliminate scroll) */}
        <div className="hidden sm:flex overflow-x-auto no-scrollbar items-center space-x-2 px-1 pt-0.5 pb-1 select-none scroll-smooth">
          <button
            onClick={() => onSelectCategory(null)}
            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap tracking-wide transition-all shrink-0 cursor-pointer flex items-center space-x-1.5 ${
              selectedCategoryId === null
                ? 'bg-[#0C831F] text-white shadow-sm font-black scale-[1.02]'
                : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 shadow-sm'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>All Dishes</span>
          </button>

          {categories.map((category) => {
            const isSelected = selectedCategoryId === category.id;
            return (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap tracking-wide transition-all shrink-0 cursor-pointer flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-[#0C831F] text-white shadow-sm font-black scale-[1.02]'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 shadow-sm'
                }`}
              >
                <span>{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default CategoryBar;

