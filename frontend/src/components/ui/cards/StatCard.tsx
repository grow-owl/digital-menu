import React from 'react';
import { LucideIcon, ArrowUpRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  iconColor?: string;
  badge?: string;
  onClick?: () => void;
  clickHint?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  isPositive = true,
  icon: Icon,
  iconColor = 'text-[#38BDF8]',
  badge,
  onClick,
  clickHint
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-aura-container/80 backdrop-blur-xl border p-5 rounded-2xl space-y-3 shadow-xl transition-all duration-300 relative overflow-hidden group ${
        onClick
          ? 'cursor-pointer border-aura-border/80 hover:border-[#38BDF8] hover:shadow-2xl hover:scale-[1.015] active:scale-[0.99]'
          : 'border-aura-border/60 hover:border-[#38BDF8]/40'
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-1.5">
          <span className="text-[11px] font-semibold text-aura-slate uppercase tracking-wider">{title}</span>
          {onClick && (
            <ArrowUpRight className="w-3 h-3 text-[#38BDF8] opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-aura-obsidian border border-aura-border ${iconColor} group-hover:scale-110 transition-transform`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">{value}</h2>
          {badge && (
            <span className="px-2 py-0.5 rounded-full bg-[#38BDF8]/10 text-[#38BDF8] text-[10px] font-bold border border-[#38BDF8]/20">
              {badge}
            </span>
          )}
        </div>

        {trend && (
          <p className={`text-[10px] font-bold flex items-center space-x-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            <span>{isPositive ? '↑' : '↓'} {trend}</span>
          </p>
        )}

        <div className="flex items-center justify-between">
          {subtitle && (
            <p className="text-[10px] text-aura-slate font-medium">{subtitle}</p>
          )}
          {clickHint && (
            <span className="text-[9px] text-[#38BDF8]/80 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
              {clickHint} →
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
