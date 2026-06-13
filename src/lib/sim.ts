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

// R32 layout. 1X = winner of group X, 2X = runner-up, T# = a ranked best-third.
// Winners A–H meet thirds; winners I–L meet runners-up A–D; the remaining
// runners-up meet each other. Top half (ties 1–8) and bottom half (9–16) feed
// the two semi-finals.
type RawSlot =
  | { t: 'w'; g: GroupId }
  | { t: 'r'; g: GroupId }
  | { t: 'third'; i: number }

const R32_LAYOUT: [RawSlot, RawSlot][] = [
  [{ t: 'w', g: 'A' }, { t: 'third', i: 0 }],
  [{ t: 'r', g: 'E' }, { t: 'r', g: 'J' }],
  [{ t: 'w', g: 'C' }, { t: 'third', i: 1 }],
  [{ t: 'w', g: 'I' }, { t: 'r', g: 'A' }],
  [{ t: 'w', g: 'E' }, { t: 'third', i: 2 }],
  [{ t: 'r', g: 'G' }, { t: 'r', g: 'L' }],
  [{ t: 'w', g: 'G' }, { t: 'third', i: 3 }],
  [{ t: 'w', g: 'K' }, { t: 'r', g: 'C' }],
  [{ t: 'w', g: 'B' }, { t: 'third', i: 4 }],
  [{ t: 'r', g: 'F' }, { t: 'r', g: 'I' }],
  [{ t: 'w', g: 'D' }, { t: 'third', i: 5 }],
  [{ t: 'w', g: 'J' }, { t: 'r', g: 'B' }],
  [{ t: 'w', g: 'H' }, { t: 'third', i: 6 }],
  [{ t: 'r', g: 'H' }, { t: 'r', g: 'K' }],
  [{ t: 'w', g: 'F' }, { t: 'third', i: 7 }],
  [{ t: 'w', g: 'L' }, { t: 'r', g: 'D' }],
]

const THIRD_MATCH_WINNER_GROUPS: GroupId[] = ['A', 'C', 'E', 'G', 'B', 'D', 'H', 'F']

/** Assign the 8 qualified thirds to the 8 winner ties, avoiding a side meeting
 *  a team from its own group (a R32 rematch). */
function assignThirds(
  winnerGroups: GroupId[],
  thirds: { group: GroupId; id: string }[],
): (string | undefined)[] {
  const res: (string | undefined)[] = new Array(winnerGroups.length).fill(undefined)
  const used = new Array(thirds.length).fill(false)

  for (let i = 0; i < winnerGroups.length; i++) {
    let pick = thirds.findIndex((t, j) => !used[j] && t.group !== winnerGroups[i])
    if (pick === -1) pick = used.findIndex((u) => !u)
    if (pick === -1) break
    used[pick] = true
    res[i] = thirds[pick].id
  }

  for (let i = 0; i < winnerGroups.length; i++) {
    const ti = thirds.find((x) => x.id === res[i])
    if (ti && ti.group === winnerGroups[i]) {
      for (let k = 0; k < winnerGroups.length; k++) {
        if (k === i) continue
        const tk = thirds.find((x) => x.id === res[k])
        if (tk && tk.group !== winnerGroups[i] && ti.group !== winnerGroups[k]) {
          ;[res[i], res[k]] = [res[k], res[i]]
          break
        }
      }
    }
  }
  return res
}

export function buildBracket(state: SimState): Bracket {
  const winner = (g: GroupId) => orderOf(state, g)[0]
  const runner = (g: GroupId) => orderOf(state, g)[1]

  const ranked = thirdsTable(state)
    .filter((t) => t.qualifies)
    .map((t) => ({ group: t.group, id: t.team.id }))
  const assignedThirds = assignThirds(THIRD_MATCH_WINNER_GROUPS, ranked)

  const toSlot = (raw: RawSlot): Slot => {
    if (raw.t === 'w') return { teamId: winner(raw.g), code: `1${raw.g}`, label: `Winner Group ${raw.g}` }
    if (raw.t === 'r') return { teamId: runner(raw.g), code: `2${raw.g}`, label: `Runner-up Group ${raw.g}` }
    return { teamId: assignedThirds[raw.i], code: '3rd', label: 'Best third-placed team' }
  }

  const rounds: Record<Round, KOMatchView[]> = { R32: [], R16: [], QF: [], SF: [], F: [] }
  const winnerOf: Record<string, string | undefined> = {}

  const resolve = (id: string, round: Round, home: Slot, away: Slot): KOMatchView => {
    const view: KOMatchView = { id, round, home, away }
    const w = state.ko[id]
    if (home.teamId && away.teamId && (w === home.teamId || w === away.teamId)) {
      view.winnerId = w
      winnerOf[id] = w
    }
    return view
  }

  const fromMatch = (id: string): Slot => ({ teamId: winnerOf[id], code: '', label: 'Winner' })

  R32_LAYOUT.forEach((m, i) => {
    rounds.R32.push(resolve(`R32-${i + 1}`, 'R32', toSlot(m[0]), toSlot(m[1])))
  })
  for (let i = 0; i < 8; i++) {
    rounds.R16.push(resolve(`R16-${i + 1}`, 'R16', fromMatch(`R32-${2 * i + 1}`), fromMatch(`R32-${2 * i + 2}`)))
  }
  for (let i = 0; i < 4; i++) {
    rounds.QF.push(resolve(`QF-${i + 1}`, 'QF', fromMatch(`R16-${2 * i + 1}`), fromMatch(`R16-${2 * i + 2}`)))
  }
  for (let i = 0; i < 2; i++) {
    rounds.SF.push(resolve(`SF-${i + 1}`, 'SF', fromMatch(`QF-${2 * i + 1}`), fromMatch(`QF-${2 * i + 2}`)))
  }
  rounds.F.push(resolve('F-1', 'F', fromMatch('SF-1'), fromMatch('SF-2')))

  return { rounds, championId: winnerOf['F-1'] }
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
