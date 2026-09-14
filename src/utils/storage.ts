import { normalizeBranding } from './branding';
import { getPersistentValue, hydratePersistentValues, removePersistentValue, setPersistentValue } from '../lib/persistentStorage';
import { GameState, PlayerProfile, Team, RetiredPlayerRecord } from '../types';
import { normalizeRetiredPlayerPeak } from './calc2k';
import { DEFAULT_GAME_MODE, GameMode } from '../gameMode';
import type { TradeModalData } from '../data/realTradesData';
import type { YearDraftData } from '../data/draftData';
import type { DestinyEventRecord } from '../data/destinyEvents';

const MAX_LEGENDS = 50;
export interface SavedData { version: number; gameMode?: GameMode; updatedAt: string; phase: GameState['phase']; currentYear: number; currentSeasonWeek: number; isPlayoffs: boolean; playoffRound: number; playoffSeriesWins: number; playoffSeriesLosses: number; playoffOpponentId: string | null; player: PlayerProfile | null; teams: Team[]; schedule: GameState['schedule']; tweets: GameState['tweets']; careerHistory: GameState['careerHistory']; leagueHistory?: GameState['leagueHistory']; activeTab?: string; executedTradeYears?: number[]; seasonTradeHistory?: Record<number, TradeModalData>; parallelDraftHistory?: Record<number, YearDraftData>; destinyEventRecords?: Record<string, DestinyEventRecord>; activeInSeasonTradeOffers?: any[]; declinePromptYear?: number | null; uiState?: { isInteractiveMatch?: boolean; usedOffseasonEventIds?: string[]; offseasonMonth?: number; offseasonCompletedPlans?: Record<number, { id: string; title: string; desc: string }>; offseasonEventMonths?: number[]; offseasonPhase?: 'draft' | 'contract' | 'training'; isDraftCompleted?: boolean; isContractCompleted?: boolean; contractStep?: 'decision' | 'renewal_offer' | 'free_agency'; renewalOffer?: any; freeAgencyOffers?: any[] }; }
export interface SaveMeta { isEmpty: boolean; updatedAt?: string; playerName?: string; playerOvr?: number; playerPosition?: string; currentTeamName?: string; currentTeamLogo?: string; currentTeamAbbrev?: string; currentTeamPrimaryColor?: string; currentTeamSecondaryColor?: string; currentYear?: number; currentWeek?: number; phase?: string; }
const storageKeysFor = (gameMode: GameMode) => gameMode === DEFAULT_GAME_MODE
  ? {
      legends: 'career.hof.legends.v2',
      save: 'career.save.slot_1.v2',
    }
  : {
      legends: 'career.random-trade.hof.legends.v1',
      save: 'career.random-trade.save.slot_1.v1',
    };
function valid(value: unknown): value is SavedData { const save = value as SavedData; return !!(save?.player && Array.isArray(save.teams) && save.teams.length); }
function validHydratedValue(gameMode: GameMode, key: string, value: unknown): boolean {
  const keys = storageKeysFor(gameMode);
  if (key === keys.legends) return Array.isArray(value);
  if (key === keys.save) return valid(value);
  return true;
}
export async function hydrateGameStorage(gameMode: GameMode = DEFAULT_GAME_MODE): Promise<void> {
  const keys = storageKeysFor(gameMode);
  await hydratePersistentValues(
    [keys.save, keys.legends],
    (key, value) => validHydratedValue(gameMode, key, value),
  );
}
function migrateLegacyPeak<T extends { player?: PlayerProfile | null }>(value: T): T {
  const player = value.player;
  if (!player || player.peakOvrTracked || player.peakOvr !== 98) return value;
  return { ...value, player: { ...player, peakOvr: player.ovr, peakOvrTracked: true } };
}
export function saveGameToStorage(data: SavedData, gameMode: GameMode = data.gameMode || DEFAULT_GAME_MODE): boolean { setPersistentValue(storageKeysFor(gameMode).save, { ...data, gameMode }); return true; }
export function loadGameFromStorage(gameMode: GameMode = DEFAULT_GAME_MODE): SavedData | null { const save = getPersistentValue<SavedData>(storageKeysFor(gameMode).save); return valid(save) && (save.gameMode || DEFAULT_GAME_MODE) === gameMode ? normalizeBranding(migrateLegacyPeak(save)) : null; }
export function getSaveMeta(gameMode: GameMode = DEFAULT_GAME_MODE): SaveMeta { const save = loadGameFromStorage(gameMode); if (!save?.player) return { isEmpty: true }; const team = save.teams.find((item) => item.id === save.player?.currentTeamId); return { isEmpty: false, updatedAt: save.updatedAt, playerName: save.player.name, playerOvr: save.player.ovr, playerPosition: save.player.position, currentTeamName: team?.name || '自由球员', currentTeamLogo: team?.logo, currentTeamAbbrev: team?.abbrev, currentTeamPrimaryColor: team?.primaryColor, currentTeamSecondaryColor: team?.secondaryColor, currentYear: save.currentYear, currentWeek: save.currentSeasonWeek, phase: save.phase }; }
export function clearGameStorage(gameMode: GameMode = DEFAULT_GAME_MODE): void { removePersistentValue(storageKeysFor(gameMode).save); }
export function getHallOfFameLegends(gameMode: GameMode = DEFAULT_GAME_MODE): RetiredPlayerRecord[] {
  const legends = getPersistentValue<RetiredPlayerRecord[]>(storageKeysFor(gameMode).legends);
  if (!Array.isArray(legends)) return [];
  const normalized = normalizeBranding(legends.map((legend) => normalizeRetiredPlayerPeak({ ...legend, gameMode: legend.gameMode || gameMode })));
  return normalized.sort((a, b) => b.goatScore - a.goatScore).slice(0, MAX_LEGENDS);
}
export function saveHallOfFameLegend(legend: RetiredPlayerRecord, gameMode: GameMode = DEFAULT_GAME_MODE): void {
  legend = { ...legend, gameMode };
  const prior = getHallOfFameLegends(gameMode);
  const index = prior.findIndex((item) => item.id === legend.id);
  const next = index < 0 ? [legend, ...prior] : prior.map((item, i) => i === index ? legend : item);
  setPersistentValue(storageKeysFor(gameMode).legends, next.sort((a, b) => b.goatScore - a.goatScore).slice(0, MAX_LEGENDS));
}
export function deleteHallOfFameLegend(id: string, gameMode: GameMode = DEFAULT_GAME_MODE): void { setPersistentValue(storageKeysFor(gameMode).legends, getHallOfFameLegends(gameMode).filter((item) => item.id !== id)); }
