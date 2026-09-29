import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/use-auth-store';
import { Role } from '../types/user.types';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

// Decode JWT and check if it's expired (client-side check only, server still validates)
const isTokenExpired = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    // exp is in seconds, Date.now() is in ms
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated, token, logout } = useAuthStore();

  // Require login + valid token
  if (!isAuthenticated || !user || !token) {
    return <Navigate to="/staff-access" replace />;
  }

  // If JWT is expired, clear auth and redirect to login
  if (isTokenExpired(token)) {
    // Call logout asynchronously so we don't mutate state during render
    setTimeout(() => logout(), 0);
    return <Navigate to="/staff-access" replace />;
  }

  const normalizedUserRole: Role | null = user.role
    ? (() => {
        const upper = String(user.role).toUpperCase();
        if (upper === 'ADMIN' || upper === 'RESTAURANT_OWNER' || upper === 'MANAGER' || upper === 'SUPER_ADMIN') return 'OWNER';
        if (upper === 'KITCHEN') return 'CHEF';
        if (['OWNER', 'CHEF', 'WAITER', 'CUSTOMER'].includes(upper)) {
          return upper as Role;
        }
        return 'CUSTOMER';
      })()
    : null;

  const isAuthorized = !allowedRoles || allowedRoles.length === 0 || (
    normalizedUserRole && (
      normalizedUserRole === 'OWNER' ||
      allowedRoles.some((r) => {
        const target = (r === ('ADMIN' as any) || r === ('RESTAURANT_OWNER' as any)) ? 'OWNER' : r;
        return target === normalizedUserRole;
      })
    )
  );

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-aura-obsidian text-aura-ivory flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            403
          </div>
          <h1 className="font-serif text-3xl font-bold text-aura-ivory">Access Restricted</h1>
          <p className="text-aura-slate text-sm">
            Your user role <span className="font-mono text-[#38BDF8] font-bold">{user.role}</span> does not have privilege to access this module.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2.5 bg-[#0EA5E9] hover:bg-[#0284C7] text-[#090A0F] font-bold rounded-xl text-sm transition-all border border-[#7DD3FC]/50"
          >
            Return to Homepage
          </a>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
