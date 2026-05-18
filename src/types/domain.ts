export const SECTOR_IDS = [
  'manufacturing',
  'agriculture',
  'food',
  'construction',
  'tourism',
  'childcare',
  'it',
] as const;

export type Sector = (typeof SECTOR_IDS)[number];

export const STANDARD_EVENT_IDS = [
  'evt_01',
  'evt_02',
  'evt_03',
  'evt_04',
  'evt_05',
  'evt_06',
  'evt_07',
  'evt_08',
  'evt_09',
  'evt_10',
  'evt_11',
  'evt_12',
  'evt_13',
  'evt_14',
  'evt_15',
  'evt_16',
] as const;

export type StandardEventId = (typeof STANDARD_EVENT_IDS)[number];

export type BonusEventId = 'bonus_demand';

export type EventId = StandardEventId | BonusEventId;

export type SectorRates = Record<Sector, number>;

export interface StandardEventDefinition {
  id: StandardEventId;
  number: number;
  name: string;
  kind: 'standard';
  rates: SectorRates;
}

export interface BonusEventDefinition {
  id: BonusEventId;
  name: string;
  kind: 'bonus';
  multipliers: SectorRates;
}

export type EventDefinition = StandardEventDefinition | BonusEventDefinition;

export interface InvestmentLine {
  id: string;
  sector: Sector;
  amount: number;
}

export interface InvestmentLineResult {
  sector: Sector;
  invested: number;
  result: number;
  delta: number;
}

export interface SetCalculationResult {
  lines: InvestmentLineResult[];
  uninvestedCarry: number;
  setEndingAsset: number;
}

export type ValidationErrorCode =
  | 'INVALID_UNIT'
  | 'EXCEEDS_ASSET'
  | 'INVALID_AMOUNT'
  | 'BORROW_NOT_ALLOWED'
  | 'BORROW_ALREADY_USED'
  | 'EVENT_NOT_ASSIGNED';

export interface ValidationError {
  code: ValidationErrorCode;
  message: string;
}

export type Result<T, E = ValidationError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export type TeamStatus =
  | 'not_started'
  | 'investing'
  | 'investment_submitted'
  | 'waiting_event'
  | 'completed_set'
  | 'finished';

export interface Team {
  id: string;
  teamName: string;
  teamCode: string;
  currentSet: number;
  currentAsset: number;
  totalDebt: number;
  netAsset: number;
  status: TeamStatus;
  pendingInvestments: InvestmentLine[] | null;
  investmentSubmittedAt: string | null;
  borrowedInCurrentSet: boolean;
  /** 草愛銀行への融資申込金額（P）。未申込は null */
  loanApplicationAmount: number | null;
  loanAppliedAt: string | null;
  updatedAt: string;
}

export interface GameSession {
  id: string;
  sessionSet: number;
  activeEventId: EventId | null;
  activeEventSetNumber: number | null;
  updatedAt: string;
}

export interface SetResult {
  id: string;
  teamId: string;
  setNumber: number;
  startingAsset: number;
  investments: InvestmentLine[];
  selectedEvent: EventId;
  resultAsset: number;
  borrowedAmount: number;
  debtAdded: number;
  completedAt: string;
}

export class DuplicateSetResultError extends Error {
  constructor(teamId: string, setNumber: number) {
    super(`Set result already exists for team ${teamId} set ${setNumber}`);
    this.name = 'DuplicateSetResultError';
  }
}
