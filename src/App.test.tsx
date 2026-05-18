import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { AUTH_STORAGE_KEYS } from '@/context/authStorage';
import { repositories, seedDemoTeams } from '@/services/repositories';
import { renderWithRouter } from '@/test/renderWithRouter';

describe('App routing', () => {
  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    await repositories.resetAll();
    await seedDemoTeams(repositories.teams);
  });

  it('renders home page at /', () => {
    renderWithRouter(<App />, { route: '/' });
    expect(screen.getByTestId('home-bank-link')).toHaveAttribute('href', '/bank');
    expect(screen.getByTestId('home-bank-desk-link')).toHaveAttribute(
      'href',
      '/bank/desk/login',
    );
    expect(screen.getByTestId('team-code')).toBeInTheDocument();
  });

  it('renders team entry page for valid team code', async () => {
    renderWithRouter(<App />, { route: '/team/shogai' });
    await waitFor(() => {
      expect(screen.getByTestId('asset-header')).toBeInTheDocument();
    });
  });

  it('denies invalid team code', async () => {
    renderWithRouter(<App />, { route: '/team/invalid-code' });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'アクセス拒否' })).toBeInTheDocument();
    });
  });

  it('renders event results page at /team/:teamCode/event', async () => {
    renderWithRouter(<App />, { route: '/team/shogai/event' });
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: '渉外活動委員会' }),
      ).toBeInTheDocument();
    });
  });

  it('renders admin gate at /admin', () => {
    renderWithRouter(<App />, { route: '/admin' });
    expect(screen.getByRole('heading', { name: '運営ログイン' })).toBeInTheDocument();
  });

  it('redirects admin dashboard without auth', () => {
    renderWithRouter(<App />, { route: '/admin/dashboard' });
    expect(screen.getByLabelText('管理用パスコード')).toBeInTheDocument();
  });

  it('renders admin dashboard when authenticated', async () => {
    sessionStorage.setItem(AUTH_STORAGE_KEYS.admin, '1');
    renderWithRouter(<App />, { route: '/admin/dashboard' });
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: '運営ダッシュボード' }),
      ).toBeInTheDocument();
    });
  });
});
