# Requirements Document

## Introduction

「GAME 02 命の配分」向けの Web 進行管理システム。各チームがスマートフォンで投資を入力し、ファシリテーターがイベント結果を計算し、運営が全チームの進行状況を把握する。通貨はペリカ（P）、全 6 SET（SET01〜SET06）を一括管理する。

## Boundary Context

- **In scope**:
  - 1 チームあたりの SET 進行（投資入力 → 運営発表イベントの確認 → 計算 → 結果表示 → 次 SET）
  - 7 投資先への複数投資、10,000P 単位の投資・借入ルール
  - 16 種の増減率イベントおよび BONUS 倍率イベントの計算
  - チーム入力画面、イベント結果処理画面、運営ダッシュボードの利用者向け振る舞い
  - 簡易認証（チームコード、管理パスコード）
  - 全チーム状況の一覧・順位・エクスポート・ゲームリセット
  - SET ごとの「投資完了」申告と、運営向け準備状況の一覧把握
  - 運営ダッシュボードでの発生イベント選択と、選択内容の各チーム端末への即時反映
- **Out of scope**:
  - ボードゲーム物理コンポーネントの管理
  - 本番インフラの構築・運用 SLA の定義
  - ユーザーアカウント登録・OAuth 等の本格認証
- **Adjacent expectations**:
  - 運営が当該 SET で発生するイベントを決定し、全チームに同一イベントを適用する
  - ファシリテーター／チームは運営が決定したイベントに基づき計算・結果確認のみ行う（イベントの選択権限は持たない）
  - 初期資産・チーム数は運営がゲーム開始前に設定する（本仕様では初期値の具体数は運営判断とする）

## Requirements

### Requirement 1: ゲーム進行と SET 管理

**Objective:** As a チーム参加者, I want SET01〜SET06 を順に進行できること, so that ゲーム全体をアプリ上で完結できる

#### Acceptance Criteria

1. The Game Progress Service shall 1 ゲームセッションあたり最大 6 SET（SET01〜SET06）を管理する
2. When 1 SET が開始されたとき, the Game Progress Service shall 当該 SET の進行状態を「投資入力可能」とする
3. When チームが当該 SET の「投資完了」操作を行ったとき, the Game Progress Service shall 当該 SET の進行状態を「投資完了」（investment_submitted）とし、当該 SET の投資内容をスナップショットとして記録する
4. When チームが投資完了後にイベント画面へ進む操作を行ったとき, the Game Progress Service shall 当該 SET の進行状態を「イベント待ち」（waiting_event）とする
5. When ファシリテーターがイベント計算を確定したとき, the Game Progress Service shall 当該 SET の結果資産を次 SET の開始資産として引き継ぐ
6. When SET06 の計算が確定されたとき, the Game Progress Service shall ゲームセッションを「終了」状態とし、最終精算を可能にする
7. While ゲームセッションが終了していない, the Game Progress Service shall 未投資の保有資産を次 SET へそのまま持ち越す
8. When 新しい SET が開始されたとき, the Game Progress Service shall 当該 SET の投資完了フラグおよび投資スナップショットをリセットする

### Requirement 2: 投資入力とバリデーション

**Objective:** As a チーム参加者, I want 複数の投資先へ資産内で投資を登録できること, so that 戦略に沿った配分を入力できる

#### Acceptance Criteria

1. The Investment Service shall 投資先として製造業・農業・飲食・建設・観光・子育て・IT の 7 区分を扱う
2. When チームが 1 SET 内で投資を追加したとき, the Investment Service shall 投資先の選択と投資金額（10,000P 単位）を受け付ける
3. The Investment Service shall 1 SET 内で同一投資先を含む複数行の投資登録を許可する
4. If 投資金額が 10,000P の倍数でない, then the Investment Service shall 登録を拒否し、利用者に修正を促す
5. If 当該 SET の投資合計が現在保有資産を超える, then the Investment Service shall 登録を拒否し、利用者に修正を促す
6. When チームが投資行を削除したとき, the Investment Service shall 当該投資を一覧から除去し、残り投資可能額を再計算する
7. The Team Input Interface shall チーム名・現在 SET 番号・現在資産・借入総額・残り投資可能額を表示する
8. While 当該 SET のステータスが investment_submitted または waiting_event である, the Investment Service shall 投資の追加・削除・変更を拒否する
9. If 当該 SET の投資合計が現在保有資産を超える状態で投資完了が要求された, then the Investment Service shall 投資完了を拒否し、利用者に修正を促す

