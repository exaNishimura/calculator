import { SECTOR_IDS, type Sector } from '@/types/domain';

export interface SectorDefinition {
  id: Sector;
  label: string;
}

export const SECTORS: readonly SectorDefinition[] = [
  { id: 'manufacturing', label: '製造業' },
  { id: 'agriculture', label: '農業' },
  { id: 'food', label: '飲食' },
  { id: 'construction', label: '建設' },
  { id: 'tourism', label: '観光' },
  { id: 'childcare', label: '子育て' },
  { id: 'it', label: 'IT' },
] as const;

const sectorLabelMap = Object.fromEntries(
  SECTORS.map((s) => [s.id, s.label]),
) as Record<Sector, string>;

export function getSectorLabel(sector: Sector): string {
  return sectorLabelMap[sector];
}

export function isSector(value: string): value is Sector {
  return (SECTOR_IDS as readonly string[]).includes(value);
}
