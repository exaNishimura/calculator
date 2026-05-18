/** 1 ゲームセッションあたりの SET 数 */
export const SET_MAX = 6;

/** 投資金額の単位（ペリカ） */
export const INVESTMENT_UNIT = 10_000;

/** 借入可能となる現在資産の上限（未満で借入可） */
export const BORROW_ASSET_THRESHOLD = 10_000;

/** 借入実行時に加算される現在資産 */
export const BORROW_ASSET_CREDIT = 80_000;

/** 借入実行時に記録される借入総額の増分 */
export const BORROW_DEBT_RECORD = 100_000;
