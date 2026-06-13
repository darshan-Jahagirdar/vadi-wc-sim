# World Cup 2026 Simulator ⚽

An interactive predictor for the **2026 FIFA World Cup** — the first 48-team
edition, co-hosted by Canada, Mexico and the USA. Pick every group-stage result
and knockout winner yourself, or let it simulate the whole tournament, all the
way to crowning a champion.

🔗 **Live site:** https://darshan-jahagirdar.github.io/vadi-wc-sim/

## Features

- **Real tournament field** — all 48 teams in their actual 12 groups from the
  December 2025 Final Draw, with the March 2026 play-off winners resolved into
  their slots.
- **Live group tables** with points / goal-difference / head-to-head
  tie-breakers, plus the *race for the eight best third-placed teams* (only the
  top 8 advance to the Round of 32).
- **Full knockout bracket** — Round of 32 → Round of 16 → Quarter-finals →
  Semi-finals → Final, with penalty shoot-outs when a tie is level.
- **One-click simulation** — *Auto-fill rest* (keeps your picks and fills the
  gaps), *Randomise all* (a fresh run of the whole tournament) and *Reset*.
- **Champion reveal** with confetti, and your bracket is saved in the browser
  (localStorage) so it survives a refresh.

## How the simulation works

Every team has a rough Elo-style strength rating. Match scores are drawn from a
Poisson model weighted by the rating gap between the two sides, so favourites
usually progress but upsets still happen. Ratings and outcomes are for fun, not
forecasts.

## Tech

Vite + React + TypeScript, deployed to GitHub Pages by a GitHub Actions
workflow (`.github/workflows/deploy.yml`).

```bash
npm install
npm run dev      # local dev server at http://localhost:5173
npm run build    # production build into dist/
npm run preview  # preview the production build
```

## Disclaimer

Unofficial fan-made project, not affiliated with FIFA. Team line-ups reflect the
real 2026 World Cup draw; strength ratings and all simulated results are
illustrative only.
