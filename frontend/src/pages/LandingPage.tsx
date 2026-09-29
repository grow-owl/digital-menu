import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Coffee, Utensils, ChefHat, Layers, Receipt, ShieldCheck,
  QrCode, Clock, MapPin, Phone, ArrowRight, CheckCircle2,
  Sparkles, ExternalLink, Menu as MenuIcon, X, ChevronRight,
  Wifi, Check, AlertCircle, ShoppingBag, Star, Flame, Calendar
} from 'lucide-react';
import { TableQrScanModal } from '../components/customer/TableQrScanModal';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isTableQrScanOpen, setIsTableQrScanOpen] = useState(false);

  const systemPortals = [
    {
      title: "Customer Table Menu",
      role: "Diners and Guests",
      route: "/menu",
      icon: Utensils,
      description: "Contactless QR ordering right from your seat. Browse handcrafted teas, snacks, and meals with dietary tags and track kitchen preparation live.",
      badge: "Public Access",
      badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
      cta: "Scan & Open Menu",
      actionBg: "bg-[#9d785e] hover:bg-[#86644d] text-white"
    },
    {
      title: "Waiter Floor Station",
      role: "Floor Service Staff",
      route: "/waiter",
      icon: Layers,
      description: "Manage table occupancy across dining zones, respond to guest assistance calls, record manual table orders, and monitor ready-for-pickup notifications.",
      badge: "Staff Role",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
      cta: "Floor Station",
      actionBg: "bg-[#223134] hover:bg-[#1a2528] text-white"
    },
    {
      title: "Kitchen Display (KDS)",
      role: "Kitchen Line and Chefs",
      route: "/kitchen",
      icon: ChefHat,
      description: "Live order preparation tickets with station routing, preparation timers, modifier notes, and stage toggles for coordinated kitchen pacing.",
      badge: "Kitchen Staff",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
      cta: "Open KDS",
      actionBg: "bg-[#223134] hover:bg-[#1a2528] text-white"
    },
    {
      title: "Admin Management",
      role: "Manager and Owner",
      route: "/admin",
      icon: ShieldCheck,
      description: "Complete menu catalog management, stock availability toggles, price updates, printable table QR stand generator, and daily shift records.",
      badge: "Management",
      badgeColor: "bg-stone-100 text-stone-700 border-stone-300",
      cta: "Admin Console",
      actionBg: "bg-[#223134] hover:bg-[#1a2528] text-white"
    }
  ];

  const signatureItems = [
    {
      name: "Handcrafted Masala Chai",
      category: "Artisan Teas",
      description: "Assam golden-tip tea simmered with fresh crushed ginger, green cardamom, cloves, and whole milk.",
      price: "₹45",
      isVeg: true,
      prepTime: "5 mins",
      imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80"
    },
    {
      name: "Steamed Darjeeling Momos",
      category: "Appetisers",
      description: "Handmade flour parcels filled with seasoned chicken, fresh scallions, and served with spicy sesame chutney.",
      price: "₹140",
      isVeg: false,
      prepTime: "12 mins",
      imageUrl: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80"
    },
    {
      name: "Smoky Paneer Tikka Burger",
      category: "Burgers & Sandwiches",
      description: "Charcoal-grilled spiced paneer slab, mint mayo, crisp lettuce, and caramelized onions on toasted brioche.",
      price: "₹165",
      isVeg: true,
      prepTime: "10 mins",
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80"
    },
    {
      name: "Classic Wai Wai Sadheko",
      category: "Quick Bites",
      description: "Crispy roasted Wai Wai noodles tossed with fresh tomatoes, red onions, green chillies, mustard oil, and fresh coriander.",
      price: "₹85",
      isVeg: true,
      prepTime: "7 mins",
      imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80"
    },
    {
      name: "Iced Strawberry Matcha Latte",
      category: "Cold Brews",
      description: "House strawberry compote, chilled milk, and stone-ground Japanese Uji matcha whisked fresh to order.",
      price: "₹190",
      isVeg: true,
      prepTime: "6 mins",
      imageUrl: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80"
    },
    {
      name: "Artisanal Cold Brew Coffee",
      category: "Specialty Coffee",
      description: "Single-origin Arabica steeped cold for 18 hours, served over clear ice blocks with optional vanilla cream.",
      price: "₹150",
      isVeg: true,
      prepTime: "4 mins",
      imageUrl: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80"
    }
  ];

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
              <a href="#home" className="text-[#9d785e] hover:text-[#86644d] transition-colors border-b-2 border-[#9d785e] pb-1 whitespace-nowrap">
                Home
              </a>
              <a href="#about" className="hover:text-[#9d785e] transition-colors whitespace-nowrap">
                Concept
              </a>
              <a href="#specialties" className="hover:text-[#9d785e] transition-colors whitespace-nowrap">
                Our Menu
              </a>
              <a href="#how-it-works" className="hover:text-[#9d785e] transition-colors whitespace-nowrap">
                How It Works
              </a>
              <a href="#portals" className="hover:text-[#9d785e] transition-colors whitespace-nowrap">
                Portals
              </a>
              <a href="#location" className="hover:text-[#9d785e] transition-colors whitespace-nowrap">
                Contact
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
                <a
                  href="#specialties"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded hover:bg-[#f5f2ef]"
                >
                  Our Menu
                </a>
                <a
                  href="#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded hover:bg-[#f5f2ef]"
                >
                  How QR Ordering Works
                </a>
                <a
                  href="#location"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded hover:bg-[#f5f2ef]"
                >
                  Location &amp; Contact
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
                    3. Served
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
                Add food, request extra water, or view your itemized bill without having to flag down staff during crowded rush hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SIGNATURE MENU SPECIALTIES
          ========================================================================= */}
      <section id="specialties" className="py-12 sm:py-24 px-3 sm:px-6 lg:px-8 bg-plaster border-b border-[#e3ddd4]">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="font-script text-3xl sm:text-4xl text-[#9d785e] block">
                From Our Kitchen
              </span>
              <h2 className="text-2xl sm:text-4xl font-serif-display font-bold text-[#223134] tracking-tight">
                Signature House Specialties
              </h2>
              <p className="text-xs sm:text-sm text-[#5f6c6e] max-w-xl leading-relaxed">
                Handcrafted fresh to order. Explore our complete artisan catalog spanning handcrafted teas, momos, burgers, and comfort food.
              </p>
            </div>

            <button
              onClick={() => setIsTableQrScanOpen(true)}
              className="inline-flex items-center space-x-2 text-xs font-bold tracking-wider uppercase text-[#9d785e] hover:text-[#86644d] transition-colors shrink-0 cursor-pointer"
            >
              <span>View complete artisan menu</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {signatureItems.map((dish, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-[#e3ddd4] overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all"
              >
                <div className="h-48 w-full overflow-hidden bg-stone-100 relative">
                  <img
                    src={dish.imageUrl}
                    alt={dish.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-white/95 text-[#9d785e] border border-[#e3ddd4] uppercase tracking-wider shadow-xs">
                      {dish.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        dish.isVeg
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {dish.isVeg ? 'Veg' : 'Non-Veg'}
                    </span>
                  </div>

                  <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded text-[10px] font-mono font-medium text-stone-700 bg-white/90 backdrop-blur-xs shadow-xs">
                    {dish.prepTime}
                  </span>
                </div>

                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold font-serif-display text-base text-[#223134] leading-tight">
                        {dish.name}
                      </h3>
                      <span className="font-mono font-bold text-[#9d785e] text-base shrink-0">
                        {dish.price}
                      </span>
                    </div>
                    <p className="text-xs text-[#5f6c6e] leading-relaxed font-normal">
                      {dish.description}
                    </p>
                  </div>

                  <button
                    onClick={() => setIsTableQrScanOpen(true)}
                    className="w-full py-2.5 bg-[#9d785e] hover:bg-[#86644d] text-white text-xs font-semibold tracking-wider uppercase rounded transition-colors cursor-pointer text-center flex items-center justify-center space-x-1.5"
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    <span>Order from Table</span>
                  </button>
                </div>
              </div>
            ))}
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
          5 DEDICATED SYSTEM PORTALS
          ========================================================================= */}
      <section id="portals" className="py-12 sm:py-24 px-3 sm:px-6 lg:px-8 bg-plaster border-b border-[#e3ddd4]">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-10">
          <div className="space-y-2 text-left">
            <span className="font-script text-2xl xs:text-3xl sm:text-4xl text-[#9d785e] block">
              Unified Platform
            </span>
            <h2 className="text-xl xs:text-2xl sm:text-4xl font-serif-display font-bold text-[#223134] tracking-tight">
              Dedicated Portals for Diners and Restaurant Staff
            </h2>
            <p className="text-xs sm:text-sm text-[#5f6c6e] max-w-2xl leading-relaxed">
              Every dining touchpoint is coordinated seamlessly: guests order from tables, floor captains supervise zones, chefs pace kitchen tickets, and managers coordinate table billing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {systemPortals.map((portal, idx) => {
              const Icon = portal.icon;
              return (
                <div
                  key={idx}
                  className="p-5 sm:p-6 rounded-xl sm:rounded-2xl bg-white border border-[#e3ddd4] hover:shadow-md flex flex-col justify-between space-y-4 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-lg bg-[#9d785e]/10 border border-[#9d785e]/20 flex items-center justify-center text-[#9d785e]">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded border uppercase tracking-wider ${portal.badgeColor}`}>
                        {portal.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold font-serif-display text-base text-[#223134]">
                        {portal.title}
                      </h3>
                      <p className="text-[11px] font-mono text-[#5f6c6e] uppercase tracking-wide mt-0.5">
                        User: {portal.role}
                      </p>
                    </div>

                    <p className="text-xs text-[#5f6c6e] leading-relaxed">
                      {portal.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#e3ddd4]">
                    <button
                      onClick={() => {
                        if (portal.route === '/menu') {
                          setIsTableQrScanOpen(true);
                        } else {
                          navigate(portal.route);
                        }
                      }}
                      className={`w-full py-2.5 px-3 rounded text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center space-x-2 cursor-pointer ${portal.actionBg}`}
                    >
                      <span>{portal.cta}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          LOCATION, HOURS & CONTACT
          ========================================================================= */}
      <section id="location" className="py-12 sm:py-24 px-3 sm:px-6 lg:px-8 bg-white border-b border-[#e3ddd4]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Location info */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-left">
            <span className="font-script text-2xl xs:text-3xl sm:text-4xl text-[#9d785e] block">
              Visit Us in Siliguri
            </span>

            <h2 className="text-xl xs:text-2xl sm:text-4xl font-serif-display font-bold text-[#223134] tracking-tight">
              Café Location and Service Hours
            </h2>

            <p className="text-xs sm:text-sm text-[#5f6c6e] leading-relaxed max-w-xl">
              Join us for authentic tea brews, conversation, and freshly prepared food in Siliguri. Whether dining in or taking away, we welcome you every day of the week.
            </p>

            <div className="space-y-3 pt-2 text-xs sm:text-sm text-[#223134]">
              <div className="flex items-start space-x-3.5 p-3.5 sm:p-4 rounded-xl bg-plaster-subtle border border-[#e3ddd4]">
                <MapPin className="w-4 h-4 text-[#9d785e] mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold block">Physical Address</span>
                  <span className="text-[#5f6c6e]">Sevoke Road, Siliguri, West Bengal 734001, India</span>
                </div>
              </div>

              <div className="flex items-start space-x-3.5 p-3.5 sm:p-4 rounded-xl bg-plaster-subtle border border-[#e3ddd4]">
                <Clock className="w-4 h-4 text-[#9d785e] mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold block">Operating Hours</span>
                  <span className="text-[#5f6c6e]">Open 7 Days a Week: 10:00 AM to 11:00 PM</span>
                  <span className="block text-[11px] text-[#9d785e] mt-0.5 font-medium">Kitchen orders accepted until 10:30 PM</span>
                </div>
              </div>

              <div className="flex items-start space-x-3.5 p-3.5 sm:p-4 rounded-xl bg-plaster-subtle border border-[#e3ddd4]">
                <Phone className="w-4 h-4 text-[#9d785e] mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold block">Direct Telephone</span>
                  <a
                    href="tel:+919382776017"
                    className="text-[#9d785e] hover:text-[#86644d] font-mono font-medium transition-colors"
                  >
                    +91 93827 76017
                  </a>
                </div>
              </div>
            </div>

            {/* Amenities Strip */}
            <div className="pt-2 flex flex-wrap gap-2 text-xs text-[#5f6c6e]">
              <span className="px-3 py-1 rounded bg-[#f5f2ef] border border-[#e3ddd4]">Air Conditioned</span>
              <span className="px-3 py-1 rounded bg-[#f5f2ef] border border-[#e3ddd4]">High-Speed Wi-Fi</span>
              <span className="px-3 py-1 rounded bg-[#f5f2ef] border border-[#e3ddd4]">Contactless Table QR</span>
              <span className="px-3 py-1 rounded bg-[#f5f2ef] border border-[#e3ddd4]">Pure Veg &amp; Non-Veg Stations</span>
            </div>
          </div>

          {/* Quick Direct Actions Box */}
          <div className="lg:col-span-5 bg-plaster-subtle border border-[#c9c1b5] rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-7 space-y-4 shadow-sm w-full">
            <h3 className="font-bold font-serif-display text-base text-[#223134] flex items-center space-x-2">
              <Utensils className="w-4 h-4 text-[#9d785e]" />
              <span>Direct Dining Links</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <button
                onClick={() => setIsTableQrScanOpen(true)}
                className="w-full p-3 rounded-lg bg-white hover:bg-stone-50 text-left text-[#223134] border border-[#e3ddd4] transition-colors flex items-center justify-between cursor-pointer"
              >
                <div>
                  <span className="font-bold text-[#223134] block">Digital Table Menu</span>
                  <span className="text-[11px] text-[#5f6c6e]">Browse dishes, prices, and dietary tags</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#9d785e] shrink-0" />
              </button>



              <button
                onClick={() => navigate('/privacy')}
                className="w-full p-3 rounded-lg bg-white hover:bg-stone-50 text-left text-[#223134] border border-[#e3ddd4] transition-colors flex items-center justify-between cursor-pointer"
              >
                <div>
                  <span className="font-bold text-[#223134] block">Privacy Policy</span>
                  <span className="text-[11px] text-[#5f6c6e]">Data practices for diners and sessions</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#9d785e] shrink-0" />
              </button>

              <button
                onClick={() => navigate('/terms')}
                className="w-full p-3 rounded-lg bg-white hover:bg-stone-50 text-left text-[#223134] border border-[#e3ddd4] transition-colors flex items-center justify-between cursor-pointer"
              >
                <div>
                  <span className="font-bold text-[#223134] block">Terms of Service</span>
                  <span className="text-[11px] text-[#5f6c6e]">Ordering and service policies</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#9d785e] shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER
          ========================================================================= */}
      <footer className="border-t border-[#2d3a3d] bg-[#1a2528] py-10 sm:py-12 px-3 sm:px-6 lg:px-8 text-xs text-stone-400 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#9d785e] shadow-sm flex items-center justify-center text-white">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-serif-display font-bold text-white tracking-wider block text-sm">
                Siliguri's Chai Addaa
              </span>
              <span className="text-[10px] text-stone-400 font-mono tracking-wider uppercase">
                Artisan Tea House &amp; Digital Dining
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-stone-300">
            <a href="#about" className="hover:text-white transition-colors">Concept</a>
            <a href="#specialties" className="hover:text-white transition-colors">Specialties</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <button onClick={() => setIsTableQrScanOpen(true)} className="hover:text-white transition-colors cursor-pointer">Menu</button>
            <button onClick={() => navigate('/privacy')} className="hover:text-white transition-colors cursor-pointer">Privacy</button>
            <button onClick={() => navigate('/terms')} className="hover:text-white transition-colors cursor-pointer">Terms</button>
          </div>

          <p className="text-stone-400 font-mono text-[11px] text-center md:text-right">
            &copy; {new Date().getFullYear()} Siliguri's Chai Addaa. All rights reserved.
          </p>
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
