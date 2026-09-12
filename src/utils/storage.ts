import { normalizeBranding } from './branding';
import { getPersistentValue, hydratePersistentValues, removePersistentValue, setPersistentValue } from '../lib/persistentStorage';
import { GameState, PlayerProfile, Team, RetiredPlayerRecord } from '../types';
import { normalizeRetiredPlayerPeak } from './calc2k';
import { DEFAULT_GAME_MODE, GameMode } from '../gameMode';

const MAX_LEGENDS = 50;
export type SaveSlotId = 'slot_1' | 'slot_2' | 'slot_3' | 'slot_4';
export const SAVE_SLOTS_CONFIG: { id: SaveSlotId; name: string }[] = [{ id: 'slot_1', name: '📁 存档 1' }, { id: 'slot_2', name: '📁 存档 2' }, { id: 'slot_3', name: '📁 存档 3' }, { id: 'slot_4', name: '📁 存档 4' }];
export interface SavedData { version: number; gameMode?: GameMode; slotId?: SaveSlotId; slotName?: string; updatedAt: string; phase: GameState['phase']; currentYear: number; currentSeasonWeek: number; isPlayoffs: boolean; playoffRound: number; playoffSeriesWins: number; playoffSeriesLosses: number; playoffOpponentId: string | null; player: PlayerProfile | null; teams: Team[]; schedule: GameState['schedule']; tweets: GameState['tweets']; careerHistory: GameState['careerHistory']; leagueHistory?: GameState['leagueHistory']; activeTab?: string; executedTradeYears?: number[]; activeInSeasonTradeOffers?: any[]; declinePromptYear?: number | null; uiState?: { isInteractiveMatch?: boolean; usedOffseasonEventIds?: string[]; offseasonMonth?: number; offseasonCompletedPlans?: Record<number, { id: string; title: string; desc: string }>; offseasonEventMonths?: number[]; offseasonPhase?: 'draft' | 'contract' | 'training'; isDraftCompleted?: boolean; isContractCompleted?: boolean; contractStep?: 'decision' | 'renewal_offer' | 'free_agency'; renewalOffer?: any; freeAgencyOffers?: any[] }; }
export interface SaveSlotMeta { slotId: SaveSlotId; slotName: string; isEmpty: boolean; updatedAt?: string; playerName?: string; playerOvr?: number; playerPosition?: string; currentTeamName?: string; currentTeamLogo?: string; currentTeamAbbrev?: string; currentTeamPrimaryColor?: string; currentTeamSecondaryColor?: string; currentYear?: number; currentWeek?: number; phase?: string; }
const storageKeysFor = (gameMode: GameMode) => gameMode === DEFAULT_GAME_MODE
  ? {
      activeSlot: 'career.save.active-slot.v2',
      legends: 'career.hof.legends.v2',
      slot: (slot: SaveSlotId) => `career.save.${slot}.v2`,
    }
  : {
      activeSlot: 'career.random-trade.save.active-slot.v1',
      legends: 'career.random-trade.hof.legends.v1',
      slot: (slot: SaveSlotId) => `career.random-trade.save.${slot}.v1`,
    };
