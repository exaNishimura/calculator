import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render } from '@testing-library/react';
import { EventResultsPage } from './EventResultsPage';
import { repositories, seedDemoTeams } from '@/services/repositories';
import { STORAGE_KEYS } from '@/services/repositories/storage';
import { syncService } from '@/services/instances';
import { useGameStore, useTeamDraftStore } from '@/stores';
import type { InvestmentLine } from '@/types/domain';

const pending: InvestmentLine[] = [
  { id: 'inv-1', sector: 'agriculture', amount: 50_000 },
];

function renderEventPage() {
  return render(
    <MemoryRouter initialEntries={['/team/shogai/event']}>
      <Routes>
        <Route path="/team/:teamCode/event" element={<EventResultsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('EventResultsPage', () => {
  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    await repositories.resetAll();
    await seedDemoTeams(repositories.teams);
    useTeamDraftStore.getState().clear();

    const team = await repositories.teams.getByCode('shogai');
    await repositories.teams.upsert({
      ...team!,
      currentAsset: 500_000,
      status: 'waiting_event',
      pendingInvestments: pending,
      investmentSubmittedAt: new Date().toISOString(),
    });
    await useTeamDraftStore.getState().loadTeam('shogai');
  });

  it('shows waiting message when event is not assigned', async () => {
    renderEventPage();
    await waitFor(() => {
      expect(screen.getByText(/運営のイベント発表待ち/)).toBeInTheDocument();
    });
    expect(
      screen.getByRole('button', { name: '計算を確定' }),
    ).toBeDisabled();
  });

  it('previews and confirms set result when event is assigned', async () => {
    await repositories.gameSession.assignEvent(1, 'evt_01');
    syncService.notify(STORAGE_KEYS.session);
    await useGameStore.getState().hydrate();
    await useTeamDraftStore.getState().syncFromServer('shogai');

    renderEventPage();
    await waitFor(() => {
      expect(screen.getByTestId('set-calculation-preview')).toBeInTheDocument();
    });
    expect(screen.getByTestId('event-announcement-card')).toHaveTextContent(
      'F1開催効果',
    );
    expect(
      within(screen.getByTestId('set-calculation-preview')).getByText('農業'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '計算を確定' }));
    await waitFor(() => {
      expect(screen.getByTestId('set-result-confirmed')).toBeInTheDocument();
    });
    expect(screen.getByText('SET1 結果確定')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '投資画面へ戻る' })).toBeInTheDocument();

    const updated = await repositories.teams.getByCode('shogai');
    expect(updated?.status).toBe('investing');
    expect(updated?.currentSet).toBe(2);
    expect(updated?.currentAsset).toBe(500_000);

    const results = await repositories.setResults.listByTeam(updated!.id);
    expect(results).toHaveLength(1);
    expect(results[0]?.setNumber).toBe(1);
  });

  it('redirects hint when not in waiting_event', async () => {
    const team = await repositories.teams.getByCode('shogai');
    await repositories.teams.upsert({
      ...team!,
      status: 'investing',
      pendingInvestments: null,
    });
    await useTeamDraftStore.getState().syncFromServer('shogai');

    renderEventPage();
    await waitFor(() => {
      expect(screen.getByTestId('event-results-status-gate')).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: '投資画面へ' })).toBeInTheDocument();
  });
});
