import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Coffee, Lock, Eye, FileText, CheckCircle2, Phone, MapPin } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0D111A] text-slate-100 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0D111A]/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </button>

        <div 
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 cursor-pointer"
        >
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Coffee className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-wide text-white">Siliguri's Chai Addaa</span>
        </div>

        <button
          onClick={() => navigate('/menu')}
          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
        >
          View Menu
        </button>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-14">
        <div className="space-y-3 mb-8">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Customer Privacy Commitment</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Last Updated: September 2026. Applicable to dining guests, QR ordering sessions, and staff accounts at Siliguri's Chai Addaa.
          </p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-slate-300">
          <section className="bg-[#131826] border border-slate-800 rounded-xl p-5 sm:p-6 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <Eye className="w-4 h-4 text-amber-400 shrink-0" />
              <span>1. Information We Collect</span>
            </h2>
            <p>
              When dining with us or using our table QR ordering system, we collect minimal data required to prepare and serve your meal accurately:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li><strong>Table Session Data:</strong> Your designated dining table identifier to route food orders to the kitchen display.</li>
              <li><strong>Order Items and Notes:</strong> Dishes chosen, customization requests, and preparation preferences.</li>
              <li><strong>Contact Information (Optional):</strong> Mobile number provided for digital bill receipts and SMS alerts.</li>
              <li><strong>Payment Records:</strong> Transaction reference IDs and payment status (UPI, debit/credit cards, cash). We do not store raw card numbers or banking passwords.</li>
            </ul>
          </section>

          <section className="bg-[#131826] border border-slate-800 rounded-xl p-5 sm:p-6 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <FileText className="w-4 h-4 text-amber-400 shrink-0" />
              <span>2. How We Use Your Information</span>
            </h2>
            <p>The information gathered is strictly used for dining operations:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li>Directing your tickets to the kitchen prep line and dispatching food to the right table.</li>
              <li>Generating itemized tax invoices and processing bill settlements.</li>
              <li>Addressing customer service queries or food safety concerns.</li>
            </ul>
          </section>

          <section className="bg-[#131826] border border-slate-800 rounded-xl p-5 sm:p-6 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>3. Data Protection and Security</span>
            </h2>
            <p>
              We apply standard technical safeguards, including encrypted connections (HTTPS), secure database access controls, and hashed authentication tokens. We do not sell, rent, or trade guest personal information to third-party advertisers.
            </p>
          </section>

          <section className="bg-[#131826] border border-slate-800 rounded-xl p-5 sm:p-6 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>4. Your Rights and Contact</span>
            </h2>
            <p>
              You may request a copy of your dining history or ask to remove your contact details from our rewards ledger at any time by speaking with restaurant management or contacting us at:
            </p>
            <div className="pt-2 text-xs space-y-1 text-slate-300">
              <p className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Sevoke Road, Siliguri, West Bengal 734001, India</span>
              </p>
              <p className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <a href="tel:+919382776017" className="text-amber-400 hover:underline">
                  +91 93827 76017
                </a>
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#0A0D14] py-6 px-4 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} Siliguri's Chai Addaa. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default PrivacyPolicyPage;