function valid(value: unknown): value is SavedData { const save = value as SavedData; return !!(save?.player && Array.isArray(save.teams) && save.teams.length); }
function validHydratedValue(gameMode: GameMode, key: string, value: unknown): boolean {
  const keys = storageKeysFor(gameMode);
  if (key === keys.activeSlot) return SAVE_SLOTS_CONFIG.some(({ id }) => id === value);
  if (key === keys.legends) return Array.isArray(value);
  if (SAVE_SLOTS_CONFIG.some(({ id }) => keys.slot(id) === key)) return valid(value);
  return true;
}
export async function hydrateGameStorage(gameMode: GameMode = DEFAULT_GAME_MODE): Promise<void> {
  const keys = storageKeysFor(gameMode);
  await hydratePersistentValues(
    [keys.activeSlot, keys.legends, ...SAVE_SLOTS_CONFIG.map(({ id }) => keys.slot(id))],
    (key, value) => validHydratedValue(gameMode, key, value),
  );
}
function migrateLegacyPeak<T extends { player?: PlayerProfile | null }>(value: T): T {
  const player = value.player;
  if (!player || player.peakOvrTracked || player.peakOvr !== 98) return value;
  return { ...value, player: { ...player, peakOvr: player.ovr, peakOvrTracked: true } };
}
export function saveGameToStorage(data: SavedData, slotId: SaveSlotId = 'slot_1', gameMode: GameMode = data.gameMode || DEFAULT_GAME_MODE): boolean { const keys = storageKeysFor(gameMode); setPersistentValue(keys.slot(slotId), { ...data, gameMode, slotId, slotName: SAVE_SLOTS_CONFIG.find((slot) => slot.id === slotId)?.name || '存档' }); setPersistentValue(keys.activeSlot, slotId); return true; }
export function loadGameFromStorage(slotId?: SaveSlotId, gameMode: GameMode = DEFAULT_GAME_MODE): SavedData | null { const keys = storageKeysFor(gameMode); const target = slotId || getPersistentValue<SaveSlotId>(keys.activeSlot) || 'slot_1'; const save = getPersistentValue<SavedData>(keys.slot(target)); return valid(save) && (save.gameMode || DEFAULT_GAME_MODE) === gameMode ? normalizeBranding(migrateLegacyPeak(save)) : null; }
export function getSaveSlotMeta(slotId: SaveSlotId, gameMode: GameMode = DEFAULT_GAME_MODE): SaveSlotMeta { const slotName = SAVE_SLOTS_CONFIG.find((slot) => slot.id === slotId)?.name || '存档'; const save = loadGameFromStorage(slotId, gameMode); if (!save?.player) return { slotId, slotName, isEmpty: true }; const team = save.teams.find((item) => item.id === save.player?.currentTeamId); return { slotId, slotName, isEmpty: false, updatedAt: save.updatedAt, playerName: save.player.name, playerOvr: save.player.ovr, playerPosition: save.player.position, currentTeamName: team?.name || '自由球员', currentTeamLogo: team?.logo, currentTeamAbbrev: team?.abbrev, currentTeamPrimaryColor: team?.primaryColor, currentTeamSecondaryColor: team?.secondaryColor, currentYear: save.currentYear, currentWeek: save.currentSeasonWeek, phase: save.phase }; }
export function getAllSaveSlotsMeta(gameMode: GameMode = DEFAULT_GAME_MODE): SaveSlotMeta[] { return SAVE_SLOTS_CONFIG.map(({ id }) => getSaveSlotMeta(id, gameMode)); }
export function clearSlotStorage(slotId: SaveSlotId, gameMode: GameMode = DEFAULT_GAME_MODE): void { const keys = storageKeysFor(gameMode); removePersistentValue(keys.slot(slotId)); if (getPersistentValue(keys.activeSlot) === slotId) removePersistentValue(keys.activeSlot); }
export function clearGameStorage(gameMode: GameMode = DEFAULT_GAME_MODE): void { SAVE_SLOTS_CONFIG.forEach(({ id }) => clearSlotStorage(id, gameMode)); }
export function getHallOfFameLegends(gameMode: GameMode = DEFAULT_GAME_MODE): RetiredPlayerRecord[] {
  const legends = getPersistentValue<RetiredPlayerRecord[]>(storageKeysFor(gameMode).legends);
  if (!Array.isArray(legends)) return [];
  const normalized = normalizeBranding(legends.map(normalizeRetiredPlayerPeak));
  return normalized.sort((a, b) => b.goatScore - a.goatScore).slice(0, MAX_LEGENDS);
}
export function saveHallOfFameLegend(legend: RetiredPlayerRecord, gameMode: GameMode = DEFAULT_GAME_MODE): void {
  const prior = getHallOfFameLegends(gameMode);
  const index = prior.findIndex((item) => item.id === legend.id);
  const next = index < 0 ? [legend, ...prior] : prior.map((item, i) => i === index ? legend : item);
  setPersistentValue(storageKeysFor(gameMode).legends, next.sort((a, b) => b.goatScore - a.goatScore).slice(0, MAX_LEGENDS));
}
export function deleteHallOfFameLegend(id: string, gameMode: GameMode = DEFAULT_GAME_MODE): void { setPersistentValue(storageKeysFor(gameMode).legends, getHallOfFameLegends(gameMode).filter((item) => item.id !== id)); }
