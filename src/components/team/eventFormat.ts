import type { EventDefinition, Sector } from '@/types/domain';
import { SECTORS } from '@/constants/sectors';

export function formatSectorImpact(
  event: EventDefinition,
  sector: Sector,
): string {
  if (event.kind === 'bonus') {
    return `×${event.multipliers[sector]}`;
  }
  const percent = Math.round(event.rates[sector] * 100);
  return percent >= 0 ? `+${percent}%` : `${percent}%`;
}

export function getSectorImpactTone(
  event: EventDefinition,
  sector: Sector,
): 'profit' | 'loss' | 'neutral' {
  if (event.kind === 'bonus') {
    const multiplier = event.multipliers[sector];
    if (multiplier > 1) return 'profit';
    if (multiplier < 1) return 'loss';
    return 'neutral';
  }
  const rate = event.rates[sector];
  if (rate > 0) return 'profit';
  if (rate < 0) return 'loss';
  return 'neutral';
}

export const ALL_SECTOR_ROWS = SECTORS;
