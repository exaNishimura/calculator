import { type FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { BankShell } from '@/components/bank/BankShell';
import { useAuth } from '@/context/AuthContext';

export function BankGatePage() {
  const navigate = useNavigate();
  const { isBank, loginBank } = useAuth();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  if (isBank) {
    return <Navigate to="/bank/manage" replace />;
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const result = loginBank(passcode);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    navigate('/bank/manage');
  };

  return (
    <BankShell title="行員専用ログイン">
      <form
        onSubmit={onSubmit}
        className="bank-frame mx-auto max-w-md space-y-4 p-6"
      >
        <p className="text-sm text-gray-700">
          草愛銀行の窓口担当者のみアクセスできます。
        </p>
        <label className="block text-sm font-bold" htmlFor="bank-passcode">
          行員パスコード
        </label>
        <input
          id="bank-passcode"
          type="password"
          value={passcode}
          onChange={(event) => setPasscode(event.target.value)}
          className="w-full border-2 border-gray-500 px-3 py-2"
          autoComplete="off"
        />
        {error ? (
          <p className="text-sm font-bold text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="bank-btn-cheesy w-full">
          ログイン
        </button>
      </form>
    </BankShell>
  );
}
