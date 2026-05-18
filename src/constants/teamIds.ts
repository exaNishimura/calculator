export const FACILITATOR_TEAM_CODES = [
  'shogai',
  'business',
  'mirai',
  'somu',
  'chiiki',
  'shikko',
] as const;

export type FacilitatorTeamCode = (typeof FACILITATOR_TEAM_CODES)[number];

/** Supabase（uuid 列）と local 共通の安定 ID */
const TEAM_UUID_BY_CODE: Record<FacilitatorTeamCode, string> = {
  shogai: '11111111-1111-4111-8111-000000000001',
  business: '11111111-1111-4111-8111-000000000002',
  mirai: '11111111-1111-4111-8111-000000000003',
  somu: '11111111-1111-4111-8111-000000000004',
  chiiki: '11111111-1111-4111-8111-000000000005',
  shikko: '11111111-1111-4111-8111-000000000006',
};

export function facilitatorTeamId(teamCode: string): string {
  const normalized = teamCode.trim().toLowerCase();
  if (normalized in TEAM_UUID_BY_CODE) {
    return TEAM_UUID_BY_CODE[normalized as FacilitatorTeamCode];
  }
  return TEAM_UUID_BY_CODE.shogai;
}
