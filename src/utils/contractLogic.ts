import { Team, Contract, RosterPlayer } from '../types';

export interface ContractOffer {
  team: Team;
  salaryPerYear: number;
  totalYears: number;
  totalValue: number;
}

/**
 * Generate contract yearly salary & years based on player OVR
 * Formula:
 *  - OVR < 65: Base $2,000,000
 *  - OVR 65-69: Base $4,500,000
 *  - OVR 70-74: Base $9,000,000
 *  - OVR 75-79: Base $16,000,000
 *  - OVR 80-84: Base $25,000,000
 *  - OVR 85-89: Base $35,000,000
 *  - OVR 90+: Base $48,000,000
 */
export function generateContractOfferForTeam(team: Team, playerOvr: number): ContractOffer {
  let baseSalary = 2000000;

  if (playerOvr >= 90) {
    baseSalary = 48000000;
  } else if (playerOvr >= 85) {
    baseSalary = 35000000;
  } else if (playerOvr >= 80) {
    baseSalary = 25000000;
  } else if (playerOvr >= 75) {
    baseSalary = 16000000;
  } else if (playerOvr >= 70) {
    baseSalary = 9000000;
  } else if (playerOvr >= 65) {
    baseSalary = 4500000;
  } else {
    baseSalary = 2000000;
  }

  // Random variance between 0.85 and 1.15 (+/- 15%)
  const variance = 0.85 + Math.random() * 0.30;
  let finalSalary = Math.round((baseSalary * variance) / 100000) * 100000;
  finalSalary = Math.max(1000000, finalSalary); // Minimum $1M

  // Contract length 2-5 years randomly
  const totalYears = Math.floor(Math.random() * 4) + 2;
  const totalValue = finalSalary * totalYears;

  return {
    team,
    salaryPerYear: finalSalary,
    totalYears,
    totalValue,
  };
}

/**
 * Generate 5 Free Agency offers from other teams
 */
export function generateFreeAgencyOffers(
  playerOvr: number,
  currentTeamId: string,
  allTeams: Team[]
): ContractOffer[] {
  const otherTeams = allTeams.filter((t) => t.id !== currentTeamId);
  // Shuffle other teams and take 5
  const shuffled = [...otherTeams].sort(() => Math.random() - 0.5);
  const selectedTeams = shuffled.slice(0, 5);

  return selectedTeams.map((team) => generateContractOfferForTeam(team, playerOvr));
}
