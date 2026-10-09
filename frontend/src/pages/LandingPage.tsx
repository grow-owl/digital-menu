import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Coffee, Utensils, QrCode, Clock, MapPin, Phone, ArrowRight,
  Sparkles, Menu as MenuIcon, X, ChevronRight, CheckCircle2
} from 'lucide-react';
import { TableQrScanModal } from '../components/customer/TableQrScanModal';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isTableQrScanOpen, setIsTableQrScanOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f2ef] text-[#223134] font-sans selection:bg-[#9d785e] selection:text-white flex flex-col w-full max-w-full overflow-x-hidden">
      {/* =========================================================================
          HERO SECTION — WARM WHITEWASHED PLASTER / CONCRETE TEXTURE
          ========================================================================= */}
      <section className="bg-plaster relative min-h-screen overflow-hidden flex flex-col justify-between border-b border-[#e3ddd4]/80">
        {/* Inner vignette for photographed edge depth */}
        <div
          className="absolute inset-0 pointer-events-none vignette-plaster z-0"
          style={{ boxShadow: "inset 0 0 180px 40px rgba(0,0,0,0.06)" }}
        />

        {/* Top Navigation */}
        <header className="relative z-10 w-full pt-4 sm:pt-6 px-3 sm:px-8 lg:px-12">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Left Brand Identity — 2 clean lines on mobile (never truncates!) & 1 line on desktop */}
            <div
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center space-x-2 sm:space-x-2.5 cursor-pointer select-none shrink-0"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#9d785e] shadow-sm flex items-center justify-center text-white shrink-0">
                <Coffee className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
              </div>
              {/* Desktop view */}
              <span className="hidden sm:inline font-serif-display font-bold text-sm tracking-[0.18em] text-[#223134] uppercase whitespace-nowrap">
                Siliguri's Chai Addaa
              </span>
              {/* Mobile view — Always 100% visible, full brand name, never truncated (no ellipsis) */}
              <span className="inline sm:hidden font-serif-display font-bold text-[11px] min-[375px]:text-xs tracking-[0.05em] min-[375px]:tracking-[0.1em] text-[#223134] uppercase whitespace-nowrap">
                Siliguri's Chai Addaa
              </span>
            </div>

            {/* Center / Left Nav Links — All in a single line, whitespace-nowrap */}
            <nav className="hidden lg:flex items-center space-x-6 xl:space-x-7 text-xs font-semibold tracking-[0.16em] uppercase text-[#223134]">
              <a href="#about" className="hover:text-[#9d785e] transition-colors whitespace-nowrap">
                Concept
              </a>
              <button
                onClick={() => setIsTableQrScanOpen(true)}
                className="hover:text-[#9d785e] transition-colors whitespace-nowrap uppercase cursor-pointer"
              >
                Menu
              </button>
              <a href="#how-it-works" className="hover:text-[#9d785e] transition-colors whitespace-nowrap">
                How It Works
              </a>
              <a href="#contact" className="hover:text-[#9d785e] transition-colors whitespace-nowrap">
                Location &amp; Hours
              </a>
            </nav>

            {/* Right Action Buttons — Identical height (h-10), balanced, single line text */}
            <div className="hidden sm:flex items-center space-x-3 shrink-0">
              <button
                onClick={() => setIsTableQrScanOpen(true)}
                className="h-10 px-5 bg-[#9d785e] hover:bg-[#86644d] text-white text-xs font-semibold tracking-[0.15em] uppercase rounded shadow-sm transition-all active:scale-95 flex items-center justify-center space-x-2 whitespace-nowrap cursor-pointer"
              >
                <Utensils className="w-3.5 h-3.5 shrink-0" />
                <span>Browse Menu</span>
              </button>
            </div>

            {/* Mobile Menu & Hamburger Toggle — 360px phone friendly */}
            <div className="flex sm:hidden items-center space-x-2 shrink-0">
              <button
                onClick={() => setIsTableQrScanOpen(true)}
                className="h-8 px-2.5 bg-[#9d785e] text-white text-[11px] font-bold tracking-wider uppercase rounded flex items-center space-x-1 whitespace-nowrap shadow-xs active:scale-95"
              >
                <Utensils className="w-3 h-3" />
                <span>Menu</span>
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="h-8 w-8 flex items-center justify-center text-[#223134] bg-white/90 rounded border border-[#c9c1b5] transition-colors active:scale-95"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <MenuIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="sm:hidden mt-3 rounded-xl border border-[#c9c1b5] bg-white/95 backdrop-blur-md p-4 space-y-3 shadow-xl">
              <div className="flex flex-col space-y-2 text-xs font-semibold tracking-wider uppercase text-[#223134]">
                <a
                  href="#about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded hover:bg-[#f5f2ef] text-[#9d785e]"
                >
                  About &amp; Concept
                </a>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsTableQrScanOpen(true);
                  }}
                  className="text-left py-2 px-3 rounded hover:bg-[#f5f2ef] uppercase"
                >
                  Our Menu
                </button>
                <a
                  href="#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded hover:bg-[#f5f2ef]"
                >
                  How QR Ordering Works
                </a>
                <a
                  href="#contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded hover:bg-[#f5f2ef]"
                >
                  Location &amp; Hours
                </a>
              </div>

              <div className="pt-2 border-t border-[#e3ddd4]">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsTableQrScanOpen(true);
                  }}
                  className="w-full py-2.5 bg-[#9d785e] hover:bg-[#86644d] text-white font-bold text-xs tracking-widest uppercase rounded shadow transition-colors flex items-center justify-center space-x-2"
                >
                  <Utensils className="w-4 h-4" />
                  <span>Open Digital Menu</span>
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Center Hero Heading & Identity */}
        <div id="home" className="relative z-10 flex flex-col items-center text-center px-3 sm:px-6 py-10 xs:py-14 sm:py-18 md:py-24 max-w-5xl mx-auto my-auto w-full">
          {/* Siliguri's Chai Addaa Brand Title — Above 'Welcome to our' with balanced gap */}
          <div className="flex flex-col items-center mb-7 sm:mb-9 md:mb-12 select-none w-full px-2">
            <div className="inline-flex items-center space-x-1.5 sm:space-x-2 px-3.5 py-1.5 rounded-full bg-white/70 border border-[#c9c1b5]/60 text-[#9d785e] text-[9px] xs:text-[10px] sm:text-xs font-mono font-medium tracking-[0.22em] uppercase mb-2.5 sm:mb-3 shadow-xs">
              <Coffee className="w-3 h-3 text-[#9d785e] shrink-0" />
              <span className="truncate">Artisan Tea House &amp; Kitchen</span>
            </div>
            <h2 className="font-serif-display text-base xs:text-lg sm:text-2xl md:text-3xl font-bold tracking-[0.16em] sm:tracking-[0.24em] text-[#223134] uppercase leading-tight">
              SILIGURI'S CHAI ADDAA
            </h2>
            <div className="w-12 sm:w-20 h-0.5 bg-[#9d785e]/40 mt-3 sm:mt-4" />
          </div>

          {/* Script Calligraphy "Welcome to our" — Snug just above RESTAURANT */}
          <span className="font-script text-3xl xs:text-4xl sm:text-5xl md:text-6xl text-[#9d785e] font-normal leading-normal tracking-wide drop-shadow-xs select-none mb-1 sm:mb-2 md:mb-3">
            Welcome to our
          </span>

          {/* Huge Iconic RESTAURANT Typography */}
          <h1 className="font-serif-display text-[2.65rem] xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-[0.08em] xs:tracking-[0.14em] sm:tracking-[0.2em] text-[#223134] uppercase select-none leading-none mb-4 sm:mb-5 md:mb-6 drop-shadow-sm max-w-full text-center break-normal">
            RESTAURANT
          </h1>

          {/* Subtitle / Philosophy */}
          <p className="max-w-xl text-xs sm:text-sm md:text-base font-normal text-[#5f6c6e] tracking-wide leading-relaxed px-2 mt-2 sm:mt-3 mb-6 sm:mb-8">
            Fresh handcrafted teas, authentic comfort food, and contactless digital table ordering in Siliguri.
          </p>

          {/* Action CTAs — Responsive on 360px */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 w-full sm:w-auto px-2 max-w-xs sm:max-w-none">
            <button
              onClick={() => setIsTableQrScanOpen(true)}
              className="w-full sm:w-auto h-11 px-6 bg-[#9d785e] hover:bg-[#86644d] text-white font-semibold text-xs tracking-[0.18em] uppercase rounded shadow-md transition-all active:scale-95 flex items-center justify-center space-x-2 whitespace-nowrap cursor-pointer"
            >
              <Utensils className="w-4 h-4 shrink-0" />
              <span>Browse Table Menu</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 shrink-0" />
            </button>

            <button
              onClick={() => navigate('/order/active')}
              className="w-full sm:w-auto h-11 px-5 bg-white/85 hover:bg-white text-[#223134] border border-[#c9c1b5] font-semibold text-xs tracking-[0.15em] uppercase rounded transition-all shadow-xs flex items-center justify-center space-x-2 whitespace-nowrap cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-[#9d785e] shrink-0" />
              <span>Track Table Order</span>
            </button>
          </div>

          {/* Guarantees Strip — Responsive wrap */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2 text-[10px] sm:text-xs text-[#5f6c6e] font-medium px-2">
            <div className="flex items-center space-x-1.5 whitespace-nowrap">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>No App Required</span>
            </div>
            <div className="flex items-center space-x-1.5 whitespace-nowrap">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Cooked Fresh on Order</span>
            </div>
            <div className="flex items-center space-x-1.5 whitespace-nowrap">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>UPI, Cards &amp; Cash</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          AUTHENTIC TABLE DINING EXPERIENCE (PLASTER ACCENT)
          ========================================================================= */}
      <section className="py-12 sm:py-20 px-3 sm:px-6 lg:px-8 bg-plaster-subtle border-b border-[#e3ddd4]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Text */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-5 text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-white border border-[#c9c1b5] text-[#9d785e] text-xs font-semibold tracking-wider uppercase font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Contactless Dining Technology</span>
            </div>

            <h2 className="text-xl xs:text-2xl sm:text-4xl font-bold font-serif-display text-[#223134] tracking-tight leading-tight">
              Order Fresh From Your Seat, Direct to the Kitchen Line
            </h2>

            <p className="text-xs sm:text-sm text-[#5f6c6e] leading-relaxed">
              No need to wait for a server during packed rush hours. Point your phone at the table QR stand to explore our full artisan tea catalog, specify custom spice or dietary instructions for our chef, and watch live ticket preparation in real time.
            </p>

            <div className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-[#223134]">
              <div className="flex items-start space-x-3 p-3 sm:p-3.5 rounded-lg bg-white/90 border border-[#e3ddd4] shadow-xs">
                <div className="w-7 h-7 rounded bg-[#9d785e]/10 flex items-center justify-center text-[#9d785e] shrink-0 font-bold text-xs">
                  01
                </div>
                <div>
                  <span className="font-bold block">Instant Digital Menu</span>
                  <span className="text-[#5f6c6e] text-xs">Instant access on any smartphone with zero app installations.</span>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 sm:p-3.5 rounded-lg bg-white/90 border border-[#e3ddd4] shadow-xs">
                <div className="w-7 h-7 rounded bg-[#9d785e]/10 flex items-center justify-center text-[#9d785e] shrink-0 font-bold text-xs">
                  02
                </div>
                <div>
                  <span className="font-bold block">Direct Kitchen Dispatch</span>
                  <span className="text-[#5f6c6e] text-xs">Orders appear immediately on our kitchen KDS line for rapid cooking.</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/menu')}
                className="w-full xs:w-auto px-6 py-3 bg-[#9d785e] hover:bg-[#86644d] text-white text-xs font-semibold tracking-widest uppercase rounded shadow transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Launch Table Menu Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Live Table Status Card Mockup — 360px optimized */}
          <div className="lg:col-span-6 w-full">
            <div className="bg-white/90 backdrop-blur-md border border-[#c9c1b5] rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-7 shadow-xl space-y-3.5 sm:space-y-4">
              {/* Card Top Bar */}
              <div className="flex items-center justify-between border-b border-[#e3ddd4] pb-3 gap-2">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#9d785e]/10 border border-[#9d785e]/30 flex items-center justify-center text-[#9d785e] shrink-0">
                    <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#223134] block truncate">Table 12 • Main Dining</span>
                    <span className="text-[10px] text-emerald-700 font-mono font-medium block truncate">Session Active</span>
                  </div>
                </div>
                <span className="text-[10px] sm:text-[11px] font-mono font-medium text-[#5f6c6e] bg-[#f5f2ef] px-2 py-0.5 rounded border border-[#e3ddd4] shrink-0">
                  Dine-In
                </span>
              </div>

              {/* Order Status Stepper */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#223134]">Kitchen Status</span>
                  <span className="text-[10px] sm:text-[11px] font-mono text-[#9d785e] font-bold">Cooking (7m left)</span>
                </div>

                <div className="grid grid-cols-3 gap-1 text-center text-[9px] xs:text-[10px] font-semibold">
                  <div className="bg-emerald-50 text-emerald-800 py-1.5 px-0.5 rounded border border-emerald-200 truncate">
                    1. Received
                  </div>
                  <div className="bg-amber-50 text-amber-800 py-1.5 px-0.5 rounded border border-amber-300 font-bold animate-pulse truncate">
                    2. In Kitchen
                  </div>
                  <div className="bg-stone-100 text-stone-500 py-1.5 px-0.5 rounded border border-stone-200 truncate">
                    3. Ready
                  </div>
                </div>
              </div>

              {/* Simulated Order Items */}
              <div className="space-y-2 pt-1 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#fbf9f6] border border-[#e3ddd4] gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="w-5 h-5 rounded bg-[#9d785e]/15 text-[#9d785e] font-bold flex items-center justify-center text-[10px] shrink-0">
                      1x
                    </span>
                    <span className="text-[#223134] font-medium truncate">Handcrafted Masala Chai</span>
                  </div>
                  <span className="font-mono font-bold text-[#223134] shrink-0">₹45</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#fbf9f6] border border-[#e3ddd4] gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="w-5 h-5 rounded bg-[#9d785e]/15 text-[#9d785e] font-bold flex items-center justify-center text-[10px] shrink-0">
                      1x
                    </span>
                    <span className="text-[#223134] font-medium truncate">Steamed Darjeeling Momos</span>
                  </div>
                  <span className="font-mono font-bold text-[#223134] shrink-0">₹140</span>
                </div>
              </div>

              {/* Action Buttons for Guest */}
              <div className="pt-2 border-t border-[#e3ddd4] grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => navigate('/menu')}
                  className="py-2.5 px-2 rounded bg-[#9d785e] hover:bg-[#86644d] text-white font-semibold transition-colors cursor-pointer text-center truncate"
                >
                  Order More
                </button>
                <button
                  onClick={() => navigate('/order/active')}
                  className="py-2.5 px-2 rounded bg-white hover:bg-stone-50 text-[#223134] font-semibold border border-[#c9c1b5] transition-colors cursor-pointer text-center truncate"
                >
                  Track Prep
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ABOUT & PHILOSOPHY
          ========================================================================= */}
      <section id="about" className="py-12 sm:py-24 px-3 sm:px-6 lg:px-8 bg-white border-b border-[#e3ddd4]">
        <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 text-center">
          <span className="font-script text-2xl xs:text-3xl sm:text-4xl text-[#9d785e] block">
            Our Heritage &amp; Philosophy
          </span>

          <h2 className="text-xl xs:text-2xl sm:text-4xl font-serif-display font-bold text-[#223134] tracking-tight">
            Authentic Regional Flavours Crafted Fresh for Every Table
          </h2>

          <p className="text-xs sm:text-base text-[#5f6c6e] leading-relaxed max-w-3xl mx-auto px-2">
            Siliguri's Chai Addaa was founded to celebrate true tea brewing craft and Himalayan comfort culinary recipes. We pair whole single-estate tea leaves and fresh spices with modern contactless table ordering, so our guests spend less time waiting in lines and more time enjoying honest food.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-4 sm:pt-6 text-left">
            <div className="p-4 sm:p-6 rounded-xl bg-plaster-subtle border border-[#e3ddd4] space-y-2.5 sm:space-y-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#9d785e]/10 border border-[#9d785e]/20 flex items-center justify-center text-[#9d785e]">
                <Coffee className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#223134] font-serif-display">Single-Estate Darjeeling &amp; Assam Teas</h3>
              <p className="text-xs text-[#5f6c6e] leading-relaxed">
                Brewed fresh with whole spices, whole milk, or clear golden-tip leaves rather than powdered extracts or pre-made syrups.
              </p>
            </div>

            <div className="p-4 sm:p-6 rounded-xl bg-plaster-subtle border border-[#e3ddd4] space-y-2.5 sm:space-y-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#9d785e]/10 border border-[#9d785e]/20 flex items-center justify-center text-[#9d785e]">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#223134] font-serif-display">Cooked Fresh on Every Ticket</h3>
              <p className="text-xs text-[#5f6c6e] leading-relaxed">
                Dishes are never kept under heat lamps. Each order begins preparation the moment your ticket lands on our kitchen display.
              </p>
            </div>

            <div className="p-4 sm:p-6 rounded-xl bg-plaster-subtle border border-[#e3ddd4] space-y-2.5 sm:space-y-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#9d785e]/10 border border-[#9d785e]/20 flex items-center justify-center text-[#9d785e]">
                <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#223134] font-serif-display">Contactless Control at Your Table</h3>
              <p className="text-xs text-[#5f6c6e] leading-relaxed">
                Add food, request service assistance, or view your itemized bill without having to flag down staff during crowded rush hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          HOW TABLE QR DINING WORKS (3 STEPS)
          ========================================================================= */}
      <section id="how-it-works" className="py-12 sm:py-24 px-3 sm:px-6 lg:px-8 bg-white border-b border-[#e3ddd4]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-2 mb-8 sm:mb-12">
            <span className="font-script text-2xl xs:text-3xl sm:text-4xl text-[#9d785e] block">
              Effortless Ordering
            </span>
            <h2 className="text-xl xs:text-2xl sm:text-4xl font-serif-display font-bold text-[#223134] tracking-tight">
              How Contactless QR Table Dining Works
            </h2>
            <p className="text-xs sm:text-sm text-[#5f6c6e] max-w-lg mx-auto px-2">
              Skip waiting times and order your favourite teas and bites whenever you are ready.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="p-5 sm:p-7 rounded-xl sm:rounded-2xl bg-plaster-subtle border border-[#e3ddd4] space-y-2.5 sm:space-y-3 relative">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#9d785e]/10 border border-[#9d785e]/30 flex items-center justify-center font-mono font-bold text-[#9d785e] text-xs sm:text-sm">
                01
              </div>
              <h3 className="font-bold font-serif-display text-base text-[#223134]">Scan Table QR Stand</h3>
              <p className="text-xs text-[#5f6c6e] leading-relaxed">
                Open your smartphone camera and point it at the QR code stand on your dining table. Your table number is instantly verified.
              </p>
            </div>

            <div className="p-5 sm:p-7 rounded-xl sm:rounded-2xl bg-plaster-subtle border border-[#e3ddd4] space-y-2.5 sm:space-y-3 relative">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#9d785e]/10 border border-[#9d785e]/30 flex items-center justify-center font-mono font-bold text-[#9d785e] text-xs sm:text-sm">
                02
              </div>
              <h3 className="font-bold font-serif-display text-base text-[#223134]">Select Dishes &amp; Add Notes</h3>
              <p className="text-xs text-[#5f6c6e] leading-relaxed">
                Browse our categories, filter by Pure Veg or Non-Veg, adjust spice preferences, and add direct chef instructions before sending your ticket.
              </p>
            </div>

            <div className="p-5 sm:p-7 rounded-xl sm:rounded-2xl bg-plaster-subtle border border-[#e3ddd4] space-y-2.5 sm:space-y-3 relative">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#9d785e]/10 border border-[#9d785e]/30 flex items-center justify-center font-mono font-bold text-[#9d785e] text-xs sm:text-sm">
                03
              </div>
              <h3 className="font-bold font-serif-display text-base text-[#223134]">Fresh Service to Your Table</h3>
              <p className="text-xs text-[#5f6c6e] leading-relaxed">
                Your order is sent instantly to the kitchen display line. Track live preparation updates on your phone until staff brings your food fresh to your seat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER & RESTAURANT LOCATION / HOURS
          ========================================================================= */}
      <footer id="contact" className="border-t border-[#2d3a3d] bg-[#1a2528] pt-12 pb-8 sm:pt-14 sm:pb-10 px-4 sm:px-6 lg:px-8 text-xs text-stone-400 mt-auto">
        <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-8 border-b border-[#2d3a3d]/70">
            {/* Col 1: Brand Identity */}
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

            {/* Col 2: Updated Address, Phone & Hours (Requested by user) */}
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

            {/* Col 3: Direct Dining Links */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Quick Navigation
              </h4>
              <div className="flex flex-col space-y-2 text-xs text-stone-300">
                <button
                  onClick={() => setIsTableQrScanOpen(true)}
                  className="hover:text-white transition-colors cursor-pointer text-left flex items-center space-x-1.5"
                >
                  <Utensils className="w-3.5 h-3.5 text-[#9d785e]" />
                  <span>Digital Table Menu</span>
                </button>
                <a href="#about" className="hover:text-white transition-colors">
                  Concept &amp; Philosophy
                </a>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How QR Ordering Works
                </a>
                <button
                  onClick={() => navigate('/privacy')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
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

      {/* QR Code Table Scanner & Quick Table Selector Modal */}
      <TableQrScanModal
        isOpen={isTableQrScanOpen}
        onClose={() => setIsTableQrScanOpen(false)}
        defaultTableId="1"
      />
    </div>
  );
};

export default LandingPage;
