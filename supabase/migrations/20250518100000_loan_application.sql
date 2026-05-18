-- 草愛銀行 — 融資申込フィールド
alter table public.teams
  add column if not exists loan_application_amount integer
    check (loan_application_amount is null or loan_application_amount >= 0);

alter table public.teams
  add column if not exists loan_applied_at timestamptz;
