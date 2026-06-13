// FIFA World Cup 2026 — final tournament field.
//
// All 48 teams as drawn into the 12 groups at the Final Draw
// (Washington D.C., 5 Dec 2025), with the March 2026 play-off winners
// resolved into their slots:
//   UEFA play-off winners: A→Czechia, B→Bosnia & Herzegovina,
//   C→Türkiye, D→Sweden ... (mapped below by their group placement)
//   Intercontinental: FIFA 1→DR Congo (Group K), FIFA 2→Iraq (Group I)
//
// `rating` is an Elo-style strength estimate used only to weight the
// match simulation; it is not official.

export type Confederation =
  | 'UEFA'
  | 'CONMEBOL'
  | 'CONCACAF'
  | 'CAF'
  | 'AFC'
  | 'OFC'

export type GroupId =
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  | 'G' | 'H' | 'I' | 'J' | 'K' | 'L'

export interface Team {
  id: string // unique 3-letter code
  name: string
  /** flagcdn.com country code (ISO 3166-1 alpha-2, or gb-sct / gb-eng) */
  flag: string
  group: GroupId
  confed: Confederation
  rating: number
}

export const GROUP_IDS: GroupId[] = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
]

export const TEAMS: Team[] = [
  // Group A
  { id: 'MEX', name: 'Mexico', flag: 'mx', group: 'A', confed: 'CONCACAF', rating: 1800 },
  { id: 'RSA', name: 'South Africa', flag: 'za', group: 'A', confed: 'CAF', rating: 1700 },
  { id: 'KOR', name: 'South Korea', flag: 'kr', group: 'A', confed: 'AFC', rating: 1775 },
  { id: 'CZE', name: 'Czechia', flag: 'cz', group: 'A', confed: 'UEFA', rating: 1740 },

  // Group B
  { id: 'CAN', name: 'Canada', flag: 'ca', group: 'B', confed: 'CONCACAF', rating: 1750 },
  { id: 'BIH', name: 'Bosnia & Herzegovina', flag: 'ba', group: 'B', confed: 'UEFA', rating: 1720 },
  { id: 'QAT', name: 'Qatar', flag: 'qa', group: 'B', confed: 'AFC', rating: 1700 },
  { id: 'SUI', name: 'Switzerland', flag: 'ch', group: 'B', confed: 'UEFA', rating: 1820 },

  // Group C
  { id: 'BRA', name: 'Brazil', flag: 'br', group: 'C', confed: 'CONMEBOL', rating: 2025 },
  { id: 'MAR', name: 'Morocco', flag: 'ma', group: 'C', confed: 'CAF', rating: 1870 },
  { id: 'HAI', name: 'Haiti', flag: 'ht', group: 'C', confed: 'CONCACAF', rating: 1610 },
  { id: 'SCO', name: 'Scotland', flag: 'gb-sct', group: 'C', confed: 'UEFA', rating: 1735 },

  // Group D
  { id: 'USA', name: 'United States', flag: 'us', group: 'D', confed: 'CONCACAF', rating: 1805 },
  { id: 'PAR', name: 'Paraguay', flag: 'py', group: 'D', confed: 'CONMEBOL', rating: 1730 },
  { id: 'AUS', name: 'Australia', flag: 'au', group: 'D', confed: 'AFC', rating: 1740 },
  { id: 'TUR', name: 'Türkiye', flag: 'tr', group: 'D', confed: 'UEFA', rating: 1780 },

  // Group E
  { id: 'GER', name: 'Germany', flag: 'de', group: 'E', confed: 'UEFA', rating: 1965 },
  { id: 'CUW', name: 'Curaçao', flag: 'cw', group: 'E', confed: 'CONCACAF', rating: 1620 },
  { id: 'CIV', name: "Côte d'Ivoire", flag: 'ci', group: 'E', confed: 'CAF', rating: 1760 },
  { id: 'ECU', name: 'Ecuador', flag: 'ec', group: 'E', confed: 'CONMEBOL', rating: 1800 },

  // Group F
  { id: 'NED', name: 'Netherlands', flag: 'nl', group: 'F', confed: 'UEFA', rating: 1975 },
  { id: 'JPN', name: 'Japan', flag: 'jp', group: 'F', confed: 'AFC', rating: 1815 },
  { id: 'SWE', name: 'Sweden', flag: 'se', group: 'F', confed: 'UEFA', rating: 1770 },
  { id: 'TUN', name: 'Tunisia', flag: 'tn', group: 'F', confed: 'CAF', rating: 1710 },

  // Group G
  { id: 'BEL', name: 'Belgium', flag: 'be', group: 'G', confed: 'UEFA', rating: 1935 },
  { id: 'EGY', name: 'Egypt', flag: 'eg', group: 'G', confed: 'CAF', rating: 1745 },
  { id: 'IRN', name: 'Iran', flag: 'ir', group: 'G', confed: 'AFC', rating: 1755 },
  { id: 'NZL', name: 'New Zealand', flag: 'nz', group: 'G', confed: 'OFC', rating: 1635 },

  // Group H
  { id: 'ESP', name: 'Spain', flag: 'es', group: 'H', confed: 'UEFA', rating: 2100 },
  { id: 'CPV', name: 'Cabo Verde', flag: 'cv', group: 'H', confed: 'CAF', rating: 1640 },
  { id: 'KSA', name: 'Saudi Arabia', flag: 'sa', group: 'H', confed: 'AFC', rating: 1685 },
  { id: 'URU', name: 'Uruguay', flag: 'uy', group: 'H', confed: 'CONMEBOL', rating: 1860 },

  // Group I
  { id: 'FRA', name: 'France', flag: 'fr', group: 'I', confed: 'UEFA', rating: 2080 },
  { id: 'SEN', name: 'Senegal', flag: 'sn', group: 'I', confed: 'CAF', rating: 1830 },
  { id: 'IRQ', name: 'Iraq', flag: 'iq', group: 'I', confed: 'AFC', rating: 1665 },
  { id: 'NOR', name: 'Norway', flag: 'no', group: 'I', confed: 'UEFA', rating: 1810 },

  // Group J
  { id: 'ARG', name: 'Argentina', flag: 'ar', group: 'J', confed: 'CONMEBOL', rating: 2085 },
  { id: 'ALG', name: 'Algeria', flag: 'dz', group: 'J', confed: 'CAF', rating: 1755 },
  { id: 'AUT', name: 'Austria', flag: 'at', group: 'J', confed: 'UEFA', rating: 1795 },
  { id: 'JOR', name: 'Jordan', flag: 'jo', group: 'J', confed: 'AFC', rating: 1660 },

  // Group K
  { id: 'POR', name: 'Portugal', flag: 'pt', group: 'K', confed: 'UEFA', rating: 2000 },
  { id: 'COD', name: 'DR Congo', flag: 'cd', group: 'K', confed: 'CAF', rating: 1705 },
  { id: 'UZB', name: 'Uzbekistan', flag: 'uz', group: 'K', confed: 'AFC', rating: 1680 },
  { id: 'COL', name: 'Colombia', flag: 'co', group: 'K', confed: 'CONMEBOL', rating: 1865 },

  // Group L
  { id: 'ENG', name: 'England', flag: 'gb-eng', group: 'L', confed: 'UEFA', rating: 2040 },
  { id: 'CRO', name: 'Croatia', flag: 'hr', group: 'L', confed: 'UEFA', rating: 1880 },
  { id: 'GHA', name: 'Ghana', flag: 'gh', group: 'L', confed: 'CAF', rating: 1715 },
  { id: 'PAN', name: 'Panama', flag: 'pa', group: 'L', confed: 'CONCACAF', rating: 1690 },
]

export const TEAM_BY_ID: Record<string, Team> = Object.fromEntries(
  TEAMS.map((t) => [t.id, t]),
)

export function teamsInGroup(group: GroupId): Team[] {
  return TEAMS.filter((t) => t.group === group)
}

export const HOSTS = [
  { name: 'Canada', flag: 'ca' },
  { name: 'Mexico', flag: 'mx' },
  { name: 'United States', flag: 'us' },
]

export const flagUrl = (code: string, width = 40): string =>
  `https://flagcdn.com/w${width}/${code}.png`

export const flagUrl2x = (code: string, width = 40): string =>
  `https://flagcdn.com/w${width * 2}/${code}.png`
