import React, { useState, useEffect, useMemo } from 'react';
import { TableResponse } from '../../types/order.types';
import { tableService } from '../../services/table.service';
import { useToast } from '../../components/feedback/ToastContainer';
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
  downloadBoardPoster,
  downloadTableSticker,
  downloadQrOnly,
  batchDownloadAllStands,
  batchDownloadAllPosters,
  batchDownloadAllStickers,
  batchDownloadAllQrs,
} from '../../utils/standCardGenerator';
import {
  QrCode,
  Printer,
  Download,
  Copy,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Search,
  Check,
  Settings,
  Globe,
  Wifi,
  Layers,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  RefreshCw,
  Maximize2,
  Grid,
  FileText,
  CreditCard,
  Sliders,
} from 'lucide-react';

// Default initial dataset of tables with rich zone info (Tables 1 to 30)
const INITIAL_TABLES: TableResponse[] = Array.from({ length: 30 }, (_, i) => {
  const num = i + 1;
  return {
    _id: `tbl-${num}`,
    tableNumber: num,
    capacity: num % 4 === 0 ? 6 : num % 2 === 0 ? 4 : 2,
    status: 'AVAILABLE' as any,
    qrCodeToken: `tok_aura_tbl_${String(num).padStart(2, '0')}_secure`,
  };
});