### Requirement 3: 借入

**Objective:** As a チーム参加者, I want 資産が枯渇したときに限り借入できること, so that ゲームを継続できる

#### Acceptance Criteria

1. When 現在資産が 10,000P 未満であるとき, the Borrowing Service shall 当該 SET における借入申請を受け付ける
2. If 現在資産が 10,000P 以上である, then the Borrowing Service shall 借入申請を拒否する
3. When 借入が実行されたとき, the Borrowing Service shall 当該 SET に 80,000P を現在資産へ加算する
4. When 借入が実行されたとき, the Borrowing Service shall 借入総額に 100,000P を加算する（金利 20,000P 相当を含む）
5. The Borrowing Service shall 1 SET あたり借入を最大 1 回までとする
6. While ゲームセッションが終了していない, the Borrowing Service shall 借入の返済操作を受け付けない
7. When SET06 終了後の最終精算が行われたとき, the Borrowing Service shall 最終資産を「現在資産 − 借入総額」で算出する
8. While 借入総額が 0 より大きい, the Team Input Interface shall 借入状態を警告表示で示す

### Requirement 4: イベント割当と結果計算

**Objective:** As a ファシリテーター, I want 運営が決定したイベントに基づき投資結果を自動計算できること, so that 結果発表を迅速に行える

#### Acceptance Criteria

1. The Event Assignment Service shall 付録 A に定義する 16 種の標準イベントおよび BONUS イベント「特需発生」を、運営が SET 単位で割り当て可能とする
2. When 運営が当該 SET の発生イベントを確定したとき, the Event Assignment Service shall 当該 SET 向けの `active_event_id` を全クライアントで参照可能な共有状態として公開する
3. The Event Assignment Service shall チーム画面・ファシリ画面におけるイベント選択 UI を提供しない（運営のみが割当操作を行う）
4. When 標準イベントが割当され計算が実行されたとき, the Event Calculation Service shall 各投資について「結果金額 = 投資金額 × (1 + 当該投資先の増減率)」を適用する
5. When BONUS イベントが割当され計算が実行されたとき, the Event Calculation Service shall 各投資について「結果金額 = 投資金額 × 当該投資先の倍率」を適用する（増減率は適用しない）
6. When 計算が完了したとき, the Event Calculation Service shall 投資先別の結果金額・増減額・当該 SET 終了時の総資産を算出する
7. When 当該 SET に `active_event_id` が公開されているとき, the Team Input Interface shall チーム入力画面（イベント結果画面の直前画面）に、イベント名・投資先別増減率（または倍率）を読み取り専用で表示する
8. The Event Results Interface shall 運営割当済みイベントの内容・計算結果プレビュー・計算実行操作を提供する（イベントの再選択は不可）
9. When 計算が確定されたとき, the Event Results Interface shall 投資先別結果・増減額・SET 終了資産を表示する
10. If 当該 SET に `active_event_id` が未公開のとき, then the Event Results Interface shall 計算実行を拒否し、運営のイベント発表待ちであることを表示する

### Requirement 5: チーム入力画面（スマートフォン）

**Objective:** As a チーム参加者, I want 片手操作で投資と借入を入力できること, so that 会場で素早く操作できる

#### Acceptance Criteria

1. The Team Input Interface shall スマートフォン画面幅を前提としたレイアウトで表示する
2. The Team Input Interface shall 投資先の追加・選択・投資額入力・投資削除・借入実行・投資完了・イベント画面へ進む操作を提供する
3. When 当該 SET のステータスが investing であるとき, the Team Input Interface shall 「投資完了」ボタンを有効表示する
4. When 当該 SET のステータスが investment_submitted であるとき, the Team Input Interface shall 投資完了済みであることを表示し、「イベント画面へ進む」操作を有効化する
5. When 当該 SET のステータスが investment_submitted または waiting_event であるとき, the Team Input Interface shall 投資入力フォームを読み取り専用とする
6. When バリデーションエラーが発生したとき, the Team Input Interface shall エラー理由を利用者に表示する
7. The Team Input Interface shall 金額を大きく読みやすく表示する
8. The Team Input Interface shall 主要操作ボタンを大きく、タップしやすいサイズで提供する
9. While 当該 SET に運営発表済みイベントが存在しない, the Team Input Interface shall イベント未発表であることを表示する

