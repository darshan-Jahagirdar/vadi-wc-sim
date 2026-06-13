// Simulation engine for the World Cup 2026 simulator.
//
// Everything the UI shows is *derived* from a single `Results` map
// (matchId -> result). That keeps state tiny and avoids sync bugs:
// change one group result and the whole bracket recomputes.

import {
  GROUP_IDS,
  GroupId,
  Team,
  TEAM_BY_ID,
  teamsInGroup,
} from '../data/teams'

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

export type MatchResult =
  | { kind: 'group'; home: number; away: number }
  | { kind: 'ko'; home: number; away: number; winner: string; pens?: [number, number] }

export type Results = Record<string, MatchResult>

export interface Fixture {
  id: string
  group: GroupId
  matchday: number
  home: string
  away: string
}

export interface Standing {
  team: Team
  played: number
  win: number
  draw: number
  loss: number
  gf: number
  ga: number
  gd: number
  points: number
  rank: number
}

export interface Slot {
  teamId?: string
  /** short code shown before the group stage resolves, e.g. "1A", "2E", "3rd" */
  code: string
  /** longer human label, e.g. "Winner Group A" */
  label: string
}

export interface KOMatchView {
  id: string
  round: Round
  home: Slot
  away: Slot
  winnerId?: string
  homeGoals?: number
  awayGoals?: number
  pens?: [number, number]
}

export interface Bracket {
  rounds: Record<Round, KOMatchView[]>
  championId?: string
  seeded: boolean // true once all 12 groups are complete
}

// ---------------------------------------------------------------------------
// Fixtures (single round-robin, 6 matches per group)
// ---------------------------------------------------------------------------

const GROUP_PAIRS: [number, number][][] = [
  [[0, 1], [2, 3]], // matchday 1
  [[0, 2], [3, 1]], // matchday 2
  [[0, 3], [1, 2]], // matchday 3
]

export function groupFixtures(group: GroupId): Fixture[] {
  const teams = teamsInGroup(group)
  const fixtures: Fixture[] = []
  GROUP_PAIRS.forEach((round, md) => {
    round.forEach(([h, a], i) => {
      fixtures.push({
        id: `G-${group}-${md}-${i}`,
        group,
        matchday: md + 1,
        home: teams[h].id,
        away: teams[a].id,
      })
    })
  })
  return fixtures
}

export const ALL_GROUP_FIXTURES: Fixture[] = GROUP_IDS.flatMap(groupFixtures)
export const TOTAL_GROUP_MATCHES = ALL_GROUP_FIXTURES.length // 72
export const TOTAL_KO_MATCHES = 16 + 8 + 4 + 2 + 1 // 31

export function groupComplete(group: GroupId, results: Results): boolean {
  return groupFixtures(group).every((fx) => {
    const r = results[fx.id]
    return r != null && r.kind === 'group'
  })
}

export function allGroupsComplete(results: Results): boolean {
  return GROUP_IDS.every((g) => groupComplete(g, results))
}

// ---------------------------------------------------------------------------
// Standings
// ---------------------------------------------------------------------------

export function groupStandings(group: GroupId, results: Results): Standing[] {
  const teams = teamsInGroup(group)
  const table = new Map<string, Standing>()
  for (const t of teams) {
    table.set(t.id, {
      team: t,
      played: 0, win: 0, draw: 0, loss: 0,
      gf: 0, ga: 0, gd: 0, points: 0, rank: 0,
    })
  }

  const fixtures = groupFixtures(group)
  const played = fixtures
    .map((fx) => ({ fx, r: results[fx.id] }))
    .filter((x): x is { fx: Fixture; r: Extract<MatchResult, { kind: 'group' }> } =>
      x.r != null && x.r.kind === 'group',
    )

  for (const { fx, r } of played) {
    const h = table.get(fx.home)!
    const a = table.get(fx.away)!
    h.played++; a.played++
    h.gf += r.home; h.ga += r.away
    a.gf += r.away; a.ga += r.home
    if (r.home > r.away) { h.win++; a.loss++; h.points += 3 }
    else if (r.home < r.away) { a.win++; h.loss++; a.points += 3 }
    else { h.draw++; a.draw++; h.points++; a.points++ }
  }
  for (const s of table.values()) s.gd = s.gf - s.ga

  // Pairwise head-to-head goal difference (exact for 2-way ties).
  const h2h = (aId: string, bId: string): number => {
    const m = played.find(
      (p) =>
        (p.fx.home === aId && p.fx.away === bId) ||
        (p.fx.home === bId && p.fx.away === aId),
    )
    if (!m) return 0
    const aGoals = m.fx.home === aId ? m.r.home : m.r.away
    const bGoals = m.fx.home === aId ? m.r.away : m.r.home
    return aGoals - bGoals
  }

  const sorted = [...table.values()].sort((x, y) => {
    if (y.points !== x.points) return y.points - x.points
    if (y.gd !== x.gd) return y.gd - x.gd
    if (y.gf !== x.gf) return y.gf - x.gf
    const h = h2h(x.team.id, y.team.id)
    if (h !== 0) return h > 0 ? -1 : 1
    if (y.team.rating !== x.team.rating) return y.team.rating - x.team.rating
    return x.team.id < y.team.id ? -1 : 1
  })
  sorted.forEach((s, i) => (s.rank = i + 1))
  return sorted
}

