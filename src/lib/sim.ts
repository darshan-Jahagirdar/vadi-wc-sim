// Simulation engine for the World Cup 2026 simulator.
//
// Interaction model (matches a classic bracket predictor):
//   * Group stage  -> you set each team's FINAL POSITION in its group
//                     (1st..4th). No individual matches, no scorelines.
//   * Knockout     -> you pick the WINNER of each tie. No scorelines.
//
// State is just the group orderings + the chosen knockout winners; the whole
// bracket is derived from it.

import { GROUP_IDS, GroupId, Team, TEAM_BY_ID, teamsInGroup } from '../data/teams'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Round = 'R32' | 'R16' | 'QF' | 'SF' | 'F'

export const ROUND_ORDER: Round[] = ['R32', 'R16', 'QF', 'SF', 'F']

export const ROUND_NAME: Record<Round, string> = {
  R32: 'Round of 32',
  R16: 'Round of 16',
  QF: 'Quarter-finals',
  SF: 'Semi-finals',
  F: 'Final',
}

/** teamId[] of length 4, in finishing order (index 0 = 1st). */
export type GroupOrders = Partial<Record<GroupId, string[]>>
/** matchId -> advancing teamId */
export type KOWinners = Record<string, string>

export interface SimState {
  groups: GroupOrders
  ko: KOWinners
}

export const EMPTY_STATE: SimState = { groups: {}, ko: {} }

export interface GroupRow {
  team: Team
  rank: number
}

export interface Slot {
  teamId?: string
  /** short code, e.g. "1A", "2E", "3rd" */
  code: string
  label: string
}

export interface KOMatchView {
  id: string
  round: Round
  home: Slot
  away: Slot
  winnerId?: string
}

export interface Bracket {
  rounds: Record<Round, KOMatchView[]>
  championId?: string
}

export const TOTAL_KO_MATCHES = 16 + 8 + 4 + 2 + 1 // 31

// ---------------------------------------------------------------------------
// Group orderings
// ---------------------------------------------------------------------------

/** Default finishing order for a group: strongest (by rating) on top. */
export function defaultOrder(group: GroupId): string[] {
  return [...teamsInGroup(group)]
    .sort((a, b) => b.rating - a.rating || (a.id < b.id ? -1 : 1))
    .map((t) => t.id)
}

export function orderOf(state: SimState, group: GroupId): string[] {
  return state.groups[group] ?? defaultOrder(group)
}

export function groupTable(state: SimState, group: GroupId): GroupRow[] {
  return orderOf(state, group).map((id, i) => ({ team: TEAM_BY_ID[id], rank: i + 1 }))
}

export interface ThirdRow {
  group: GroupId
  team: Team
  qualifies: boolean
  order: number
}

/** The 12 third-placed teams ranked; the top 8 advance. With no match data to
 *  separate them, they are seeded by team strength (a stand-in for ranking). */
export function thirdsTable(state: SimState): ThirdRow[] {
  const thirds = GROUP_IDS.map((g) => ({ group: g, team: TEAM_BY_ID[orderOf(state, g)[2]] }))
  thirds.sort((a, b) => b.team.rating - a.team.rating || (a.team.id < b.team.id ? -1 : 1))
  return thirds.map((t, i) => ({
    group: t.group,
    team: t.team,
    qualifies: i < 8,
    order: i + 1,
  }))
}

// ---------------------------------------------------------------------------
// Knockout bracket
// ---------------------------------------------------------------------------

// Official 2026 knockout bracket (FIFA match numbers 73–104). 1X = winner of
// group X, 2X = runner-up, 3rd = one of the eight best third-placed teams.
type Src =
  | { k: 'w'; g: GroupId }
  | { k: 'r'; g: GroupId }
  | { k: 'third'; slot: number }
  | { k: 'm'; id: string }

interface KOEntry {
  id: string
  round: Round
  home: Src
  away: Src
}

// The eight R32 third-place slots and the groups whose third-placed team may
// fill each, per FIFA's allocation. A winner's own group never appears in its
// slot, so nobody meets a group rival in the Round of 32.
const THIRD_SLOTS: { allowed: GroupId[] }[] = [
  { allowed: ['A', 'B', 'C', 'D', 'F'] }, // slot 0 -> M74 (1E)
  { allowed: ['C', 'D', 'F', 'G', 'H'] }, // slot 1 -> M77 (1I)
  { allowed: ['C', 'E', 'F', 'H', 'I'] }, // slot 2 -> M79 (1A)
  { allowed: ['E', 'H', 'I', 'J', 'K'] }, // slot 3 -> M80 (1L)
  { allowed: ['B', 'E', 'F', 'I', 'J'] }, // slot 4 -> M81 (1D)
  { allowed: ['A', 'E', 'H', 'I', 'J'] }, // slot 5 -> M82 (1G)
  { allowed: ['E', 'F', 'G', 'I', 'J'] }, // slot 6 -> M85 (1B)
  { allowed: ['D', 'E', 'I', 'J', 'L'] }, // slot 7 -> M87 (1K)
]

