# Research & Design Decisions

---
**Purpose**: 技術設計のための調査・意思決定ログ
---

## Summary

- **Feature**: `game02-life-allocation`
- **Discovery Scope**: New Feature（グリーンフィールド）
- **Key Findings**:
  - Supabase Realtime は `postgres_changes` で `teams` / `set_results` を subscribe し、Publication 有効化が必須
  - Phase 1 は Repository 抽象化により LocalStorage のみで完結可能（Phase 2 で差し替え）
  - PWA は `vite-plugin-pwa` + Workbox で React/Vite と相性が良い

## Research Log

### Supabase Realtime（Postgres Changes）

- **Context**: 運営ダッシュボードの手動リロードなし更新（Req 6.3, 8.3）
- **Sources Consulted**: [Supabase Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes), supabase-js Realtime README
- **Findings**:
  - 対象テーブルを `supabase_realtime` publication に追加する必要がある
  - `supabase.channel().on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, handler).subscribe()`
  - React では `useEffect` の cleanup で `channel.unsubscribe()` 必須（subscribe 直後に unsubscribe しない）
- **Implications**: `SyncService` は channel 管理を hook 層に集約。Phase 2 タスクに publication 設定 SQL を含める

### フロントエンド状態管理（Zustand vs Context）

- **Context**: チーム入力・イベント画面・ダッシュボード間の状態共有
- **Sources Consulted**: プロジェクト初期要件、React ベストプラクティス
- **Findings**:
  - ドメイン計算は pure function に分離し、Zustand は UI 状態 + キャッシュされた Team スナップショットのみ保持
  - Context は認証セッション（teamCode / adminAuthenticated）に限定すると責務が明確
- **Implications**: `useGameStore`（Zustand）+ `AuthContext` のハイブリッド採用

### PWA（Vite + React）

- **Context**: スマホファースト・会場オフライン耐性（Req 9, 8.4）
- **Sources Consulted**: [vite-plugin-pwa](https://github.com/vite-pwa/vite-plugin-pwa), Vite PWA React guide
- **Findings**:
  - `vite-plugin-pwa` v1.x は Vite 5+ 対応、manifest / SW 自動生成
  - `virtual:pwa-register/react` で更新通知可能
- **Implications**: Phase 3 以降で PWA 有効化。Phase 1 では manifest のみ先行可能

### 計算精度

- **Context**: 増減率・倍率計算（Req 4.3, 4.4）
- **Findings**:
  - 金額は整数（ペリカ）で保持し、率は小数（0.6 = +60%）で constants に定義
  - `Math.round` で端数処理を統一（設計で明示）
- **Implications**: `calculateStandardResult(amount, rate)` は `Math.round(amount * (1 + rate))`

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Layered + Repository | UI → Store → Service → Repository → DB/Local | Phase 分離が容易、テスト容易 | 初期ボイラープレート | **採用** |
| Full SPA + BaaS only | ロジックを Supabase RPC に集約 | クライアント薄い | Phase1 ローカル不可、デバッグ難 | 不採用 |
| Monolith component state | useState のみ | 実装速い | 6 SET × 多チームで破綻 | MVP 後に負債 |

## Design Decisions

### Decision: Repository 抽象化による Phase 分離

- **Context**: Req 10.1〜10.3 の段階リリース
- **Alternatives**: (1) LocalStorage のみ (2) 最初から Supabase 直結
- **Selected Approach**: `ITeamRepository` / `ISetResultRepository` インターフェース。Phase1=`LocalStorageRepository`、Phase2+=`SupabaseRepository`
- **Rationale**: 同一 UI・ドメイン層で Phase 切替可能
- **Trade-offs**: アダプタ実装コスト vs 長期保守性
- **Follow-up**: Supabase RLS ポリシーを Phase 2 で定義

### Decision: ドメイン計算の pure function 化

- **Context**: 16 イベント + BONUS、借入ルールの正確性
- **Selected Approach**: `src/utils/calculator.ts` に副作用なし関数群
- **Rationale**: ユニットテストで全イベント表を検証可能
- **Follow-up**: 付録 A/B 全件のテストケース自動生成を検討

### Decision: 認証はクライアント簡易ゲート

- **Context**: Req 7（MVP 簡易認証）
- **Selected Approach**: チームコードは DB 照合、管理パスコードは環境変数 `VITE_ADMIN_PASSCODE` と照合（セッション storage にフラグ）
- **Rationale**: OAuth 不要、会場運用向け
- **Trade-offs**: 本番では RLS + サーバー検証へ強化余地あり

### イベント決定権（追加仕様）

- **Context**: 発生イベントは運営が決定し、チーム入力画面（前画面）に表示
- **Selected Approach**: `game_sessions.active_event_id` を運営のみ更新。チーム/ファシリ画面は読み取り専用表示
- **Rejected**: ファシリ/チーム画面でのイベントカード選択グリッド
- **Implications**: `EventAssignmentService` + `EventAnnouncementCard` を追加

### 投資完了と準備状況（追加仕様）

- **Context**: 運営が SET ごとの投入完了を一覧把握したい
- **Selected Approach**: ステータス `investment_submitted` を新設し、「投資完了」と「イベント画面へ進む」を分離
- **Implications**: `teams.pending_investments` + `investment_submitted_at` を追加。運営 UI に `PrepSummaryBar` を配置

## Risks & Mitigations

- **Realtime 遅延・切断** — localStorage 補助保存 + 再接続時に `listAll()` で全件再取得
- **同時更新競合** — チーム画面は自チームのみ更新、運営は読み取り中心。楽観的 UI + `updated_at` 比較（Phase 2）
- **計算端数** — 整数丸めルールを constants で一元化しテスト固定
- **簡易認証の漏洩** — 管理パスコードは env のみ、リポジトリに平文保存しない

## References

- [Supabase Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [vite-plugin-pwa](https://github.com/vite-pwa/vite-plugin-pwa)
- [Zustand](https://github.com/pmndrs/zustand)
