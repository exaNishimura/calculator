import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render } from '@testing-library/react';
import { TeamEntryPage } from './TeamEntryPage';
import { repositories, seedDemoTeams } from '@/services/repositories';
import { syncService } from '@/services/instances';
import { useTeamDraftStore } from '@/stores';

function renderTeamPage() {
  return render(
    <MemoryRouter initialEntries={['/team/shogai']}>
      <Routes>
        <Route path="/team/:teamCode" element={<TeamEntryPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('TeamEntryPage', () => {
  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    await repositories.resetAll();
    await seedDemoTeams(repositories.teams);
    useTeamDraftStore.getState().clear();
    await useTeamDraftStore.getState().loadTeam('shogai');
  });

  it('shows asset input and header', async () => {
    renderTeamPage();
    await waitFor(() => {
      expect(screen.getByTestId('current-asset-input')).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: '渉外活動委員会' })).toBeInTheDocument();
    expect(screen.queryByTestId('event-announcement-card')).not.toBeInTheDocument();
    expect(screen.getByTestId('asset-header')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('asset-header')).queryByText('現在資産'),
    ).not.toBeInTheDocument();
  });

  it('hides current asset input from SET2 onward', async () => {
    const seeded = await repositories.teams.getByCode('shogai');
    await repositories.teams.upsert({
      ...seeded!,
      currentSet: 2,
      currentAsset: 600_000,
      status: 'investing',
      pendingInvestments: null,
    });
    await useTeamDraftStore.getState().syncFromServer('shogai');

    renderTeamPage();
    await waitFor(() => {
      expect(screen.getByTestId('asset-header')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('current-asset-input')).not.toBeInTheDocument();
    expect(
      within(screen.getByTestId('asset-header')).getByText('現在資産'),
    ).toBeInTheDocument();
  });

  it('does not show previous SET investments on SET2 entry screen', async () => {
    const seeded = await repositories.teams.getByCode('shogai');
    syncService.backupDraft('shogai', {
      team: seeded!,
      investments: [{ id: 'prev', sector: 'agriculture', amount: 50_000 }],
    });
    await repositories.teams.upsert({
      ...seeded!,
      currentSet: 2,
      currentAsset: 600_000,
      status: 'investing',
      pendingInvestments: null,
    });
    await useTeamDraftStore.getState().syncFromServer('shogai');

    renderTeamPage();
    await waitFor(() => {
      expect(screen.getByTestId('asset-header')).toBeInTheDocument();
    });
    expect(screen.getByTestId('investment-list')).not.toHaveTextContent('農業');
  });

  it('adds investment and completes submission', async () => {
    renderTeamPage();
    await waitFor(() => {
      expect(screen.getByTestId('current-asset-input')).toBeInTheDocument();
    });

    await userEvent.type(screen.getByLabelText('金額（P）'), '500000');
    await userEvent.click(
      screen.getByRole('button', { name: '現在資産を保存' }),
    );
    await waitFor(() => {
      expect(screen.getByTestId('add-investment-form')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: '投資を追加' }));
    expect(screen.getByTestId('investment-list')).toHaveTextContent('農業');

    await userEvent.click(screen.getByRole('button', { name: '投資完了' }));
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'イベント画面へ進む' }),
      ).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: '削除' })).not.toBeInTheDocument();
  });
});
