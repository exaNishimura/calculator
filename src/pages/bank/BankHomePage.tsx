import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { BankShell } from '@/components/bank/BankShell';
import { BORROW_ASSET_THRESHOLD } from '@/constants';
import { repositories } from '@/services/repositories';
import { canBorrow } from '@/services';

export function BankHomePage() {
  const [teamCode, setTeamCode] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [eligibleCode, setEligibleCode] = useState<string | null>(null);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onLookup = async (event: FormEvent) => {
    event.preventDefault();
    setLookupError(null);
    setEligibleCode(null);
    setTeamName(null);
    setBusy(true);

    try {
      const normalized = teamCode.trim().toLowerCase();
      const team = await repositories.teams.getByCode(normalized);
      if (!team) {
        setLookupError('お客様番号（チームコード）が見つかりません。');
        return;
      }

      setTeamName(team.teamName);

      if (canBorrow(team)) {
        setEligibleCode(normalized);
        return;
      }

      if (team.borrowedInCurrentSet) {
        setLookupError('この SET ではすでに融資をご利用済みです。');
        return;
      }

      if (team.currentAsset >= BORROW_ASSET_THRESHOLD) {
        setLookupError(
          `現在資産が ${BORROW_ASSET_THRESHOLD.toLocaleString('ja-JP')}P 未満の方が融資の対象です。`,
        );
        return;
      }

      setLookupError('ただいま融資のお申込みは受け付けておりません（進行状況をご確認ください）。');
    } finally {
      setBusy(false);
    }
  };

  return (
    <BankShell title="インターネットバンキング">
      <div className="grid gap-4 md:grid-cols-[1fr_220px]">
        <section className="bank-frame space-y-4 p-4">
          <p className="border border-dashed border-green-600 bg-green-50 p-2 text-center text-sm font-bold text-green-800">
            【重要】当行は金融庁の…ような何かに加盟しているかもしれません
          </p>

          <h2 className="text-xl font-bold text-blue-900 underline decoration-wavy">
            個人のお客様
          </h2>
          <ul className="list-inside list-disc space-y-1 text-sm">
            <li>超スピード融資（審査の正体不明）</li>
            <li>金利表示が小さすぎて読めないプラン</li>
            <li>返済はゲーム終了後（たぶん）</li>
          </ul>

          <form onSubmit={(event) => void onLookup(event)} className="space-y-3 border-t-2 border-gray-300 pt-4">
            <label className="block text-sm font-bold" htmlFor="bank-team-code">
              お客様番号（チームコード）を入力
            </label>
            <input
              id="bank-team-code"
              value={teamCode}
              onChange={(event) => setTeamCode(event.target.value)}
              className="w-full border-2 border-gray-500 bg-white px-3 py-2 font-mono"
              placeholder="例: shogai"
              autoComplete="off"
            />
            <button
              type="submit"
              className="bank-btn-cheesy w-full"
              disabled={busy || !teamCode.trim()}
            >
              融資可否を調べる（無料ではないかも）
            </button>
          </form>

          {lookupError ? (
            <p className="border-2 border-red-600 bg-red-50 p-3 text-sm font-bold text-red-800" role="alert">
              {lookupError}
            </p>
          ) : null}

          {eligibleCode && teamName ? (
            <div className="space-y-3 border-4 border-red-500 bg-yellow-50 p-4 text-center">
              <p className="text-sm">
                <span className="font-bold">{teamName}</span> 様 — 融資のご案内が可能です！！！
              </p>
              <p className="bank-blink">
                <Link
                  to={`/bank/apply/${eligibleCode}`}
                  className="bank-link-hot"
                  data-testid="bank-apply-link"
                >
                  ▶▶ 緊急融資お申込みフォームはコチラ ◀◀
                </Link>
              </p>
              <p className="text-[11px] text-gray-600">
                ※ クリックすると契約が成立するような雰囲気が出ます
              </p>
            </div>
          ) : null}
        </section>

        <aside className="space-y-3">
          <div className="bank-frame bg-lime-100 p-3 text-center text-xs font-bold text-green-900">
            <p className="bank-blink text-2xl">NEW</p>
            <p>今だけ！</p>
            <p className="text-lg">審査3秒</p>
          </div>
          <div
            className="bank-frame border-4 border-purple-600 bg-purple-100 p-2 text-center text-[10px]"
            style={{ transform: 'rotate(-2deg)' }}
          >
            <p className="font-bold text-purple-900">社長からのメッセージ</p>
            <p className="mt-2 text-left">
              草愛銀行はお客様を愛しています。だからお金を貸します。愛は草のように育ちます。
            </p>
          </div>
        </aside>
      </div>
    </BankShell>
  );
}
