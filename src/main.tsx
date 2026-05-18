import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { FACILITATOR_TEAMS } from './constants/teams';
import { resolveDataSource } from './config/dataSource';
import {
  repositories,
  SEED_VERSION,
  seedDemoTeams,
} from './services/repositories';
import { browserStorage } from './services/repositories/storage';
import './index.css';

const SEED_VERSION_KEY = 'game02:seedVersion';

async function ensureTeamsSeeded(): Promise<void> {
  const teams = await repositories.teams.listAll();

  if (resolveDataSource() === 'supabase') {
    const existingCodes = new Set(teams.map((team) => team.teamCode));
    const missing = FACILITATOR_TEAMS.some(
      (entry) => !existingCodes.has(entry.teamCode),
    );
    if (teams.length === 0 || missing) {
      await seedDemoTeams(repositories.teams);
    }
    return;
  }

  const storedVersion = browserStorage.getItem(SEED_VERSION_KEY);
  if (teams.length === 0 || storedVersion !== SEED_VERSION) {
    await repositories.resetAll();
    await seedDemoTeams(repositories.teams);
    browserStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
  }
}

async function bootstrap(): Promise<void> {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element #root not found');
  }

  try {
    await ensureTeamsSeeded();
  } catch (error) {
    console.error('チームデータの初期化に失敗しました', error);
  }

  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
}

void bootstrap();
