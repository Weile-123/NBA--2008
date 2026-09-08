import { GameState, PlayerProfile, Team, MatchBoxScore } from '../types';

const DEFAULT_SAVE_KEY = 'nba2k2008_mycareer_save_v1';

export type SaveSlotId = 'slot_1' | 'slot_2' | 'slot_3' | 'slot_4';

export interface SavedData {
  version: number;
  slotId?: SaveSlotId;
  slotName?: string;
  updatedAt: string;
  phase: GameState['phase'];
  currentYear: number;
  currentSeasonWeek: number;
  isPlayoffs: boolean;
  playoffRound: number;
  playoffSeriesWins: number;
  playoffSeriesLosses: number;
  playoffOpponentId: string | null;
  player: PlayerProfile | null;
  teams: Team[];
  schedule: GameState['schedule'];
  tweets: GameState['tweets'];
  careerHistory: GameState['careerHistory'];
  leagueHistory?: GameState['leagueHistory'];
  activeTab?: string;
  executedTradeYears?: number[];
  activeInSeasonTradeOffers?: any[];
  declinePromptYear?: number | null;
}

export interface SaveSlotMeta {
  slotId: SaveSlotId;
  slotName: string;
  isEmpty: boolean;
  updatedAt?: string;
  playerName?: string;
  playerOvr?: number;
  playerPosition?: string;
  currentTeamName?: string;
  currentTeamLogo?: string;
  currentTeamAbbrev?: string;
  currentTeamPrimaryColor?: string;
  currentTeamSecondaryColor?: string;
  currentYear?: number;
  currentWeek?: number;
  phase?: string;
}

export const SAVE_SLOTS_CONFIG: { id: SaveSlotId; name: string }[] = [
  { id: 'slot_1', name: '📁 存档 1 (Slot 1)' },
  { id: 'slot_2', name: '📁 存档 2 (Slot 2)' },
  { id: 'slot_3', name: '📁 存档 3 (Slot 3)' },
  { id: 'slot_4', name: '📁 存档 4 (Slot 4)' },
];

function getStorageKeyForSlot(slotId: SaveSlotId = 'slot_1'): string {
  return `nba2k2008_mycareer_save_${slotId}`;
}

export function saveGameToStorage(data: SavedData, slotId: SaveSlotId = 'slot_1'): boolean {
  try {
    const key = getStorageKeyForSlot(slotId);
    const dataWithSlot = {
      ...data,
      slotId,
      slotName: SAVE_SLOTS_CONFIG.find((s) => s.id === slotId)?.name || '存档',
    };
    const jsonStr = JSON.stringify(dataWithSlot);
    localStorage.setItem(key, jsonStr);

    // Also update default key so quick load on fresh start loads latest save
    localStorage.setItem(DEFAULT_SAVE_KEY, jsonStr);
    return true;
  } catch (err) {
    console.error('Failed to save game to localStorage:', err);
    return false;
  }
}

export function loadGameFromStorage(slotId?: SaveSlotId): SavedData | null {
  try {
    if (slotId) {
      const key = getStorageKeyForSlot(slotId);
      let raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedData;
        if (parsed && parsed.player && parsed.teams && parsed.teams.length > 0) {
          return parsed;
        }
      }
      return null;
    }

    // If no slot specified, try DEFAULT_SAVE_KEY or iterate slot_1..4
    const defaultRaw = localStorage.getItem(DEFAULT_SAVE_KEY);
    if (defaultRaw) {
      const parsed = JSON.parse(defaultRaw) as SavedData;
      if (parsed && parsed.player && parsed.teams && parsed.teams.length > 0) {
        return parsed;
      }
    }

    for (const config of SAVE_SLOTS_CONFIG) {
      const raw = localStorage.getItem(getStorageKeyForSlot(config.id));
      if (raw) {
        const parsed = JSON.parse(raw) as SavedData;
        if (parsed && parsed.player && parsed.teams && parsed.teams.length > 0) {
          return parsed;
        }
      }
    }
    return null;
  } catch (err) {
    console.error('Failed to load game from localStorage:', err);
    return null;
  }
}

