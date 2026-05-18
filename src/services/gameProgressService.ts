import {
  BORROW_ASSET_CREDIT,
  BORROW_DEBT_RECORD,
  SET_MAX,
} from '@/constants';
import type {
  EventId,
  InvestmentLine,
  SetResult,
  Team,
} from '@/types/domain';
import { calculateSetResultSafe } from '@/utils/calculator';
import { sumInvestments, validateInvestmentTotal } from '@/utils/validation';
import type { EventCalculationService } from './eventCalculationService';
import { getActiveEventForTeam } from './eventAssignmentService';
import type { LocalRepositories } from './repositories/types';
import { GameProgressError } from './types';

export interface ConfirmSetInput {
  setNumber: number;
  startingAsset: number;
  investments: InvestmentLine[];
  selectedEventId: EventId;
  borrowedInSet: boolean;
}

export class GameProgressService {
  constructor(
    private readonly repos: LocalRepositories,
    private readonly eventCalculation: EventCalculationService,
  ) {}

  private async requireTeam(teamId: string): Promise<Team> {
    const team = await this.repos.teams.getById(teamId);
    if (!team) {
      throw new GameProgressError('TEAM_NOT_FOUND', `チームが見つかりません: ${teamId}`);
    }
    return team;
  }

  async startSet(teamId: string): Promise<Team> {
    const team = await this.requireTeam(teamId);
    if (team.status !== 'not_started') {
      throw new GameProgressError(
        'INVALID_STATUS',
        'SET 開始は not_started のときのみ可能です',
      );
    }

    return this.repos.teams.upsert({
      ...team,
      status: 'investing',
      currentSet: 1,
      pendingInvestments: null,
      investmentSubmittedAt: null,
      borrowedInCurrentSet: false,
      loanApplicationAmount: null,
      loanAppliedAt: null,
    });
  }

  async completeInvestmentSubmission(
    teamId: string,
    investments: InvestmentLine[],
  ): Promise<Team> {
    const team = await this.requireTeam(teamId);
    const canSubmit =
      team.status === 'investing' ||
      team.status === 'investment_submitted' ||
      team.status === 'waiting_event';
    if (!canSubmit) {
      throw new GameProgressError(
        'INVALID_STATUS',
        '投資の保存は SET 確定前まで可能です',
      );
    }

    const total = sumInvestments(investments);
    const validation = validateInvestmentTotal(total, team.currentAsset);
    if (!validation.ok) {
      throw new GameProgressError(
        'INVALID_INVESTMENTS',
        validation.error.message,
      );
    }

    const now = new Date().toISOString();
    const nextStatus =
      team.status === 'investing' ? 'investment_submitted' : team.status;

    return this.repos.teams.upsert({
      ...team,
      status: nextStatus,
      pendingInvestments: investments.map((line) => ({ ...line })),
      investmentSubmittedAt: now,
    });
  }

  async proceedToEvent(teamId: string): Promise<Team> {
    const team = await this.requireTeam(teamId);
    if (team.status !== 'investment_submitted') {
      throw new GameProgressError(
        'INVALID_STATUS',
        'イベント画面へ進むには投資完了が必要です',
      );
    }

    return this.repos.teams.upsert({
      ...team,
      status: 'waiting_event',
    });
  }

