import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Coffee,
  ArrowLeft,
  Home,
  UtensilsCrossed,
  ShieldCheck,
  Compass,
  Sparkles,
  QrCode
} from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-amber-500/30">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-amber-600/15 via-emerald-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-black/50">
            <Coffee className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="font-serif text-base sm:text-lg font-bold text-white tracking-wide">
              Siliguri's Chai Addaa
            </h1>
            <p className="text-[10px] text-emerald-400 font-mono tracking-wider uppercase font-semibold">
              Digital Experience
            </p>
          </div>
        </Link>

        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          className="px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/80 text-xs text-slate-300 hover:text-white hover:border-slate-500 transition-all flex items-center space-x-1.5 cursor-pointer backdrop-blur-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Go Back</span>
        </button>
      </header>

      {/* Main 404 Hero Container */}
      <main className="relative z-10 w-full max-w-3xl mx-auto px-6 py-12 flex flex-col items-center text-center my-auto">
        {/* Crest Pill */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full mb-6">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="font-serif tracking-widest text-[11px] text-amber-300 font-bold uppercase">
            Error 404 • Destination Not Found
          </span>
        </div>

        {/* Big stylized 404 with tea kettle center */}
        <div className="relative mb-6 select-none">
          <div className="text-[110px] sm:text-[150px] font-serif font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-b from-slate-200 via-slate-400 to-slate-700/40 opacity-90 drop-shadow-2xl">
            404
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#0D121F]/90 border border-amber-500/40 shadow-2xl shadow-amber-500/20 backdrop-blur-xl flex items-center justify-center animate-bounce-slow">
              <Coffee className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 drop-shadow" />
            </div>
          </div>
        </div>

        {/* Text descriptions */}
        <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-wide max-w-xl mb-4">
          This Table Isn't on the Menu
        </h2>
        <p className="text-sm sm:text-base text-slate-400 max-w-lg leading-relaxed mb-8">
          The page or table route you requested does not exist or may have been moved. Don't worry — fresh kulhad chai is always hot and waiting for you!
        </p>

        {/* Quick Navigation Cards */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-xl mb-8">
          <Link
            to="/"
            className="p-4 rounded-2xl bg-[#0D121F]/90 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition-all flex flex-col items-center text-center space-y-2 group shadow-lg"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Home className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-slate-200 group-hover:text-emerald-300">
              Restaurant Home
            </span>
            <span className="text-[11px] text-slate-500 leading-tight">
              Return to main arrival page
            </span>
          </Link>

          <Link
            to="/menu"
            className="p-4 rounded-2xl bg-[#0D121F]/90 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 transition-all flex flex-col items-center text-center space-y-2 group shadow-lg"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-slate-200 group-hover:text-amber-300">
              Digital Menu
            </span>
            <span className="text-[11px] text-slate-500 leading-tight">
              Explore culinary specialties
            </span>
          </Link>

          <Link
            to="/staff-access"
            className="p-4 rounded-2xl bg-[#0D121F]/90 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-900 transition-all flex flex-col items-center text-center space-y-2 group shadow-lg"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-slate-200 group-hover:text-sky-300">
              Staff Portal
            </span>
            <span className="text-[11px] text-slate-500 leading-tight">
              POS, KDS &amp; Management
            </span>
          </Link>
        </div>

        {/* QR Scanner Tip Note */}
        <div className="inline-flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/60 border border-slate-800/80 px-4 py-2 rounded-xl">
          <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Looking for your table session? Simply scan the permanent QR stand placed right on your table.
          </span>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-6 text-xs text-slate-600 border-t border-slate-900">
        Siliguri's Chai Addaa • Good Food, Better Chai, Happier People • Est. 2021
      </footer>
    </div>
  );
};

export default NotFoundPage;