// Every knockout tie in bracket (display) order: the R32 ties are arranged so
// each adjacent pair feeds the same Round-of-16 tie, and so on up to the final.
const KO_MATCHES: KOEntry[] = [
  // Round of 32
  { id: 'M74', round: 'R32', home: { k: 'w', g: 'E' }, away: { k: 'third', slot: 0 } },
  { id: 'M77', round: 'R32', home: { k: 'w', g: 'I' }, away: { k: 'third', slot: 1 } },
  { id: 'M73', round: 'R32', home: { k: 'r', g: 'A' }, away: { k: 'r', g: 'B' } },
  { id: 'M75', round: 'R32', home: { k: 'w', g: 'F' }, away: { k: 'r', g: 'C' } },
  { id: 'M83', round: 'R32', home: { k: 'r', g: 'K' }, away: { k: 'r', g: 'L' } },
  { id: 'M84', round: 'R32', home: { k: 'w', g: 'H' }, away: { k: 'r', g: 'J' } },
  { id: 'M81', round: 'R32', home: { k: 'w', g: 'D' }, away: { k: 'third', slot: 4 } },
  { id: 'M82', round: 'R32', home: { k: 'w', g: 'G' }, away: { k: 'third', slot: 5 } },
  { id: 'M76', round: 'R32', home: { k: 'w', g: 'C' }, away: { k: 'r', g: 'F' } },
  { id: 'M78', round: 'R32', home: { k: 'r', g: 'E' }, away: { k: 'r', g: 'I' } },
  { id: 'M79', round: 'R32', home: { k: 'w', g: 'A' }, away: { k: 'third', slot: 2 } },
  { id: 'M80', round: 'R32', home: { k: 'w', g: 'L' }, away: { k: 'third', slot: 3 } },
  { id: 'M86', round: 'R32', home: { k: 'w', g: 'J' }, away: { k: 'r', g: 'H' } },
  { id: 'M88', round: 'R32', home: { k: 'r', g: 'D' }, away: { k: 'r', g: 'G' } },
  { id: 'M85', round: 'R32', home: { k: 'w', g: 'B' }, away: { k: 'third', slot: 6 } },
  { id: 'M87', round: 'R32', home: { k: 'w', g: 'K' }, away: { k: 'third', slot: 7 } },
  // Round of 16
  { id: 'M89', round: 'R16', home: { k: 'm', id: 'M74' }, away: { k: 'm', id: 'M77' } },
  { id: 'M90', round: 'R16', home: { k: 'm', id: 'M73' }, away: { k: 'm', id: 'M75' } },
  { id: 'M93', round: 'R16', home: { k: 'm', id: 'M83' }, away: { k: 'm', id: 'M84' } },
  { id: 'M94', round: 'R16', home: { k: 'm', id: 'M81' }, away: { k: 'm', id: 'M82' } },
  { id: 'M91', round: 'R16', home: { k: 'm', id: 'M76' }, away: { k: 'm', id: 'M78' } },
  { id: 'M92', round: 'R16', home: { k: 'm', id: 'M79' }, away: { k: 'm', id: 'M80' } },
  { id: 'M95', round: 'R16', home: { k: 'm', id: 'M86' }, away: { k: 'm', id: 'M88' } },
  { id: 'M96', round: 'R16', home: { k: 'm', id: 'M85' }, away: { k: 'm', id: 'M87' } },
  // Quarter-finals
  { id: 'M97', round: 'QF', home: { k: 'm', id: 'M89' }, away: { k: 'm', id: 'M90' } },
  { id: 'M98', round: 'QF', home: { k: 'm', id: 'M93' }, away: { k: 'm', id: 'M94' } },
  { id: 'M99', round: 'QF', home: { k: 'm', id: 'M91' }, away: { k: 'm', id: 'M92' } },
  { id: 'M100', round: 'QF', home: { k: 'm', id: 'M95' }, away: { k: 'm', id: 'M96' } },
  // Semi-finals
  { id: 'M101', round: 'SF', home: { k: 'm', id: 'M97' }, away: { k: 'm', id: 'M98' } },
  { id: 'M102', round: 'SF', home: { k: 'm', id: 'M99' }, away: { k: 'm', id: 'M100' } },
  // Final
  { id: 'M104', round: 'F', home: { k: 'm', id: 'M101' }, away: { k: 'm', id: 'M102' } },
]

/** Assign the eight qualified thirds to the eight third-slots, respecting each
 *  slot's allowed groups (a bipartite matching — FIFA's table guarantees one
 *  exists). Falls back to a relaxed fill if somehow unmatched. */
