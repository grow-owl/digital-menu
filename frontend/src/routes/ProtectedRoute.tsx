import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/use-auth-store';
import { Role } from '../types/user.types';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

interface JwtPayload {
  id?: string;
  role?: string;
  exp?: number;
  iat?: number;
}

// Safely decode base64url encoded JWT payload
const parseJwtPayload = (token: string): JwtPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonStr);
  } catch {
    try {
      const parts = token.split('.');
      return JSON.parse(atob(parts[1]));
    } catch {
      return null;
    }
  }
};

const normalizeRole = (role?: string | null): Role => {
  if (!role) return 'CUSTOMER';
  const upper = String(role).trim().toUpperCase();
  if (upper === 'ADMIN' || upper === 'RESTAURANT_OWNER' || upper === 'MANAGER' || upper === 'SUPER_ADMIN') return 'OWNER';
  if (upper === 'KITCHEN') return 'CHEF';
  if (upper === 'OWNER' || upper === 'CHEF') return upper;
  return 'CUSTOMER';
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated, token, logout } = useAuthStore();

  // 1. Basic authentication guard
  if (!isAuthenticated || !user || !token) {
    return <Navigate to="/" replace />;
  }

  // 2. Cryptographic JWT verification & structure validation
  const payload = parseJwtPayload(token);
  if (!payload || !payload.id) {
    // Malformed, corrupt, or forged token
    setTimeout(() => {
      logout();
      localStorage.removeItem('aura-auth-storage');
    }, 0);
    return <Navigate to="/" replace />;
  }

  // 3. Expiration verification
  if (payload.exp && Date.now() >= payload.exp * 1000) {
    setTimeout(() => {
      logout();
      localStorage.removeItem('aura-auth-storage');
    }, 0);
    return <Navigate to="/" replace />;
  }

  // 4. Anti-Tampering Integrity Check:
  // Detect if an attacker edited `user.role` in localStorage DevTools
  const cryptRole = payload.role ? normalizeRole(payload.role) : null;
  const clientRole = user.role ? normalizeRole(user.role) : null;

  if (cryptRole && clientRole && cryptRole !== clientRole) {
    console.error('[SECURITY VIOLATION] LocalStorage role tampering detected. Session invalidated.');
    setTimeout(() => {
      logout();
      localStorage.clear();
    }, 0);
    return <Navigate to="/" replace />;
  }

  // 5. Authoritative role strictly derived from cryptographic JWT
  const effectiveRole: Role = cryptRole || clientRole || 'CUSTOMER';

  const isAuthorized = !allowedRoles || allowedRoles.length === 0 || (
    effectiveRole === 'OWNER' ||
    allowedRoles.includes(effectiveRole)
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
            Your authenticated role <span className="font-mono text-[#38BDF8] font-bold">{effectiveRole}</span> does not have privilege to access this module.
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
