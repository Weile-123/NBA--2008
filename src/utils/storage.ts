import { normalizeBranding } from './branding';
import { getPersistentValue, hydratePersistentValues, removePersistentValue, setPersistentValue } from '../lib/persistentStorage';
import { GameState, PlayerProfile, Team, RetiredPlayerRecord } from '../types';
import { normalizeRetiredPlayerPeak } from './calc2k';

const DEFAULT_SAVE_KEY = 'career.save.active-slot.v2';
const LEGENDS_STORAGE_KEY = 'career.hof.legends.v2';
const MAX_LEGENDS = 50;
export type SaveSlotId = 'slot_1' | 'slot_2' | 'slot_3' | 'slot_4';
export const SAVE_SLOTS_CONFIG: { id: SaveSlotId; name: string }[] = [{ id: 'slot_1', name: '📁 存档 1' }, { id: 'slot_2', name: '📁 存档 2' }, { id: 'slot_3', name: '📁 存档 3' }, { id: 'slot_4', name: '📁 存档 4' }];
export interface SavedData { version: number; slotId?: SaveSlotId; slotName?: string; updatedAt: string; phase: GameState['phase']; currentYear: number; currentSeasonWeek: number; isPlayoffs: boolean; playoffRound: number; playoffSeriesWins: number; playoffSeriesLosses: number; playoffOpponentId: string | null; player: PlayerProfile | null; teams: Team[]; schedule: GameState['schedule']; tweets: GameState['tweets']; careerHistory: GameState['careerHistory']; leagueHistory?: GameState['leagueHistory']; activeTab?: string; executedTradeYears?: number[]; activeInSeasonTradeOffers?: any[]; declinePromptYear?: number | null; uiState?: { isInteractiveMatch?: boolean; usedOffseasonEventIds?: string[]; offseasonMonth?: number; offseasonCompletedPlans?: Record<number, { id: string; title: string; desc: string }>; offseasonEventMonths?: number[]; offseasonPhase?: 'draft' | 'contract' | 'training'; isDraftCompleted?: boolean; isContractCompleted?: boolean; contractStep?: 'decision' | 'renewal_offer' | 'free_agency'; renewalOffer?: any; freeAgencyOffers?: any[] }; }
export interface SaveSlotMeta { slotId: SaveSlotId; slotName: string; isEmpty: boolean; updatedAt?: string; playerName?: string; playerOvr?: number; playerPosition?: string; currentTeamName?: string; currentTeamLogo?: string; currentTeamAbbrev?: string; currentTeamPrimaryColor?: string; currentTeamSecondaryColor?: string; currentYear?: number; currentWeek?: number; phase?: string; }
const keyFor = (slot: SaveSlotId) => `career.save.${slot}.v2`;
function valid(value: unknown): value is SavedData { const save = value as SavedData; return !!(save?.player && Array.isArray(save.teams) && save.teams.length); }
function validHydratedValue(key: string, value: unknown): boolean {
  if (key === DEFAULT_SAVE_KEY) return SAVE_SLOTS_CONFIG.some(({ id }) => id === value);
  if (key === LEGENDS_STORAGE_KEY) return Array.isArray(value);
  if (SAVE_SLOTS_CONFIG.some(({ id }) => keyFor(id) === key)) return valid(value);
  return true;
}
export async function hydrateGameStorage(): Promise<void> {
  await hydratePersistentValues(
    [DEFAULT_SAVE_KEY, LEGENDS_STORAGE_KEY, ...SAVE_SLOTS_CONFIG.map(({ id }) => keyFor(id))],
    validHydratedValue,
  );
}
function migrateLegacyPeak<T extends { player?: PlayerProfile | null }>(value: T): T {
  const player = value.player;
  if (!player || player.peakOvrTracked || player.peakOvr !== 98) return value;
  return { ...value, player: { ...player, peakOvr: player.ovr, peakOvrTracked: true } };
}
export function saveGameToStorage(data: SavedData, slotId: SaveSlotId = 'slot_1'): boolean { setPersistentValue(keyFor(slotId), { ...data, slotId, slotName: SAVE_SLOTS_CONFIG.find((slot) => slot.id === slotId)?.name || '存档' }); setPersistentValue(DEFAULT_SAVE_KEY, slotId); return true; }
export function loadGameFromStorage(slotId?: SaveSlotId): SavedData | null { const target = slotId || getPersistentValue<SaveSlotId>(DEFAULT_SAVE_KEY) || 'slot_1'; const save = getPersistentValue<SavedData>(keyFor(target)); return valid(save) ? normalizeBranding(migrateLegacyPeak(save)) : null; }
export function getSaveSlotMeta(slotId: SaveSlotId): SaveSlotMeta { const slotName = SAVE_SLOTS_CONFIG.find((slot) => slot.id === slotId)?.name || '存档'; const save = loadGameFromStorage(slotId); if (!save?.player) return { slotId, slotName, isEmpty: true }; const team = save.teams.find((item) => item.id === save.player?.currentTeamId); return { slotId, slotName, isEmpty: false, updatedAt: save.updatedAt, playerName: save.player.name, playerOvr: save.player.ovr, playerPosition: save.player.position, currentTeamName: team?.name || '自由球员', currentTeamLogo: team?.logo, currentTeamAbbrev: team?.abbrev, currentTeamPrimaryColor: team?.primaryColor, currentTeamSecondaryColor: team?.secondaryColor, currentYear: save.currentYear, currentWeek: save.currentSeasonWeek, phase: save.phase }; }
export function getAllSaveSlotsMeta(): SaveSlotMeta[] { return SAVE_SLOTS_CONFIG.map(({ id }) => getSaveSlotMeta(id)); }
export function clearSlotStorage(slotId: SaveSlotId): void { removePersistentValue(keyFor(slotId)); if (getPersistentValue(DEFAULT_SAVE_KEY) === slotId) removePersistentValue(DEFAULT_SAVE_KEY); }
export function clearGameStorage(): void { SAVE_SLOTS_CONFIG.forEach(({ id }) => clearSlotStorage(id)); }
export function getHallOfFameLegends(): RetiredPlayerRecord[] {
  const legends = getPersistentValue<RetiredPlayerRecord[]>(LEGENDS_STORAGE_KEY);
  if (!Array.isArray(legends)) return [];
  const normalized = normalizeBranding(legends.map(normalizeRetiredPlayerPeak));
  return normalized.sort((a, b) => b.goatScore - a.goatScore).slice(0, MAX_LEGENDS);
}
export function saveHallOfFameLegend(legend: RetiredPlayerRecord): void {
  const prior = getHallOfFameLegends();
  const index = prior.findIndex((item) => item.id === legend.id);
  const next = index < 0 ? [legend, ...prior] : prior.map((item, i) => i === index ? legend : item);
  setPersistentValue(LEGENDS_STORAGE_KEY, next.sort((a, b) => b.goatScore - a.goatScore).slice(0, MAX_LEGENDS));
}
export function deleteHallOfFameLegend(id: string): void { setPersistentValue(LEGENDS_STORAGE_KEY, getHallOfFameLegends().filter((item) => item.id !== id)); }
