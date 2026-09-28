import React from 'react';
import { Coffee, MapPin, Phone, Clock, FileText, ShieldCheck, Utensils, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CustomerFooter: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="mt-16 bg-[#0B0F19] text-slate-400 text-xs border-t border-slate-800/90 pt-12 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 mb-10">
        {/* Col 1: Brand & Concept (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-wide block">
                Siliguri's Chai Addaa
              </span>
              <span className="text-[11px] text-amber-400/90 font-mono tracking-wider block uppercase">
                Artisan Tea House &amp; Kitchen
              </span>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-slate-300 max-w-md">
            Handcrafted teas, authentic Darjeeling momos, and comfort meals prepared fresh to order. Experience contactless dining with instant table QR ordering and real-time kitchen tracking.
          </p>
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Dine-In • Takeaway • Contactless Table Service</span>
          </div>
        </div>

        {/* Col 2: Service Hours (3 cols) */}
        <div className="md:col-span-3 space-y-3">
          <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Café Hours</span>
          </h4>
          <div className="space-y-2 text-xs text-slate-300">
            <div>
              <span className="font-medium text-slate-400 block">Monday to Sunday</span>
              <span className="font-mono text-white font-semibold">10:00 AM to 11:00 PM</span>
            </div>
            <div>
              <span className="font-medium text-slate-400 block">Kitchen Last Call</span>
              <span className="font-mono text-slate-300">10:30 PM</span>
            </div>
            <div className="pt-1">
              <span className="inline-block text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/50">
                Open All 7 Days
              </span>
            </div>
          </div>
        </div>

        {/* Col 3: Visit & Direct Contact (2 cols) */}
        <div className="md:col-span-2 space-y-3">
          <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span>Visit Us</span>
          </h4>
          <address className="not-italic text-xs text-slate-300 space-y-2">
            <p className="leading-relaxed">
              Sevoke Road<br />
              Siliguri, West Bengal<br />
              India 734001
            </p>
            <a
              href="tel:+919382776017"
              className="inline-flex items-center space-x-1.5 text-amber-400 hover:text-amber-300 transition-colors font-mono font-medium"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>+91 93827 76017</span>
            </a>
          </address>
        </div>

        {/* Col 4: Quick Navigation & Legal (2 cols) */}
        <div className="md:col-span-2 space-y-3">
          <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center space-x-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Navigation</span>
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button
                onClick={() => navigate('/menu')}
                className="hover:text-amber-400 transition-colors cursor-pointer flex items-center space-x-1"
              >
                <span>Digital Menu</span>
              </button>
            </li>

            <li>
              <button
                onClick={() => navigate('/privacy')}
                className="hover:text-amber-400 transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/terms')}
                className="hover:text-amber-400 transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar: Copyright & Attribution */}
      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-3">
        <p>
          &copy; {new Date().getFullYear()} Siliguri's Chai Addaa. All rights reserved.
        </p>
        <p className="text-slate-400 font-mono text-[11px]">
          Siliguri, West Bengal, India
        </p>
      </div>
    </footer>
  );
};

export default CustomerFooter;
