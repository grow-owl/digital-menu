import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/use-auth-store';
import {
  ShieldCheck,
  Utensils,
  Eye,
  EyeOff,
  Lock,
  User as UserIcon,
  ArrowRight,
  ArrowLeft,
  ChefHat,
  LayoutDashboard,
  KeyRound,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  // Terminal Key Login State (Primary Authentication)
  const [searchParams] = useSearchParams();
  const urlTerminalKey = searchParams.get('terminalKey') || searchParams.get('stationKey') || '';
  
  const [terminalPasscode, setTerminalPasscode] = useState<string>(urlTerminalKey);
  const [isTerminalLoading, setIsTerminalLoading] = useState<string | null>(null); // 'OWNER' | 'CHEF' | null
  const [terminalError, setTerminalError] = useState<string | null>(null);

  // Email/Password Login State (Secondary Option)
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  useEffect(() => {
    // Purge any legacy stored terminal secrets from browser storage for security
    localStorage.removeItem('aura_saved_terminal_key');
    localStorage.removeItem('aura_terminal_authorized');

    if (urlTerminalKey) {
      setTerminalPasscode(urlTerminalKey);
    }
  }, [urlTerminalKey]);

  // Primary: Terminal Key Fast Authentication (Owner / Chef)
  const handleTerminalLogin = async (targetRole: 'OWNER' | 'CHEF') => {
    const cleanKey = terminalPasscode.trim().toUpperCase();
    if (!cleanKey) {
      setTerminalError('Please enter the Restaurant Access Key to launch the terminal.');
      return;
    }

    setIsTerminalLoading(targetRole);
    setTerminalError(null);

    try {
      const res = await authService.terminalLogin(cleanKey, targetRole);
      const user = res.user;
      const token = res.accessToken || res.token;

      setAuth(user, token, '', res.refreshToken);

      if (targetRole === 'CHEF') {
        navigate('/kitchen');
      } else {
        navigate('/admin');
      }
    } catch (err: any) {
      console.error('Terminal Login Error:', err);
      setTerminalError(err.response?.data?.message || 'Invalid Restaurant Access Key. Please check with the restaurant owner.');
    } finally {
      setIsTerminalLoading(null);
    }
  };

  // Secondary: Traditional Email & Password Login
  const handleEmailLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setEmailError('Please enter your staff email and password.');
      return;
    }

    setIsEmailLoading(true);
    setEmailError(null);

    try {
      const data = await authService.login({ identifier: identifier.trim(), password });
      const user = data.user;
      const token = data.accessToken || data.token;

      setAuth(user, token, '', data.refreshToken);

      const userRole = (user.role || '').toUpperCase();
      if (userRole === 'CHEF') {
        navigate('/kitchen');
      } else {
        navigate('/admin');
      }
    } catch (err: any) {
      console.error('Email Login Error:', err);
      setEmailError(err.response?.data?.message || 'Invalid credentials. Please verify your staff email and password.');
    } finally {
      setIsEmailLoading(false);
    }
  };

  return (
    <div className="page-theme-login min-h-screen bg-theme-bg text-theme-text flex relative overflow-hidden font-sans">
      {/* Back to Home Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-20 flex items-center space-x-2 px-3.5 py-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-lg"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Website</span>
      </button>

      {/* Left Panel: Luxury Culinary Atmosphere */}
      <div className="hidden lg:flex flex-1 relative bg-[#0B0F17] border-r border-slate-800/80 p-12 flex-col justify-between overflow-hidden">
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center opacity-25"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1400&q=80")',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090E] via-[#0B0F17]/80 to-transparent" />

        <div className="relative z-10 space-y-3 pt-12">
          <div className="w-12 h-12 bg-white/5 border border-slate-700 rounded-2xl flex items-center justify-center shadow-md">
            <Utensils className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-widest text-white">SILIGURI'S CHAI ADDAA</h1>
          <p className="text-xs text-emerald-400 uppercase tracking-[0.2em] font-mono font-bold">Staff &amp; Operations Terminal</p>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <h2 className="font-serif text-2xl font-bold leading-snug text-slate-100">
            "Coordinating table orders, live kitchen preparation, floor dispatch, and table billing in real time."
          </h2>
          <div className="grid grid-cols-3 gap-4 border-t border-slate-800 pt-6">
            <div>
              <h3 className="text-xl font-black text-white font-mono">30 Tables</h3>
              <p className="text-[10px] text-slate-400 uppercase font-mono">Floor Grid</p>
            </div>
            <div>
              <h3 className="text-xl font-black text-amber-400 font-mono">Live KDS</h3>
              <p className="text-[10px] text-slate-400 uppercase font-mono">Kitchen Tickets</p>
            </div>
            <div>
              <h3 className="text-xl font-black text-emerald-400 font-mono">Table Billing</h3>
              <p className="text-[10px] text-slate-400 uppercase font-mono">Fast Settlement</p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-[10px] text-slate-500 font-mono">
          &copy; {new Date().getFullYear()} Siliguri's Chai Addaa. Authorized Personnel Only.
        </p>
      </div>

      {/* Right Panel: Staff Login */}
      <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-8 lg:p-12 z-10 overflow-y-auto my-auto py-8 sm:py-12 w-full">
        <div className="w-full max-w-md bg-[#0D121F]/90 backdrop-blur-2xl border border-slate-800/90 p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl space-y-6">

          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center justify-center px-3 py-1 bg-slate-800/80 border border-slate-700 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
              <span className="font-mono text-[10px] tracking-widest text-slate-300 font-bold uppercase">Staff Workspace Access</span>
            </div>
            <h2 className="text-2xl font-black text-white">Station Sign In</h2>
            <p className="text-xs text-slate-400">Launch your management console or kitchen KDS</p>
          </div>

          {/* PRIMARY OPTION: Fast Terminal Key Access */}
          <div className="p-4 sm:p-5 bg-[#070A12]/95 border border-slate-800/90 rounded-2xl space-y-4 shadow-inner">
            <div className="flex items-center space-x-2 text-white">
              <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Fast Access via Terminal Key</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Enter your Restaurant Access Key to sign in instantly without email or password.
            </p>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono text-slate-300 uppercase tracking-wider">
                Restaurant Access Key
              </label>
              <input
                type="password"
                value={terminalPasscode}
                onChange={(e) => {
                  setTerminalPasscode(e.target.value.toUpperCase());
                  setTerminalError(null);
                }}
                placeholder="Enter Terminal Key"
                className="w-full px-3.5 py-3 bg-[#0D121F] border border-slate-700 rounded-xl text-white text-xs font-mono tracking-widest focus:outline-none focus:border-amber-400 transition-colors uppercase placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-600"
              />
            </div>

            {terminalError && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs text-center font-medium leading-relaxed">
                {terminalError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                disabled={isTerminalLoading !== null}
                onClick={() => handleTerminalLogin('OWNER')}
                className="p-3 bg-gradient-to-b from-indigo-950/60 to-indigo-900/30 hover:from-indigo-900/80 hover:to-indigo-800/50 border border-indigo-500/40 hover:border-indigo-400 text-white rounded-xl transition-all flex flex-col items-center justify-center space-y-1.5 cursor-pointer disabled:opacity-50 active:scale-95 group shadow-sm"
              >
                <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg group-hover:scale-110 transition-transform">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <span className="font-bold text-xs text-center leading-tight">
                  {isTerminalLoading === 'OWNER' ? 'Connecting...' : 'Owner / Admin'}
                </span>
                <span className="text-[9px] text-indigo-300/70 font-mono">Full Console</span>
              </button>

              <button
                type="button"
                disabled={isTerminalLoading !== null}
                onClick={() => handleTerminalLogin('CHEF')}
                className="p-3 bg-gradient-to-b from-amber-950/60 to-amber-900/30 hover:from-amber-900/80 hover:to-amber-800/50 border border-amber-500/40 hover:border-amber-400 text-white rounded-xl transition-all flex flex-col items-center justify-center space-y-1.5 cursor-pointer disabled:opacity-50 active:scale-95 group shadow-sm"
              >
                <div className="p-2 bg-amber-500/20 text-amber-300 rounded-lg group-hover:scale-110 transition-transform">
                  <ChefHat className="w-5 h-5" />
                </div>
                <span className="font-bold text-xs text-center leading-tight">
                  {isTerminalLoading === 'CHEF' ? 'Connecting...' : 'Head Chef'}
                </span>
                <span className="text-[9px] text-amber-300/70 font-mono">Kitchen KDS</span>
              </button>
            </div>
          </div>

          {/* SECONDARY OPTION: Email & Password Collapsible */}
          <div className="border-t border-slate-800/80 pt-4 space-y-3">
            <button
              type="button"
              onClick={() => setShowEmailLogin(!showEmailLogin)}
              className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-white py-1 px-1 transition-colors cursor-pointer"
            >
              <span className="flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Or sign in with Email &amp; Password</span>
              </span>
              {showEmailLogin ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showEmailLogin && (
              <form onSubmit={handleEmailLoginSubmit} className="space-y-3 pt-2">
                {emailError && (
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs text-center font-medium leading-relaxed">
                    {emailError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Staff Email or ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. staff@chaiaddaa.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#070A12] border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-[#070A12] border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-2.5 text-slate-500 hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isEmailLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  <span>{isEmailLoading ? 'Authenticating...' : 'Sign In with Password'}</span>
                  {!isEmailLoading && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
export default LoginPage;
