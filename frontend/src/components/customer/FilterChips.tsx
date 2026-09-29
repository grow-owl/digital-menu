import React from 'react';
import { Sparkles, Award, X } from 'lucide-react';

export type ActiveFilter = 'ALL' | 'VEG' | 'NON_VEG' | 'JAIN' | 'GF' | 'SPECIAL' | 'BESTSELLER' | 'UNDER300' | 'SPICY';

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
        <span className="w-3 h-3 rounded-xs border border-emerald-600 flex items-center justify-center bg-white shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
        </span>
      ),
      activeClass: 'bg-emerald-50 border-emerald-600 text-emerald-900 font-extrabold shadow-xs',
    },
    {
      id: 'NON_VEG',
      label: 'Non-Veg',
      icon: (
        <span className="w-3 h-3 rounded-xs border border-rose-600 flex items-center justify-center bg-white shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
        </span>
      ),
      activeClass: 'bg-rose-50 border-rose-600 text-rose-900 font-extrabold shadow-xs',
    },
    {
      id: 'BESTSELLER',
      label: 'Bestseller',
      icon: <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
      activeClass: 'bg-amber-50 border-amber-600 text-amber-950 font-extrabold shadow-xs',
    },
    {
      id: 'SPECIAL',
      label: 'Special',
      icon: <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />,
      activeClass: 'bg-amber-50 border-amber-500 text-amber-900 font-extrabold shadow-xs',
    },
  ];

  return (
    <div className="w-full max-w-full flex items-center gap-1 select-none overflow-x-auto no-scrollbar">
      {/* Clear Active Filters Button (Hidden on Mobile & Tablet, visible on Desktop) */}
      {hasActiveFilters && (
        <button
          onClick={() => onToggleFilter('ALL')}
          className="hidden lg:inline-flex h-8 px-2.5 rounded-full text-[11px] font-bold items-center space-x-1 bg-slate-900 text-white shadow-xs cursor-pointer shrink-0 active:scale-95 transition-all"
          title="Reset filters"
        >
          <X className="w-3 h-3 stroke-[2.5]" />
          <span>Clear</span>
        </button>
      )}

      {/* 4 core filters fitting in 1 line with FULL text completely visible (no truncation) */}
      <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-2 flex-1 w-full min-w-0">
        {chips.map((chip) => {
          const active = isSelected(chip.id);

          return (
            <button
              key={chip.id}
              onClick={() => onToggleFilter(chip.id)}
              className={`h-8 px-1.5 xs:px-2 sm:px-3.5 rounded-full text-[11px] sm:text-xs font-bold flex items-center justify-center space-x-1 sm:space-x-1.5 whitespace-nowrap transition-all border cursor-pointer active:scale-95 shadow-2xs flex-1 sm:flex-initial min-w-0 ${
                active
                  ? chip.activeClass
                  : 'bg-white text-slate-700 border-slate-200/90 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {chip.icon}
              <span className="whitespace-nowrap font-bold text-[11px] sm:text-xs">{chip.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default FilterChips;
