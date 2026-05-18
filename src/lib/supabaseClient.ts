import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseEnvConfigured } from '@/config/dataSource';

/** postgrest-js GenericRelationship 互換 */
type DbRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

/** JSON カラム用（postgrest-js 互換） */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TableDef<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: DbRelationship[];
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '12';
  };
  public: {
    Tables: {
      game_sessions: TableDef<GameSessionRow, GameSessionInsert>;
      teams: TableDef<TeamRow, TeamInsert>;
      set_results: TableDef<SetResultRow, SetResultInsert>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

export type GameSessionRow = {
  id: string;
  session_set: number;
  active_event_id: string | null;
  active_event_set_number: number | null;
  updated_at: string;
};

export type GameSessionInsert = Omit<GameSessionRow, 'updated_at'> & {
  updated_at?: string;
};

export type TeamRow = {
  id: string;
  team_name: string;
  team_code: string;
  current_set: number;
  current_asset: number;
  total_debt: number;
  net_asset: number;
  status: string;
  pending_investments: Json | null;
  investment_submitted_at: string | null;
  borrowed_in_current_set: boolean;
  loan_application_amount: number | null;
  loan_applied_at: string | null;
  created_at?: string;
  updated_at: string;
};

export type TeamInsert = Omit<TeamRow, 'created_at' | 'updated_at'> & {
  created_at?: string;
  updated_at?: string;
};

export type SetResultRow = {
  id: string;
  team_id: string;
  set_number: number;
  starting_asset: number;
  investments: Json;
  selected_event: string;
  result_asset: number;
  borrowed_amount: number;
  debt_added: number;
  completed_at: string;
};

export type SetResultInsert = Omit<SetResultRow, 'completed_at'> & {
  completed_at?: string;
};

let client: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!isSupabaseEnvConfigured()) {
    throw new Error(
      'VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を設定してください',
    );
  }
  if (!client) {
    client = createClient<Database>(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!,
    );
  }
  return client;
}

export function resetSupabaseClientForTests(): void {
  client = null;
}
