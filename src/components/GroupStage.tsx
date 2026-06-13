import { GROUP_IDS, GroupId } from '../data/teams'
import { GroupRow, SimState, ThirdRow, groupTable } from '../lib/sim'
import { Flag } from './Flag'

interface Props {
  state: SimState
  thirds: ThirdRow[]
  onMove: (group: GroupId, index: number, dir: -1 | 1) => void
}

export function GroupStage({ state, thirds, onMove }: Props) {
  return (
    <>
      <p className="stage-hint">
        Set where each nation finishes in its group — use the{' '}
        <span className="kbd">▲</span> <span className="kbd">▼</span> arrows to reorder.
        The top two go through automatically, and the best eight third-placed teams join them.
      </p>

      <div className="groups-grid">
        {GROUP_IDS.map((g) => (
          <GroupCard key={g} group={g} rows={groupTable(state, g)} onMove={onMove} />
        ))}
      </div>

      <ThirdsPanel thirds={thirds} />

      <div className="legend">
        <span className="lg lg-q">Through to last 32</span>
        <span className="lg lg-3">3rd — in the play-off race</span>
        <span className="lg lg-out">Eliminated</span>
      </div>
    </>
  )
}

function GroupCard({
  group,
  rows,
  onMove,
}: {
  group: GroupId
  rows: GroupRow[]
  onMove: (group: GroupId, index: number, dir: -1 | 1) => void
}) {
  return (
    <section className="group-card">
      <div className="group-head">
        <span className="gtag">Group {group}</span>
      </div>

      <ol className="rank-list">
        {rows.map((row, i) => (
          <li key={row.team.id} className={`rank-row q${row.rank}`}>
            <span className="pos">{row.rank}</span>
            <Flag code={row.team.flag} />
            <span className="tn">{row.team.name}</span>
            <span className="movers">
              <button
                className="mv"
                aria-label={`Move ${row.team.name} up`}
                disabled={i === 0}
                onClick={() => onMove(group, i, -1)}
              >
                ▲
              </button>
              <button
                className="mv"
                aria-label={`Move ${row.team.name} down`}
                disabled={i === rows.length - 1}
                onClick={() => onMove(group, i, 1)}
              >
                ▼
              </button>
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

function ThirdsPanel({ thirds }: { thirds: ThirdRow[] }) {
  return (
    <section className="thirds-panel">
      <h2>
        Best third-placed teams
        <span className="hint">top 8 advance</span>
      </h2>
      <p className="thirds-note">
        Ranked by seeding to decide which third-placed sides fill the last eight spots.
      </p>
      <div className="thirds-grid">
        {thirds.map((t) => (
          <div key={t.group} className={`third-row ${t.qualifies ? 'in' : 'out'}`}>
            <span className="ord">{t.order}</span>
            <Flag code={t.team.flag} />
            <span className="tn">{t.team.name}</span>
            <span className="grp">Grp {t.group}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
