import { Team, TEAM_BY_ID } from '../data/teams'
import { Bracket, KOMatchView, ROUND_NAME, ROUND_ORDER, Slot } from '../lib/sim'
import { Flag } from './Flag'

interface Props {
  bracket: Bracket
  onPick: (matchId: string, winnerId: string) => void
}

export function Knockout({ bracket, onPick }: Props) {
  const champion = bracket.championId ? TEAM_BY_ID[bracket.championId] : undefined

  return (
    <div className="ko-wrap">
      <p className="stage-hint">
        Tap a team to send them through. Win the final to crown your champion.
      </p>

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
  onPick: (matchId: string, winnerId: string) => void
}) {
  const ready = Boolean(m.home.teamId && m.away.teamId)
  return (
    <div className={`ko-match${ready ? '' : ' pending'}`}>
      <KOTeam slot={m.home} m={m} onPick={onPick} />
      <KOTeam slot={m.away} m={m} onPick={onPick} />
    </div>
  )
}

function KOTeam({
  slot,
  m,
  onPick,
}: {
  slot: Slot
  m: KOMatchView
  onPick: (matchId: string, winnerId: string) => void
}) {
  const team = slot.teamId ? TEAM_BY_ID[slot.teamId] : undefined
  const clickable = Boolean(m.home.teamId && m.away.teamId)
  const isWin = m.winnerId != null && slot.teamId === m.winnerId
  const isLose = m.winnerId != null && slot.teamId !== m.winnerId

  return (
    <button
      className={`ko-team${isWin ? ' win' : ''}${isLose ? ' lose' : ''}${clickable ? '' : ' disabled'}`}
      disabled={!clickable}
      onClick={() => {
        if (slot.teamId) onPick(m.id, slot.teamId)
      }}
    >
      {team ? <Flag code={team.flag} /> : <span className="flag ph" />}
      <span className="ko-name">
        {team ? team.name : <span className="slot-code">{slot.code || '—'}</span>}
      </span>
      {isWin && <span className="ko-check" aria-hidden="true">✓</span>}
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