export const QrGeneratorPage: React.FC = () => {
  const { showToast } = useToast();

  // ─────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────
  const [tables, setTables] = useState<TableResponse[]>(INITIAL_TABLES);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL_GRID' | 'SINGLE_INSPECTOR' | 'BATCH_PRINT' | 'SETTINGS'>('ALL_GRID');

  // Venue & QR Domain Settings
  const [config, setConfig] = useState<VenueQrConfig>(getVenueConfig());
  const [draftConfig, setDraftConfig] = useState<VenueQrConfig>(getVenueConfig());

  // Focus table for Inspector / Single Editor
  const [selectedTableNumber, setSelectedTableNumber] = useState<number | string>(1);
  const [previewFormat, setPreviewFormat] = useState<'STAND' | 'POSTER' | 'STICKER' | 'RAW_QR'>('STAND');
  const [zoomScale, setZoomScale] = useState<number>(100);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('ALL');

  // Interactive Action States
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [isBatchRunning, setIsBatchRunning] = useState(false);

  // Bulk Generator State
  const [bulkCount, setBulkCount] = useState<number>(30);

  // Print Mode State ('STAND_SINGLE', 'POSTER_SINGLE', 'STICKER_SINGLE', 'ALL_STANDS', 'ALL_POSTERS', 'STICKER_SHEET')
  const [printTarget, setPrintTarget] = useState<{
    mode: 'STAND_SINGLE' | 'POSTER_SINGLE' | 'STICKER_SINGLE' | 'ALL_STANDS' | 'ALL_POSTERS' | 'STICKER_SHEET' | null;
    tableNumber?: number | string;
  }>({ mode: null });

  // Cache of generated QR code data URLs (tableNumber -> dataUrl)
  const [qrCache, setQrCache] = useState<{ [key: string]: string }>({});

  // ─────────────────────────────────────────────────────────────
  // Initial Table Loading from Backend
  // ─────────────────────────────────────────────────────────────
  const fetchTables = async () => {
    setIsLoadingTables(true);
    try {
      const serverTables = await tableService.getAllTables();
      if (serverTables && serverTables.length > 0) {
        setTables(serverTables);
      } else {
        setTables(INITIAL_TABLES);
      }
    } catch (err) {
      console.warn('Using initial rich table set:', err);
      setTables(INITIAL_TABLES);
    } finally {
      setIsLoadingTables(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Regenerate QR Code Data URLs when tables or config changes
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const generateAll = async () => {
      const cache: { [key: string]: string } = {};
      for (const t of tables) {
        const token = t.qrCodeToken || (t as any).qrToken || `tok_${t.tableNumber}`;
        const url = computeTableDineUrl(token, config);
        try {
          const dataUrl = await generateQrDataUrl(url, { size: 400 });
          cache[String(t.tableNumber)] = dataUrl;
        } catch (e) {
          console.error(`QR gen error for table ${t.tableNumber}`, e);
        }
      }
      if (isMounted) setQrCache(cache);
    };

    generateAll();
    return () => {
      isMounted = false;
    };
  }, [tables, config.baseUrl, config.urlFormat]);

  // Selected table object
  const activeFocusTable = useMemo(() => {
    return tables.find((t) => String(t.tableNumber) === String(selectedTableNumber)) || tables[0] || INITIAL_TABLES[0];
  }, [tables, selectedTableNumber]);

  // Filtered Tables
  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      const strNum = String(t.tableNumber);
      const matchesSearch = !searchQuery.trim() || strNum.includes(searchQuery.trim());
      const num = Number(t.tableNumber);
      if (selectedZoneFilter === 'VIP') return matchesSearch && num === 10;
      if (selectedZoneFilter === 'MAIN') return matchesSearch && num >= 1 && num <= 9;
      if (selectedZoneFilter === 'TERRACE') return matchesSearch && (num === 11 || strNum.toLowerCase().includes('terrace'));
      if (selectedZoneFilter === 'BAR') return matchesSearch && (num === 12 || strNum.toLowerCase().includes('bar'));
      return matchesSearch;
    });
  }, [tables, searchQuery, selectedZoneFilter]);

  // ─────────────────────────────────────────────────────────────
  // Action Handlers
  // ─────────────────────────────────────────────────────────────
  const handleSaveVenueSettings = () => {
    const saved = saveVenueConfig(draftConfig);
    setConfig(saved);
    showToast('Venue branding & customer base domain updated!', 'success');
  };

  const handleResetVenueSettings = () => {
    const reset = saveVenueConfig(DEFAULT_VENUE_CONFIG);
    setConfig(reset);
    setDraftConfig(reset);
    showToast('Reset settings to default configuration.', 'info');
  };

  const handleSetCurrentDomain = () => {
    setDraftConfig((prev) => ({
      ...prev,
      baseUrl: window.location.origin,
    }));
    showToast(`Base domain set to current browser origin: ${window.location.origin}`, 'info');
  };

  const handleCopyLink = (tableNum: number | string, token?: string) => {
    const url = computeTableDineUrl(token, config);
    navigator.clipboard.writeText(url);
    setCopiedKey(String(tableNum));
    showToast(`Table ${tableNum} Dine URL copied!`, 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRotateQrToken = async (table: TableResponse) => {
    const tId = table._id || table.tableNumber;
    try {
      await tableService.rotateQrToken(tId);
      showToast(`Regenerated cryptographic token for Table ${table.tableNumber}!`, 'success');
      fetchTables();
    } catch (err: any) {
      const newToken = `tok_aura_${table.tableNumber}_${Math.random().toString(36).substring(2, 8)}`;
      setTables((prev) =>
        prev.map((t) => (t.tableNumber === table.tableNumber ? { ...t, qrCodeToken: newToken } : t))
      );
      showToast(`Generated new client-side token for Table ${table.tableNumber}`, 'success');
    }
  };

  // Bulk Generator for N Tables
  const handleGenerateBulkTables = (count: number) => {
    const targetCount = Math.max(1, Math.min(100, count));
    const newTablesList: TableResponse[] = Array.from({ length: targetCount }, (_, i) => {
      const num = i + 1;
      const isVip = num === 10;
      const isTerrace = num === 11;
      const isBar = num === 12;
      return {
        _id: `tbl-${num}`,
        tableNumber: num,
        capacity: isVip ? 12 : isBar ? 2 : isTerrace ? 4 : (num % 2 === 0 ? 6 : 4),
        status: 'AVAILABLE' as any,
        qrCodeToken: `tok_aura_tbl_${String(num).padStart(2, '0')}_secure`,
      };
    });
    setTables(newTablesList);
    setSelectedTableNumber(1);
    showToast(`Generated QR codes for all ${targetCount} tables!`, 'success');
  };

  // Download Handlers
  const handleDownloadSingle = async (
    table: TableResponse,
    format: 'STAND' | 'POSTER' | 'STICKER' | 'RAW_QR'
  ) => {
    const key = `${format}_${table.tableNumber}`;
    setDownloadingKey(key);
    try {
      if (format === 'STAND') {
        await downloadStandCard(table, config);
        showToast(`Table ${table.tableNumber} Stand Card downloaded!`, 'success');
      } else if (format === 'POSTER') {
        await downloadBoardPoster(table, config);
        showToast(`Table ${table.tableNumber} Board Poster downloaded!`, 'success');
      } else if (format === 'STICKER') {
        await downloadTableSticker(table, config);
        showToast(`Table ${table.tableNumber} Square Sticker downloaded!`, 'success');
      } else {
        await downloadQrOnly(table, config);
        showToast(`Table ${table.tableNumber} Raw QR Code downloaded!`, 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Download failed. Please check browser permissions.', 'error');
    } finally {
      setDownloadingKey(null);
    }
  };

  // Batch Download Handlers
  const handleBatchDownload = async (format: 'STAND' | 'POSTER' | 'STICKER' | 'RAW_QR') => {
    if (filteredTables.length === 0) return;
    setIsBatchRunning(true);
    setBatchProgress({ current: 0, total: filteredTables.length });

    try {
      const progressCb = (cur: number, tot: number) => setBatchProgress({ current: cur, total: tot });
      if (format === 'STAND') {
        await batchDownloadAllStands(filteredTables, config, progressCb);
        showToast(`Downloaded all ${filteredTables.length} Table Stand Cards!`, 'success');
      } else if (format === 'POSTER') {
        await batchDownloadAllPosters(filteredTables, config, progressCb);
        showToast(`Downloaded all ${filteredTables.length} Board Posters!`, 'success');
      } else if (format === 'STICKER') {
        await batchDownloadAllStickers(filteredTables, config, progressCb);
        showToast(`Downloaded all ${filteredTables.length} Table Stickers!`, 'success');
      } else {
        await batchDownloadAllQrs(filteredTables, config, progressCb);
        showToast(`Downloaded all ${filteredTables.length} Raw QR Codes!`, 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Batch download encountered an issue.', 'error');
    } finally {
      setIsBatchRunning(false);
      setBatchProgress(null);
    }
  };

  // Print Handlers
  const triggerPrint = (
    mode: 'STAND_SINGLE' | 'POSTER_SINGLE' | 'STICKER_SINGLE' | 'ALL_STANDS' | 'ALL_POSTERS' | 'STICKER_SHEET',
    tableNumber?: number | string
  ) => {
    setPrintTarget({ mode, tableNumber });
    setTimeout(() => {
      window.print();
    }, 180);
  };

  // Add Custom Table
  const handleAddNewTable = () => {
    const nextNum = tables.length > 0 ? Math.max(...tables.map((t) => Number(t.tableNumber) || 0)) + 1 : 1;
    const newT: TableResponse = {
      _id: `tbl-${Date.now()}`,
      tableNumber: nextNum,
      capacity: 4,
      status: 'AVAILABLE' as any,
      qrCodeToken: `tok_aura_tbl_${nextNum}_custom_${Math.random().toString(36).substring(2, 6)}`,
    };
    setTables((prev) => [...prev, newT]);
    setSelectedTableNumber(nextNum);
    showToast(`Table ${nextNum} added successfully!`, 'success');
  };

  // Delete Table
  const handleDeleteTable = (num: number | string) => {
    if (tables.length <= 1) {
      showToast('At least one table must remain.', 'error');
      return;
    }
    setTables((prev) => prev.filter((t) => String(t.tableNumber) !== String(num)));
    if (String(selectedTableNumber) === String(num)) {
      setSelectedTableNumber(tables[0]?.tableNumber || 1);
    }
    showToast(`Table ${num} removed.`, 'info');
  };

  // ─────────────────────────────────────────────────────────────
  // Theme styling helpers for Screen Preview
  // ─────────────────────────────────────────────────────────────
  const getThemeStyles = (theme?: string) => {
    const t = theme || config.themeStyle || 'EMERALD_GOLD';
    if (t === 'ROYAL_NOIR') {
      return {
        bg: 'from-[#060913] via-[#0B142B] to-[#070C1B]',
        cardBorder: 'border-sky-400/60 shadow-[0_0_25px_rgba(56,189,248,0.2)]',
        innerBorder: 'border-sky-400/30',
        textAccent: 'text-sky-400',
        plaqueBg: 'bg-[#0E172A] border-sky-400/80 text-sky-200',
      };
    }
    if (t === 'SUNSET_AMBER') {
      return {
        bg: 'from-[#1C0E07] via-[#2E150C] to-[#180A04]',
        cardBorder: 'border-orange-500/70 shadow-[0_0_25px_rgba(249,115,22,0.2)]',
        innerBorder: 'border-orange-500/30',
        textAccent: 'text-amber-400',
        plaqueBg: 'bg-[#33180E] border-orange-400/80 text-orange-200',
      };
    }
    if (t === 'CYBER_NEON') {
      return {
        bg: 'from-[#080811] via-[#110E24] to-[#070710]',
        cardBorder: 'border-purple-500/70 shadow-[0_0_25px_rgba(168,85,247,0.2)]',
        innerBorder: 'border-purple-500/30',
        textAccent: 'text-green-400',
        plaqueBg: 'bg-[#1D1438] border-purple-400/80 text-green-300',
      };
    }
    if (t === 'MINIMAL_IVORY') {
      return {
        bg: 'from-[#FAF9F6] via-[#F4F4F0] to-[#EAE9E4]',
        cardBorder: 'border-zinc-800 shadow-xl',
        innerBorder: 'border-zinc-400/40',
        textAccent: 'text-emerald-700',
        plaqueBg: 'bg-zinc-900 border-zinc-700 text-white',
      };
    }
    // EMERALD_GOLD
    return {
      bg: 'from-[#04150F] via-[#07241A] to-[#04150F]',
      cardBorder: 'border-amber-500/70 shadow-[0_0_30px_rgba(245,158,11,0.2)]',
      innerBorder: 'border-amber-400/30',
      textAccent: 'text-amber-400',
      plaqueBg: 'bg-[#092B1F] border-amber-400/80 text-amber-200',
    };
  };

  const currentTheme = getThemeStyles(config.themeStyle);

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          SCREEN UI (Hidden during window.print())
      ───────────────────────────────────────────────────────────── */}
      <div className="min-h-full bg-[#050811] text-slate-100 flex flex-col font-sans pb-16 no-print">
        
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 bg-[#070B16]/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-amber-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-950/40">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h1 className="font-serif text-base sm:text-xl font-bold text-white tracking-wide">
                  Table QR &amp; Stand Studio
                </h1>
                <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold rounded-full">
                  All {tables.length} Tables Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-md sm:max-w-xl">
                Automatic QR codes for every table. 1-click downloads, live customizer, and direct board printing.
              </p>
            </div>
          </div>

          {/* Quick Action Navigation & Global Print/Download buttons */}
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <button
              onClick={() => triggerPrint('ALL_STANDS')}
              className="px-3 py-1.5 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/40 text-sky-300 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
              title="Print all table stands"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print All ({tables.length})</span>
            </button>

            <button
              onClick={() => handleBatchDownload('STAND')}
              disabled={isBatchRunning || filteredTables.length === 0}
              className="px-3 py-1.5 bg-[#0C831F] hover:bg-[#096918] text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border border-emerald-400/50 shadow-md shadow-emerald-950/30 disabled:opacity-50"
              title="Batch download all stand cards as PNG"
            >
              {isBatchRunning ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>
                {batchProgress ? `${batchProgress.current}/${batchProgress.total}` : 'Download All Stands'}
              </span>
            </button>

            <button
              onClick={handleAddNewTable}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
              title="Add a new custom dining table"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Add Table</span>
            </button>
          </div>
        </header>

        {/* Bulk Table Generator & Quick Setup Bar */}
        <div className="bg-[#080D1A] border-b border-slate-800 px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
            <span className="text-slate-400 font-semibold">Quick Setup Total Tables:</span>
            {[6, 10, 12, 16, 20, 24, 30].map((count) => (
              <button
                key={count}
                onClick={() => handleGenerateBulkTables(count)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  tables.length === count
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {count} Tables
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Custom Count:</span>
            <input
              type="number"
              min={1}
              max={100}
              value={bulkCount}
              onChange={(e) => setBulkCount(Number(e.target.value) || 1)}
              className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white text-center font-bold focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => handleGenerateBulkTables(bulkCount)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 rounded-lg text-xs font-bold cursor-pointer"
            >
              Set
            </button>
          </div>
        </div>

        {/* Studio Sub-Navigation Tabs */}
        <div className="bg-[#090E1D] border-b border-slate-800/80 px-3 sm:px-6 py-2 flex items-center space-x-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('ALL_GRID')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer shrink-0 border ${
              activeTab === 'ALL_GRID'
                ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>All Tables Grid ({tables.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('SINGLE_INSPECTOR')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer shrink-0 border ${
              activeTab === 'SINGLE_INSPECTOR'
                ? 'bg-amber-500/20 border-amber-400/60 text-amber-300 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Live Inspector &amp; Single Table Customizer</span>
          </button>

          <button
            onClick={() => setActiveTab('BATCH_PRINT')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer shrink-0 border ${
              activeTab === 'BATCH_PRINT'
                ? 'bg-sky-500/20 border-sky-400/60 text-sky-300 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Station &amp; Sticker Sheets</span>
          </button>

          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer shrink-0 border ${
              activeTab === 'SETTINGS'
                ? 'bg-purple-500/20 border-purple-400/60 text-purple-300 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Venue Domain &amp; Wi-Fi Setup</span>
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            TAB 1: ALL TABLES GRID VIEW
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'ALL_GRID' && (
          <div className="p-3 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
            {/* Search & Zone Filter Bar */}
            <div className="bg-[#0B1020] border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center space-x-2 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search table number (e.g. 1, 10, VIP)..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Zone Chips */}
              <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'ALL', label: `All Tables (${tables.length})` },
                  { id: 'VIP', label: 'VIP' },
                  { id: 'MAIN', label: 'Main Hall' },
                  { id: 'TERRACE', label: 'Terrace' },
                  { id: 'BAR', label: 'Bar' },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setSelectedZoneFilter(chip.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                      selectedZoneFilter === chip.id
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Quick Theme Selector */}
              <div className="flex items-center space-x-2">
                <select
                  value={config.themeStyle}
                  onChange={(e) => {
                    const saved = saveVenueConfig({ themeStyle: e.target.value as any });
                    setConfig(saved);
                  }}
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-semibold cursor-pointer"
                >
                  <option value="EMERALD_GOLD">Theme: Emerald Gold</option>
                  <option value="ROYAL_NOIR">Theme: Royal Noir</option>
                  <option value="SUNSET_AMBER">Theme: Sunset Amber</option>
                  <option value="CYBER_NEON">Theme: Cyber Neon</option>
                  <option value="MINIMAL_IVORY">Theme: Minimal Ivory (Print)</option>
                </select>
              </div>
            </div>

            {/* Table Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredTables.map((table) => {
                const token = table.qrCodeToken || (table as any).qrToken || `tok_${table.tableNumber}`;
                const dineUrl = computeTableDineUrl(token, config);
                const isVip = Number(table.tableNumber) === 10;
                const qrImgUrl = qrCache[String(table.tableNumber)];

                return (
                  <div
                    key={table.tableNumber}
                    className="bg-[#0B1020] border border-slate-800 hover:border-emerald-500/50 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-black/50 group"
                  >
                    {/* Card Top Header */}
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-serif font-black text-lg sm:text-xl text-white tracking-wide">
                            Table {table.tableNumber}
                          </span>
                          {isVip && (
                            <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-400/50 text-amber-300 font-mono text-[10px] font-bold rounded-full">
                              VIP
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                          {table.capacity || 4} Guests
                        </span>
                      </div>

                      {/* Mini Live QR Preview Container */}
                      <div className="bg-white rounded-2xl p-3 flex flex-col items-center justify-center relative shadow-inner mb-3 overflow-hidden">
                        {qrImgUrl ? (
                          <div className="relative">
                            <img
                              src={qrImgUrl}
                              alt={`Table ${table.tableNumber} QR`}
                              className="w-36 h-36 sm:w-40 sm:h-40 object-contain"
                            />
                            {/* Center Cutlery Medallion */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-8 h-8 rounded-full bg-[#04150F] border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-md">
                                <Sparkles className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-36 h-36 flex items-center justify-center text-slate-400">
                            <RefreshCw className="w-6 h-6 animate-spin" />
                          </div>
                        )}
                        <p className="text-[9px] font-serif text-slate-700 mt-1.5 font-bold tracking-wider uppercase">
                          {config.brandName || 'AURA'} • TABLE {table.tableNumber}
                        </p>
                      </div>
                    </div>

                    {/* Card Actions (Download, Print, Edit, Rotate) */}
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      {/* Primary Download Stand Button */}
                      <button
                        onClick={() => handleDownloadSingle(table, 'STAND')}
                        disabled={downloadingKey === `STAND_${table.tableNumber}`}
                        className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-950/50 cursor-pointer disabled:opacity-50"
                        title="Download Luxury Stand Card PNG"
                      >
                        {downloadingKey === `STAND_${table.tableNumber}` ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span>Download Stand Card</span>
                      </button>

                      {/* Secondary Action Grid */}
                      <div className="grid grid-cols-4 gap-1.5">
                        <button
                          onClick={() => handleDownloadSingle(table, 'POSTER')}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-[10px] font-bold flex flex-col items-center justify-center transition-colors cursor-pointer"
                          title="Download Large Board Poster PNG"
                        >
                          <Layers className="w-3.5 h-3.5 text-sky-400 mb-0.5" />
                          <span>Poster</span>
                        </button>

                        <button
                          onClick={() => handleDownloadSingle(table, 'STICKER')}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-[10px] font-bold flex flex-col items-center justify-center transition-colors cursor-pointer"
                          title="Download Square Sticker PNG"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-amber-400 mb-0.5" />
                          <span>Sticker</span>
                        </button>

                        <button
                          onClick={() => triggerPrint('STAND_SINGLE', table.tableNumber)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-[10px] font-bold flex flex-col items-center justify-center transition-colors cursor-pointer"
                          title="Direct Print Single Stand Card"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-400 mb-0.5" />
                          <span>Print</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedTableNumber(table.tableNumber);
                            setActiveTab('SINGLE_INSPECTOR');
                          }}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-[10px] font-bold flex flex-col items-center justify-center transition-colors cursor-pointer"
                          title="Open in Live Single Inspector"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-purple-400 mb-0.5" />
                          <span>Edit</span>
                        </button>
                      </div>

                      {/* Token Regenerate & Delete Footer */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                        <button
                          onClick={() => handleRotateQrToken(table)}
                          className="hover:text-amber-400 transition-colors flex items-center space-x-1 cursor-pointer"
                          title="Regenerate Security QR Token"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Rotate Token</span>
                        </button>

                        <button
                          onClick={() => handleDeleteTable(table.tableNumber)}
                          className="hover:text-rose-400 transition-colors p-1 cursor-pointer"
                          title="Remove Table"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 2: SINGLE TABLE FOCUS & LIVE CANVAS INSPECTOR
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'SINGLE_INSPECTOR' && (
          <div className="p-3 sm:p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Live Card / Board / Sticker Visual Preview */}
            <div className="lg:col-span-7 flex flex-col items-center">
              
              {/* Preview Format Selector & Zoom Controls */}
              <div className="w-full bg-[#0B1020] border border-slate-800 rounded-2xl p-2.5 mb-4 flex items-center justify-between gap-2 flex-wrap shadow-lg">
                <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'STAND', label: 'Acrylic Stand (4x6")', icon: Layers },
                    { id: 'POSTER', label: 'Board Poster (A4)', icon: FileText },
                    { id: 'STICKER', label: 'Square Sticker', icon: CreditCard },
                    { id: 'RAW_QR', label: 'Raw QR Code', icon: QrCode },
                  ].map((fmt) => {
                    const Icon = fmt.icon;
                    return (
                      <button
                        key={fmt.id}
                        onClick={() => setPreviewFormat(fmt.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 border ${
                          previewFormat === fmt.id
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{fmt.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center space-x-1 text-xs text-slate-400">
                  <button
                    onClick={() => setZoomScale((prev) => Math.max(60, prev - 15))}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-mono px-1">{zoomScale}%</span>
                  <button
                    onClick={() => setZoomScale((prev) => Math.min(140, prev + 15))}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* LIVE STAND CARD PREVIEW (Scaleable Container) */}
              <div className="w-full flex justify-center overflow-x-auto p-2">
                <div
                  style={{ transform: `scale(${zoomScale / 100})`, transformOrigin: 'top center' }}
                  className="transition-transform duration-200 flex justify-center"
                >
                  {/* Format 1: Stand Card Preview */}
                  {previewFormat === 'STAND' && (
                    <div
                      className={`w-[340px] sm:w-[380px] rounded-3xl p-6 bg-gradient-to-b ${currentTheme.bg} ${currentTheme.cardBorder} flex flex-col items-center text-center relative overflow-hidden select-none`}
                    >
                      {/* Inner border line */}
                      <div className={`absolute inset-3.5 rounded-2xl pointer-events-none ${currentTheme.innerBorder}`} />

                      {/* Header Crest */}
                      <div className={`font-serif text-xs font-bold tracking-widest ${currentTheme.textAccent} mt-1`}>
                        ✦  A U R A  ✦
                      </div>
                      <div className="font-serif font-black text-xl text-white tracking-wider mt-1">
                        {config.brandName.toUpperCase()}
                      </div>
                      <p className="text-[10px] text-slate-300 italic mt-0.5 max-w-[280px]">
                        {config.tagline || 'Scan with Camera to Explore Menu & Order Instantly'}
                      </p>

                      {/* Table Plaque */}
                      <div className={`w-full py-2.5 px-4 rounded-2xl mt-3 border ${currentTheme.plaqueBg} shadow-md`}>
                        <div className="font-serif font-black text-2xl tracking-wide">
                          TABLE {activeFocusTable.tableNumber}
                        </div>
                        <div className="text-[10px] font-mono text-slate-300 uppercase tracking-widest mt-0.5">
                          {Number(activeFocusTable.tableNumber) === 10
                            ? 'VIP EXECUTIVE SUITE'
                            : `MAIN DINING • ${activeFocusTable.capacity || 4} GUESTS`}
                        </div>
                      </div>

                      {/* QR Code Container */}
                      <div className="w-56 h-56 bg-white rounded-3xl p-3.5 mt-3.5 flex flex-col items-center justify-center relative shadow-2xl">
                        {qrCache[String(activeFocusTable.tableNumber)] ? (
                          <img
                            src={qrCache[String(activeFocusTable.tableNumber)]}
                            alt={`Table ${activeFocusTable.tableNumber} QR`}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-40 h-40 flex items-center justify-center text-slate-400">
                            <RefreshCw className="w-8 h-8 animate-spin" />
                          </div>
                        )}
                        {/* Center Emblem */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-11 h-11 rounded-full bg-[#04150F] border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-xl">
                            <Sparkles className="w-5 h-5" />
                          </div>
                        </div>
                      </div>

                      {/* 3 Steps Guide Box */}
                      <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-2.5 mt-3.5 grid grid-cols-3 gap-1 text-[9px]">
                        <div>
                          <div className={`font-bold ${currentTheme.textAccent}`}>📷 STEP 1</div>
                          <div className="font-bold text-white">Open Camera</div>
                          <div className="text-slate-400 text-[8px]">iOS / Android</div>
                        </div>
                        <div className="border-x border-white/10 px-1">
                          <div className={`font-bold ${currentTheme.textAccent}`}>🎯 STEP 2</div>
                          <div className="font-bold text-white">Point at QR</div>
                          <div className="text-slate-400 text-[8px]">Tap Banner</div>
                        </div>
                        <div>
                          <div className={`font-bold ${currentTheme.textAccent}`}>🍽️ STEP 3</div>
                          <div className="font-bold text-white">Order Dishes</div>
                          <div className="text-slate-400 text-[8px]">Direct Kitchen</div>
                        </div>
                      </div>

                      {/* Wi-Fi Pill */}
                      {config.showWifi && config.wifiSsid && (
                        <div className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-xl py-1.5 px-3 mt-2.5 text-[10px] text-emerald-200 font-semibold truncate">
                          📶 Wi-Fi: {config.wifiSsid} • Password: {config.wifiPassword || 'None'}
                        </div>
                      )}

                      {/* Clean Dining Guarantee Footer (No ugly technical target URL string!) */}
                      <div className={`text-[8px] font-mono ${currentTheme.textAccent} mt-2.5 font-bold tracking-wider`}>
                        ⚡ NO APP REQUIRED • INSTANT CONTACTLESS ORDERING
                      </div>
                      <div className="text-[8px] font-serif text-slate-400 mt-1 uppercase tracking-widest">
                        ✦ {config.brandName || 'AURA'} • TABLE {activeFocusTable.tableNumber} ✦
                      </div>
                    </div>
                  )}

                  {/* Format 2: Large Board Poster Preview */}
                  {previewFormat === 'POSTER' && (
                    <div
                      className={`w-[360px] sm:w-[420px] rounded-3xl p-7 bg-gradient-to-b ${currentTheme.bg} ${currentTheme.cardBorder} flex flex-col items-center text-center relative overflow-hidden select-none`}
                    >
                      <div className={`font-serif text-sm font-bold tracking-widest ${currentTheme.textAccent}`}>
                        ✦  SILIGURI'S CHAI ADDAA BOARD POSTER  ✦
                      </div>
                      <div className="font-serif font-black text-2xl text-white tracking-wider mt-1">
                        {config.brandName.toUpperCase()}
                      </div>
                      <div className={`w-full py-3 px-4 rounded-2xl mt-3 border ${currentTheme.plaqueBg}`}>
                        <div className="font-serif font-black text-3xl">TABLE {activeFocusTable.tableNumber}</div>
                        <div className="text-xs font-mono text-slate-300">MOUNTED BOARD &amp; DINE DISPATCH</div>
                      </div>

                      <div className="w-64 h-64 bg-white rounded-3xl p-4 mt-4 flex items-center justify-center relative shadow-2xl">
                        {qrCache[String(activeFocusTable.tableNumber)] && (
                          <img
                            src={qrCache[String(activeFocusTable.tableNumber)]}
                            alt={`Table ${activeFocusTable.tableNumber} QR`}
                            className="w-full h-full object-contain"
                          />
                        )}
                      </div>

                      <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 mt-4 text-xs space-y-1">
                        <p className="font-bold text-white">Contactless Tabletop System</p>
                        <p className="text-slate-300 text-[10px]">
                          Scan anytime during your visit to re-order drinks, desserts, or call table service.
                        </p>
                      </div>

                      {config.showWifi && config.wifiSsid && (
                        <div className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-xl py-2 px-3 mt-3 text-xs text-emerald-200 font-bold">
                          📶 Guest Wi-Fi: {config.wifiSsid} • Key: {config.wifiPassword || 'None'}
                        </div>
                      )}

                      <div className="text-[9px] font-serif text-slate-400 mt-3 uppercase tracking-wider">
                        ✦ FINE DINING &amp; BOTANICAL BAR • TABLE {activeFocusTable.tableNumber} ✦
                      </div>
                    </div>
                  )}

                  {/* Format 3: Square Sticker / Coaster Preview */}
                  {previewFormat === 'STICKER' && (
                    <div
                      className={`w-[300px] h-[300px] sm:w-[340px] sm:h-[340px] rounded-3xl p-5 bg-gradient-to-b ${currentTheme.bg} ${currentTheme.cardBorder} flex flex-col items-center justify-between text-center select-none shadow-2xl`}
                    >
                      <div className="w-full">
                        <div className={`font-serif text-[10px] font-bold ${currentTheme.textAccent}`}>✦ SILIGURI'S CHAI ADDAA ✦</div>
                        <div className="font-serif font-black text-xl text-white">TABLE {activeFocusTable.tableNumber}</div>
                      </div>

                      <div className="w-40 h-40 bg-white rounded-2xl p-2.5 shadow-inner">
                        {qrCache[String(activeFocusTable.tableNumber)] && (
                          <img
                            src={qrCache[String(activeFocusTable.tableNumber)]}
                            alt={`Table ${activeFocusTable.tableNumber} QR`}
                            className="w-full h-full object-contain"
                          />
                        )}
                      </div>

                      <div className="w-full text-[9px] font-bold text-slate-300">
                        SCAN TO EXPLORE MENU &amp; ORDER
                      </div>
                    </div>
                  )}

                  {/* Format 4: Raw QR */}
                  {previewFormat === 'RAW_QR' && (
                    <div className="w-[300px] h-[300px] bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center border-4 border-slate-700">
                      {qrCache[String(activeFocusTable.tableNumber)] && (
                        <img
                          src={qrCache[String(activeFocusTable.tableNumber)]}
                          alt={`Table ${activeFocusTable.tableNumber} QR`}
                          className="w-full h-full object-contain"
                        />
                      )}
                      <p className="text-[10px] font-mono text-slate-700 font-bold mt-2">
                        TABLE {activeFocusTable.tableNumber} • 1024x1024 HD
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Table Customizer & Actions */}
            <div className="lg:col-span-5 space-y-5">
              
              {/* Select Active Table Dropdown */}
              <div className="bg-[#0B1020] border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
                <label className="block text-xs font-bold text-slate-300">
                  Select Table to Customize &amp; Download:
                </label>
                <select
                  value={selectedTableNumber}
                  onChange={(e) => setSelectedTableNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {tables.map((t) => (
                    <option key={t.tableNumber} value={t.tableNumber}>
                      Table {t.tableNumber} ({t.capacity || 4} Guests • {Number(t.tableNumber) === 10 ? 'VIP Suite' : 'Main Hall'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Single Table Live Field Editor */}
              <div className="bg-[#0B1020] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Edit3 className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Edit Table {activeFocusTable.tableNumber} Properties
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    Live Reactive
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Table Number</label>
                    <input
                      type="text"
                      value={activeFocusTable.tableNumber}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTables((prev) =>
                          prev.map((t) =>
                            String(t.tableNumber) === String(selectedTableNumber)
                              ? { ...t, tableNumber: val }
                              : t
                          )
                        );
                        setSelectedTableNumber(val);
                      }}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Capacity (Guests)</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={activeFocusTable.capacity || 4}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 1;
                        setTables((prev) =>
                          prev.map((t) =>
                            String(t.tableNumber) === String(selectedTableNumber)
                              ? { ...t, capacity: val }
                              : t
                          )
                        );
                      }}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Security Token / QR Signature
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={activeFocusTable.qrCodeToken || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTables((prev) =>
                          prev.map((t) =>
                            String(t.tableNumber) === String(selectedTableNumber)
                              ? { ...t, qrCodeToken: val }
                              : t
                          )
                        );
                      }}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={() => handleRotateQrToken(activeFocusTable)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl border border-slate-700 shrink-0 cursor-pointer"
                      title="Generate New Cryptographic Token"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Direct Customer Dine Link
                  </label>
                  <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-300 flex items-center justify-between">
                    <span className="truncate max-w-[240px]">
                      {computeTableDineUrl(activeFocusTable.qrCodeToken, config)}
                    </span>
                    <button
                      onClick={() => handleCopyLink(activeFocusTable.tableNumber, activeFocusTable.qrCodeToken)}
                      className="text-slate-400 hover:text-emerald-400 p-1 cursor-pointer"
                      title="Copy URL"
                    >
                      {copiedKey === String(activeFocusTable.tableNumber) ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* 1-by-1 Download & Direct Print Action Box */}
              <div className="bg-[#0B1020] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Export Single Table {activeFocusTable.tableNumber}
                </h4>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handleDownloadSingle(activeFocusTable, 'STAND')}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-md cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Stand</span>
                  </button>

                  <button
                    onClick={() => handleDownloadSingle(activeFocusTable, 'POSTER')}
                    className="py-2.5 px-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-md cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Poster</span>
                  </button>

                  <button
                    onClick={() => handleDownloadSingle(activeFocusTable, 'STICKER')}
                    className="py-2.5 px-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-md cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Sticker</span>
                  </button>

                  <button
                    onClick={() => handleDownloadSingle(activeFocusTable, 'RAW_QR')}
                    className="py-2.5 px-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-md cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Raw QR PNG</span>
                  </button>
                </div>

                {/* Direct Print Buttons */}
                <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => triggerPrint('STAND_SINGLE', activeFocusTable.tableNumber)}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Print Stand</span>
                  </button>

                  <button
                    onClick={() => triggerPrint('POSTER_SINGLE', activeFocusTable.tableNumber)}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-sky-400" />
                    <span>Print Poster</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 3: BATCH PRINT STATION & STICKER SHEETS
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'BATCH_PRINT' && (
          <div className="p-3 sm:p-6 max-w-6xl mx-auto w-full space-y-6">
            <div className="bg-[#0B1020] border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
                    Direct Print &amp; Multi-Sheet Station
                  </h3>
                  <p className="text-xs text-slate-400">
                    Send table stands directly to your office printer, print a 12-sticker sheet, or batch-download high-DPI boards.
                  </p>
                </div>
              </div>

              {/* Print Modes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {/* Mode 1: All Table Stand Cards */}
                <div className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all">
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                      <Layers className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-sm text-white">All Table Stand Cards</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Prints 1 luxury acrylic stand tent card per page with automatic clean page breaks.
                    </p>
                  </div>
                  <button
                    onClick={() => triggerPrint('ALL_STANDS')}
                    className="w-full mt-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-md cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print All Stands ({tables.length})</span>
                  </button>
                </div>

                {/* Mode 2: 12-Sticker A4 Sheet */}
                <div className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all">
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-sm text-white">12-Sticker Sheet (A4)</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Prints 12 table QR badges arranged in a 3x4 grid on a single A4 page for adhesive paper.
                    </p>
                  </div>
                  <button
                    onClick={() => triggerPrint('STICKER_SHEET')}
                    className="w-full mt-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-md cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print 12-Sticker Sheet</span>
                  </button>
                </div>

                {/* Mode 3: Large Board Posters */}
                <div className="bg-slate-900/80 border border-slate-800 hover:border-sky-500/40 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all">
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-3">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-sm text-white">Full Board Posters (A4)</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Large format display poster with 3-step ordering guide and Wi-Fi badge.
                    </p>
                  </div>
                  <button
                    onClick={() => triggerPrint('ALL_POSTERS')}
                    className="w-full mt-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-md cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print All Posters ({tables.length})</span>
                  </button>
                </div>
              </div>

              {/* Batch Download Station */}
              <div className="mt-8 pt-6 border-t border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                  Batch Download HD Image Files (PNG)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    onClick={() => handleBatchDownload('STAND')}
                    disabled={isBatchRunning}
                    className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-700/80 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>All Stand PNGs</span>
                  </button>

                  <button
                    onClick={() => handleBatchDownload('POSTER')}
                    disabled={isBatchRunning}
                    className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-sky-300 border border-slate-700/80 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>All Poster PNGs</span>
                  </button>

                  <button
                    onClick={() => handleBatchDownload('STICKER')}
                    disabled={isBatchRunning}
                    className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700/80 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>All Sticker PNGs</span>
                  </button>

                  <button
                    onClick={() => handleBatchDownload('RAW_QR')}
                    disabled={isBatchRunning}
                    className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-purple-300 border border-slate-700/80 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>All Raw QR PNGs</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 4: VENUE BRANDING & WI-FI SETTINGS
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'SETTINGS' && (
          <div className="p-3 sm:p-6 max-w-4xl mx-auto w-full space-y-6">
            <div className="bg-[#0B1020] border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-xl space-y-6">
              <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
                    Venue Branding, Wi-Fi &amp; SaaS Domain Setup
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure the customer dining domain, Wi-Fi credentials printed on table tents, and theme styles.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Brand Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Restaurant Brand Name
                  </label>
                  <input
                    type="text"
                    value={draftConfig.brandName}
                    onChange={(e) => setDraftConfig({ ...draftConfig, brandName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Tagline */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Slogan / Subtitle
                  </label>
                  <input
                    type="text"
                    value={draftConfig.tagline}
                    onChange={(e) => setDraftConfig({ ...draftConfig, tagline: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Base Domain URL */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Customer Dining Base Domain URL
                    </label>
                    <button
                      type="button"
                      onClick={handleSetCurrentDomain}
                      className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                    >
                      Use Current Browser Origin ({typeof window !== 'undefined' ? window.location.origin : ''})
                    </button>
                  </div>
                  <input
                    type="text"
                    value={draftConfig.baseUrl}
                    onChange={(e) => setDraftConfig({ ...draftConfig, baseUrl: e.target.value })}
                    placeholder="https://your-restaurant-domain.com"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Wi-Fi SSID */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Guest Wi-Fi Network (SSID)
                  </label>
                  <input
                    type="text"
                    value={draftConfig.wifiSsid}
                    onChange={(e) => setDraftConfig({ ...draftConfig, wifiSsid: e.target.value })}
                    placeholder="e.g. AURA-Guest-5G"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Wi-Fi Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Guest Wi-Fi Password
                  </label>
                  <input
                    type="text"
                    value={draftConfig.wifiPassword}
                    onChange={(e) => setDraftConfig({ ...draftConfig, wifiPassword: e.target.value })}
                    placeholder="e.g. AuraDining2026"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Theme Style */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Stand Visual Theme
                  </label>
                  <select
                    value={draftConfig.themeStyle}
                    onChange={(e) => setDraftConfig({ ...draftConfig, themeStyle: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold cursor-pointer"
                  >
                    <option value="EMERALD_GOLD">Emerald &amp; Gold (Default)</option>
                    <option value="ROYAL_NOIR">Royal Noir (Sapphire &amp; Deep Navy)</option>
                    <option value="SUNSET_AMBER">Sunset Amber (Warm Charcoal &amp; Gold)</option>
                    <option value="CYBER_NEON">Cyber Neon (Violet &amp; Neon Accent)</option>
                    <option value="MINIMAL_IVORY">Minimal Ivory (Clean Print &amp; Ink-Friendly)</option>
                  </select>
                </div>

                {/* Show Wi-Fi Toggle */}
                <div className="flex items-center space-x-3 pt-6">
                  <input
                    type="checkbox"
                    id="showWifiToggle"
                    checked={draftConfig.showWifi}
                    onChange={(e) => setDraftConfig({ ...draftConfig, showWifi: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                  <label htmlFor="showWifiToggle" className="text-xs font-semibold text-slate-300 cursor-pointer">
                    Print Wi-Fi credentials on table stands &amp; posters
                  </label>
                </div>
              </div>

              {/* Save & Reset Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleResetVenueSettings}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Reset Defaults
                </button>

                <button
                  type="button"
                  onClick={handleSaveVenueSettings}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-950/50 cursor-pointer flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Venue Settings</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PRINT CONTAINER (Visible ONLY during window.print())
      ───────────────────────────────────────────────────────────── */}
      <div className="hidden print:block text-black bg-white w-full">
        <style>
          {`
            @media print {
              @page {
                size: auto;
                margin: 8mm;
              }
              body {
                background: white !important;
                color: black !important;
              }
              .no-print {
                display: none !important;
              }
              .page-break {
                page-break-after: always;
                break-after: page;
              }
            }
          `}
        </style>

        {/* PRINT MODE: ALL STANDS or SINGLE STAND */}
        {(printTarget.mode === 'ALL_STANDS' || printTarget.mode === 'STAND_SINGLE') && (
          <div>
            {(printTarget.mode === 'STAND_SINGLE'
              ? tables.filter((t) => String(t.tableNumber) === String(printTarget.tableNumber))
              : tables
            ).map((t) => {
              const qrUrl = qrCache[String(t.tableNumber)];

              return (
                <div
                  key={t.tableNumber}
                  className="page-break w-full max-w-lg mx-auto border-4 border-black rounded-3xl p-8 text-center flex flex-col items-center justify-between min-h-[90vh] my-4"
                >
                  <div>
                    <h2 className="font-serif text-lg font-bold tracking-widest uppercase">
                      ✦ {config.brandName || "SILIGURI'S CHAI ADDAA"} ✦
                    </h2>
                    <p className="text-xs italic text-gray-700 mt-1">
                      {config.tagline || 'Scan with Camera to Explore Menu & Order Instantly'}
                    </p>
                  </div>

                  {/* Table Plaque */}
                  <div className="border-2 border-black rounded-2xl py-3 px-8 my-4 bg-gray-100 w-full">
                    <div className="font-serif font-black text-4xl">TABLE {t.tableNumber}</div>
                    <div className="text-xs font-mono font-bold tracking-wider mt-1 text-gray-700">
                      {Number(t.tableNumber) === 10 ? 'VIP EXECUTIVE SUITE' : `MAIN DINING HALL • ${t.capacity || 4} GUESTS`}
                    </div>
                  </div>

                  {/* QR Box */}
                  <div className="border-2 border-black rounded-2xl p-4 my-2">
                    {qrUrl && <img src={qrUrl} alt={`Table ${t.tableNumber}`} className="w-64 h-64 mx-auto" />}
                  </div>

                  {/* 3 Steps */}
                  <div className="border border-gray-400 rounded-xl p-3 grid grid-cols-3 gap-2 text-xs w-full my-3">
                    <div>
                      <div className="font-bold">📷 STEP 1</div>
                      <div>Open Camera</div>
                    </div>
                    <div className="border-x border-gray-300">
                      <div className="font-bold">🎯 STEP 2</div>
                      <div>Point at QR</div>
                    </div>
                    <div>
                      <div className="font-bold">🍽️ STEP 3</div>
                      <div>Order Dishes</div>
                    </div>
                  </div>

                  {/* Wi-Fi */}
                  {config.showWifi && config.wifiSsid && (
                    <div className="border border-black rounded-lg py-1.5 px-4 text-xs font-bold my-1">
                      📶 Wi-Fi: {config.wifiSsid} • Password: {config.wifiPassword || 'None'}
                    </div>
                  )}

                  <div className="text-xs font-serif font-bold tracking-widest uppercase text-gray-800 mt-3">
                    ✦ {config.brandName || "SILIGURI'S CHAI ADDAA"} • TABLE {t.tableNumber} ✦
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PRINT MODE: 12-STICKER SHEET */}
        {printTarget.mode === 'STICKER_SHEET' && (
          <div className="p-4">
            <h2 className="text-center font-serif text-lg font-bold uppercase mb-4">
              {config.brandName || "SILIGURI'S CHAI ADDAA"}: TABLE QR STICKER SHEET
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {tables.slice(0, 12).map((t) => {
                const qrUrl = qrCache[String(t.tableNumber)];
                return (
                  <div
                    key={t.tableNumber}
                    className="border-2 border-black rounded-2xl p-3 text-center flex flex-col items-center justify-between aspect-square"
                  >
                    <div>
                      <div className="text-[10px] font-bold font-serif">✦ AURA ✦</div>
                      <div className="text-lg font-black font-serif">TABLE {t.tableNumber}</div>
                    </div>
                    {qrUrl && <img src={qrUrl} alt={`Table ${t.tableNumber}`} className="w-28 h-28 mx-auto" />}
                    <div className="text-[8px] font-bold tracking-wider">SCAN TO ORDER</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PRINT MODE: ALL POSTERS or SINGLE POSTER */}
        {(printTarget.mode === 'ALL_POSTERS' || printTarget.mode === 'POSTER_SINGLE') && (
          <div>
            {(printTarget.mode === 'POSTER_SINGLE'
              ? tables.filter((t) => String(t.tableNumber) === String(printTarget.tableNumber))
              : tables
            ).map((t) => {
              const qrUrl = qrCache[String(t.tableNumber)];

              return (
                <div
                  key={t.tableNumber}
                  className="page-break w-full max-w-2xl mx-auto border-8 border-black rounded-3xl p-10 text-center flex flex-col items-center justify-between min-h-[92vh] my-4"
                >
                  <div>
                    <h1 className="font-serif text-3xl font-black uppercase tracking-wider">
                      {config.brandName || "SILIGURI'S CHAI ADDAA"}
                    </h1>
                    <p className="text-sm italic text-gray-700 mt-1">
                      {config.tagline || 'Scan with Camera to Explore Menu & Order Instantly'}
                    </p>
                  </div>

                  <div className="border-4 border-black rounded-2xl py-4 px-12 my-6 bg-gray-100 w-full">
                    <div className="font-serif font-black text-5xl">TABLE {t.tableNumber}</div>
                    <div className="text-sm font-mono font-bold mt-1 text-gray-700">
                      MOUNTED BOARD &amp; ORDER DISPATCH
                    </div>
                  </div>

                  <div className="border-4 border-black rounded-3xl p-6 my-4">
                    {qrUrl && <img src={qrUrl} alt={`Table ${t.tableNumber}`} className="w-80 h-80 mx-auto" />}
                  </div>

                  <div className="border-2 border-gray-500 rounded-2xl p-4 grid grid-cols-3 gap-4 text-sm w-full my-4">
                    <div>
                      <div className="font-bold">📷 STEP 1</div>
                      <div>Open Camera</div>
                    </div>
                    <div className="border-x-2 border-gray-400">
                      <div className="font-bold">🎯 STEP 2</div>
                      <div>Point at QR</div>
                    </div>
                    <div>
                      <div className="font-bold">🍽️ STEP 3</div>
                      <div>Order Dishes</div>
                    </div>
                  </div>

                  {config.showWifi && config.wifiSsid && (
                    <div className="border-2 border-black rounded-xl py-2 px-6 text-sm font-bold my-2">
                      📶 Free Dining Wi-Fi: {config.wifiSsid} • Password: {config.wifiPassword || 'None'}
                    </div>
                  )}

                  <div className="text-sm font-serif font-bold tracking-widest uppercase text-gray-800 mt-3">
                    ✦ {config.brandName || "SILIGURI'S CHAI ADDAA"} • TABLE {t.tableNumber} ✦
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default QrGeneratorPage;