export function allStandings(results: Results): Record<GroupId, Standing[]> {
  const out = {} as Record<GroupId, Standing[]>
  for (const g of GROUP_IDS) out[g] = groupStandings(g, results)
  return out
}

function compareThird(a: Standing, b: Standing): number {
  if (b.points !== a.points) return b.points - a.points
  if (b.gd !== a.gd) return b.gd - a.gd
  if (b.gf !== a.gf) return b.gf - a.gf
  if (b.team.rating !== a.team.rating) return b.team.rating - a.team.rating
  return a.team.id < b.team.id ? -1 : 1
}

export interface ThirdRow {
  group: GroupId
  standing: Standing
  qualifies: boolean
  order: number
}

/** All 12 third-placed teams ranked; top 8 qualify (only meaningful once
 *  every group is complete, but returns a best-effort ranking regardless). */
export function thirdsTable(results: Results): ThirdRow[] {
  const standings = allStandings(results)
  const thirds = GROUP_IDS.map((g) => ({ group: g, standing: standings[g][2] }))
  thirds.sort((a, b) => compareThird(a.standing, b.standing))
  return thirds.map((t, i) => ({
    group: t.group,
    standing: t.standing,
    qualifies: i < 8,
    order: i + 1,
  }))
}

// ---------------------------------------------------------------------------
// Knockout bracket
// ---------------------------------------------------------------------------

// R32 layout (16 ties). 1X = winner of group X, 2X = runner-up, T# = a ranked
// best-third. Winners A–H meet thirds; winners I–L meet runners-up A–D; the
// remaining runners-up meet each other. Arranged into a balanced tree so the
// top half (ties 1–8) and bottom half (9–16) feed the two semi-finals.
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

// Groups whose winners occupy the eight winner-vs-third ties, in the order the
// thirds (i = 0..7) appear above.
const THIRD_MATCH_WINNER_GROUPS: GroupId[] = ['A', 'C', 'E', 'G', 'B', 'D', 'H', 'F']

/** Assign the 8 qualified thirds to the 8 winner ties, avoiding a team meeting
 *  a side from its own group (a R32 rematch). */
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

  // Repair any residual same-group clash with a swap.
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

