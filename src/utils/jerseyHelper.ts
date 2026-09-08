import { Team } from '../types';

/**
 * Famous retired numbers by NBA team in 2008 (and league-wide retired numbers like #23 on Miami/Bulls)
 */
export const TEAM_RETIRED_NUMBERS_2008: Record<string, number[]> = {
  chi: [4, 10, 23, 33], // Sloan, Love, Jordan, Pippen
  bos: [0, 1, 2, 3, 6, 10, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 32, 33, 35], // Parish, Cousy, Russell, Havlicek, Bird, etc.
  lal: [13, 22, 25, 32, 33, 42, 44], // Chamberlain, Baylor, Goodrich, Magic, Kareem, Worthy, West
  hou: [22, 23, 24, 34, 45], // Drexler, Murphy, Malone, Olajuwon, Tomjanovich
  mia: [10, 13, 23], // Hardaway, Marino, Jordan
  cle: [7, 22, 25, 34, 42, 43], // Bingo, Nance, Price, Carr, Daugherty
  orl: [6], // Fans
  phx: [5, 6, 7, 9, 24, 34, 42, 44], // Van Arsdale, Johnson, Majerle, Chambers, Barkley
  sas: [0, 13, 32, 50], // Moore, Silenas, Elliott, Robinson
  det: [2, 4, 11, 15, 16, 21, 40], // Daly, Dumars, Thomas, Bing, Lanier, Bing, Laimbeer
  nyk: [10, 12, 15, 19, 22, 24, 33], // Frazier, Barnett, Monroe/Dick McGuire, Reed, DeBusschere, Bradley, Ewing
  phi: [6, 10, 13, 15, 24, 32, 34], // Erving, Cheeks, Chamberlain, Greer, Jones, Cunningham, Barkley
  okc: [1, 10, 19, 24, 32, 43], // Williams, Sikma, Wilkens, Haywood, Brown, Sikma
  por: [13, 14, 15, 20, 22, 30, 32, 36, 45, 77], // Hollins, Steele, Lucas, Drexler, Gross, Walton, Ramsay
  uta: [1, 7, 9, 12, 14, 32, 35, 53], // Layden, Maravich, Miller, Stockton, Hornacek, Malone, Griffith, Eaton
  dal: [15, 22], // Brad Davis, Rolando Blackman
  den: [2, 33, 40, 44, 55], // English, Thompson, Beckman, Issel, Mutombo
  sac: [1, 2, 4, 6, 11, 12, 14, 16], // Robertson, Webber, Fans, Davies, Stokes, Oscar
  mil: [1, 2, 10, 14, 16, 32, 33], // Robertson, Dandridge, McGlocklin, Jon McGlocklin, Lanier, Abdul-Jabbar
  ind: [30, 34, 35, 529], // McGinnis, Daniels, Brown, Slick Leonard
  atl: [9, 21, 23, 40, 55], // Pettit, Wilkins, Lou Hudson, Jason Collier, Mutombo
  gsw: [13, 14, 16, 24, 42], // Chamberlain, Meschery, Attles, Barry, Thurmond
  lac: [],
  mem: [],
  cha: [13], // Phills
  bkn: [3, 23, 25, 32, 52], // Drazen Petrovic, John Williamson, Mel Daniels, Erving, Buck Williams
  was: [11, 25, 41, 44], // Hayes, Gus Johnson, Unseld, Chenier
  min: [2], // Malik Sealy
  nop: [7], // Maravich
  tor: [],
};

/**
 * Returns maps/sets of unavailable jersey numbers for a specific team roster in 2008
 */
export function getUnavailableJerseyNumbers(team: Team): {
  unavailableMap: Record<number, 'teammate' | 'retired' | string>;
  isUnavailable: (num: number) => boolean;
  getReason: (num: number) => string | null;
} {
  const unavailableMap: Record<number, 'teammate' | 'retired' | string> = {};

  // 1. Retired numbers for team
  const retired = TEAM_RETIRED_NUMBERS_2008[team.id] || [];
  retired.forEach((n) => {
    if (n >= 0 && n <= 99) {
      unavailableMap[n] = 'retired';
    }
  });

  // 2. Teammate numbers from team roster
  if (team && team.roster) {
    // Map known star jersey numbers or explicit numbers
    team.roster.forEach((player) => {
      // Common teammate jersey map by name or id
      const name = player.name;
      let num: number | null = null;

      if (name.includes('科比')) num = 24;
      else if (name.includes('加索尔') && !name.includes('马克')) num = 16;
      else if (name.includes('奥多姆')) num = 7;
      else if (name.includes('费舍尔')) num = 2;
      else if (name.includes('拜纳姆')) num = 17;
      else if (name.includes('阿里扎')) num = 3;
      else if (name.includes('加内特')) num = 5;
      else if (name.includes('皮尔斯')) num = 34;
      else if (name.includes('雷·阿伦')) num = 20;
      else if (name.includes('隆多')) num = 9;
      else if (name.includes('詹姆斯')) num = 23;
      else if (name.includes('莫·威廉姆斯')) num = 2;
      else if (name.includes('霍华德')) num = 12;
      else if (name.includes('特克格鲁')) num = 15;
      else if (name.includes('罗斯')) num = 1;
      else if (name.includes('洛尔·邓')) num = 9;
      else if (name.includes('韦德')) num = 3;
      else if (name.includes('比斯利')) num = 8;
      else if (name.includes('姚明')) num = 11;
      else if (name.includes('麦克格雷迪') || name.includes('麦迪')) num = 1;
      else if (name.includes('阿泰斯特')) num = 96;
      else if (name.includes('巴蒂尔')) num = 31;
      else if (name.includes('保罗') && !name.includes('乔治')) num = 3;
      else if (name.includes('邓肯')) num = 21;
      else if (name.includes('帕克')) num = 9;
      else if (name.includes('吉诺比利')) num = 20;
      else if (name.includes('德克') || name.includes('诺维茨基')) num = 41;
      else if (name.includes('基德')) num = 2;
      else if (name.includes('安东尼') && !name.includes('克里斯')) num = 15;
      else if (name.includes('艾弗森')) num = 3;
      else if (name.includes('纳什')) num = 13;
      else if (name.includes('斯塔德迈尔')) num = 1;
      else if (name.includes('杜兰特')) num = 35;
      else if (name.includes('威斯布鲁克')) num = 0;
      else if (name.includes('库里') && !name.includes('塞斯')) num = 30;

      if (num !== null && num >= 0 && num <= 99) {
        unavailableMap[num] = `${player.name} 使用中`;
      }
    });
  }

  return {
    unavailableMap,
    isUnavailable: (num: number) => Boolean(unavailableMap[num]),
    getReason: (num: number) => {
      const val = unavailableMap[num];
      if (!val) return null;
      if (val === 'retired') return '球队已退役号码';
      return typeof val === 'string' ? val : '队友使用中';
    },
  };
}
