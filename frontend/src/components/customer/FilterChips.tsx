import React from 'react';
import { X } from 'lucide-react';

export type ActiveFilter = 'ALL' | 'VEG' | 'NON_VEG';

interface FilterChipsProps {
  selectedFilters: ActiveFilter[];
  onToggleFilter: (filter: ActiveFilter) => void;
}

export const FilterChips: React.FC<FilterChipsProps> = ({ selectedFilters, onToggleFilter }) => {
  const isSelected = (filter: ActiveFilter) => selectedFilters.includes(filter);
  const hasActiveFilters = selectedFilters.some((f) => f !== 'ALL');

  const chips: { id: ActiveFilter; label: string; icon?: React.ReactNode; activeClass: string }[] = [
    {
      id: 'VEG',
      label: 'Veg',
      icon: (
        <span className="w-3.5 h-3.5 rounded-xs border-2 border-emerald-600 flex items-center justify-center bg-white shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
        </span>
      ),
      activeClass: 'bg-emerald-100/90 border-emerald-600 text-emerald-950 font-black shadow-xs ring-1 ring-emerald-500/30',
    },
    {
      id: 'NON_VEG',
      label: 'Non-Veg',
      icon: (
        <span className="w-3.5 h-3.5 rounded-xs border-2 border-rose-600 flex items-center justify-center bg-white shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
        </span>
      ),
      activeClass: 'bg-rose-100/90 border-rose-600 text-rose-950 font-black shadow-xs ring-1 ring-rose-500/30',
    },
  ];

  return (
    <div className="w-full max-w-full flex items-center gap-1.5 sm:gap-2 select-none overflow-x-auto no-scrollbar py-0.5">
      {/* Clear Active Filters Button (Visible on ALL devices so user is never trapped) */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => onToggleFilter('ALL')}
          className="inline-flex h-8 px-3 rounded-full text-xs font-black items-center space-x-1.5 bg-slate-900 text-white shadow-xs cursor-pointer shrink-0 active:scale-95 transition-all hover:bg-slate-800"
          title="Reset filters to All"
        >
          <X className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Clear Filter</span>
        </button>
      )}

      {/* Veg and Non-Veg Filter Chips */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {chips.map((chip) => {
          const active = isSelected(chip.id);

          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => onToggleFilter(chip.id)}
              className={`h-8 px-3.5 sm:px-4 rounded-full text-xs font-bold flex items-center justify-center space-x-1.5 whitespace-nowrap transition-all border cursor-pointer active:scale-95 shadow-2xs shrink-0 ${
                active
                  ? chip.activeClass
                  : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              {chip.icon}
              <span className="whitespace-nowrap font-bold text-xs">{chip.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FilterChips;