### Requirement 6: 運営ダッシュボード

**Objective:** As a 運営担当者, I want 全チームの進行と順位を一覧できること, so that 会場全体を把握できる

#### Acceptance Criteria

1. The Operations Dashboard shall 登録済み全チームについて、チーム名・現在 SET・現在資産・借入総額・借入控除後資産（現在資産 − 借入総額）・現在順位・ステータス・準備状況を一覧表示する
2. The Operations Dashboard shall ステータスとして not_started・investing・investment_submitted・waiting_event・completed_set・finished を表示する
3. The Operations Dashboard shall 各チームの準備状況を、現在 SET に対応する状態（入力中／投資完了／イベント待ち／SET 完了／終了）として一覧表示する
4. The Operations Dashboard shall 現在 SET について「投資完了 N チーム / 全 M チーム」の集計を表示する
5. The Operations Dashboard shall 現在 SET でステータスが investing のチーム（投資完了未申告）を視覚的に強調する
6. When チームの入力または計算によりデータが更新されたとき, the Operations Dashboard shall 一覧を手動リロードなしで最新状態に反映する
7. While SET01〜SET05 が進行中である, the Operations Dashboard shall 順位を「現在資産 − 借入総額」の降順で算出する
8. When ゲームセッションが終了したとき, the Operations Dashboard shall 最終順位を「最終資産 − 借入総額」の降順で算出する
9. The Operations Dashboard shall 借入総額が 0 より大きいチームを視覚的に強調する
10. The Operations Dashboard shall イベント待ち（waiting_event）のチームを視覚的に強調する
11. When 運営がエクスポート操作を行ったとき, the Operations Dashboard shall 一覧データを CSV 形式でダウンロード可能にする
12. When 運営がゲームリセットを確認のうえ実行したとき, the Operations Dashboard shall 当該ゲームセッションの進行データを初期状態に戻す
13. The Operations Dashboard shall 現在 SET の発生イベントを、16 標準イベントおよび BONUS から選択して確定する操作を提供する
14. When 運営が当該 SET のイベントを確定したとき, the Operations Dashboard shall 確定したイベント名をダッシュボード上に表示する
15. When 運営が当該 SET のイベントを確定または変更したとき, the Data Synchronization Service shall 確定内容を各チーム端末（チーム入力画面・イベント結果画面）へ手動リロードなしで反映する

### Requirement 7: アクセス制御

**Objective:** As a 運営担当者, I want チームと管理画面を簡易に保護できること, so that 誤操作や不正アクセスを抑止できる

#### Acceptance Criteria

1. When 利用者がチーム画面にアクセスしたとき, the Access Control Service shall 有効なチームコードの提示を要求する
2. If 無効なチームコードが提示された, then the Access Control Service shall チーム画面へのアクセスを拒否する
3. When 利用者が運営ダッシュボードにアクセスしたとき, the Access Control Service shall 管理用パスコードの提示を要求する
4. If 無効な管理用パスコードが提示された, then the Access Control Service shall 運営ダッシュボードへのアクセスを拒否する

### Requirement 8: データ永続化と同期（利用者観測）

**Objective:** As a 運営担当者, I want チームの入力が運営画面に即時反映されること, so that 進行漏れを防げる

#### Acceptance Criteria

1. When チームが投資・借入・投資完了を保存したとき, the Data Synchronization Service shall 当該チームの状態を永続化する
2. When 運営が SET イベントを確定または変更したとき, the Data Synchronization Service shall 共有状態 `active_event_id` を永続化し、全画面へ即時反映する
3. When ファシリテーターが SET 結果を確定したとき, the Data Synchronization Service shall 当該 SET の結果記録を永続化する
4. When チームまたは SET 結果が更新されたとき, the Data Synchronization Service shall 運営ダッシュボードの表示を遅延なく更新する
5. Where ブラウザのローカル保存が利用可能である, the Data Synchronization Service shall 通信断時でも直近のチーム操作内容を失わないよう補助保存する

