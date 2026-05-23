# Gravity Scouting 🏀

**Live Site:** https://jxts3.github.io/gravity-scouting

College-to-NBA draft intelligence for the 2026 class. Gravity Scouting is a full-stack basketball analytics platform that scores every prospect in the 2026 NBA Draft across 5 composite models, matches them to all 30 NBA team systems, and visualizes everything in an interactive dashboard.

---

## What It Does

- **Matrix** — Interactive scatter plot mapping any two of 5 model scores against each other. Click any dot to pull up a full prospect profile
- **Leaderboard** — Ranked table across Gravity, Engine, Defense, Rebounding, and Playmaking scores for the entire draft class
- **Big Board** — Full draft class browser with score bars, archetype labels, combine measurements, and advanced stat tabs
- **System Fit** — Pick any of the 30 NBA teams and see which 2026 prospects fit their system best, with A+ to F grades and fit reasoning per pick

---

## How I Built It

### Data Pipeline (Python)
- Scraped 9 years of college basketball data (2018–2026) from BartTorvik using Selenium — **18,445 player seasons, 102 columns each**
- Cleaned and normalized all stats including conference adjustments, position corrections, and suffix name matching
- Built a historical baseline from 345 drafted players to train the ML translation model

### Scoring Models
Five composite scores computed per prospect, each normalized 0–100:

| Score | What It Measures |
|---|---|
| **Gravity** | Spacing threat — 3P%, FT%, eFG%, shot volume, conference adjustment, position rarity |
| **Engine** | Offensive creation — usage, assist rate, FTR, A/TO, OBPM, ORtg |
| **Defense** | Defensive impact — DBPM, BLK%, STL%, DReb%, foul rate |
| **Rebounding** | Glass control — OReb%, DReb%, position-adjusted totals |
| **Playmaking** | Creation — Ast%, A/TO, pure point BPM, turnover rate |

### ML Translation Model
- Trained a logistic regression model on 345 players drafted between 2018–2025
- Matched college stats to NBA spacing outcomes using historical BartTorvik data
- **0.717 AUC** — predicts probability of becoming a perimeter spacing threat at the NBA level

### NBA System Fit Engine
- Built profiles for all 30 NBA teams using pace, 3PR, rim frequency, assisted rate, and positional need
- Each prospect gets a fit score per team pick, graded A+ to F
- Factors in spacing need, playmaking need, defensive need, rebounding need, and roster quality

### Scoring Profile
- Estimated play type tendencies (PnR handler, drives, spot-up 3, transition, post-up, cuts, etc.) from BartTorvik statistical proxies
- PPP estimated per play type using eFG%, FTR, 3P%, and OReb% as inputs
- Roll vs pop split tracked for every prospect with pick and pop usage

### Frontend (React + Vite)
- Built entirely in React with Recharts for data visualization
- Single-page app served as a static site via GitHub Pages
- Dark theme UI with score bars, grade tags, shot zone breakdowns, and prospect comparison cards
- Deployed via gh-pages with Vite base path configuration

---

## Tech Stack

| Layer | Tools |
|---|---|
| Data scraping | Python, Selenium, pandas |
| ML model | scikit-learn (logistic regression) |
| Data storage | JSON, CSV |
| Frontend | React 19, Vite, Recharts |
| Deployment | GitHub Pages, gh-pages |

---

## Project Structure

gravity-scouting/
├── src/
│   └── App.jsx
├── public/
│   └── data/
│       └── gravity_scouting_2026.json
├── vite.config.js
└── package.json

---

## Key Numbers

- **92** prospects in the 2026 draft class
- **18,445** historical player seasons scraped
- **5** composite model scores per prospect
- **30** NBA team system fit profiles
- **0.717** AUC on ML spacing translation model
- **345** drafted players used for model training

---

*Built by Jesse Igbide — CS student at UNC Charlotte*
*Data sourced from BartTorvik. Not affiliated with any NBA team or organization.*