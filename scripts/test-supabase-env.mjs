import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function loadEnvFile(path) {
  const env = {};
  const text = readFileSync(path, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

function mask(value) {
  if (!value) return '(未設定)';
  if (value.length <= 12) return '***';
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

const env = loadEnvFile('.env');
const url = env.VITE_SUPABASE_URL ?? '';
const anonKey = env.VITE_SUPABASE_ANON_KEY ?? '';
const dataSource = env.VITE_DATA_SOURCE ?? 'local';

const checks = [];

checks.push({
  name: 'VITE_SUPABASE_URL',
  ok: /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url),
  detail: url ? mask(url) : '未設定',
});

checks.push({
  name: 'VITE_SUPABASE_ANON_KEY',
  ok: anonKey.startsWith('eyJ') && anonKey.split('.').length === 3,
  detail: mask(anonKey),
});

checks.push({
  name: 'VITE_DATA_SOURCE',
  ok: true,
  detail: `${dataSource}（アプリで Supabase を使うには supabase に変更）`,
});

let connectionOk = false;
let tablesOk = false;
let tableError = '';

if (url && anonKey) {
  const client = createClient(url, anonKey);
  const { error: teamsError } = await client.from('teams').select('id').limit(1);
  connectionOk = !teamsError;
  tablesOk = connectionOk;
  if (teamsError) {
    tableError = teamsError.message;
    if (
      teamsError.message.includes('relation') &&
      teamsError.message.includes('does not exist')
    ) {
      connectionOk = true;
      tablesOk = false;
    }
  }

  const { error: sessionError } = await client
    .from('game_sessions')
    .select('id')
    .limit(1);
  if (!sessionError) {
    tablesOk = tablesOk || true;
  } else if (!tablesOk) {
    tableError = `${tableError}; ${sessionError.message}`.trim();
  }
}

checks.push({
  name: 'Supabase API 接続',
  ok: connectionOk,
  detail: connectionOk ? 'OK' : tableError || '接続失敗',
});

checks.push({
  name: 'game02 テーブル (teams / game_sessions)',
  ok: tablesOk,
  detail: tablesOk
    ? 'OK'
    : tableError.includes('does not exist')
      ? '未作成 — SQL Editor で migration を実行してください'
      : tableError || '確認できませんでした',
});

let failed = 0;
console.log('=== Supabase .env チェック ===\n');
for (const c of checks) {
  const mark = c.ok ? 'PASS' : 'FAIL';
  if (!c.ok) failed += 1;
  console.log(`[${mark}] ${c.name}: ${c.detail}`);
}

if (dataSource !== 'supabase') {
  console.log(
    '\n⚠ VITE_DATA_SOURCE が local のままです。Supabase 連携を有効にするには .env で supabase に変更し、dev サーバーを再起動してください。',
  );
}

process.exit(failed > 0 ? 1 : 0);
