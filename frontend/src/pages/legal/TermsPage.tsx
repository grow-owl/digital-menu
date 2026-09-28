import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft, Coffee, AlertCircle, Clock, CheckCircle, MapPin, Phone, Utensils } from 'lucide-react';

export const TermsPage: React.FC = () => {
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
            <FileText className="w-3.5 h-3.5" />
            <span>Dining and Service Terms</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Terms &amp; Conditions
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Effective Date: September 2026. Governing dine-in table ordering, billing, and services at Siliguri's Chai Addaa.
          </p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-slate-300">
          <section className="bg-[#131826] border border-slate-800 rounded-xl p-5 sm:p-6 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>1. Table Ordering and Order Confirmation</span>
            </h2>
            <p>
              By scanning a table QR code and confirming an order via our digital dining platform, you authorize the kitchen to begin immediate preparation of your selected food and beverage items.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li>Orders sent to the kitchen are queued immediately to maintain preparation quality and freshness.</li>
              <li>Please inform our floor staff promptly if you have severe food allergies or specific dietary restrictions before placing your order.</li>
              <li>Prices listed on the digital menu reflect the active dine-in tariff inclusive of all applicable statutory taxes (CGST and SGST).</li>
            </ul>
          </section>

          <section className="bg-[#131826] border border-slate-800 rounded-xl p-5 sm:p-6 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>2. Preparation Times and Modifications</span>
            </h2>
            <p>
              Estimated preparation times are indicative and may vary during peak dining hours. Because all dishes are freshly prepared to order:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li>Order cancellations must be requested before kitchen preparation begins. Once preparation is marked in progress by our chef, orders cannot be cancelled.</li>
              <li>In the rare event that an ingredient is unavailable after an order is placed, staff will notify you immediately and suggest a substitute or issue an instant credit or refund.</li>
            </ul>
          </section>

          <section className="bg-[#131826] border border-slate-800 rounded-xl p-5 sm:p-6 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>3. Billing and Payment Settlement</span>
            </h2>
            <p>
              Payment may be settled at the table or at the cashier counter using UPI, debit/credit cards, or cash. Itemized digital receipts and printed tax invoices are provided upon settlement.
            </p>
          </section>

          <section className="bg-[#131826] border border-slate-800 rounded-xl p-5 sm:p-6 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <Utensils className="w-4 h-4 text-amber-400 shrink-0" />
              <span>4. Café Atmosphere and Hospitality</span>
            </h2>
            <p>
              We strive to create a warm, welcoming community space for all visitors. We reserve the right to refuse service to individuals exhibiting disrespectful or disruptive behavior toward staff or fellow guests.
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

export default TermsPage;
