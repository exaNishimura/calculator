import { Link } from 'react-router-dom';
import type { SetCalculationResult } from '@/types/domain';
import { SET_MAX } from '@/constants';
import { Card, GameButton } from '@/components/ui';
import { SetCalculationPreview } from './SetCalculationPreview';

interface SetResultConfirmedProps {
  setNumber: number;
  calculation: SetCalculationResult;
  teamCode: string;
  isGameFinished: boolean;
}

export function SetResultConfirmed({
  setNumber,
  calculation,
  teamCode,
  isGameFinished,
}: SetResultConfirmedProps) {
  return (
    <section className="space-y-4" data-testid="set-result-confirmed">
      <Card>
        <h2 className="text-xl font-bold text-white">SET{setNumber} 結果確定</h2>
        <p className="mt-2 text-sm text-game-muted">
          {isGameFinished
            ? '全6 SET が完了しました。最終精算に借入総額が反映されます。'
            : `SET${setNumber + 1} の投資画面で次のラウンドを開始してください。`}
        </p>
      </Card>
      <SetCalculationPreview result={calculation} />
      {!isGameFinished ? (
        <Link to={`/team/${teamCode}`} className="block">
          <GameButton>投資画面へ戻る</GameButton>
        </Link>
      ) : (
        <p className="text-center text-sm text-game-muted">
          ゲーム終了（SET{SET_MAX} 完了）
        </p>
      )}
    </section>
  );
}
