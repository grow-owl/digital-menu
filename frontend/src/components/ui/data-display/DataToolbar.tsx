import React from 'react';
import { Search, Download, Filter, ArrowUpDown } from 'lucide-react';

interface DataToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categories?: string[];
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  onExportCSV?: () => void;
  placeholder?: string;
}

export const DataToolbar: React.FC<DataToolbarProps> = ({
  searchQuery,
  onSearchChange,
  categories = [],
  selectedCategory,
  onCategoryChange,
  onExportCSV,
  placeholder = 'Search records...'
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-aura-obsidian/60 border border-aura-border/60 rounded-2xl">
      {/* Search Input */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 text-aura-slate absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 bg-aura-container border border-aura-border rounded-xl text-xs text-aura-ivory placeholder:text-aura-slate focus:outline-none focus:border-[#38BDF8] transition-colors"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
        {categories.length > 0 && onCategoryChange && (
          <div className="relative">
            <select
              value={selectedCategory || ''}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="px-3 py-2 bg-aura-container border border-aura-border rounded-xl text-xs text-aura-ivory focus:outline-none focus:border-[#38BDF8] appearance-none pr-8 cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-aura-slate absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        )}

        {onExportCSV && (
          <button
            onClick={onExportCSV}
            className="px-3.5 py-2 bg-[#38BDF8]/10 border border-[#38BDF8]/30 hover:bg-[#0EA5E9] hover:text-[#090A0F] text-[#38BDF8] text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        )}
      </div>
    </div>
  );
};
