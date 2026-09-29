import React from 'react';
import { MapPin, Clock, Coffee, Sparkles } from 'lucide-react';


interface CustomerHeroBannerProps {
  tableId?: string;
}

export const CustomerHeroBanner: React.FC<CustomerHeroBannerProps> = ({
  tableId = '10',
}) => {
  return (
    // Hidden on mobile screens per user specification; authoritative luxury hero for tablet and desktop
    <div className="hidden md:block px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4 max-w-[1560px] mx-auto">
      <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-md bg-gradient-to-r from-emerald-50/90 via-white to-amber-50/70 p-5 lg:p-7 flex items-center justify-between gap-6 lg:gap-10 min-h-[180px]">
        {/* Left Gourmet Branding & Details */}
        <div className="space-y-3 min-w-0 flex-1">
          {/* Status Badges Row */}
          <div className="flex items-center space-x-2.5 flex-wrap gap-y-1.5">
            <div className="flex items-center space-x-1.5 bg-[#0C831F] text-white px-2.5 py-0.5 rounded-lg text-[11px] font-bold shadow-xs shrink-0">
              <Clock className="w-3.5 h-3.5" />
              <span>FRESH TO ORDER PREPARATION</span>
            </div>

            <div className="flex items-center space-x-1 bg-amber-50 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-lg text-[11px] font-bold shadow-xs shrink-0">
              <Coffee className="w-3.5 h-3.5 text-amber-700" />
              <span>Artisan Darjeeling &amp; Assam Teas</span>
            </div>
          </div>

          {/* Restaurant Master Title */}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-black text-2xl lg:text-3xl text-slate-950 tracking-tight uppercase">
                Siliguri's Chai Addaa
              </span>
              <span className="text-xs font-mono font-bold tracking-widest text-[#0C831F] bg-emerald-100/80 px-2.5 py-0.5 rounded-lg uppercase border border-emerald-300">
                Table QR Dining
              </span>
            </div>
            <p className="text-xs lg:text-sm text-slate-600 leading-relaxed max-w-2xl mt-1">
              Handcrafted teas, steaming snacks, and chef specialties cooked to order and served directly to your table.
            </p>
          </div>

          {/* Address & Table Location */}
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 pt-0.5">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>Siliguri, West Bengal, India</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-900 font-bold bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
              Table {tableId}
            </span>
          </div>
        </div>

        {/* Right Architectural Dining Ambience Window */}
        <div className="w-80 lg:w-96 h-44 lg:h-48 rounded-2xl overflow-hidden border border-slate-200/90 shadow-md shrink-0 relative group">
          <img
            src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800&auto=format&fit=crop"
            alt="Siliguri Chai Addaa Dining Ambience"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-white text-[11px] font-bold border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Dine-In &amp; Table QR</span>
            </div>
            <span className="text-[10px] text-white/90 font-mono font-bold bg-emerald-600/80 px-2 py-0.5 rounded-lg border border-emerald-400/40">
              Open Till 11:00 PM
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerHeroBanner;
