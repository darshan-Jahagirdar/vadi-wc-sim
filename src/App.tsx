import { useEffect, useMemo, useState } from 'react'
import confetti from 'canvas-confetti'
import { HOSTS, TEAM_BY_ID } from './data/teams'
import {
  allStandings,
  autoFillGroups,
  autoFillRest,
  buildBracket,
  GroupOutcome,
  groupProgress,
  koProgress,
  Results,
  setGroupOutcome,
  setKOWinner,
  simulateEverything,
  thirdsTable,
} from './lib/sim'
import { Flag } from './components/Flag'
import { GroupStage } from './components/GroupStage'
import { Knockout } from './components/Knockout'

const STORAGE_KEY = 'wc2026-sim-results'

function loadResults(): Results {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Results
  } catch {
    /* ignore */
  }
  return {}
}

type Tab = 'groups' | 'knockout'

export default function App() {
  const [results, setResults] = useState<Results>(loadResults)
  const [tab, setTab] = useState<Tab>('groups')

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(results))
    } catch {
      /* ignore */
    }
  }, [results])

  const standings = useMemo(() => allStandings(results), [results])
  const bracket = useMemo(() => buildBracket(results), [results])
  const thirds = useMemo(() => thirdsTable(results), [results])
  const gp = useMemo(() => groupProgress(results), [results])
  const kp = useMemo(() => koProgress(bracket), [bracket])

  const championId = bracket.championId
  const champion = championId ? TEAM_BY_ID[championId] : undefined

  useEffect(() => {
    if (championId) fireConfetti()
  }, [championId])

  const pickGroup = (fixtureId: string, outcome: GroupOutcome) =>
    setResults((r) => setGroupOutcome(r, fixtureId, outcome))

  const pickKO = (matchId: string, winnerId: string, homeId: string, awayId: string) =>
    setResults((r) => setKOWinner(r, matchId, winnerId, homeId, awayId))

  const handleAutoFill = () => {
    setResults((r) => autoFillRest(r))
    setTab('knockout')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const handleRandomize = () => {
    setResults(simulateEverything())
    setTab('knockout')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const handleReset = () => {
    setResults({})
    setTab('groups')
  }
  const handleSeedGroups = () => setResults((r) => autoFillGroups(r))

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="ball">⚽</div>
          <div>
            <h1 className="brand-title">
              World Cup 2026 <span>Simulator</span>
            </h1>
            <div className="hosts">
              {HOSTS.map((h) => (
                <span className="host" key={h.name}>
                  <Flag code={h.flag} /> {h.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {champion && (
          <div className="champion-strip">
            <span className="label">Your champion</span>
            <Flag code={champion.flag} />
            <strong>{champion.name}</strong>
          </div>
        )}
      </header>

      <div className="controlbar">
        <div className="tabs">
          <button
            className={`tab${tab === 'groups' ? ' active' : ''}`}
            onClick={() => setTab('groups')}
          >
            Group stage
          </button>
          <button
            className={`tab${tab === 'knockout' ? ' active' : ''}`}
            onClick={() => setTab('knockout')}
          >
            Knockout
          </button>
        </div>

        <div className="progress">
          <ProgressBar label="Group stage" done={gp.done} total={gp.total} />
          <ProgressBar label="Knockout" done={kp.done} total={kp.total} />
        </div>

        <div className="actions">
          <button className="btn btn-primary" onClick={handleAutoFill}>
            ⚡ Auto-fill rest
          </button>
          <button className="btn" onClick={handleRandomize}>
            🎲 Randomise all
          </button>
          <button className="btn" onClick={handleReset}>
            ↺ Reset
          </button>
        </div>
      </div>

      <main className="content">
        {tab === 'groups' ? (
          <GroupStage
            results={results}
            standings={standings}
            thirds={thirds}
            onPick={pickGroup}
          />
        ) : (
          <Knockout bracket={bracket} onPick={pickKO} onSeed={handleSeedGroups} />
        )}
      </main>

      <footer className="footer">
        Unofficial fan-made predictor · 48 teams, 12 groups, real 2026 final-draw line-ups.
        <br />
        Match outcomes are simulated from rough strength ratings — for fun, not forecasting.
      </footer>
    </div>
  )
}

function ProgressBar({ label, done, total }: { label: string; done: number; total: number }) {
  const pct = total ? Math.round((done / total) * 100) : 0
  return (
    <div className="pbar">
      <div className="row">
        <span>{label}</span>
        <span>
          {done}/{total}
        </span>
      </div>
      <div className="track">
        <div className="fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function fireConfetti() {
  const end = Date.now() + 900
  const colors = ['#15d2c6', '#3b82f6', '#e8468a', '#f5a524']
  const frame = () => {
    confetti({ particleCount: 4, angle: 60, spread: 72, origin: { x: 0 }, colors })
    confetti({ particleCount: 4, angle: 120, spread: 72, origin: { x: 1 }, colors })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}
