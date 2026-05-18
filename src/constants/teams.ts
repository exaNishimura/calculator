import { facilitatorTeamId, type FacilitatorTeamCode } from './teamIds';

export type { FacilitatorTeamCode } from './teamIds';

/** 委員会・執行部（各1名のファシリテーターがチーム画面を操作） */
export const FACILITATOR_TEAMS = [
  {
    id: facilitatorTeamId('shogai'),
    teamName: '渉外活動委員会',
    teamCode: 'shogai',
  },
  {
    id: facilitatorTeamId('business'),
    teamName: 'ビジネス向上委員会',
    teamCode: 'business',
  },
  {
    id: facilitatorTeamId('mirai'),
    teamName: '未来創造委員会',
    teamCode: 'mirai',
  },
  {
    id: facilitatorTeamId('somu'),
    teamName: '総務・広報委員会',
    teamCode: 'somu',
  },
  {
    id: facilitatorTeamId('chiiki'),
    teamName: '地域活性化委員会',
    teamCode: 'chiiki',
  },
  {
    id: facilitatorTeamId('shikko'),
    teamName: '執行部',
    teamCode: 'shikko',
  },
] as const;

/** テスト・サンプル用の代表チームコード */
export const DEFAULT_TEAM_CODE: FacilitatorTeamCode = 'shogai';
