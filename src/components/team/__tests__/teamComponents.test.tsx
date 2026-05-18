import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { GameSession, Team } from '@/types/domain';
import { renderWithRouter } from '@/test/renderWithRouter';
import { EventAnnouncementCard } from '../EventAnnouncementCard';
import { getActiveEventForTeam } from '@/services';

const baseTeam: Team = {
  id: 'team-shogai',
  teamName: '渉外活動委員会',
  teamCode: 'shogai',
  currentSet: 1,
  currentAsset: 500_000,
  totalDebt: 0,
  netAsset: 500_000,
  status: 'investing',
  pendingInvestments: null,
  investmentSubmittedAt: null,
  borrowedInCurrentSet: false,
  loanApplicationAmount: null,
  loanAppliedAt: null,
  updatedAt: new Date().toISOString(),
};

describe('EventAnnouncementCard', () => {
  it('renders nothing when no event assigned', () => {
    const session: GameSession = {
      id: 's1',
      sessionSet: 1,
      activeEventId: null,
      activeEventSetNumber: null,
      updatedAt: new Date().toISOString(),
    };
    const { container } = renderWithRouter(
      <EventAnnouncementCard team={baseTeam} session={session} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows event name and sector rates when assigned', () => {
    const session: GameSession = {
      id: 's1',
      sessionSet: 1,
      activeEventId: 'evt_01',
      activeEventSetNumber: 1,
      updatedAt: new Date().toISOString(),
    };
    expect(getActiveEventForTeam(baseTeam, session)).toBe('evt_01');
    renderWithRouter(
      <EventAnnouncementCard team={baseTeam} session={session} />,
    );
    expect(screen.getByText('F1開催効果')).toBeInTheDocument();
    expect(screen.getByText('製造業')).toBeInTheDocument();
  });
});

describe('BorrowPanel', () => {
  it('links to kusai bank when borrowable', async () => {
    const { BorrowPanel } = await import('../BorrowPanel');
    renderWithRouter(
      <BorrowPanel
        team={{ ...baseTeam, currentAsset: 5_000 }}
        editable
      />,
    );
    expect(screen.getByTestId('kusai-bank-link')).toHaveAttribute(
      'href',
      '/bank/apply/shogai',
    );
  });
});

describe('TeamActionBar', () => {
  it('shows complete button only when investing', async () => {
    const { TeamActionBar } = await import('../TeamActionBar');
    const onComplete = vi.fn();
    const { rerender } = renderWithRouter(
      <TeamActionBar
        team={{ ...baseTeam, status: 'investing' }}
        teamCode="shogai"
        busy={false}
        onCompleteInvestment={onComplete}
        onProceedToEvent={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: '投資完了' }));
    expect(onComplete).toHaveBeenCalled();

    rerender(
      <TeamActionBar
        team={{ ...baseTeam, status: 'investment_submitted' }}
        teamCode="shogai"
        busy={false}
        onCompleteInvestment={onComplete}
        onProceedToEvent={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole('button', { name: '投資完了' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'イベント画面へ進む' }),
    ).toBeInTheDocument();
  });
});
