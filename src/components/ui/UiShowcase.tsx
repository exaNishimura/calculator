import { AmountDisplay } from './AmountDisplay';
import { Badge } from './Badge';
import { Card } from './Card';
import { GameButton } from './GameButton';
import { WarningAlert } from './WarningAlert';

/** 開発用: 各 UI プリミティブの見た目確認 */
export function UiShowcase() {
  return (
    <div className="space-y-6" data-testid="ui-showcase">
      <Card>
        <AmountDisplay amount={1250000} label="現在資産" />
      </Card>

      <Card className="space-y-3">
        <AmountDisplay amount={90000} tone="profit" label="増減額" />
        <AmountDisplay amount={-30000} tone="loss" label="損失" />
        <AmountDisplay amount={100000} tone="warning" label="借入総額" />
      </Card>

      <Card className="flex flex-wrap gap-2">
        <Badge tone="profit">+80%</Badge>
        <Badge tone="loss">-20%</Badge>
        <Badge tone="warning">借入中</Badge>
      </Card>

      <WarningAlert title="注意">借入総額 100,000P — 返済はゲーム終了後</WarningAlert>

      <div className="space-y-3">
        <GameButton>投資完了</GameButton>
        <GameButton variant="secondary">イベント画面へ進む</GameButton>
        <GameButton variant="danger" disabled>
          無効ボタン
        </GameButton>
      </div>
    </div>
  );
}
