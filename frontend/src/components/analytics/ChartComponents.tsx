import React from 'react';

// 1. Revenue Velocity Area Curve
export const RevenueAreaChart: React.FC = () => {
  const points = [
    { time: '11 AM', val: 450 },
    { time: '1 PM', val: 1200 },
    { time: '3 PM', val: 850 },
    { time: '5 PM', val: 1650 },
    { time: '7 PM', val: 3400 },
    { time: '9 PM', val: 4280 },
    { time: '11 PM', val: 2100 }
  ];

  return (
    <div className="bg-aura-container/80 backdrop-blur-xl border border-aura-border/60 p-5 rounded-2xl space-y-4 shadow-xl">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-serif text-base font-bold text-aura-ivory">Revenue Velocity Curve</h3>
          <p className="text-[10px] text-aura-slate">Hourly gross revenue trajectory (£)</p>
        </div>
        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
          Peak: £4,280
        </span>
      </div>

      <div className="h-44 w-full flex items-end justify-between space-x-2 pt-6 pb-2 px-2 border-b border-aura-border/40">
        {points.map((pt, i) => {
          const heightPct = (pt.val / 4500) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
              <div className="text-[9px] font-bold text-[#38BDF8] opacity-0 group-hover:opacity-100 transition-opacity">
                £{pt.val}
              </div>
              <div
                style={{ height: `${heightPct}%` }}
                className="w-full max-w-[28px] bg-gradient-to-t from-[#0EA5E9]/20 to-[#38BDF8] rounded-t-lg transition-all duration-500 group-hover:brightness-125 relative"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#38BDF8] shadow-lg shadow-[#38BDF8]/50" />
              </div>
              <span className="text-[9px] text-aura-slate">{pt.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 2. Peak Hours Heatmap Bar Chart
export const PeakHoursBarChart: React.FC = () => {
  const hours = [
    { hour: '12:00', orders: 18, peak: false },
    { hour: '13:00', orders: 42, peak: true },
    { hour: '14:00', orders: 28, peak: false },
    { hour: '18:00', orders: 35, peak: false },
    { hour: '19:00', orders: 68, peak: true },
    { hour: '20:00', orders: 84, peak: true },
    { hour: '21:00', orders: 52, peak: false }
  ];

  return (
    <div className="bg-aura-container/80 backdrop-blur-xl border border-aura-border/60 p-5 rounded-2xl space-y-4 shadow-xl">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-serif text-base font-bold text-aura-ivory">Peak Dining Rush Hours</h3>
          <p className="text-[10px] text-aura-slate">Live covers per service window</p>
        </div>
        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
          Dinner Rush Active
        </span>
      </div>

      <div className="h-44 w-full flex items-end justify-between space-x-2 pt-6 pb-2 px-2 border-b border-aura-border/40">
        {hours.map((h, i) => {
          const heightPct = (h.orders / 90) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
              <span className="text-[9px] text-aura-slate group-hover:text-aura-ivory font-bold">{h.orders}</span>
              <div
                style={{ height: `${heightPct}%` }}
                className={`w-full max-w-[24px] rounded-t-lg transition-all duration-500 ${
                  h.peak
                    ? 'bg-gradient-to-t from-amber-500/30 to-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-aura-obsidian border border-aura-border hover:border-[#38BDF8]'
                }`}
              />
              <span className="text-[9px] text-aura-slate">{h.hour}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 3. Category Revenue Donut Chart
export const CategoryDonutChart: React.FC = () => {
  const categories = [
    { name: 'Chef Specials', pct: 35, color: 'bg-[#38BDF8]' },
    { name: 'Artisanal Cocktails', pct: 25, color: 'bg-emerald-400' },
    { name: 'Fine Wines', pct: 20, color: 'bg-purple-400' },
    { name: 'Pastry & Desserts', pct: 20, color: 'bg-blue-400' }
  ];

  return (
    <div className="bg-aura-container/80 backdrop-blur-xl border border-aura-border/60 p-5 rounded-2xl space-y-4 shadow-xl">
      <h3 className="font-serif text-base font-bold text-aura-ivory">Sales Category Mix</h3>

      <div className="flex items-center space-x-6 py-2">
        {/* Simple Ring Representation */}
        <div className="relative w-28 h-28 rounded-full border-8 border-[#38BDF8]/80 flex items-center justify-center shadow-inner">
          <div className="text-center">
            <span className="font-serif text-lg font-bold text-aura-ivory">100%</span>
            <span className="text-[9px] text-aura-slate block">Category Mix</span>
          </div>
        </div>

        <div className="space-y-2 flex-1 text-xs">
          {categories.map((c) => (
            <div key={c.name} className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full ${c.color}`} />
                <span className="text-aura-slate">{c.name}</span>
              </div>
              <span className="font-bold text-aura-ivory">{c.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 4. Floor Occupancy Radial Gauge
export const OccupancyGauge: React.FC = () => {
  return (
    <div className="bg-aura-container/80 backdrop-blur-xl border border-aura-border/60 p-5 rounded-2xl space-y-3 shadow-xl text-center">
      <h3 className="font-serif text-base font-bold text-aura-ivory">Live Floor Occupancy</h3>
      
      <div className="relative w-32 h-32 mx-auto rounded-full border-8 border-aura-obsidian border-t-emerald-400 border-r-emerald-400 border-b-emerald-400 flex items-center justify-center">
        <div>
          <span className="font-serif text-3xl font-bold text-emerald-400">78%</span>
          <span className="text-[10px] text-aura-slate block">24 / 30 Occupied</span>
        </div>
      </div>

      <p className="text-[10px] text-emerald-400 font-semibold">High Dining Capacity Active</p>
    </div>
  );
};
