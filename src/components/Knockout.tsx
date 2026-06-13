import { Team, TEAM_BY_ID } from '../data/teams'
import {
  Bracket,
  KOMatchView,
  ROUND_NAME,
  ROUND_ORDER,
  Slot,
} from '../lib/sim'
import { Flag } from './Flag'

interface Props {
  bracket: Bracket
  onPick: (matchId: string, winnerId: string, homeId: string, awayId: string) => void
  onSeed: () => void
}

export function Knockout({ bracket, onPick, onSeed }: Props) {
  const champion = bracket.championId ? TEAM_BY_ID[bracket.championId] : undefined

  return (
    <div className="ko-wrap">
      {!bracket.seeded && (
        <div className="notice">
          <span>Finish all 12 groups to lock in the Round of 32 — winners, runners-up and the eight best third-placed teams.</span>
          <button className="btn btn-primary sm" onClick={onSeed}>
            ⚡ Auto-fill group stage
          </button>
        </div>
      )}

      <div className="rounds">
        {ROUND_ORDER.map((round) => (
          <div className={`round round-${round}`} key={round}>
            <div className="round-title">{ROUND_NAME[round]}</div>
            <div className="round-matches">
              {bracket.rounds[round].map((m) => (
                <KOMatch key={m.id} m={m} onPick={onPick} />
              ))}
            </div>
          </div>
        ))}

        <div className="round round-champ">
          <div className="round-title">Champion</div>
          <div className="round-matches">
            <ChampionCard champion={champion} />
          </div>
        </div>
      </div>
    </div>
  )
}

function KOMatch({
  m,
  onPick,
}: {
  m: KOMatchView
  onPick: (matchId: string, winnerId: string, homeId: string, awayId: string) => void
}) {
  const ready = Boolean(m.home.teamId && m.away.teamId)
  return (
    <div className={`ko-match${ready ? '' : ' pending'}`}>
      <KOTeam slot={m.home} side="home" m={m} onPick={onPick} />
      <KOTeam slot={m.away} side="away" m={m} onPick={onPick} />
    </div>
  )
}

function KOTeam({
  slot,
  side,
  m,
  onPick,
}: {
  slot: Slot
  side: 'home' | 'away'
  m: KOMatchView
  onPick: (matchId: string, winnerId: string, homeId: string, awayId: string) => void
}) {
  const team = slot.teamId ? TEAM_BY_ID[slot.teamId] : undefined
  const clickable = Boolean(m.home.teamId && m.away.teamId)
  const isWin = m.winnerId != null && slot.teamId === m.winnerId
  const isLose = m.winnerId != null && slot.teamId !== m.winnerId
  const goals = side === 'home' ? m.homeGoals : m.awayGoals
  const pen = m.pens ? (side === 'home' ? m.pens[0] : m.pens[1]) : undefined

  return (
    <button
      className={`ko-team${isWin ? ' win' : ''}${isLose ? ' lose' : ''}${clickable ? '' : ' disabled'}`}
      disabled={!clickable}
      onClick={() => {
        if (team && m.home.teamId && m.away.teamId) {
          onPick(m.id, team.id, m.home.teamId, m.away.teamId)
        }
      }}
    >
      {team ? <Flag code={team.flag} /> : <span className="flag ph" />}
      <span className="ko-name">
        {team ? team.name : <span className="slot-code">{slot.code || '—'}</span>}
      </span>
      {m.winnerId != null && goals != null && (
        <span className="ko-score">
          {goals}
          {pen != null && <sup>({pen})</sup>}
        </span>
      )}
    </button>
  )
}

function ChampionCard({ champion }: { champion: Team | undefined }) {
  return (
    <div className={`champion-card${champion ? ' done' : ''}`}>
      <div className="trophy">🏆</div>
      {champion ? (
        <>
          <Flag code={champion.flag} className="big" />
          <div className="champ-name">{champion.name}</div>
          <div className="champ-sub">World Champions</div>
        </>
      ) : (
        <div className="champ-sub">Win the final to crown a champion</div>
      )}
    </div>
  )
}
