import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tableService } from '../../services/table.service';
import { useTableStore } from '../../store/use-table-store';
import { useAuthStore } from '../../store/use-auth-store';
import { QrCode, ShieldCheck, AlertCircle, Utensils, ArrowRight, Loader2, Sparkles } from 'lucide-react';

export const DineScanPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const setActiveSession = useTableStore((state) => state.setActiveSession);
  const user = useAuthStore((state) => state.user);

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [tableData, setTableData] = useState<{ tableNumber: string; sessionId: string; qrToken: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const performScanVerification = async () => {
      if (!token) {
        setStatus('error');
        setErrorMessage('No table QR token detected. Please scan the QR code located on your dining table.');
        return;
      }

      try {
        setStatus('verifying');
        const data = await tableService.scanTable(token, user?._id);

        if (!isMounted) return;

        const tableNum = String(data.tableNumber || '10');
        const sessId = data.sessionId || `SESS-T${tableNum}-${Date.now()}`;
        const qrTok = data.qrToken || token;

        setTableData({ tableNumber: tableNum, sessionId: sessId, qrToken: qrTok });
        setActiveSession(tableNum, sessId, qrTok, true);
        setStatus('success');

        // Elegant brief delay to show verified animation before seamless menu entrance
        setTimeout(() => {
          if (isMounted) {
            navigate('/menu', { replace: true });
          }
        }, 1200);
      } catch (err: any) {
        if (!isMounted) return;
        setStatus('error');
        setErrorMessage(
          err.response?.data?.message ||
            'Unable to verify this table QR code. Please ensure you are scanning the official QR code at your dining table or request staff assistance.'
        );
      }
    };

    performScanVerification();

    return () => {
      isMounted = false;
    };
  }, [token, user, navigate, setActiveSession]);

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(16,185,129,0.08),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(217,119,6,0.05),transparent_60%)]" />

      <div className="w-full max-w-md bg-[#0D121F]/90 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10 text-center space-y-6">
        {/* Brand Crest */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-slate-900/80 border border-slate-700/80 rounded-full">
          <Utensils className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-serif tracking-widest text-[11px] text-slate-300 font-bold uppercase">
            Siliguri's Chai Addaa
          </span>

        </div>

        {status === 'verifying' && (
          <div className="space-y-5 py-4">
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-emerald-500/40 animate-spin-slow" />
              <div className="w-16 h-16 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <QrCode className="w-8 h-8 text-emerald-400 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white font-serif tracking-wide">
                Verifying Table Seating
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                Validating your cryptographic table QR token with the culinary dispatch server...
              </p>
            </div>

            <div className="flex items-center justify-center space-x-2 text-[11px] font-mono text-emerald-400 font-bold">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Authenticating Table Session</span>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-5 py-4 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-10 h-10 text-emerald-400" />
            </div>

            <div className="space-y-2">
              <div className="inline-block px-3 py-1 bg-emerald-500/15 border border-emerald-500/40 rounded-full text-emerald-300 font-mono text-xs font-bold">
                Table {tableData?.tableNumber} Verified ✓
              </div>
              <h2 className="text-2xl font-bold text-white font-serif">
                Welcome to Table {tableData?.tableNumber}
              </h2>
              <p className="text-xs text-slate-400">
                Opening live digital menu and table cart...
              </p>
            </div>

            <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-400 h-full w-full animate-pulse transition-all duration-1000" />
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-5 py-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-rose-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white font-serif">
                Invalid Table QR Code
              </h2>
              <p className="text-xs text-rose-300/90 leading-relaxed bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-xl">
                {errorMessage}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 bg-[#9d785e] hover:bg-[#86644d] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md"
              >
                Return to Homepage
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DineScanPage;
