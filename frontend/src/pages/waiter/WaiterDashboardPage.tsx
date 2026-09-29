// Deprecated: Waiter section removed as requested. Redirecting to Admin.
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const WaiterDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/admin', { replace: true });
  }, [navigate]);

  return null;
};

export default WaiterDashboardPage;
