import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Outlet } from 'react-router-dom';
import { useTableStore } from '../store/use-table-store';
import { useAuthStore } from '../store/use-auth-store';
import { tableService } from '../services/table.service';
import { Loader2, QrCode, ShieldCheck, Utensils, AlertCircle, Camera } from 'lucide-react';
import { TableQrScanModal } from '../components/customer/TableQrScanModal';

// Session expires after 4 hours of inactivity
const SESSION_EXPIRY_MS = 4 * 60 * 60 * 1000;

// Client-side JWT expiration check
const isTokenExpired = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
};

export const TableSessionRoute: React.FC = () => {
  const { tableId, orderId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const { activeTableId, activeSessionId, qrToken, isVerified, verifiedAt, setActiveSession, clearSession } = useTableStore();
  const { user, isAuthenticated, token: authToken } = useAuthStore();

  const [isValidating, setIsValidating] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Strict Admin verification — ONLY genuinely authenticated Admins/Owners with a valid, non-expired JWT
  const isAdmin = React.useMemo(() => {
    if (!isAuthenticated || !authToken || isTokenExpired(authToken) || !user) return false;
    const normalizedRole = String(user.role || '').toUpperCase();
    return ['OWNER', 'ADMIN', 'MANAGER', 'RESTAURANT_OWNER'].includes(normalizedRole);
  }, [user, isAuthenticated, authToken]);

  // Check if the current session is still valid (not expired) OR authorized Admin preview
  const isSessionValid = React.useMemo(() => {
    // Verified Admin/Owner can preview and inspect customer menu directly without physical table QR scan
    if (isAdmin) return true;
    if (!activeTableId || !isVerified || !verifiedAt) return false;
    const elapsed = Date.now() - verifiedAt;
    return elapsed < SESSION_EXPIRY_MS;
  }, [activeTableId, isVerified, verifiedAt, isAdmin]);

  // Auto-clear expired sessions on mount
  useEffect(() => {
    if (activeTableId && verifiedAt) {
      const elapsed = Date.now() - verifiedAt;
      if (elapsed >= SESSION_EXPIRY_MS) {
        clearSession();
      }
    }
  }, []);

  // If a legacy URL with /table/:tableId was hit, securely seed/validate and transition to clean masked URL /menu
  useEffect(() => {
    const handleLegacyTableParam = async () => {
      if (!tableId) return;

      setIsValidating(true);
      try {
        let data;
        if (token) {
          // Only allow legacy route if a real QR token is provided
          data = await tableService.validateQr(tableId, token, user?._id).catch(() => null);
        } else {
          // No token on legacy route → require QR scan
          setIsValidating(false);
          return;
        }

        const finalTableNum = String(data?.tableNumber || data?.table?.tableNumber || tableId);
        const finalSessId = data?.session?.sessionId || `SESS-T${tableId}-${Date.now().toString().slice(-4)}`;
        const finalToken = data?.table?.qrToken || data?.qrToken || token || 'table-token';

        setActiveSession(finalTableNum, finalSessId, finalToken, true);

        // Clean the address bar: Transition away from /table/:tableId/menu to /menu (or /order/:orderId)
        if (orderId) {
          navigate(`/order/${orderId}`, { replace: true });
        } else {
          navigate('/menu', { replace: true });
        }
      } catch (err: any) {
        // On error, require QR scan
        setIsValidating(false);
      } finally {
        setIsValidating(false);
      }
    };

    if (tableId && token) {
      handleLegacyTableParam();
    }
  }, [tableId, token, orderId, user, navigate, setActiveSession]);

  if (isValidating) {
    return (
      <div className="min-h-screen bg-[#070A12] flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
          <Loader2 className="w-7 h-7 text-emerald-400 animate-spin" />
        </div>
        <h3 className="font-serif text-lg font-bold text-slate-100">Securing Table Session</h3>
        <p className="text-xs text-slate-400 font-mono mt-1">Validating QR token with server...</p>
      </div>
    );
  }

  // If there's a valid, non-expired verified table session, allow access to the menu
  if (isSessionValid) {
    return <Outlet />;
  }

  // If NO valid table session exists — require QR scan (no manual bypass)
  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(16,185,129,0.08),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(217,119,6,0.05),transparent_60%)]" />

      <div className="w-full max-w-md bg-[#0D121F]/95 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 text-center space-y-6">
        {/* Brand Crest */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-slate-900/80 border border-slate-700/80 rounded-full">
          <Utensils className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-serif tracking-widest text-[11px] text-slate-300 font-bold uppercase">
            Siliguri's Chai Addaa
          </span>
        </div>

        {/* Security QR Shield Icon */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-[#9d785e]/40 animate-spin-slow" />
          <div className="w-16 h-16 rounded-2xl bg-[#9d785e]/15 border border-[#9d785e]/40 flex items-center justify-center shadow-lg shadow-[#9d785e]/10">
            <QrCode className="w-8 h-8 text-[#9d785e]" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-full text-amber-300 font-mono text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Table Verification Required</span>
          </div>
          <h2 className="text-2xl font-bold text-white font-serif tracking-wide">
            Scan Your Table QR Code
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            Please scan the QR code placed on your table to access the digital menu. This ensures your order is routed to the correct table.
          </p>
        </div>

        {/* Expired Session Notice */}
        {activeTableId && !isSessionValid && (
          <div className="flex items-start space-x-2 p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-left">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-rose-300 leading-relaxed">
              Your previous session has expired. Please scan the QR code on your table to continue.
            </p>
          </div>
        )}

        {/* Scan QR Button Only */}
        <div className="p-4 bg-[#070A12]/90 border border-slate-800/90 rounded-2xl space-y-3 text-left">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="w-full py-4 bg-[#9d785e] hover:bg-[#86644d] text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
          >
            <Camera className="w-5 h-5" />
            <span>Scan Table QR Code</span>
          </button>
          <p className="text-center text-[10px] text-slate-500 font-mono">
            Use your camera to scan the QR stand on your table
          </p>
        </div>

        {/* Return to Landing Page */}
        <div className="pt-1">
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Return to Home
          </button>
        </div>
      </div>

      <TableQrScanModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        defaultTableId="1"
      />
    </div>
  );
};

export default TableSessionRoute;
