import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminAuthGuard, BankAuthGuard, TeamAuthGuard } from '@/components/auth';
import { initSyncServiceRealtime } from '@/services/instances';
import { initGameStoreSync, useGameStore } from '@/stores';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { AdminGatePage } from '@/pages/AdminGatePage';
import { EventResultsPage } from '@/pages/EventResultsPage';
import { HomePage } from '@/pages/HomePage';
import { TeamEntryPage } from '@/pages/TeamEntryPage';
import { BankApplyPage } from '@/pages/bank/BankApplyPage';
import { BankDeskPage } from '@/pages/bank/BankDeskPage';
import { BankGatePage } from '@/pages/bank/BankGatePage';
import { BankHomePage } from '@/pages/bank/BankHomePage';

export function AppRoot() {
  const hydrate = useGameStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
    const stopStoreSync = initGameStoreSync();
    const stopRealtime = initSyncServiceRealtime();
    return () => {
      stopStoreSync();
      stopRealtime();
    };
  }, [hydrate]);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/team/:teamCode"
        element={
          <TeamAuthGuard>
            <TeamEntryPage />
          </TeamAuthGuard>
        }
      />
      <Route
        path="/team/:teamCode/event"
        element={
          <TeamAuthGuard>
            <EventResultsPage />
          </TeamAuthGuard>
        }
      />
      <Route path="/bank" element={<BankHomePage />} />
      <Route path="/bank/apply/:teamCode" element={<BankApplyPage />} />
      <Route path="/bank/desk/login" element={<BankGatePage />} />
      <Route
        path="/bank/desk"
        element={
          <BankAuthGuard>
            <BankDeskPage />
          </BankAuthGuard>
        }
      />
      <Route
        path="/bank/manage"
        element={
          <BankAuthGuard>
            <BankDeskPage />
          </BankAuthGuard>
        }
      />
      <Route path="/admin" element={<AdminGatePage />} />
      <Route
        path="/admin/dashboard"
        element={
          <AdminAuthGuard>
            <AdminDashboardPage />
          </AdminAuthGuard>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