  async confirmSetResult(
    teamId: string,
    input: ConfirmSetInput,
  ): Promise<{ team: Team; setResult: SetResult }> {
    const team = await this.requireTeam(teamId);

    if (team.status !== 'waiting_event') {
      throw new GameProgressError(
        'INVALID_STATUS',
        'SET 確定は waiting_event のときのみ可能です',
      );
    }

    if (team.currentSet !== input.setNumber) {
      throw new GameProgressError(
        'SET_MISMATCH',
        `SET 番号が一致しません（チーム: ${team.currentSet}, 入力: ${input.setNumber}）`,
      );
    }

    const session = await this.repos.gameSession.get();
    const activeEventId = getActiveEventForTeam(team, session);
    if (!activeEventId) {
      throw new GameProgressError(
        'EVENT_NOT_ASSIGNED',
        'イベントが割り当てられていません',
      );
    }

    if (activeEventId !== input.selectedEventId) {
      throw new GameProgressError(
        'EVENT_MISMATCH',
        '確定イベントが運営の割当と一致しません',
      );
    }

    const investments = input.investments;
    const calc = this.eventCalculation.apply(team, investments, session);
    if (!calc.ok) {
      throw new GameProgressError('EVENT_NOT_ASSIGNED', calc.error.message);
    }

    const setResult: SetResult = {
      id: crypto.randomUUID(),
      teamId: team.id,
      setNumber: input.setNumber,
      startingAsset: input.startingAsset,
      investments: investments.map((line) => ({ ...line })),
      selectedEvent: input.selectedEventId,
      resultAsset: calc.value.setEndingAsset,
      borrowedAmount: input.borrowedInSet ? BORROW_ASSET_CREDIT : 0,
      debtAdded: input.borrowedInSet ? BORROW_DEBT_RECORD : 0,
      completedAt: new Date().toISOString(),
    };

    const savedResult = await this.repos.setResults.create(setResult);
    const isFinalSet = input.setNumber >= SET_MAX;

    const updatedTeam = await this.repos.teams.upsert({
      ...team,
      currentAsset: calc.value.setEndingAsset,
      currentSet: isFinalSet ? team.currentSet : team.currentSet + 1,
      status: isFinalSet ? 'finished' : 'investing',
      pendingInvestments: null,
      investmentSubmittedAt: null,
      borrowedInCurrentSet: false,
      loanApplicationAmount: null,
      loanAppliedAt: null,
    });

    return { team: updatedTeam, setResult: savedResult };
  }

  async updateCompletedSetInvestments(
    teamId: string,
    setNumber: number,
    investments: InvestmentLine[],
  ): Promise<{ team: Team; setResults: SetResult[] }> {
    const team = await this.requireTeam(teamId);
    const history = await this.repos.setResults.listByTeam(teamId);
    const target = history.find((row) => row.setNumber === setNumber);
    if (!target) {
      throw new GameProgressError(
        'INVALID_STATUS',
        `SET${setNumber} はまだ確定していません`,
      );
    }

    const total = sumInvestments(investments);
    const validation = validateInvestmentTotal(total, target.startingAsset);
    if (!validation.ok) {
      throw new GameProgressError(
        'INVALID_INVESTMENTS',
        validation.error.message,
      );
    }

    const recalculated = new Map<number, SetResult>();
    for (const record of history) {
      if (record.setNumber < setNumber) {
        recalculated.set(record.setNumber, record);
        continue;
      }

      const startingAsset =
        record.setNumber === setNumber
          ? record.startingAsset
          : (recalculated.get(record.setNumber - 1)?.resultAsset ??
            record.startingAsset);

      const lines =
        record.setNumber === setNumber
          ? investments.map((line) => ({ ...line }))
          : record.investments.map((line) => ({ ...line }));

      const calc = calculateSetResultSafe({
        currentAsset: startingAsset,
        investments: lines,
        eventId: record.selectedEvent,
      });
      if (!calc.ok) {
        throw new GameProgressError('INVALID_INVESTMENTS', calc.error.message);
      }

      const nextRecord: SetResult = {
        ...record,
        startingAsset,
        investments: lines,
        resultAsset: calc.value.setEndingAsset,
      };
      const saved = await this.repos.setResults.update(nextRecord);
      recalculated.set(record.setNumber, saved);
    }

    const updatedHistory = [...recalculated.values()].sort(
      (a, b) => a.setNumber - b.setNumber,
    );

    let nextTeam = team;
    const priorSet = team.currentSet - 1;
    const priorResult = recalculated.get(priorSet);
    if (
      priorResult &&
      team.currentSet > setNumber &&
      team.status === 'investing' &&
      !team.borrowedInCurrentSet
    ) {
      nextTeam = await this.repos.teams.upsert({
        ...team,
        currentAsset: priorResult.resultAsset,
        netAsset: priorResult.resultAsset - team.totalDebt,
      });
    }

    return { team: nextTeam, setResults: updatedHistory };
  }
}
