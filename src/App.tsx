import { AuthProvider } from '@/context/AuthContext';
import { AppRoot } from './AppRoot';

export default function App() {
  return (
    <AuthProvider>
      <AppRoot />
    </AuthProvider>
  );
}
