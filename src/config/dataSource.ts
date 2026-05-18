export type DataSource = 'local' | 'supabase';

export function getConfiguredDataSource(): DataSource {
  const raw = import.meta.env.VITE_DATA_SOURCE?.trim().toLowerCase();
  return raw === 'supabase' ? 'supabase' : 'local';
}

export function isSupabaseEnvConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL?.trim() &&
      import.meta.env.VITE_SUPABASE_ANON_KEY?.trim(),
  );
}

/** 実際に使用するデータソース（未設定時は local にフォールバック） */
export function resolveDataSource(): DataSource {
  if (getConfiguredDataSource() === 'supabase' && isSupabaseEnvConfigured()) {
    return 'supabase';
  }
  return 'local';
}
