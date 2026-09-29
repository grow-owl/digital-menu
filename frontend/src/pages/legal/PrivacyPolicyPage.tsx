import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowLeft,
  Coffee,
  Lock,
  Eye,
  FileText,
  CheckCircle2,
  Phone,
  MapPin,
  Clock,
  Utensils
} from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f5f2ef] text-[#223134] flex flex-col font-sans selection:bg-[#9d785e] selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#f5f2ef]/90 backdrop-blur-md border-b border-[#c9c1b5]/60 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-[#5f6c6e] hover:text-[#223134] transition-colors cursor-pointer uppercase tracking-wider font-mono"
        >
          <ArrowLeft className="w-4 h-4 text-[#9d785e]" />
          <span>Home</span>
        </button>

        <div
          onClick={() => navigate('/')}
          className="flex items-center space-x-2.5 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-[#9d785e] flex items-center justify-center text-white shadow-xs">
            <Coffee className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif-display font-bold text-sm sm:text-base tracking-wider text-[#223134]">
              Siliguri's Chai Addaa
            </span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#9d785e]">
              Artisan Tea House
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate('/menu')}
          className="h-9 px-4 bg-[#9d785e] hover:bg-[#86644d] text-white text-xs font-semibold tracking-wider uppercase rounded shadow-xs transition-all active:scale-95 flex items-center space-x-1.5 cursor-pointer"
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Menu</span>
        </button>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-14">
        <div className="space-y-3 mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-white border border-[#c9c1b5] text-[#9d785e] text-xs font-semibold tracking-wider uppercase font-mono shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Customer Privacy Commitment</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif-display font-bold text-[#223134] tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-[#5f6c6e]">
            Last Updated: September 2026. Applicable to dining guests, QR ordering sessions, and staff accounts at Siliguri's Chai Addaa.
          </p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-[#5f6c6e]">
          <section className="bg-white border border-[#e3ddd4] rounded-2xl p-6 sm:p-7 shadow-xs space-y-3">
            <h2 className="text-base sm:text-lg font-serif-display font-bold text-[#223134] flex items-center space-x-2.5">
              <Eye className="w-4 h-4 text-[#9d785e] shrink-0" />
              <span>1. Information We Collect</span>
            </h2>
            <p>
              When dining with us or using our table QR ordering system, we collect minimal data required to prepare and serve your meal accurately:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#5f6c6e]">
              <li><strong className="text-[#223134]">Table Session Data:</strong> Your designated dining table identifier to route food orders to the kitchen display.</li>
              <li><strong className="text-[#223134]">Order Items and Notes:</strong> Dishes chosen, customization requests, and preparation preferences.</li>
              <li><strong className="text-[#223134]">Contact Information (Optional):</strong> Mobile number provided for digital bill receipts and SMS alerts.</li>
              <li><strong className="text-[#223134]">Payment Records:</strong> Transaction reference IDs and payment status (UPI, debit/credit cards, cash). We do not store raw card numbers or banking passwords.</li>
            </ul>
          </section>

          <section className="bg-white border border-[#e3ddd4] rounded-2xl p-6 sm:p-7 shadow-xs space-y-3">
            <h2 className="text-base sm:text-lg font-serif-display font-bold text-[#223134] flex items-center space-x-2.5">
              <FileText className="w-4 h-4 text-[#9d785e] shrink-0" />
              <span>2. How We Use Your Information</span>
            </h2>
            <p>The information gathered is strictly used for dining operations:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#5f6c6e]">
              <li>Directing your tickets to the kitchen prep line and dispatching food to the right table.</li>
              <li>Generating itemized tax invoices and processing bill settlements.</li>
              <li>Addressing customer service queries or food safety concerns.</li>
            </ul>
          </section>

          <section className="bg-white border border-[#e3ddd4] rounded-2xl p-6 sm:p-7 shadow-xs space-y-3">
            <h2 className="text-base sm:text-lg font-serif-display font-bold text-[#223134] flex items-center space-x-2.5">
              <Lock className="w-4 h-4 text-[#9d785e] shrink-0" />
              <span>3. Data Protection and Security</span>
            </h2>
            <p>
              We apply standard technical safeguards, including encrypted connections (HTTPS), secure database access controls, and hashed authentication tokens. We do not sell, rent, or trade guest personal information to third-party advertisers.
            </p>
          </section>

          <section className="bg-white border border-[#e3ddd4] rounded-2xl p-6 sm:p-7 shadow-xs space-y-3">
            <h2 className="text-base sm:text-lg font-serif-display font-bold text-[#223134] flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#9d785e] shrink-0" />
              <span>4. Your Rights and Contact</span>
            </h2>
            <p>
              You may request a copy of your dining history or ask to remove your contact details from our rewards ledger at any time by speaking with restaurant management or contacting us at:
            </p>
            <div className="pt-2 text-xs space-y-2 text-[#5f6c6e]">
              <div className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-[#9d785e] mt-0.5 shrink-0" />
                <span className="leading-snug">Champasari Rd, Indrapally, Champasari, Siliguri, West Bengal 734003</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-[#9d785e] shrink-0" />
                <a href="tel:07585877937" className="text-[#9d785e] font-mono font-medium hover:underline">
                  075858 77937
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer matching Landing Page */}
      <footer id="contact" className="border-t border-[#2d3a3d] bg-[#1a2528] pt-12 pb-8 sm:pt-14 sm:pb-10 px-4 sm:px-6 lg:px-8 text-xs text-stone-400 mt-auto">
        <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-8 border-b border-[#2d3a3d]/70">
            {/* Col 1: Brand */}
            <div className="lg:col-span-4 space-y-3.5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#9d785e] shadow-sm flex items-center justify-center text-white shrink-0">
                  <Coffee className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-serif-display font-bold text-white tracking-wider block text-base sm:text-lg">
                    Siliguri's Chai Addaa
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono tracking-wider uppercase">
                    Artisan Tea House &amp; Digital Dining
                  </span>
                </div>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed max-w-sm">
                Authentic handcrafted regional teas, fresh comfort snacks, and contactless QR table ordering in Siliguri.
              </p>
            </div>

            {/* Col 2: Store Location & Hours */}
            <div className="lg:col-span-5 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Store Location &amp; Hours
              </h4>
              <div className="space-y-2.5 text-xs text-stone-300">
                <div className="flex items-start space-x-2.5">
                  <MapPin className="w-4 h-4 text-[#9d785e] mt-0.5 shrink-0" />
                  <span className="leading-snug">
                    Champasari Rd, Indrapally, Champasari, Siliguri, West Bengal 734003
                  </span>
                </div>

                <div className="flex items-center space-x-2.5">
                  <Phone className="w-4 h-4 text-[#9d785e] shrink-0" />
                  <a
                    href="tel:07585877937"
                    className="hover:text-white font-mono font-medium transition-colors"
                  >
                    075858 77937
                  </a>
                </div>

                <div className="flex items-center space-x-2.5">
                  <Clock className="w-4 h-4 text-[#9d785e] shrink-0" />
                  <span className="font-mono text-emerald-400 font-semibold">
                    Open 7 Days a Week: 3–10 pm
                  </span>
                </div>
              </div>
            </div>

            {/* Col 3: Navigation */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Quick Navigation
              </h4>
              <div className="flex flex-col space-y-2 text-xs text-stone-300">
                <button
                  onClick={() => navigate('/menu')}
                  className="hover:text-white transition-colors cursor-pointer text-left flex items-center space-x-1.5"
                >
                  <Utensils className="w-3.5 h-3.5 text-[#9d785e]" />
                  <span>Digital Table Menu</span>
                </button>
                <button
                  onClick={() => navigate('/#about')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Concept &amp; Philosophy
                </button>
                <button
                  onClick={() => navigate('/#how-it-works')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  How QR Ordering Works
                </button>
                <button
                  onClick={() => navigate('/privacy')}
                  className="text-white font-medium cursor-pointer text-left"
                >
                  Privacy Policy
                </button>
                <button
                  onClick={() => navigate('/terms')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Terms of Service
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Attribution: Centered GrowOwl Agency Credits & Copyright */}
          <div className="space-y-2.5 text-center text-xs">
            <div className="flex items-center flex-wrap justify-center gap-2">
              <span className="text-[11px] text-stone-400 tracking-wide font-sans">
                Developed, Maintained &amp; Designed by
              </span>
              <a
                href="https://www.growowl.online/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center hover:opacity-80 transition-opacity"
                title="GrowOwl"
              >
                <img
                  src="/growowl-logo-white.webp"
                  alt="GrowOwl"
                  className="h-5 sm:h-6 w-auto object-contain brightness-105"
                />
              </a>
            </div>

            <p className="text-stone-500 font-mono text-[11px]">
              &copy; {new Date().getFullYear()} Siliguri's Chai Addaa. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicyPage;
