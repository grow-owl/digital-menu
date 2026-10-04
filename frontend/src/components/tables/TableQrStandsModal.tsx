import React, { useState, useEffect, useMemo } from 'react';
import { TableResponse } from '../../types/order.types';
import { tableService } from '../../services/table.service';
import { useToast } from '../feedback/ToastContainer';
import {
  VenueQrConfig,
  getVenueConfig,
  saveVenueConfig,
  computeTableDineUrl,
  DEFAULT_VENUE_CONFIG,
} from '../../utils/venueConfig';
import {
  generateQrDataUrl,
  downloadStandCard,
  downloadQrOnly,
  batchDownloadAllStands,
} from '../../utils/standCardGenerator';
import {
  QrCode,
  X,
  Copy,
  ExternalLink,
  Printer,
  RotateCcw,
  ShieldCheck,
  Coffee,
  Search,
  Check,
  Download,
  Settings,
  Globe,
  Wifi,
  ChevronDown,
  ChevronUp,
  Palette,
  Layers,
  Smartphone,
  Save,
  RefreshCw,
  Eye,
  CheckCircle2,
} from 'lucide-react';

interface TableQrStandsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: TableResponse[];
  onRefreshTables?: () => void;
}

export const TableQrStandsModal: React.FC<TableQrStandsModalProps> = ({
  isOpen,
  onClose,
  tables,
  onRefreshTables,
}) => {
  const { showToast } = useToast();

  // Configuration State
  const [config, setConfig] = useState<VenueQrConfig>(getVenueConfig());
  const [draftConfig, setDraftConfig] = useState<VenueQrConfig>(getVenueConfig());
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Filters & Interactivity
  const [searchTable, setSearchTable] = useState('');
  const [copiedTable, setCopiedTable] = useState<string | number | null>(null);
  const [rotatingTable, setRotatingTable] = useState<string | number | null>(null);

  // Download & Print States
  const [downloadingTable, setDownloadingTable] = useState<string | number | null>(null);
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [printingTableNumber, setPrintingTableNumber] = useState<number | string | 'ALL' | null>(null);

  // Cache of locally generated QR code data URLs (tableNumber -> dataUrl)
  const [qrCache, setQrCache] = useState<{ [key: string]: string }>({});

  // Sync config when modal opens
  useEffect(() => {
    if (isOpen) {
      const active = getVenueConfig();
      setConfig(active);
      setDraftConfig(active);
    }
  }, [isOpen]);

  // Re-generate local client-side QR codes whenever tables or config changes
  useEffect(() => {
    if (!isOpen || tables.length === 0) return;

    let isMounted = true;
    const generateAllQrs = async () => {
      const newCache: { [key: string]: string } = {};
      for (const table of tables) {
        const token = table.qrCodeToken || (table as any).qrToken || 'demo-token';
        const url = computeTableDineUrl(token, config);
        try {
          const dataUrl = await generateQrDataUrl(url, { size: 400 });
          newCache[String(table.tableNumber)] = dataUrl;
        } catch (e) {
          console.error(`Failed to generate QR for Table ${table.tableNumber}:`, e);
        }
      }
      if (isMounted) {
        setQrCache(newCache);
      }
    };

    generateAllQrs();
    return () => {
      isMounted = false;
    };
  }, [isOpen, tables, config.baseUrl, config.urlFormat]);

  // Filtered Tables
  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      return !searchTable.trim() || String(t.tableNumber).includes(searchTable.trim());
    });
  }, [tables, searchTable]);

  if (!isOpen) return null;

  // Actions
  const handleSaveConfig = () => {
    const saved = saveVenueConfig(draftConfig);
    setConfig(saved);
    setIsConfigOpen(false);
    showToast('Venue branding & customer domain updated successfully!', 'success');
  };

  const handleResetConfig = () => {
    const reset = saveVenueConfig(DEFAULT_VENUE_CONFIG);
    setConfig(reset);
    setDraftConfig(reset);
    showToast('Reset venue configuration to default settings.', 'info');
  };

  const handleUseCurrentOrigin = () => {
    setDraftConfig((prev) => ({
      ...prev,
      baseUrl: window.location.origin,
    }));
    showToast(`Set base URL to current origin: ${window.location.origin}`, 'info');
  };

  const handleCopyLink = (tableNum: string | number, token?: string) => {
    const url = computeTableDineUrl(token, config);
    navigator.clipboard.writeText(url);
    setCopiedTable(tableNum);
    showToast(`Table ${tableNum} customer dine URL copied to clipboard!`, 'success');
    setTimeout(() => setCopiedTable(null), 2000);
  };

  const handleRotateQr = async (table: TableResponse) => {
    const tId = table._id || table.tableNumber;
    setRotatingTable(tId);
    try {
      await tableService.rotateQrToken(tId);
      showToast(`Regenerated cryptographic token for Table ${table.tableNumber}!`, 'success');
      if (onRefreshTables) onRefreshTables();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to rotate QR token', 'error');
    } finally {
      setRotatingTable(null);
    }
  };

  const handleDownloadStand = async (table: TableResponse) => {
    setDownloadingTable(table.tableNumber);
    try {
      await downloadStandCard(table, config);
      showToast(`Table ${table.tableNumber} acrylic stand card downloaded (PNG)!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to generate stand image', 'error');
    } finally {
      setDownloadingTable(null);
    }
  };

  const handleDownloadQrOnly = async (table: TableResponse) => {
    setDownloadingTable(`qr_${table.tableNumber}`);
    try {
      await downloadQrOnly(table, config);
      showToast(`Table ${table.tableNumber} high-res QR code downloaded!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to generate QR code', 'error');
    } finally {
      setDownloadingTable(null);
    }
  };

  const handleBatchDownloadAll = async () => {
    if (filteredTables.length === 0) return;
    setIsBatchDownloading(true);
    setBatchProgress({ current: 0, total: filteredTables.length });

    try {
      await batchDownloadAllStands(filteredTables, config, (cur, total) => {
        setBatchProgress({ current: cur, total });
      });
      showToast(`Successfully downloaded all ${filteredTables.length} table stands!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Error during batch download', 'error');
    } finally {
      setIsBatchDownloading(false);
      setBatchProgress(null);
    }
  };

  const handlePrintAll = () => {
    setPrintingTableNumber('ALL');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintSingle = (tableNumber: number | string) => {
    setPrintingTableNumber(tableNumber);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Determine theme styles for the on-screen live stand card preview
  const getThemePreviewStyles = () => {
    if (config.themeStyle === 'ROYAL_NOIR') {
      return {
        cardBg: 'bg-gradient-to-b from-[#070A12] via-[#0B1120] to-[#070A12] text-slate-100',
        frameBorder: 'border-2 border-sky-400/60 shadow-[0_0_20px_rgba(56,189,248,0.15)]',
        innerBorder: 'border border-sky-400/30',
        accentText: 'text-sky-400',
        plaqueBg: 'bg-slate-900 border-sky-400/70 text-sky-200',
        buttonAction: 'hover:border-sky-400/50',
      };
    }
    if (config.themeStyle === 'MINIMAL_IVORY') {
      return {
        cardBg: 'bg-gradient-to-b from-[#FAF9F6] to-[#F4F4F0] text-zinc-900',
        frameBorder: 'border-2 border-zinc-800 shadow-lg',
        innerBorder: 'border border-zinc-400/40',
        accentText: 'text-emerald-700',
        plaqueBg: 'bg-zinc-900 border-zinc-700 text-white',
        buttonAction: 'hover:border-zinc-500',
      };
    }
    // EMERALD_GOLD (Default)
    return {
      cardBg: 'bg-gradient-to-b from-[#04150F] via-[#07241A] to-[#04150F] text-slate-100',
      frameBorder: 'border-2 border-amber-500/70 shadow-[0_0_25px_rgba(245,158,11,0.15)]',
      innerBorder: 'border border-amber-400/30',
      accentText: 'text-amber-400',
      plaqueBg: 'bg-[#092B1F] border-amber-400/80 text-amber-200',
      buttonAction: 'hover:border-amber-400/50',
    };
  };

  const themeStyle = getThemePreviewStyles();

  return (
    <>
      {/* ============================================================== */}
      {/* SCREEN MODAL DIALOG (Hidden in Print Mode)                     */}
      {/* ============================================================== */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto no-print">
        <div className="w-full max-w-6xl bg-[#090D16] border border-slate-800/90 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[96dvh] sm:max-h-[92vh] overflow-hidden my-auto text-slate-100 font-sans">
          
          {/* Header */}
          <div className="p-4 sm:p-5 md:p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-[#070A12]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-amber-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                <QrCode className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2 flex-wrap">
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-white tracking-wide">
                    Table QR Stands &amp; Venue Manager
                  </h3>
                  <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold rounded-full">
                    SaaS Ready • Multi-Tenant
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Generate luxury acrylic table tent stands, edit customer base domain, and download high-DPI printable cards.
                </p>
              </div>
            </div>

            {/* Top Global Action Buttons */}
            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              <button
                type="button"
                onClick={() => setIsConfigOpen(!isConfigOpen)}
                className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer border ${
                  isConfigOpen
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-black'
                    : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
                title="Edit Venue Branding and Customer Base Domain"
              >
                <Settings className={`w-3.5 h-3.5 ${isConfigOpen ? 'rotate-90 transition-transform' : ''}`} />
                <span>Venue &amp; Domain Setup</span>
                {isConfigOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={handlePrintAll}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer border border-slate-700"
                title="Print All Table Stands"
              >
                <Printer className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Print All Stands</span>
                <span className="sm:hidden">Print</span>
              </button>

              <button
                type="button"
                onClick={handleBatchDownloadAll}
                disabled={isBatchDownloading || filteredTables.length === 0}
                className="px-3 py-2 bg-[#0C831F] hover:bg-[#096918] text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer border border-emerald-400/50 shadow-md disabled:opacity-50"
                title="Download All Stand Cards as PNG"
              >
                {isBatchDownloading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>
                  {batchProgress
                    ? `Saving ${batchProgress.current}/${batchProgress.total}`
                    : 'Download All'}
                </span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* VENUE & DOMAIN CONFIGURATION DRAWER (Expandable)                */}
          {/* ============================================================== */}
          {isConfigOpen && (
            <div className="p-4 sm:p-6 bg-[#0B101C] border-b border-slate-800 space-y-4 animate-in slide-in-from-top-3 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-bold text-white tracking-wide">
                    Multi-Venue Branding &amp; QR Customer Domain Configuration
                  </h4>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <button
                    type="button"
                    onClick={handleResetConfig}
                    className="text-slate-400 hover:text-amber-400 underline cursor-pointer text-xs"
                  >
                    Reset Defaults
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Restaurant / Cafe Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Restaurant / Café Brand Name</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Prints on Stand Header</span>
                  </label>
                  <input
                    type="text"
                    value={draftConfig.brandName}
                    onChange={(e) => setDraftConfig({ ...draftConfig, brandName: e.target.value })}
                    placeholder="e.g. Siliguri's Chai Addaa"
                    className="w-full px-3.5 py-2.5 bg-[#070A12] border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 font-sans focus:outline-none focus:border-emerald-500 shadow-inner"
                  />
                  <p className="text-[10px] text-slate-500">Displayed at the top of physical acrylic stands.</p>
                </div>

                {/* 2. Customer Base Domain URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Customer Base Domain / URL</span>
                    <span className="text-[10px] text-amber-400 font-mono">Scanned by Phones</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={draftConfig.baseUrl}
                      onChange={(e) => setDraftConfig({ ...draftConfig, baseUrl: e.target.value })}
                      placeholder="e.g. https://myrestaurant.com or http://192.168.1.50:5173"
                      className="w-full pl-3.5 pr-20 py-2.5 bg-[#070A12] border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 font-mono focus:outline-none focus:border-emerald-500 shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={handleUseCurrentOrigin}
                      className="absolute right-1.5 top-1.5 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                      title="Set to window.location.origin"
                    >
                      Current Origin
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Target destination encoded in QRs. Change when deploying to custom domains or local Wi-Fi IP.
                  </p>
                </div>

                {/* 3. Stand Design Theme */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Stand Theme Style</span>
                    <span className="text-[10px] text-sky-400 font-mono">Visual Aesthetic</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'EMERALD_GOLD', label: 'Emerald Gold', desc: 'Fine Dining' },
                      { id: 'ROYAL_NOIR', label: 'Royal Noir', desc: 'Cocktail Bar' },
                      { id: 'MINIMAL_IVORY', label: 'Minimal Ivory', desc: 'Ink-Saving' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setDraftConfig({ ...draftConfig, themeStyle: t.id as any })}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                          draftConfig.themeStyle === t.id
                            ? 'bg-emerald-500/20 border-emerald-400 text-white font-bold shadow-sm'
                            : 'bg-[#070A12] border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-[11px] leading-tight font-bold">{t.label}</span>
                        <span className="text-[9px] text-slate-500">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500">Selects color scheme and ornaments on printed cards.</p>
                </div>

                {/* 4. Stand Subtitle / Tagline */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Stand Subtitle / Instruction Tagline
                  </label>
                  <input
                    type="text"
                    value={draftConfig.tagline}
                    onChange={(e) => setDraftConfig({ ...draftConfig, tagline: e.target.value })}
                    placeholder="Scan with Camera to Explore Menu & Order Instantly"
                    className="w-full px-3.5 py-2.5 bg-[#070A12] border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 font-sans focus:outline-none focus:border-emerald-500 shadow-inner"
                  />
                </div>

                {/* 5. Wi-Fi SSID */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                      <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Guest Wi-Fi Network (SSID)</span>
                    </label>
                    <label className="flex items-center space-x-1 cursor-pointer text-[10px] text-slate-400">
                      <input
                        type="checkbox"
                        checked={draftConfig.showWifi}
                        onChange={(e) => setDraftConfig({ ...draftConfig, showWifi: e.target.checked })}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                      />
                      <span>Show on Stand</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={draftConfig.wifiSsid}
                    onChange={(e) => setDraftConfig({ ...draftConfig, wifiSsid: e.target.value })}
                    placeholder="e.g. AURA-Guest-5G"
                    disabled={!draftConfig.showWifi}
                    className="w-full px-3.5 py-2.5 bg-[#070A12] border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 font-mono focus:outline-none focus:border-emerald-500 shadow-inner disabled:opacity-40"
                  />
                </div>

                {/* 6. Wi-Fi Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Guest Wi-Fi Password
                  </label>
                  <input
                    type="text"
                    value={draftConfig.wifiPassword}
                    onChange={(e) => setDraftConfig({ ...draftConfig, wifiPassword: e.target.value })}
                    placeholder="e.g. AuraDining2026 (Leave blank if open)"
                    disabled={!draftConfig.showWifi}
                    className="w-full px-3.5 py-2.5 bg-[#070A12] border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 font-mono focus:outline-none focus:border-emerald-500 shadow-inner disabled:opacity-40"
                  />
                </div>
              </div>

              {/* Save & Apply Banner */}
              <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>
                    Active Domain Preview: <strong className="text-emerald-300">{draftConfig.baseUrl}/dine/[token]</strong>
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDraftConfig(config);
                      setIsConfigOpen(false);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    className="px-5 py-2 bg-[#0C831F] hover:bg-[#096918] text-white rounded-xl text-xs font-black shadow-md flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save &amp; Re-generate All QRs</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* FILTER & ACTIVE DOMAIN BAR                                     */}
          {/* ============================================================== */}
          <div className="p-3 sm:p-4 bg-[#070A12] border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            {/* Search & Zone Filter */}
            <div className="flex items-center space-x-2 w-full sm:w-auto flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search table number (e.g. 10)..."
                  value={searchTable}
                  onChange={(e) => setSearchTable(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#0D121F] border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Active Settings Summary Pill */}
            <div className="flex items-center space-x-3 text-xs font-mono text-slate-400 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="truncate max-w-[220px]">
                  Venue: <strong className="text-white font-bold">{config.brandName}</strong>
                </span>
              </div>
              <span className="text-slate-600 hidden md:inline">|</span>
              <span className="hidden md:inline">
                Domain: <strong className="text-emerald-400">{config.baseUrl}</strong>
              </span>
              <span className="text-slate-600">|</span>
              <span>
                Tables: <strong className="text-emerald-400 font-bold">{filteredTables.length}</strong>
              </span>
            </div>
          </div>

          {/* ============================================================== */}
          {/* TABLES GRID (Luxury Stand Cards)                               */}
          {/* ============================================================== */}
          <div className="p-3 sm:p-5 md:p-6 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 custom-scrollbar">
            {filteredTables.length === 0 ? (
              <div className="col-span-full py-16 text-center space-y-3 bg-[#070A12] rounded-3xl border border-slate-800 p-8 max-w-md mx-auto">
                <QrCode className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-base font-bold text-white">No Matching Tables Found</h4>
                <p className="text-xs text-slate-400">
                  Try clearing your search filter or selecting 'All' tables.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTable('');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredTables.map((table) => {
                const token = table.qrCodeToken || (table as any).qrToken || 'demo-token';
                const dineUrl = computeTableDineUrl(token, config);
                const qrDataUrl = qrCache[String(table.tableNumber)];
                const isCopied = copiedTable === table.tableNumber;
                const isRotating = rotatingTable === (table._id || table.tableNumber);
                const isDownloadingThis = downloadingTable === table.tableNumber;
                const isVip = Number(table.tableNumber) === 10;

                return (
                  <div
                    key={table.tableNumber}
                    className={`rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col justify-between space-y-3 transition-all duration-300 relative group shadow-xl ${themeStyle.cardBg} ${themeStyle.frameBorder}`}
                  >
                    {/* Inner Decorative Border */}
                    <div
                      className={`absolute inset-2 rounded-2xl pointer-events-none ${themeStyle.innerBorder}`}
                    />

                    {/* Stand Header: Brand & Table Plaque */}
                    <div className="relative z-10 space-y-2 border-b border-white/10 pb-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] tracking-widest font-black uppercase font-serif ${themeStyle.accentText}`}>
                          ✦ {config.brandName.toUpperCase()} ✦
                        </span>
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-white/10 text-slate-300 border border-white/20">
                          {`Cap: ${table.capacity || 4}`}
                        </span>
                      </div>

                      {/* Prominent Table Plaque */}
                      <div
                        className={`py-2 px-3 rounded-xl border flex items-center justify-between shadow-md ${themeStyle.plaqueBg}`}
                      >
                        <div>
                          <div className="font-serif font-black text-xl sm:text-2xl tracking-wider leading-none">
                            TABLE {table.tableNumber}
                          </div>
                          <div className="text-[10px] opacity-75 font-mono mt-0.5">
                            Dine &amp; Dispatch
                          </div>
                        </div>

                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-black/40 text-emerald-400 border border-emerald-500/40 uppercase font-bold">
                          Active
                        </span>
                      </div>
                    </div>

                    {/* QR Code Plaque Centerpiece with Center Medallion */}
                    <div className="relative z-10 flex flex-col items-center justify-center py-2 space-y-2">
                      <div className="relative p-2.5 bg-white rounded-2xl shadow-2xl border-2 border-white/80 group-hover:scale-[1.02] transition-transform">
                        {qrDataUrl ? (
                          <div className="relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center">
                            <img
                              src={qrDataUrl}
                              alt={`Table ${table.tableNumber} QR`}
                              className="w-full h-full object-contain select-none"
                            />
                            {/* Center Chai Cup Medallion (Favicon Icon) */}
                            <div className="absolute inset-0 m-auto w-9 h-9 rounded-full bg-white shadow-md border-2 border-amber-500 flex items-center justify-center">
                              <div className="w-7 h-7 rounded-full bg-[#08251B] flex items-center justify-center text-amber-400">
                                <Coffee className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-36 h-36 sm:w-40 sm:h-40 bg-slate-100 rounded-xl animate-pulse flex items-center justify-center text-slate-400">
                            <QrCode className="w-12 h-12" />
                          </div>
                        )}
                      </div>

                      {/* 3 Step Visual Guidance */}
                      <div className="w-full bg-black/30 rounded-xl p-2 border border-white/10 text-center space-y-1">
                        <div className="grid grid-cols-3 text-[9px] font-bold opacity-90 divide-x divide-white/10">
                          <div>📷 Camera</div>
                          <div>🎯 Point QR</div>
                          <div>🍽️ Order</div>
                        </div>
                        <p className="text-[9px] opacity-70 tracking-wide font-sans">
                          No app required • Instant contactless dining
                        </p>
                      </div>

                      {/* Optional Wi-Fi Badge on Card */}
                      {config.showWifi && config.wifiSsid && (
                        <div className="w-full py-1 px-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-center font-mono text-emerald-300 truncate">
                          📶 Wi-Fi: <strong>{config.wifiSsid}</strong> {config.wifiPassword && `• Pass: ${config.wifiPassword}`}
                        </div>
                      )}
                    </div>

                    {/* Masked URL Bar */}
                    <div className="relative z-10 bg-black/50 p-2 rounded-xl border border-white/10 space-y-0.5">
                      <div className="flex items-center justify-between text-[9px] opacity-70 font-mono">
                        <span>Target Customer URL:</span>
                        <span className="text-emerald-400 font-bold">128-bit Token</span>
                      </div>
                      <div className="text-[10px] font-mono opacity-90 truncate select-all px-1.5 py-0.5 rounded bg-black/40 border border-white/5">
                        {dineUrl}
                      </div>
                    </div>

                    {/* Stand Action Buttons */}
                    <div className="relative z-10 space-y-2 pt-1">
                      {/* Primary Actions: Download Stand Card vs Download QR */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadStand(table)}
                          disabled={isDownloadingThis}
                          className="py-2 px-2.5 bg-gradient-to-r from-emerald-600 to-[#0C831F] hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
                          title="Download High-Res 1200x1750 Acrylic Stand Card (PNG)"
                        >
                          {isDownloadingThis ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span>Download Stand</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadQrOnly(table)}
                          className="py-2 px-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                          title="Download 1024x1024 QR Code Only (PNG)"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>QR Only</span>
                        </button>
                      </div>

                      {/* Secondary Actions: Print Stand, Copy Link, Test Scan, Rotate */}
                      <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => handlePrintSingle(table.tableNumber)}
                          className="py-1.5 px-2 bg-black/40 hover:bg-black/60 text-slate-200 text-[11px] font-bold rounded-lg border border-white/15 transition-all flex items-center justify-center space-x-1 cursor-pointer"
                          title="Print Table Stand"
                        >
                          <Printer className="w-3 h-3 text-sky-400" />
                          <span className="hidden sm:inline">Print</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyLink(table.tableNumber, token)}
                          className="py-1.5 px-2 bg-black/40 hover:bg-black/60 text-slate-200 text-[11px] font-bold rounded-lg border border-white/15 transition-all flex items-center justify-center space-x-1 cursor-pointer"
                          title="Copy Table Session Link"
                        >
                          {isCopied ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span className="hidden sm:inline">{isCopied ? 'Done' : 'Copy'}</span>
                        </button>

                        <a
                          href={dineUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="py-1.5 px-2 bg-black/40 hover:bg-black/60 text-emerald-300 text-[11px] font-bold rounded-lg border border-white/15 transition-all flex items-center justify-center space-x-1 cursor-pointer text-center"
                          title="Open Customer Dine View in New Tab"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="hidden sm:inline">Test</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleRotateQr(table)}
                          disabled={isRotating}
                          className="py-1.5 px-2 bg-black/40 hover:bg-black/60 text-slate-300 hover:text-amber-400 text-[11px] font-bold rounded-lg border border-white/15 transition-all flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
                          title="Rotate cryptographic token"
                        >
                          <RotateCcw className={`w-3 h-3 ${isRotating ? 'animate-spin text-amber-400' : ''}`} />
                          <span className="hidden sm:inline">Rotate</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-3 sm:p-4 bg-[#070A12] border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 shrink-0 font-mono">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                128-bit cryptographic tokens prevent customers from modifying table IDs in browser URLs.
              </span>
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* PRINT-ONLY VIEWPORT: Renders strictly when window.print() fires */}
      {/* ============================================================== */}
      <div className="printable-qr-sheet hidden print:block text-slate-950 font-sans">
        {tables
          .filter((t) => {
            if (printingTableNumber === 'ALL') return true;
            return String(t.tableNumber) === String(printingTableNumber);
          })
          .map((table) => {
            const token = table.qrCodeToken || (table as any).qrToken || 'demo-token';
            const dineUrl = computeTableDineUrl(token, config);
            const qrDataUrl = qrCache[String(table.tableNumber)];
            const isVip = Number(table.tableNumber) === 10;

            return (
              <div
                key={`print_${table.tableNumber}`}
                className="printable-qr-card w-[135mm] h-[195mm] mx-auto my-6 p-6 border-4 border-slate-900 rounded-3xl flex flex-col justify-between items-center text-center bg-white shadow-none break-after-page"
                style={{ pageBreakAfter: 'always' }}
              >
                {/* Stand Header */}
                <div className="space-y-1 w-full border-b-2 border-slate-900 pb-3">
                  <div className="font-serif font-black text-2xl tracking-widest text-slate-900 uppercase">
                    ✦ {config.brandName.toUpperCase()} ✦
                  </div>
                  <p className="text-xs text-slate-600 font-serif italic">
                    {config.tagline || 'Scan with Camera to Explore Menu & Order Instantly'}
                  </p>
                </div>

                {/* Table Number Emblem */}
                <div className="my-2 py-3 px-8 border-2 border-slate-900 rounded-2xl bg-slate-100 w-full max-w-[260px]">
                  <div className="font-serif font-black text-4xl text-slate-950 tracking-wider">
                    TABLE {table.tableNumber}
                  </div>
                  <div className="text-[11px] font-mono font-bold text-slate-700 uppercase mt-0.5">
                    {`Table ${table.tableNumber}`}
                  </div>
                </div>

                {/* Big Clean High-Contrast Scannable QR */}
                <div className="p-3 border-2 border-slate-900 rounded-2xl bg-white my-2 shadow-sm">
                  {qrDataUrl && (
                    <img
                      src={qrDataUrl}
                      alt={`Table ${table.tableNumber} QR`}
                      className="w-56 h-56 object-contain"
                    />
                  )}
                </div>

                {/* Step Instructions */}
                <div className="w-full bg-slate-100 border border-slate-300 rounded-xl p-3 my-2 space-y-1 text-slate-900">
                  <div className="grid grid-cols-3 text-xs font-bold divide-x divide-slate-300">
                    <div>1. Open Camera</div>
                    <div>2. Point at QR</div>
                    <div>3. Order Dishes</div>
                  </div>
                  <p className="text-[10px] text-slate-600 font-semibold">
                    No App Required • Contactless &amp; Fast Table Dispatch
                  </p>
                </div>

                {/* Wi-Fi Info */}
                {config.showWifi && config.wifiSsid && (
                  <div className="text-xs font-mono border border-slate-400 rounded-lg py-1 px-4 text-slate-800">
                    📶 Free Wi-Fi: <strong>{config.wifiSsid}</strong> {config.wifiPassword && `• Password: ${config.wifiPassword}`}
                  </div>
                )}

                {/* Security Footer & Masked URL */}
                <div className="w-full border-t border-slate-300 pt-2 text-[9px] font-mono text-slate-500">
                  <div>Scannable Destination: {dineUrl}</div>
                  <div>128-bit Cryptographic Session Token • Siliguri's Chai Addaa Systems</div>
                </div>
              </div>
            );
          })}
      </div>
    </>
  );
};

export default TableQrStandsModal;
