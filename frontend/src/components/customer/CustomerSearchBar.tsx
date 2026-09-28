import React, { useState, useEffect } from 'react';
import { Search, X, Flame } from 'lucide-react';

interface CustomerSearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSelectSuggestion?: (term: string) => void;
}

export const CustomerSearchBar: React.FC<CustomerSearchBarProps> = ({
  value,
  onChange,
  onSelectSuggestion,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const placeholders = [
    'Search Masala Tea & Black Tea...',
    'Search Boba Tea & Taro...',
    'Search Matcha Latte & Frappes...',
    'Search Peri Peri Fries & Burgers...',
    'Search Chowmein & Fried Rice...',
    'Search Arrabbiata Pasta...',
  ];

  const popularSearches = [
    'Masala Tea',
    'Boba Tea',
    'Iced Matcha Latte',
    'Tandoori Chicken Sandwich',
    'Peri Peri Fries',
    'Chicken Chowmein',
    'Oreo Frappe',
    'Arrabbiata Pasta',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="px-4 max-w-7xl mx-auto my-3 relative z-20">
      <div className="relative">
        <Search className="w-4 h-4 text-[#38BDF8] absolute left-4 top-3.5" />
        
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholders[placeholderIndex]}
          className="w-full pl-11 pr-10 py-3.5 bg-aura-container border border-[#38BDF8]/20 hover:border-[#38BDF8]/50 rounded-2xl text-white text-xs placeholder:text-aura-slate focus:outline-none focus:border-[#38BDF8] shadow-lg transition-colors"
        />

        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3.5 top-3.5 p-0.5 text-aura-slate hover:text-white rounded-full cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Popular Search Suggestions Popup */}
      {isFocused && !value && (
        <div className="absolute top-full left-4 right-4 mt-2 bg-[#121520] border border-[#38BDF8]/30 rounded-2xl p-4 shadow-2xl space-y-3 z-30 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#38BDF8] uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Popular Guest Searches</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {popularSearches.map((term) => (
              <button
                key={term}
                onClick={() => {
                  onChange(term);
                  if (onSelectSuggestion) onSelectSuggestion(term);
                }}
                className="px-3 py-1.5 bg-[#090A0F] hover:bg-[#38BDF8]/20 border border-[#38BDF8]/20 hover:border-[#38BDF8] text-white text-xs rounded-xl font-medium transition-all cursor-pointer"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