export function getSaveSlotMeta(slotId: SaveSlotId): SaveSlotMeta {
  const slotName = SAVE_SLOTS_CONFIG.find((s) => s.id === slotId)?.name || '存档';
  const save = loadGameFromStorage(slotId);
  if (!save || !save.player) {
    return {
      slotId,
      slotName,
      isEmpty: true,
    };
  }

  const userTeam = save.teams?.find((t) => t.id === save.player?.currentTeamId);

  return {
    slotId,
    slotName,
    isEmpty: false,
    updatedAt: save.updatedAt || '未保存',
    playerName: save.player.name,
    playerOvr: save.player.ovr,
    playerPosition: save.player.position,
    currentTeamName: userTeam ? userTeam.name : '自由球员',
    currentTeamLogo: userTeam?.logo,
    currentTeamAbbrev: userTeam?.abbrev,
    currentTeamPrimaryColor: userTeam?.primaryColor,
    currentTeamSecondaryColor: userTeam?.secondaryColor,
    currentYear: save.currentYear,
    currentWeek: save.currentSeasonWeek,
    phase: save.phase,
  };
}

export function getAllSaveSlotsMeta(): SaveSlotMeta[] {
  return SAVE_SLOTS_CONFIG.map((config) => getSaveSlotMeta(config.id));
}

export function clearSlotStorage(slotId: SaveSlotId): void {
  try {
    const key = getStorageKeyForSlot(slotId);
    localStorage.removeItem(key);
  } catch (err) {
    console.error('Failed to clear slot storage:', err);
  }
}

export function clearGameStorage(): void {
  try {
    SAVE_SLOTS_CONFIG.forEach((config) => {
      localStorage.removeItem(getStorageKeyForSlot(config.id));
    });
    localStorage.removeItem(DEFAULT_SAVE_KEY);
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('nba2k2008_playoff_state_')) {
        localStorage.removeItem(key);
      }
    }
  } catch (err) {
    console.error('Failed to clear game storage:', err);
  }
}

/**
 * Export save data as a JSON file for local backup
 */
export function exportSaveToFile(data: SavedData, filename?: string): void {
  try {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `NBA2K2008_Save_${data.player?.name || 'Career'}_${data.currentYear}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Export save failed:', err);
  }
}

/**
 * Import save data from JSON file string
 */
export function importSaveFromJson(jsonString: string): SavedData | null {
  try {
    const parsed = JSON.parse(jsonString) as SavedData;
    if (parsed && parsed.player && parsed.teams && parsed.teams.length > 0) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.error('Invalid save JSON file:', err);
    return null;
  }
}

const LEGENDS_STORAGE_KEY = 'nba2k2008_mycareer_hof_legends_v1';

export function getHallOfFameLegends(): import('../types').RetiredPlayerRecord[] {
  try {
    const raw = localStorage.getItem(LEGENDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to get HOF legends:', err);
    return [];
  }
}

export function saveHallOfFameLegend(legend: import('../types').RetiredPlayerRecord): void {
  try {
    const existing = getHallOfFameLegends();
    // Replace if same legend ID exists, otherwise prepend
    const idx = existing.findIndex((l) => l.id === legend.id);
    let updated: import('../types').RetiredPlayerRecord[];
    if (idx >= 0) {
      updated = [...existing];
      updated[idx] = legend;
    } else {
      updated = [legend, ...existing];
    }
    localStorage.setItem(LEGENDS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save HOF legend:', err);
  }
}

export function deleteHallOfFameLegend(legendId: string): void {
  try {
    const existing = getHallOfFameLegends();
    const updated = existing.filter((l) => l.id !== legendId);
    localStorage.setItem(LEGENDS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete HOF legend:', err);
  }
}