### Requirement 9: 利用者インターフェース

**Objective:** As a 参加者・ファシリテーター, I want ゲーム感のある見やすい UI, so that 会場で迷わず操作できる

#### Acceptance Criteria

1. The system shall ダークテーマを基調とした画面デザインを提供する
2. The system shall 投資・イベント・結果をカード形式で表示する
3. When 損益が表示されるとき, the system shall 利益を緑・損失を赤で色分けする
4. When 借入関連情報が表示されるとき, the system shall 黄色系の警告表示を用いる
5. The Team Input Interface and Event Results Interface shall 片手操作を想定したボタン配置とサイズを採用する
6. Where 運営ダッシュボードが表示される, the system shall PC およびタブレットの広い画面に適したレイアウトを提供する

### Requirement 10: 開発フェーズ別の提供範囲

**Objective:** As a プロダクトオーナー, I want 段階的に機能をリリースできること, so that MVP から本番運用へ移行できる

#### Acceptance Criteria

1. Where Phase 1（MVP）が対象である, the system shall ローカル環境のみで「チーム入力 → 運営イベント発表の確認 → 計算 → 次 SET」の一連フローを完結できる
2. Where Phase 2 が対象である, the system shall 複数チームの状態を運営・各画面から参照可能な共有状態として同期し、Requirement 8 のリアルタイム反映を満たす
3. Where Phase 3 が対象である, the system shall Requirement 6 の運営ダッシュボード全機能（順位・強調表示・CSV・リセット）を満たす

---

## 付録 A: 標準イベント増減率一覧

| # | イベント名 | 製造 | 農業 | 飲食 | 建設 | 観光 | 子育 | IT |
|---|-----------|------|------|------|------|------|------|-----|
| 1 | F1開催効果 | +60% | 0% | +80% | +10% | +100% | +20% | -20% |
| 2 | 若者流出 | -30% | 0% | -20% | -80% | -20% | -80% | -40% |
| 3 | かぶせ茶ヒット | +10% | +80% | +20% | +10% | +20% | +20% | -20% |
| 4 | 工場トラブル | -60% | 0% | -60% | +10% | +10% | -10% | -20% |
| 5 | トレンドスイーツ | +10% | +40% | +100% | +10% | +40% | 0% | -20% |
| 6 | 大型台風 | 0% | -40% | -40% | +40% | -20% | +10% | -20% |
| 7 | 市民マラソン | +10% | 0% | +30% | +10% | +80% | +20% | -20% |
| 8 | 東南海地震 | -80% | -100% | -100% | +100% | -100% | -40% | +20% |
| 9 | 北勢バイパス | +60% | +30% | +30% | +50% | +30% | +80% | -20% |
| 10 | 大型農業施設 | +10% | +80% | +20% | +20% | +80% | +20% | -20% |
| 11 | 新型ミニバン | +100% | 0% | +40% | -30% | +10% | +30% | -20% |
| 12 | 音楽フェス | 0% | 0% | +10% | 0% | -20% | 0% | -20% |
| 13 | 新大学 | +40% | +20% | +40% | +30% | +20% | +60% | +40% |
| 14 | F1開催地移転 | 0% | 0% | +10% | -40% | -60% | -20% | -20% |
| 15 | 先端企業誘致 | +40% | +20% | +30% | +10% | +20% | +40% | +300% |
| 16 | 地域ブランド | +10% | -30% | +10% | +10% | +10% | +10% | -20% |

## 付録 B: BONUS イベント倍率（特需発生）

| 投資先 | 倍率 |
|--------|------|
| 製造業 | ×5 |
| 農業 | ×3 |
| 飲食 | ×4 |
| 建設 | ×1 |
| 観光 | ×2 |
| 子育て | ×4 |
| IT | ×3 |

---

## Project Description (Input)

<details>
<summary>初期入力（spec-init 時の原文）</summary>

あなたは優秀なフルスタックエンジニアです。スマホ操作前提のWebアプリとして、ボードゲーム「GAME 02 命の配分」の計算・進行管理システムを、仕様駆動開発で開発してください。目的・技術要件・ゲームルール・画面構成・Supabase 構成・開発優先順位等の全文は spec-init 時の requirements.md に記録済み。

</details>
