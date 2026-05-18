import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { AuthProvider } from '@/context/AuthContext';
import { BankDeskPage } from './BankDeskPage';
import { repositories, seedDemoTeams } from '@/services/repositories';
import { useGameStore } from '@/stores';

function renderDesk() {
  return render(
    <AuthProvider>
      <MemoryRouter>
        <BankDeskPage />
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('BankDeskPage', () => {
  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem('game02:auth:bank', '1');
    await repositories.resetAll();
    await seedDemoTeams(repositories.teams);
    const shogai = await repositories.teams.getByCode('shogai');
    await repositories.teams.upsert({
      ...shogai!,
      currentAsset: 5_000,
      totalDebt: 100_000,
      netAsset: -95_000,
    });
    await useGameStore.getState().hydrate();
  });

  it('shows total debt summary and per-team debt', async () => {
    renderDesk();
    await waitFor(() => {
      expect(screen.getByTestId('bank-total-debt')).toHaveTextContent('100,000');
    });
    expect(screen.getByTestId('bank-management-summary')).toBeInTheDocument();
    expect(screen.getAllByTestId('bank-row-with-debt').length).toBeGreaterThanOrEqual(
      1,
    );
  });

  it('logs out to bank login', async () => {
    renderDesk();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'ログアウト' })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('button', { name: 'ログアウト' }));
    expect(sessionStorage.getItem('game02:auth:bank')).toBeNull();
  });
});
