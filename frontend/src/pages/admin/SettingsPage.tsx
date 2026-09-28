import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Building2, Sliders, ShieldCheck, Receipt, Bell, CheckCircle2, Save, Globe, Wifi, QrCode, ArrowRight } from 'lucide-react';
import { getVenueConfig, saveVenueConfig } from '../../utils/venueConfig';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'OPERATIONS' | 'RECEIPTS' | 'SECURITY'>('GENERAL');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form State initialized with persisted venue configuration
  const venueCfg = getVenueConfig();
  const [restaurantName, setRestaurantName] = useState(venueCfg.brandName || "Siliguri's Chai Addaa");
  const [domainUrl, setDomainUrl] = useState(venueCfg.baseUrl || (typeof window !== 'undefined' ? window.location.origin : ''));
  const [wifiSsid, setWifiSsid] = useState(venueCfg.wifiSsid || 'AURA-Guest-5G');
  const [wifiPassword, setWifiPassword] = useState(venueCfg.wifiPassword || 'AuraDining2026');
  const [taxRate, setTaxRate] = useState(() => localStorage.getItem('aura_tax_rate') || '8.25');
  const [serviceCharge, setServiceCharge] = useState(() => localStorage.getItem('aura_service_charge') || '10.0');
  const [currencySymbol, setCurrencySymbol] = useState(() => localStorage.getItem('aura_currency') || '£');
  const [receiptFooter, setReceiptFooter] = useState(() => localStorage.getItem('aura_receipt_footer') || 'Thank you for dining at AURA. Atmospheric Perfection.');

  const handleSave = () => {
    saveVenueConfig({
      brandName: restaurantName,
      baseUrl: domainUrl,
      wifiSsid,
      wifiPassword,
    });
    localStorage.setItem('aura_tax_rate', taxRate);
    localStorage.setItem('aura_service_charge', serviceCharge);
    localStorage.setItem('aura_currency', currencySymbol);
    localStorage.setItem('aura_receipt_footer', receiptFooter);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="h-full overflow-y-auto p-3 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 pb-24 font-sans text-aura-ivory">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-aura-border pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#38BDF8]/10 border border-[#38BDF8]/30 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-[#38BDF8]" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold tracking-wide text-white">SAAS PLATFORM SETTINGS</h1>
            <p className="text-xs text-aura-slate">Configure Restaurant Branding, Host URL, Taxes, Thermal Receipts & Security</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/admin/qr-generator')}
            className="px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 font-bold text-xs rounded-xl flex items-center space-x-2 transition-all cursor-pointer shadow-sm"
          >
            <QrCode className="w-4 h-4" />
            <span>Open QR Studio</span>
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-[#0EA5E9] hover:bg-[#0284C7] text-[#090A0F] font-black text-xs rounded-xl shadow-lg shadow-[#0EA5E9]/20 flex items-center space-x-2 transition-all border border-[#7DD3FC]/50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Settings successfully updated and persisted across restaurant platform!</span>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex space-x-2 sm:space-x-3 border-b border-aura-border pb-3 text-xs overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('GENERAL')}
          className={`px-3 sm:px-4 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'GENERAL' ? 'bg-[#0EA5E9] text-[#090A0F] font-black shadow-md' : 'text-aura-slate hover:text-white'
          }`}
        >
          General & Branding
        </button>
        <button
          onClick={() => setActiveTab('OPERATIONS')}
          className={`px-3 sm:px-4 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'OPERATIONS' ? 'bg-[#0EA5E9] text-[#090A0F] font-black shadow-md' : 'text-aura-slate hover:text-white'
          }`}
        >
          Taxes & Operations
        </button>
        <button
          onClick={() => setActiveTab('RECEIPTS')}
          className={`px-3 sm:px-4 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'RECEIPTS' ? 'bg-[#0EA5E9] text-[#090A0F] font-black shadow-md' : 'text-aura-slate hover:text-white'
          }`}
        >
          Thermal Receipts
        </button>
        <button
          onClick={() => setActiveTab('SECURITY')}
          className={`px-3 sm:px-4 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'SECURITY' ? 'bg-[#0EA5E9] text-[#090A0F] font-black shadow-md' : 'text-aura-slate hover:text-white'
          }`}
        >
          Security & Audit
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-aura-container/80 backdrop-blur-xl border border-[#38BDF8]/20 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-6 max-w-3xl">
        {activeTab === 'GENERAL' && (
          <div className="space-y-4">
            <h3 className="font-serif text-base font-bold text-white">Restaurant Profile & Branding</h3>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-aura-slate">Restaurant Name</label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#090A0F] border border-aura-border rounded-xl text-xs text-aura-ivory focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-aura-slate flex items-center justify-between">
                <span>Base Dining URL / Table Domain</span>
                <span className="text-[10px] text-aura-slate font-normal">Used when generating Table QR Codes & Acrylic Stands</span>
              </label>
              <input
                type="text"
                value={domainUrl}
                onChange={(e) => setDomainUrl(e.target.value)}
                placeholder="e.g. http://localhost:5173 or https://aura-restaurant.com"
                className="w-full px-4 py-2.5 bg-[#090A0F] border border-aura-border rounded-xl text-xs text-aura-ivory focus:outline-none focus:border-[#38BDF8] font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-aura-slate">Currency Symbol</label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#090A0F] border border-aura-border rounded-xl text-xs text-aura-ivory focus:outline-none focus:border-[#38BDF8]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-aura-slate">Timezone</label>
                <input
                  type="text"
                  defaultValue="Europe/London (GMT)"
                  className="w-full px-4 py-2.5 bg-[#090A0F] border border-aura-border rounded-xl text-xs text-aura-ivory focus:outline-none focus:border-[#38BDF8]"
                />
              </div>
            </div>

            <div className="border-t border-aura-border/40 pt-4 mt-2">
              <h4 className="text-xs font-bold text-aura-slate uppercase tracking-wider mb-3">Guest Wi-Fi for Stand Cards</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-aura-slate">Network SSID</label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#090A0F] border border-aura-border rounded-xl text-xs text-aura-ivory focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-aura-slate">Wi-Fi Password</label>
                  <input
                    type="text"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#090A0F] border border-aura-border rounded-xl text-xs text-aura-ivory focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'OPERATIONS' && (
          <div className="space-y-4">
            <h3 className="font-serif text-base font-bold text-white">Taxes, Gratuity & Service Rules</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-aura-slate">Tax Rate (%)</label>
                <input
                  type="text"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#090A0F] border border-aura-border rounded-xl text-xs text-aura-ivory focus:outline-none focus:border-[#38BDF8]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-aura-slate">Service Charge (%)</label>
                <input
                  type="text"
                  value={serviceCharge}
                  onChange={(e) => setServiceCharge(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#090A0F] border border-aura-border rounded-xl text-xs text-aura-ivory focus:outline-none focus:border-[#38BDF8]"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'RECEIPTS' && (
          <div className="space-y-4">
            <h3 className="font-serif text-base font-bold text-white">Thermal Printer Receipt Customizer</h3>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-aura-slate">Receipt Footer Slogan</label>
              <textarea
                rows={3}
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#090A0F] border border-aura-border rounded-xl text-xs text-aura-ivory focus:outline-none focus:border-[#38BDF8] font-mono"
              />
            </div>
          </div>
        )}

        {activeTab === 'SECURITY' && (
          <div className="space-y-4">
            <h3 className="font-serif text-base font-bold text-aura-ivory">Security Policies & Audit Logs</h3>
            <div className="p-4 rounded-xl bg-aura-obsidian border border-aura-border space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-aura-ivory">Cryptographic HMAC Table Token Enforcement</span>
                <span className="text-emerald-400 font-bold">Active & Enforced</span>
              </div>
              <p className="text-[10px] text-aura-slate">Guards POST /api/v1/orders against spoofing.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
