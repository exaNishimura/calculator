import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BankShell } from '@/components/bank/BankShell';
import {
  BORROW_ASSET_CREDIT,
  BORROW_ASSET_THRESHOLD,
  BORROW_DEBT_RECORD,
} from '@/constants';
import { repositories } from '@/services/repositories';
import { syncService } from '@/services/instances';
import { STORAGE_KEYS } from '@/services/repositories/storage';
import {
  applyLoanViaBank,
  canBorrow,
  KUSAI_LOAN_PRODUCT_AMOUNT,
} from '@/services';

export function BankApplyPage() {
  const { teamCode = '' } = useParams<{ teamCode: string }>();
  const normalized = teamCode.trim().toLowerCase();
  const [team, setTeam] = useState<Awaited<
    ReturnType<typeof repositories.teams.getByCode>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void repositories.teams.getByCode(normalized).then((loaded) => {
      if (!cancelled) {
        setTeam(loaded);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [normalized]);

  const handleApply = async () => {
    if (!team) {
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const result = applyLoanViaBank(team);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      await syncService.persistTeam(result.value);
      syncService.notify(STORAGE_KEYS.teams);
      setTeam(result.value);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '融資処理に失敗しました');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <BankShell title="融資お申込み">
        <p>読み込み中…</p>
      </BankShell>
    );
  }

  if (!team) {
    return (
      <BankShell title="融資お申込み">
        <p className="font-bold text-red-700">チームが見つかりません。</p>
        <Link to="/bank" className="text-blue-800 underline">
          トップへ
        </Link>
      </BankShell>
    );
  }

  const eligible = canBorrow(team);

  return (
    <BankShell title="緊急融資お申込みフォーム">
      <div className="bank-frame max-w-lg space-y-4 p-5">
        <p className="text-center text-lg font-black text-red-700">
          お客様情報（自動入力のふり）
        </p>
        <table className="w-full border-collapse border border-gray-500 text-sm">
          <tbody>
            <tr className="border-b border-gray-400">
              <th className="bg-blue-100 px-2 py-2 text-left">お名前</th>
              <td className="px-2 py-2">{team.teamName}</td>
            </tr>
            <tr className="border-b border-gray-400">
              <th className="bg-blue-100 px-2 py-2 text-left">現在 SET</th>
              <td className="px-2 py-2">SET {team.currentSet}</td>
            </tr>
            <tr className="border-b border-gray-400">
              <th className="bg-blue-100 px-2 py-2 text-left">現在資産</th>
              <td className="px-2 py-2 font-mono">
                {team.currentAsset.toLocaleString('ja-JP')}P
              </td>
            </tr>
            <tr>
              <th className="bg-blue-100 px-2 py-2 text-left">お申込金額</th>
              <td className="px-2 py-2 text-xl font-black text-red-600">
                {KUSAI_LOAN_PRODUCT_AMOUNT.toLocaleString('ja-JP')}P
              </td>
            </tr>
          </tbody>
        </table>

        <p className="text-xs leading-relaxed text-gray-700">
          融資実行時：現在資産に +{BORROW_ASSET_CREDIT.toLocaleString('ja-JP')}P、借入総額に
          +{BORROW_DEBT_RECORD.toLocaleString('ja-JP')}P が加算されます。現在資産が
          {BORROW_ASSET_THRESHOLD.toLocaleString('ja-JP')}P 未満のときのみお申込みいただけます。
        </p>

        {done ? (
          <div
            className="space-y-3 border-4 border-green-600 bg-green-50 p-4 text-center"
            data-testid="bank-apply-success"
          >
            <p className="text-2xl font-black text-green-800">融資が成立しました！！</p>
            <p className="text-sm">
              申込金額 {KUSAI_LOAN_PRODUCT_AMOUNT.toLocaleString('ja-JP')}P を記録しました。
              <br />
              チーム画面に戻って投資を続けてください。
            </p>
            <Link
              to={`/team/${normalized}`}
              className="bank-btn-cheesy inline-block no-underline"
            >
              チーム画面へ
            </Link>
          </div>
        ) : eligible ? (
          <>
            <label className="flex items-start gap-2 text-xs">
              <input type="checkbox" defaultChecked className="mt-0.5" />
              <span>
                細かい文字の約款に同意したことにします（読んでいない方が大多数のようなので）
              </span>
            </label>
            {error ? (
              <p className="text-sm font-bold text-red-700" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="button"
              className="bank-btn-cheesy w-full bank-blink"
              disabled={busy}
              onClick={() => void handleApply()}
              data-testid="bank-submit-application"
            >
              同意して融資を受け取る
            </button>
          </>
        ) : (
          <p className="font-bold text-red-700" role="alert">
            {team.borrowedInCurrentSet
              ? 'この SET ではすでに融資済みです。'
              : '現在、融資のお申込みはできません。'}
            <br />
            <Link to="/bank" className="font-normal text-blue-800 underline">
              トップで再確認
            </Link>
          </p>
        )}
      </div>
    </BankShell>
  );
}
