import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/feedback/ToastContainer';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { MenuPage } from './pages/customer/MenuPage';
import { OrderTrackingPage } from './pages/customer/OrderTrackingPage';
import { DineScanPage } from './pages/customer/DineScanPage';
import { KitchenDisplayPage } from './pages/kitchen/KitchenDisplayPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { QrGeneratorPage } from './pages/admin/QrGeneratorPage';
import { ProfilePage } from './pages/user/ProfilePage';
import { PrivacyPolicyPage } from './pages/legal/PrivacyPolicyPage';
import { TermsPage } from './pages/legal/TermsPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { TableSessionRoute } from './routes/TableSessionRoute';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public Customer Menu & Landing Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />


          {/* Opaque QR Scan Routes for Physical Dining Tables */}
          <Route path="/dine/:token" element={<DineScanPage />} />
          <Route path="/t/:token" element={<DineScanPage />} />

          {/* Masked Customer Digital Menu & Order Tracking (No Table ID in URL) */}
          <Route element={<TableSessionRoute />}>
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/order/:orderId" element={<OrderTrackingPage />} />
            {/* Backward-compatible legacy routes: Auto-cleaned to /menu */}
            <Route path="/table/:tableId/menu" element={<MenuPage />} />
            <Route path="/table/:tableId/order/:orderId" element={<OrderTrackingPage />} />
          </Route>

          {/* Staff Authentication — Hidden from public customers */}
          <Route path="/staff-access" element={<LoginPage />} />
          <Route path="/staff-portal" element={<Navigate to="/staff-access" replace />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/staff" element={<Navigate to="/" replace />} />

          {/* Kitchen KDS Routes */}
          <Route element={<ProtectedRoute allowedRoles={['CHEF', 'OWNER']} />}>
            <Route path="/kitchen" element={<AppLayout><KitchenDisplayPage /></AppLayout>} />
            <Route path="/kitchen/kds" element={<AppLayout><KitchenDisplayPage /></AppLayout>} />
          </Route>

          {/* Legacy Waiter Route Redirects to Admin */}
          <Route path="/waiter" element={<Navigate to="/admin" replace />} />
          <Route path="/waiter/dashboard" element={<Navigate to="/admin" replace />} />


          {/* Owner & Management Routes */}
          <Route element={<ProtectedRoute allowedRoles={['OWNER']} />}>
            <Route path="/admin" element={<AppLayout><AdminDashboardPage /></AppLayout>} />
            <Route path="/admin/dashboard" element={<AppLayout><AdminDashboardPage /></AppLayout>} />
            <Route path="/admin/qr-generator" element={<AppLayout><QrGeneratorPage /></AppLayout>} />
            <Route path="/admin/qr-stands" element={<AppLayout><QrGeneratorPage /></AppLayout>} />
            <Route path="/qr-generator" element={<AppLayout><QrGeneratorPage /></AppLayout>} />
            <Route path="/owner" element={<Navigate to="/admin" replace />} />
            <Route path="/owner/dashboard" element={<Navigate to="/admin" replace />} />
            <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
            <Route path="/profile" element={<AppLayout><ProfilePage /></AppLayout>} />
          </Route>

          {/* Fallback wildcard redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
