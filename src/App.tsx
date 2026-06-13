import { useEffect, useMemo, useState } from 'react'
import confetti from 'canvas-confetti'
import { GroupId, HOSTS, TEAM_BY_ID } from './data/teams'
import {
  autoFillKO,
  buildBracket,
  EMPTY_STATE,
  koProgress,
  moveTeam,
  randomiseAll,
  setKO,
  SimState,
  thirdsTable,
} from './lib/sim'
import { Flag } from './components/Flag'
import { GroupStage } from './components/GroupStage'
import { Knockout } from './components/Knockout'

const STORAGE_KEY = 'wc2026-sim-v3'

function loadState(): SimState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as SimState
      if (parsed && typeof parsed === 'object' && parsed.groups && parsed.ko) return parsed
    }
  } catch {
    /* ignore */
  }
  return EMPTY_STATE
}

type Tab = 'groups' | 'knockout'

export default function App() {
  const [state, setState] = useState<SimState>(loadState)
  const [tab, setTab] = useState<Tab>('groups')

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state])

  const bracket = useMemo(() => buildBracket(state), [state])
  const thirds = useMemo(() => thirdsTable(state), [state])
  const kp = useMemo(() => koProgress(bracket), [bracket])

  const championId = bracket.championId
  const champion = championId ? TEAM_BY_ID[championId] : undefined

  useEffect(() => {
    if (championId) fireConfetti()
  }, [championId])

  const onMove = (group: GroupId, index: number, dir: -1 | 1) =>
    setState((s) => moveTeam(s, group, index, dir))

  const onPick = (matchId: string, winnerId: string) =>
    setState((s) => setKO(s, matchId, winnerId))

  const handleAutoFill = () => {
    setState((s) => autoFillKO(s))
    setTab('knockout')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const handleRandomize = () => {
    setState(randomiseAll())
    setTab('knockout')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const handleReset = () => {
    setState(EMPTY_STATE)
    setTab('groups')
  }

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
          <ProgressBar label="Knockout ties" done={kp.done} total={kp.total} />
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
          <GroupStage state={state} thirds={thirds} onMove={onMove} />
        ) : (
          <Knockout bracket={bracket} onPick={onPick} />
        )}
      </main>

      <footer className="footer">
        Unofficial fan-made predictor · 48 teams, 12 groups, real 2026 final-draw line-ups.
        <br />
        Pick the group positions and knockout winners — or simulate it all for fun.
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
