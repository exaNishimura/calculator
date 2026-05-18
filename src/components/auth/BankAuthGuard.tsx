import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function BankAuthGuard({ children }: { children: React.ReactNode }) {
  const { isBank } = useAuth();
  if (!isBank) {
    return <Navigate to="/bank/desk/login" replace />;
  }
  return children;
}
