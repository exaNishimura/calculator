import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface AdminAuthGuardProps {
  children: ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
