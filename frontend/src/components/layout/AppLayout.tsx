import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CommandPalette } from '../navigation/CommandPalette';
import { useAuthStore } from '../../store/use-auth-store';
import {
  ShieldCheck, Award, ChefHat, Layers, Receipt, Utensils, QrCode,
  Search, Bell, LogOut, Clock, ChevronLeft, ChevronRight, Menu, X, Activity
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = (user?.role || 'ADMIN').toUpperCase();
  const userName = user?.name || 'Authorized Staff';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter navigation items dynamically based on staff role
  const getRoleNavLinks = () => {
    const isOwner = userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'RESTAURANT_OWNER' || userRole === 'MANAGER';
    const isChef = userRole === 'CHEF' || userRole === 'KITCHEN';
    const isWaiter = userRole === 'WAITER';

    const sections = [];

    // Owner / Management Section
    if (isOwner) {
      sections.push({
        section: 'MANAGEMENT',
        items: [
          { name: 'Admin Operations & Billing', shortName: 'Admin', path: '/admin', icon: ShieldCheck, accent: 'text-indigo-400', activeBg: 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300' },
          { name: 'QR Table Stands & Print', shortName: 'QR Studio', path: '/admin/qr-generator', icon: QrCode, accent: 'text-emerald-400', activeBg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' },
        ]
      });
    }

    // Operations Section
    const opsItems = [];
    if (isOwner || isChef) {
      opsItems.push({ name: 'Kitchen', shortName: 'Kitchen', path: '/kitchen', icon: ChefHat, accent: 'text-amber-400', activeBg: 'bg-amber-500/15 border-amber-500/40 text-amber-300' });
    }
    if (isOwner || isWaiter) {
      opsItems.push({ name: 'Waiter', shortName: 'Waiter', path: '/waiter', icon: Layers, accent: 'text-cyan-400', activeBg: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300' });
    }

    if (opsItems.length > 0) {
      sections.push({
        section: 'OPERATIONS',
        items: opsItems
      });
    }

    // Customer View Section
    sections.push({
      section: 'GUEST EXPERIENCE',
      items: [
        { name: 'Customer Menu', shortName: 'Menu', path: '/menu', icon: Utensils, accent: 'text-[#0C831F]', activeBg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' }
      ]
    });

    return sections;
  };

  const navSections = getRoleNavLinks();

  // Active Portal Identity Styling
  const getPortalMeta = () => {
    if (location.pathname.startsWith('/admin')) {
      return { 
        label: 'ADMIN & OPERATIONS PORTAL', 
        badgeColor: 'bg-theme-primary-light text-theme-primary border-theme-primary/30',
        themeClass: 'page-theme-admin'
      };
    }
    if (location.pathname.startsWith('/kitchen')) {
      return { 
        label: 'KITCHEN', 
        badgeColor: 'bg-theme-primary-light text-theme-primary border-theme-primary/30',
        themeClass: 'page-theme-kitchen'
      };
    }
    if (location.pathname.startsWith('/waiter')) {
      return { 
        label: 'WAITER', 
        badgeColor: 'bg-theme-primary-light text-theme-primary border-theme-primary/30',
        themeClass: 'page-theme-waiter'
      };
    }
    return { 
      label: 'OPERATIONS PORTAL', 
      badgeColor: 'bg-theme-primary-light text-theme-primary border-theme-primary/30',
      themeClass: 'page-theme-admin'
    };
  };

  const portalMeta = getPortalMeta();
  const isOperationalRoute = ['/waiter', '/kitchen'].some(path => location.pathname.startsWith(path));

  return (
    <div className={`dark h-screen ${portalMeta.themeClass} bg-theme-bg text-theme-text flex overflow-hidden font-sans`}>
      {/* ─────────────────────────────────────────────────────────────
          DESKTOP COLLAPSIBLE SIDEBAR (Only on Management Pages: Admin, CEO, Settings)
      ───────────────────────────────────────────────────────────── */}
      {!isOperationalRoute && (
        <aside
          className={`hidden md:flex flex-col flex-shrink-0 bg-theme-surface border-r border-theme-border transition-all duration-300 z-30 select-none ${
            isSidebarCollapsed ? 'w-18' : 'w-60'
          }`}
        >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-theme-border flex items-center justify-between">
          <div
            onClick={() => navigate('/')}
            className="flex items-center space-x-3 cursor-pointer overflow-hidden min-w-0"
          >
            <div className="w-9 h-9 rounded-xl bg-theme-bg border border-theme-border flex items-center justify-center flex-shrink-0 shadow-md">
              <Utensils className="w-4 h-4 text-theme-primary" />
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-serif font-black text-sm tracking-wider text-theme-text">CHAI ADDAA</span>
                  <span className="inline-flex h-2 w-2 rounded-full bg-theme-primary animate-pulse" />
                </div>
                <p className="text-[9px] font-mono text-theme-muted uppercase tracking-widest truncate">Siliguri Ops</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-surface-hover transition-colors cursor-pointer"
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Portal Identifier Badge (when expanded) */}
        {!isSidebarCollapsed && (
          <div className="px-4 py-2.5 border-b border-theme-border bg-theme-bg/60">
            <div className="flex items-center justify-between">
              <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded border uppercase tracking-wider ${portalMeta.badgeColor}`}>
                {portalMeta.label}
              </span>
              <span className="text-[9px] text-slate-500 font-mono font-semibold">{userRole}</span>
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {navSections.map((sec, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!isSidebarCollapsed && (
                <p className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  {sec.section}
                </p>
              )}
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path) && item.path !== '/';
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    title={isSidebarCollapsed ? item.name : undefined}
                    className={`w-full flex items-center rounded-xl transition-all cursor-pointer border ${
                      isSidebarCollapsed ? 'justify-center p-3' : 'px-3 py-2.5 space-x-3 text-left'
                    } ${
                      isActive
                        ? `${item.activeBg} font-bold shadow-md shadow-black/40`
                        : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-850 hover:border-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? item.accent : 'text-slate-400'}`} />
                    {!isSidebarCollapsed && (
                      <span className="text-xs font-semibold truncate text-slate-200">
                        {item.name}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-3 border-t border-theme-border bg-theme-bg/80 space-y-2">
          {!isSidebarCollapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-theme-primary-light border border-theme-primary/30 flex items-center justify-center font-bold text-theme-primary text-xs flex-shrink-0">
                  {userName.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-theme-text truncate">{userName}</p>
                  <p className="text-[10px] text-theme-muted font-mono truncate">{userRole}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  logout();
                  navigate('/staff-access');
                }}
                className="p-1.5 text-theme-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                logout();
                navigate('/staff-access');
              }}
              className="w-full flex justify-center p-2 text-theme-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          {!isSidebarCollapsed && (
            <div className="flex items-center justify-between pt-2 border-t border-theme-border/50 text-[10px] font-mono text-theme-muted">
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-theme-muted" />
                <span>{currentTime}</span>
              </span>
              <span className="text-theme-primary font-bold">CONNECTED</span>
            </div>
          )}
        </div>
      </aside>
      )}

      {/* ─────────────────────────────────────────────────────────────
          RIGHT MAIN WORKSPACE AREA (TOP HEADER + CONTENT)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-14 px-3 sm:px-6 bg-theme-surface/95 backdrop-blur-xl border-b border-theme-border flex items-center justify-between z-20 flex-shrink-0">
          {/* Left: Menu Toggle & Workspace Identifier */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 ${isOperationalRoute ? 'flex' : 'md:hidden'} text-theme-muted hover:text-theme-text rounded-lg hover:bg-theme-surface-hover cursor-pointer transition-colors`}
              title="Open Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {isOperationalRoute && (
              <div
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 cursor-pointer pr-2.5 border-r border-theme-border"
              >
                <div className="w-7 h-7 rounded-lg bg-theme-primary/10 border border-theme-primary/30 flex items-center justify-center">
                  <Utensils className="w-3.5 h-3.5 text-theme-primary" />
                </div>
                <span className="font-serif font-black text-xs tracking-wider text-theme-text hidden sm:inline">CHAI ADDAA</span>
              </div>
            )}

            <div className="flex items-center space-x-2 min-w-0">
              <span className="text-xs font-mono font-bold text-theme-muted hidden sm:inline">WORKSPACE /</span>
              <span className="text-xs font-bold text-theme-text tracking-wide truncate">{portalMeta.label}</span>
            </div>
          </div>

          {/* Right: Clock & Portal Direct Actions */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            <div className="px-3 py-1.5 bg-theme-bg border border-theme-border rounded-xl text-xs font-mono text-theme-primary items-center space-x-1.5 hidden md:flex">
              <Activity className="w-3.5 h-3.5 text-theme-primary" />
              <span>{currentTime}</span>
            </div>
          </div>
        </header>

        {/* Navigation Drawer (Mobile & Operational Desktop) */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-72 bg-theme-surface border-r border-theme-border h-full p-4 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-theme-border">
                  <div className="flex items-center space-x-2">
                    <Utensils className="w-5 h-5 text-theme-primary" />
                    <span className="font-serif font-bold text-theme-text tracking-wider">CHAI ADDAA WORKSPACE</span>
                  </div>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 text-theme-muted hover:text-theme-text">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {navSections.map((sec, sIdx) => (
                    <div key={sIdx} className="space-y-1">
                      <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-theme-muted px-2">
                        {sec.section}
                      </p>
                      {sec.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                          <button
                            key={item.path}
                            onClick={() => {
                              navigate(item.path);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                              isActive
                                ? `${item.activeBg}`
                                : 'border-transparent text-theme-muted hover:text-theme-text hover:bg-theme-surface-hover'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-theme-border flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-theme-text">{userName}</p>
                  <p className="text-[10px] text-theme-muted font-mono">{userRole}</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    navigate('/staff-access');
                  }}
                  className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Workspace — Page controls its own scroll */}
        <main className="flex-1 min-h-0 overflow-hidden bg-theme-bg flex flex-col">
          {children}
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </div>
  );
};

export default AppLayout;
