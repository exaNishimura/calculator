import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import './bankTheme.css';

interface BankShellProps {
  title?: string;
  children: ReactNode;
}

export function BankShell({ title, children }: BankShellProps) {
  return (
    <div className="bank-root">
      <div className="bank-marquee" aria-hidden>
        <span className="bank-marquee-inner">
          ★ 草愛銀行は皆様の夢を応援します ★ 金利がわからないほどお得 ★ 審査3秒 ★
          お客様第一（のはず） ★
        </span>
      </div>
      <header className="border-b-4 border-double border-red-600 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2">
          <Link to="/bank" className="text-left no-underline">
            <p className="text-xs text-blue-800">株式会社</p>
            <h1
              className="text-3xl font-black tracking-tight text-blue-900"
              style={{ textShadow: '2px 2px 0 #ffcc00' }}
            >
              草愛銀行
            </h1>
            <p className="text-[10px] text-gray-600">
              KUSAI BANK — Since 19?? — お客様の資産を草のように愛します
            </p>
          </Link>
          {title ? (
            <p className="rounded border-2 border-red-500 bg-yellow-100 px-3 py-1 text-sm font-bold text-red-700">
              {title}
            </p>
          ) : null}
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
      <footer className="mt-8 border-t-2 border-gray-400 bg-gray-200 px-4 py-4 text-center text-[11px] text-gray-700">
        <p>Copyright © 草愛銀行 All rights reserved（たぶん）</p>
        <p className="mt-1">
          <Link to="/" className="text-blue-800 underline">
            ゲーム進行画面へ戻る
          </Link>
          {' · '}
          <Link to="/bank/desk/login" className="text-blue-800 underline">
            融資管理画面（行員）
          </Link>
        </p>
      </footer>
    </div>
  );
}
