import { GROUP_IDS, GroupId, TEAM_BY_ID } from '../data/teams'
import {
  Fixture,
  GroupOutcome,
  groupFixtures,
  MatchResult,
  Results,
  Standing,
  ThirdRow,
} from '../lib/sim'
import { Flag } from './Flag'

interface Props {
  results: Results
  standings: Record<GroupId, Standing[]>
  thirds: ThirdRow[]
  onPick: (fixtureId: string, outcome: GroupOutcome) => void
}

export function GroupStage({ results, standings, thirds, onPick }: Props) {
  return (
    <>
      <div className="groups-grid">
        {GROUP_IDS.map((g) => (
          <GroupCard
            key={g}
            group={g}
            standings={standings[g]}
            results={results}
            onPick={onPick}
          />
        ))}
      </div>
      <ThirdsPanel thirds={thirds} />
    </>
  )
}

function GroupCard({
  group,
  standings,
  results,
  onPick,
}: {
  group: GroupId
  standings: Standing[]
  results: Results
  onPick: (fixtureId: string, outcome: GroupOutcome) => void
}) {
  const fixtures = groupFixtures(group)
  return (
    <section className="group-card">
      <div className="group-head">
        <span className="gtag">Group {group}</span>
      </div>

      <table className="standings">
        <thead>
          <tr>
            <th></th>
            <th className="ta-l">Team</th>
            <th>Pl</th>
            <th>GD</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s) => (
            <tr key={s.team.id} className={`q${s.rank}`}>
              <td className="pos">{s.rank}</td>
              <td className="ta-l">
                <span className="team">
                  <Flag code={s.team.flag} />
                  <span className="tn">{s.team.name}</span>
                </span>
              </td>
              <td>{s.played}</td>
              <td>{s.gd > 0 ? `+${s.gd}` : s.gd}</td>
              <td className="pts">{s.points}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="fixtures">
        {fixtures.map((fx) => (
          <FixtureRow key={fx.id} fx={fx} result={results[fx.id]} onPick={onPick} />
        ))}
      </div>
    </section>
  )
}

function FixtureRow({
  fx,
  result,
  onPick,
}: {
  fx: Fixture
  result: MatchResult | undefined
  onPick: (fixtureId: string, outcome: GroupOutcome) => void
}) {
  const home = TEAM_BY_ID[fx.home]
  const away = TEAM_BY_ID[fx.away]

  let sel: GroupOutcome | undefined
  if (result && result.kind === 'group') {
    sel = result.home > result.away ? 'home' : result.home < result.away ? 'away' : 'draw'
  }

  const cls = (side: GroupOutcome) =>
    `side ${side}` + (sel === side ? ' win' : sel ? ' lose' : '')

  return (
    <div className="fixture">
      <button className={cls('home')} onClick={() => onPick(fx.id, 'home')}>
        <span className="tname">{home.name}</span>
        <Flag code={home.flag} />
      </button>
      <button
        className={`draw${sel === 'draw' ? ' sel' : ''}`}
        onClick={() => onPick(fx.id, 'draw')}
        title="Draw"
        aria-label="Draw"
      >
        ×
      </button>
      <button className={cls('away')} onClick={() => onPick(fx.id, 'away')}>
        <Flag code={away.flag} />
        <span className="tname">{away.name}</span>
      </button>
    </div>
  )
}

function ThirdsPanel({ thirds }: { thirds: ThirdRow[] }) {
  return (
    <section className="thirds-panel">
      <h2>
        Race for the best third-placed teams
        <span className="hint">top 8 advance</span>
      </h2>
      <div className="thirds-grid">
        {thirds.map((t) => (
          <div key={t.group} className={`third-row ${t.qualifies ? 'in' : 'out'}`}>
            <span className="ord">{t.order}</span>
            <Flag code={t.standing.team.flag} />
            <span className="tn">{t.standing.team.name}</span>
            <span className="grp">Grp {t.group}</span>
            <span className="pts">{t.standing.points} pts</span>
          </div>
        ))}
      </div>
    </section>
  )
}