function assignThirds(qualified: { group: GroupId; id: string }[]): (string | undefined)[] {
  const n = THIRD_SLOTS.length
  const candidates = THIRD_SLOTS.map((slot) =>
    qualified
      .map((q, i) => ({ id: q.id, group: q.group, i }))
      .filter((c) => slot.allowed.includes(c.group)),
  )
  const slotOrder = [...Array(n).keys()].sort((a, b) => candidates[a].length - candidates[b].length)
  const result: (string | undefined)[] = new Array(n).fill(undefined)
  const used = new Array(qualified.length).fill(false)

  const solve = (k: number): boolean => {
    if (k === n) return true
    const s = slotOrder[k]
    for (const c of candidates[s]) {
      if (used[c.i]) continue
      used[c.i] = true
      result[s] = c.id
      if (solve(k + 1)) return true
      used[c.i] = false
      result[s] = undefined
    }
    return false
  }
  if (solve(0)) return result

  // Fallback: fill remaining slots with whatever thirds are left.
  const res: (string | undefined)[] = new Array(n).fill(undefined)
  const used2 = new Array(qualified.length).fill(false)
  for (let s = 0; s < n; s++) {
    let pick = candidates[s].find((c) => !used2[c.i])?.i
    if (pick == null) pick = used2.findIndex((u) => !u)
    if (pick != null && pick >= 0) {
      used2[pick] = true
      res[s] = qualified[pick].id
    }
  }
  return res
}

export function buildBracket(state: SimState): Bracket {
  const winner = (g: GroupId) => orderOf(state, g)[0]
  const runner = (g: GroupId) => orderOf(state, g)[1]

  const qualified = thirdsTable(state)
    .filter((t) => t.qualifies)
    .map((t) => ({ group: t.group, id: t.team.id }))
  const thirdForSlot = assignThirds(qualified)

  const rounds: Record<Round, KOMatchView[]> = { R32: [], R16: [], QF: [], SF: [], F: [] }
  const winnerOf: Record<string, string | undefined> = {}

  const slotOf = (src: Src): Slot => {
    switch (src.k) {
      case 'w':
        return { teamId: winner(src.g), code: `1${src.g}`, label: `Winner Group ${src.g}` }
      case 'r':
        return { teamId: runner(src.g), code: `2${src.g}`, label: `Runner-up Group ${src.g}` }
      case 'third':
        return { teamId: thirdForSlot[src.slot], code: '3rd', label: 'Best third-placed team' }
      case 'm':
        return { teamId: winnerOf[src.id], code: '', label: 'Winner' }
    }
  }

  // KO_MATCHES is in dependency order, so a tie's feeder winners are already
  // resolved by the time we reach it.
  for (const entry of KO_MATCHES) {
    const home = slotOf(entry.home)
    const away = slotOf(entry.away)
    const view: KOMatchView = { id: entry.id, round: entry.round, home, away }
    const w = state.ko[entry.id]
    if (home.teamId && away.teamId && (w === home.teamId || w === away.teamId)) {
      view.winnerId = w
      winnerOf[entry.id] = w
    }
    rounds[entry.round].push(view)
  }

  return { rounds, championId: winnerOf['M104'] }
}

// ---------------------------------------------------------------------------
// Win model (Elo expectation) — used only by auto-fill / randomise
// ---------------------------------------------------------------------------

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

export function pickKOWinner(homeId: string, awayId: string): string {
  const e = expectedScore(TEAM_BY_ID[homeId].rating, TEAM_BY_ID[awayId].rating)
  return Math.random() < e ? homeId : awayId
}

/** Plausible random finishing order: rating plus noise, strongest-first. */
export function randomOrder(group: GroupId): string[] {
  return [...teamsInGroup(group)]
    .map((t) => ({ id: t.id, k: t.rating + (Math.random() - 0.5) * 480 }))
    .sort((a, b) => b.k - a.k)
    .map((x) => x.id)
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function moveTeam(state: SimState, group: GroupId, index: number, dir: -1 | 1): SimState {
  const order = [...orderOf(state, group)]
  const j = index + dir
  if (j < 0 || j >= order.length) return state
  ;[order[index], order[j]] = [order[j], order[index]]
  return { ...state, groups: { ...state.groups, [group]: order } }
}

export function setKO(state: SimState, matchId: string, winnerId: string): SimState {
  return { ...state, ko: { ...state.ko, [matchId]: winnerId } }
}

/** Fill every undecided knockout tie from the current group orderings. */
export function autoFillKO(state: SimState): SimState {
  let s = state
  for (const round of ROUND_ORDER) {
    const bracket = buildBracket(s)
    for (const m of bracket.rounds[round]) {
      if (m.home.teamId && m.away.teamId && !m.winnerId) {
        s = setKO(s, m.id, pickKOWinner(m.home.teamId, m.away.teamId))
      }
    }
  }
  return s
}

/** A fresh random run: shuffle every group, then play out the knockout. */
export function randomiseAll(): SimState {
  const groups: GroupOrders = {}
  for (const g of GROUP_IDS) groups[g] = randomOrder(g)
  return autoFillKO({ groups, ko: {} })
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

export function koProgress(bracket: Bracket): { done: number; total: number } {
  let done = 0
  for (const round of ROUND_ORDER) {
    for (const m of bracket.rounds[round]) if (m.winnerId) done++
  }
  return { done, total: TOTAL_KO_MATCHES }
}

/** How many groups the user has explicitly arranged (left at default = not). */
export function groupsEdited(state: SimState): number {
  return GROUP_IDS.filter((g) => state.groups[g] != null).length
}
