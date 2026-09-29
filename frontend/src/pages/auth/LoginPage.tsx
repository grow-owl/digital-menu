import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/use-auth-store';
import { ShieldCheck, Utensils, Eye, EyeOff, Lock, User as UserIcon, ArrowRight, ArrowLeft, ChefHat, UserCheck, CreditCard, LayoutDashboard, Award, Sparkles, KeyRound, CheckCircle2, Tablet } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('chef@aura.com');
  const [password, setPassword] = useState('chef123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Terminal Authorization State (Restricts 1-Click Fast Login to authorized restaurant devices)
  const [searchParams] = useSearchParams();
  const terminalKeyParam = searchParams.get('terminalKey') || searchParams.get('stationKey');

  const [isTerminalAuthorized, setIsTerminalAuthorized] = useState<boolean>(() => {
    if (terminalKeyParam && ['AURA2026', '8888', 'AURA'].includes(terminalKeyParam.toUpperCase())) {
      localStorage.setItem('aura_terminal_authorized', 'true');
      return true;
    }
    return localStorage.getItem('aura_terminal_authorized') === 'true';
  });

  const [showPasscodeForm, setShowPasscodeForm] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);

  const handleUnlockTerminal = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = passcodeInput.trim().toUpperCase();
    if (clean === 'AURA2026' || clean === '8888' || clean === 'AURA' || clean === 'STAFF') {
      localStorage.setItem('aura_terminal_authorized', 'true');
      setIsTerminalAuthorized(true);
      setShowPasscodeForm(false);
      setPasscodeInput('');
      setPasscodeError(null);
    } else {
      setPasscodeError('Invalid Master Passcode. (Hint: Default is AURA2026)');
    }
  };

  const handleLockTerminal = () => {
    localStorage.removeItem('aura_terminal_authorized');
    setIsTerminalAuthorized(false);
    setShowPasscodeForm(false);
  };

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleLoginSubmit = async (loginId: string, loginPass: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await authService.login({ identifier: loginId, password: loginPass });
      const user = data.user;
      const token = data.accessToken || data.token;

      setAuth(user, token, '', data.refreshToken);

      // Dynamic Role-Based Redirection
      const userRole = (user.role || '').toUpperCase();
      switch (userRole) {
        case 'CHEF':
        case 'KITCHEN':
          navigate('/kitchen');
          break;
        case 'WAITER':
          navigate('/waiter');
          break;
        case 'RESTAURANT_OWNER':
        case 'OWNER':
        case 'ADMIN':
        case 'MANAGER':
        default:
          navigate('/admin');
          break;
      }
    } catch (err: any) {
      console.error('Login Error:', err);
      setError(err.response?.data?.message || 'Invalid credentials. Please verify your staff email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please enter your staff ID / email and password');
      return;
    }
    handleLoginSubmit(identifier, password);
  };

  const quickRoles = [
    { role: 'OWNER', title: 'Restaurant Admin / Owner', email: 'owner@aura.com', pass: 'owner123', badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', icon: <LayoutDashboard className="w-4 h-4 text-indigo-400" /> },
    { role: 'CHEF', title: 'Head Chef KDS', email: 'chef@aura.com', pass: 'chef123', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: <ChefHat className="w-4 h-4 text-amber-400" /> },
    { role: 'WAITER', title: 'Floor Waiter', email: 'waiter@aura.com', pass: 'waiter123', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: <UserCheck className="w-4 h-4 text-emerald-400" /> },
  ];

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

      {/* Left Panel: High-Impact Luxury Culinary Atmosphere */}
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

      {/* Right Panel: Staff Login & Role Fast Access */}
      <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-8 lg:p-12 z-10 overflow-y-auto my-auto py-8 sm:py-12 w-full">
        <div className="w-full max-w-md bg-[#0D121F]/90 backdrop-blur-2xl border border-slate-800/90 p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl space-y-6">

          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center justify-center px-3 py-1 bg-slate-800/80 border border-slate-700 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
              <span className="font-mono text-[10px] tracking-widest text-slate-300 font-bold uppercase">Staff Workspace Access</span>
            </div>
            <h2 className="text-2xl font-black text-white">Staff Sign In</h2>
            <p className="text-xs text-slate-400">Sign in to your operational terminal</p>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs text-center font-medium leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Staff Email or ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="chef@aura.com"
                  className="w-full pl-10 pr-4 py-3 bg-[#070A12] border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Password</label>
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
                  className="w-full pl-10 pr-10 py-3 bg-[#070A12] border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              <span>{isLoading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Fast Staff Access Presets (Protected by Terminal Authorization) */}
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            {isTerminalAuthorized ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-[11px] font-mono font-bold text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Authorized Terminal (1-Click Active)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLockTerminal}
                    className="text-[10px] text-slate-400 hover:text-rose-400 font-mono underline cursor-pointer"
                    title="Lock 1-Click Presets on this Device"
                  >
                    Lock Station
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {quickRoles.map((item) => (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => {
                        setIdentifier(item.email);
                        setPassword(item.pass);
                        handleLoginSubmit(item.email, item.pass);
                      }}
                      className="p-2.5 bg-[#070A12]/90 border border-slate-800/90 hover:border-emerald-500/50 text-left rounded-xl transition-all flex items-center space-x-2 group cursor-pointer"
                    >
                      <div className="p-1.5 bg-slate-900 rounded-lg border border-slate-800 group-hover:border-emerald-500/40">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-white truncate">{item.title}</h4>
                        <span className="text-[9px] text-slate-500 font-mono block truncate">{item.email}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-4 bg-[#070A12]/95 border border-slate-800/90 rounded-2xl text-center space-y-3 shadow-inner">
                <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">1-Click Fast Login Locked</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    1-Click role switching is secured to protect kitchen and POS stations from unauthorized guest access.
                  </p>
                </div>

                {!showPasscodeForm ? (
                  <button
                    type="button"
                    onClick={() => setShowPasscodeForm(true)}
                    className="w-full py-2.5 px-3 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Authorize Restaurant Terminal</span>
                  </button>
                ) : (
                  <form onSubmit={handleUnlockTerminal} className="space-y-2 pt-1 text-left">
                    <label className="block text-[10px] font-mono text-slate-300 uppercase tracking-wider">
                      Master Terminal Passcode (Default: <span className="text-emerald-400 font-bold">AURA2026</span>)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="password"
                        autoFocus
                        value={passcodeInput}
                        onChange={(e) => {
                          setPasscodeInput(e.target.value);
                          setPasscodeError(null);
                        }}
                        placeholder="e.g. AURA2026"
                        className="flex-1 py-2 px-3 bg-[#0D121F] border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="submit"
                        className="py-2 px-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shrink-0"
                      >
                        Unlock
                      </button>
                    </div>
                    {passcodeError && (
                      <p className="text-[10px] text-rose-400 font-mono">{passcodeError}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPasscodeForm(false)}
                      className="text-[10px] text-slate-500 hover:text-slate-400 underline font-mono cursor-pointer"
                    >
                      Cancel
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