export function buildBracket(results: Results): Bracket {
  const standings = allStandings(results)
  const seeded = allGroupsComplete(results)

  const winner = (g: GroupId) => (seeded ? standings[g][0].team.id : undefined)
  const runner = (g: GroupId) => (seeded ? standings[g][1].team.id : undefined)

  let assignedThirds: (string | undefined)[] = new Array(8).fill(undefined)
  if (seeded) {
    const ranked = thirdsTable(results)
      .filter((t) => t.qualifies)
      .map((t) => ({ group: t.group, id: t.standing.team.id }))
    assignedThirds = assignThirds(THIRD_MATCH_WINNER_GROUPS, ranked)
  }

  const toSlot = (raw: RawSlot): Slot => {
    if (raw.t === 'w') return { teamId: winner(raw.g), code: `1${raw.g}`, label: `Winner Group ${raw.g}` }
    if (raw.t === 'r') return { teamId: runner(raw.g), code: `2${raw.g}`, label: `Runner-up Group ${raw.g}` }
    return { teamId: assignedThirds[raw.i], code: '3rd', label: 'Best third-placed team' }
  }

  const rounds: Record<Round, KOMatchView[]> = { R32: [], R16: [], QF: [], SF: [], F: [] }
  const winnerOf: Record<string, string | undefined> = {}

  const resolve = (id: string, round: Round, home: Slot, away: Slot): KOMatchView => {
    const view: KOMatchView = { id, round, home, away }
    const r = results[id]
    if (
      home.teamId && away.teamId &&
      r && r.kind === 'ko' &&
      (r.winner === home.teamId || r.winner === away.teamId)
    ) {
      view.homeGoals = r.home
      view.awayGoals = r.away
      view.winnerId = r.winner
      view.pens = r.pens
      winnerOf[id] = r.winner
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

  return { rounds, championId: winnerOf['F-1'], seeded }
}

// ---------------------------------------------------------------------------
// Match model (Elo expectation + Poisson goals)
// ---------------------------------------------------------------------------

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

function poisson(lambda: number): number {
  const L = Math.exp(-lambda)
  let k = 0
  let p = 1
  do {
    k++
    p *= Math.random()
  } while (p > L)
  return k - 1
}

function goalsFor(ratingA: number, ratingB: number, base: number): [number, number] {
  const d = (ratingA - ratingB) / 100
  const homeXg = Math.max(0.18, base + 0.42 * d)
  const awayXg = Math.max(0.18, base - 0.42 * d)
  return [poisson(homeXg), poisson(awayXg)]
}

export function simGroupMatch(homeId: string, awayId: string): MatchResult {
  const A = TEAM_BY_ID[homeId]
  const B = TEAM_BY_ID[awayId]
  const [home, away] = goalsFor(A.rating, B.rating, 1.35)
  return { kind: 'group', home, away }
}

function shootout(): [number, number] {
  const winnerScore = 3 + Math.floor(Math.random() * 3) // 3..5
  const loserScore = Math.max(1, winnerScore - 1 - Math.floor(Math.random() * 2)) // 1..winner-1
  return [winnerScore, loserScore]
}

export function simKOMatch(homeId: string, awayId: string): MatchResult {
  const A = TEAM_BY_ID[homeId]
  const B = TEAM_BY_ID[awayId]
  let [home, away] = goalsFor(A.rating, B.rating, 1.25)
  if (home !== away) {
    return { kind: 'ko', home, away, winner: home > away ? homeId : awayId }
  }
  // Level after 90' (+ ET) -> penalties.
  const homeWins = Math.random() < expectedScore(A.rating, B.rating)
  const [ws, ls] = shootout()
  const pens: [number, number] = homeWins ? [ws, ls] : [ls, ws]
  return { kind: 'ko', home, away, winner: homeWins ? homeId : awayId, pens }
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export type GroupOutcome = 'home' | 'draw' | 'away'

export function setGroupOutcome(results: Results, fixtureId: string, outcome: GroupOutcome): Results {
  const goals =
    outcome === 'home' ? { home: 1, away: 0 } :
    outcome === 'away' ? { home: 0, away: 1 } :
    { home: 1, away: 1 }
  return { ...results, [fixtureId]: { kind: 'group', home: goals.home, away: goals.away } }
}

export function setKOWinner(results: Results, matchId: string, winnerId: string, homeId: string, awayId: string): Results {
  return {
    ...results,
    [matchId]: {
      kind: 'ko',
      home: winnerId === homeId ? 1 : 0,
      away: winnerId === awayId ? 1 : 0,
      winner: winnerId,
    },
  }
}

/** Fill every undecided group match (respects existing picks). */
export function autoFillGroups(base: Results): Results {
  const results = { ...base }
  for (const fx of ALL_GROUP_FIXTURES) {
    if (!results[fx.id]) results[fx.id] = simGroupMatch(fx.home, fx.away)
  }
  return results
}

/** Fill every undecided match — groups and the whole knockout tree. */
export function autoFillRest(base: Results): Results {
  let results = autoFillGroups(base)
  for (const round of ROUND_ORDER) {
    const bracket = buildBracket(results)
    for (const m of bracket.rounds[round]) {
      if (m.home.teamId && m.away.teamId && !m.winnerId) {
        results = { ...results, [m.id]: simKOMatch(m.home.teamId, m.away.teamId) }
      }
    }
  }
  return results
}

/** A fresh random run of the entire tournament, ignoring current picks. */
export function simulateEverything(): Results {
  return autoFillRest({})
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

export function groupProgress(results: Results): { done: number; total: number } {
  let done = 0
  for (const fx of ALL_GROUP_FIXTURES) {
    const r = results[fx.id]
    if (r && r.kind === 'group') done++
  }
  return { done, total: TOTAL_GROUP_MATCHES }
}

export function koProgress(bracket: Bracket): { done: number; total: number } {
  let done = 0
  for (const round of ROUND_ORDER) {
    for (const m of bracket.rounds[round]) if (m.winnerId) done++
  }
  return { done, total: TOTAL_KO_MATCHES }
}
