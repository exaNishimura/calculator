import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getConfiguredDataSource,
  isSupabaseEnvConfigured,
  resolveDataSource,
} from './dataSource';

describe('dataSource', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults to local when unset', () => {
    vi.stubEnv('VITE_DATA_SOURCE', '');
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    expect(getConfiguredDataSource()).toBe('local');
    expect(resolveDataSource()).toBe('local');
  });

  it('uses supabase only when env vars are present', () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'supabase');
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');
    expect(isSupabaseEnvConfigured()).toBe(true);
    expect(resolveDataSource()).toBe('supabase');
  });

  it('falls back to local when supabase is selected but keys missing', () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'supabase');
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    expect(resolveDataSource()).toBe('local');
  });
});
