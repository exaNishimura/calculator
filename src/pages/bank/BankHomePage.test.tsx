import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { BankHomePage } from './BankHomePage';
import { repositories, seedDemoTeams } from '@/services/repositories';

describe('BankHomePage', () => {
  beforeEach(async () => {
    await repositories.resetAll();
    await seedDemoTeams(repositories.teams);
    const team = await repositories.teams.getByCode('shogai');
    await repositories.teams.upsert({
      ...team!,
      currentAsset: 5_000,
      status: 'investing',
    });
  });

  it('shows apply link when team is eligible', async () => {
    render(
      <MemoryRouter>
        <BankHomePage />
      </MemoryRouter>,
    );

    await userEvent.type(
      screen.getByLabelText('お客様番号（チームコード）を入力'),
      'shogai',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /融資可否を調べる/ }),
    );

    await waitFor(() => {
      expect(screen.getByTestId('bank-apply-link')).toHaveAttribute(
        'href',
        '/bank/apply/shogai',
      );
    });
  });
});
