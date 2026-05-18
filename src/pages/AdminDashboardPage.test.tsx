import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { AuthProvider } from '@/context/AuthContext';
import { AUTH_STORAGE_KEYS } from '@/context/authStorage';
import { AdminDashboardPage } from './AdminDashboardPage';
import { repositories, seedDemoTeams } from '@/services/repositories';
import { useGameStore } from '@/stores';

function renderDashboard() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AdminDashboardPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('AdminDashboardPage', () => {
  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem(AUTH_STORAGE_KEYS.admin, '1');
    await repositories.resetAll();
    await seedDemoTeams(repositories.teams);
    await useGameStore.getState().hydrate();
  });

  it('shows team table and preparation summary', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByTestId('prep-summary-bar')).toBeInTheDocument();
    });
    expect(screen.getByTestId('team-leaderboard-table')).toBeInTheDocument();
    expect(screen.getByText(/投資完了/)).toBeInTheDocument();
    expect(screen.getByTestId('team-row-shogai')).toBeInTheDocument();
  });

  it('assigns event for current set', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByTestId('event-assign-panel')).toBeInTheDocument();
    });

    const select = screen.getByLabelText('発生イベントを選択');
    await userEvent.selectOptions(select, 'evt_01');
    await userEvent.click(
      screen.getByRole('button', { name: 'この SET のイベントを確定' }),
    );

    await waitFor(() => {
      expect(
        within(screen.getByTestId('prep-summary-bar')).getByText('F1開催効果'),
      ).toBeInTheDocument();
    });
    const session = await repositories.gameSession.get();
    expect(session.activeEventId).toBe('evt_01');
    expect(session.activeEventSetNumber).toBe(1);
  });

  it('resets game after confirmation', async () => {
    const team = await repositories.teams.getByCode('shogai');
    await repositories.teams.upsert({
      ...team!,
      currentAsset: 999_999,
    });
    await useGameStore.getState().reload();

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'ゲームリセット' })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('button', { name: 'ゲームリセット' }));

    await waitFor(async () => {
      const reset = await repositories.teams.getByCode('shogai');
      expect(reset?.currentAsset).toBe(0);
    });
    const results = await repositories.setResults.listByTeam(team!.id);
    expect(results).toHaveLength(0);
  });

  it('exports csv from header action', async () => {
    if (!URL.createObjectURL) {
      Object.defineProperty(URL, 'createObjectURL', {
        value: vi.fn(() => 'blob:test'),
        configurable: true,
      });
    }
    if (!URL.revokeObjectURL) {
      Object.defineProperty(URL, 'revokeObjectURL', {
        value: vi.fn(),
        configurable: true,
      });
    }
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      () => undefined,
    );

    renderDashboard();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'CSV 出力' })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('button', { name: 'CSV 出力' }));
    expect(click).toHaveBeenCalled();
    click.mockRestore();
  });
});
