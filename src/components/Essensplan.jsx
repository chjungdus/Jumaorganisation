import { useState } from 'react'
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'

const TAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const TAGE_LANG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']

const POOLS = {
  früh: [
    { name: 'Haferflocken + Milch + Banane', kcal: 650, p: 22, k: 98, f: 12 },
    { name: 'Rührei (3 Eier) + Vollkorntoast', kcal: 620, p: 28, k: 40, f: 30 },
    { name: 'Proteinpancakes + Beeren', kcal: 680, p: 32, k: 78, f: 18 },
    { name: 'Griech. Joghurt + Müsli + Banane', kcal: 700, p: 28, k: 95, f: 14 },
    { name: 'Vollkornbrot (3×) + Ei + Käse', kcal: 640, p: 30, k: 62, f: 24 },
  ],
  mittag: [
    { name: 'Hähnchenbrust + Reis + Brokkoli', kcal: 900, p: 55, k: 95, f: 14 },
    { name: 'Pasta Bolognese + Parmesan', kcal: 920, p: 48, k: 102, f: 22 },
    { name: 'Thunfisch-Rice-Bowl + Avocado', kcal: 880, p: 50, k: 88, f: 28 },
    { name: 'Putenbrust + Kartoffeln + Bohnen', kcal: 850, p: 52, k: 90, f: 12 },
    { name: 'Hähnchen-Gyros + Pita + Tzatziki', kcal: 930, p: 50, k: 95, f: 26 },
    { name: 'Wrap mit Hähnchen + Gemüse', kcal: 860, p: 48, k: 88, f: 22 },
  ],
  abend: [
    { name: 'Lachs + Süßkartoffeln + Salat', kcal: 750, p: 42, k: 68, f: 24 },
    { name: 'Rindersteak + Kartoffeln + Gemüse', kcal: 800, p: 48, k: 62, f: 30 },
    { name: 'Hähnchen-Curry + Basmatireis', kcal: 780, p: 45, k: 85, f: 18 },
    { name: 'Thunfisch-Pasta + Parmesan', kcal: 760, p: 44, k: 80, f: 22 },
    { name: 'Pizza (3 Stücke) + Salat', kcal: 820, p: 38, k: 95, f: 28 },
    { name: 'Lachsburger + Süßkartoffel-Fries', kcal: 810, p: 46, k: 82, f: 26 },
  ],
  snack1: [
    { name: 'Magerquark + Beeren + Honig', kcal: 280, p: 28, k: 32, f: 2 },
    { name: 'Proteinshake + Milch (400 ml)', kcal: 320, p: 32, k: 28, f: 8 },
    { name: 'Hüttenkäse + Vollkornbrot', kcal: 300, p: 25, k: 30, f: 6 },
    { name: 'Skyr + Granola + Erdbeeren', kcal: 310, p: 26, k: 40, f: 5 },
  ],
  snack2: [
    { name: 'Nüsse (40 g) + dunkle Schokolade', kcal: 320, p: 8, k: 18, f: 24 },
    { name: 'Banane + Erdnussbutter (2 EL)', kcal: 350, p: 10, k: 45, f: 16 },
    { name: 'Vollkornbrot + Käse', kcal: 300, p: 14, k: 32, f: 12 },
    { name: 'Reiswaffeln + Mandelmus', kcal: 290, p: 9, k: 38, f: 14 },
  ],
}

// Per-week, per-day default indices [früh, mittag, abend, snack1, snack2]
const PLAN = [
  [[0,0,0,0,0],[1,1,1,1,1],[2,2,2,2,2],[3,3,3,0,0],[4,4,4,1,1],[0,5,5,2,2],[1,0,0,3,3]],
  [[3,2,2,1,1],[4,3,3,0,2],[0,4,4,2,0],[1,5,5,1,1],[2,0,0,0,2],[3,1,1,2,0],[4,2,2,1,1]],
  [[2,4,3,2,2],[3,5,4,0,0],[4,0,5,1,1],[0,1,0,2,2],[1,2,1,3,0],[2,3,2,0,1],[3,4,3,1,2]],
  [[1,3,1,0,1],[2,4,2,1,2],[3,5,3,2,0],[4,0,4,3,1],[0,1,5,0,2],[1,2,0,1,0],[2,3,1,2,1]],
]

const SLOT_LABELS = [
  { key: 'früh',   label: 'Frühstück',   pool: 'früh',   emoji: '🍳' },
  { key: 'mittag', label: 'Mittagessen', pool: 'mittag', emoji: '🍗' },
  { key: 'abend',  label: 'Abendessen',  pool: 'abend',  emoji: '🥗' },
  { key: 'snack1', label: 'Snack 1',     pool: 'snack1', emoji: '🥛' },
  { key: 'snack2', label: 'Snack 2',     pool: 'snack2', emoji: '🥜' },
]

const POOL_KEYS = ['früh', 'mittag', 'abend', 'snack1', 'snack2']

function loadOverrides() {
  try { return JSON.parse(localStorage.getItem('essensplan-overrides') || '{}') }
  catch { return {} }
}

function overrideKey(w, d, slot) { return `${w}-${d}-${slot}` }

export default function Essensplan() {
  const [woche, setWoche] = useState(0)
  const [tagIdx, setTagIdx] = useState(0)
  const [overrides, setOverrides] = useState(loadOverrides)

  function getIdx(w, d, slotIdx) {
    const key = overrideKey(w, d, slotIdx)
    return overrides[key] ?? PLAN[w][d][slotIdx]
  }

  function cycle(slotIdx) {
    const key = overrideKey(woche, tagIdx, slotIdx)
    const poolKey = POOL_KEYS[slotIdx]
    const cur = getIdx(woche, tagIdx, slotIdx)
    const next = (cur + 1) % POOLS[poolKey].length
    const newOv = { ...overrides, [key]: next }
    setOverrides(newOv)
    localStorage.setItem('essensplan-overrides', JSON.stringify(newOv))
  }

  const dayMeals = POOL_KEYS.map((pk, si) => ({
    ...SLOT_LABELS[si],
    meal: POOLS[pk][getIdx(woche, tagIdx, si)],
  }))

  const totalKcal = dayMeals.reduce((s, m) => s + m.meal.kcal, 0)
  const totalP    = dayMeals.reduce((s, m) => s + m.meal.p,    0)

  return (
    <div className="page">
      <div className="page-header">
        <h1>Essensplan</h1>
        <span className="person-chip chip-mateo" style={{ fontSize: 13 }}>Mateo</span>
      </div>

      {/* Wochen-Picker */}
      <div className="ep-week-row">
        <button className="ep-week-btn" onClick={() => setWoche(w => Math.max(0, w - 1))}
          disabled={woche === 0}><ChevronLeft size={18} /></button>
        {[0,1,2,3].map(w => (
          <button key={w} className={`view-toggle-btn ${woche === w ? 'active' : ''}`}
            onClick={() => setWoche(w)}>Woche {w + 1}</button>
        ))}
        <button className="ep-week-btn" onClick={() => setWoche(w => Math.min(3, w + 1))}
          disabled={woche === 3}><ChevronRight size={18} /></button>
      </div>

      {/* Tages-Tabs */}
      <div className="ep-day-tabs">
        {TAGE.map((t, i) => (
          <button key={t} className={`ep-day-tab ${tagIdx === i ? 'active' : ''}`}
            onClick={() => setTagIdx(i)}>{t}</button>
        ))}
      </div>

      <div className="ep-day-title">{TAGE_LANG[tagIdx]}</div>

      {/* Tages-Summary */}
      <div className="ep-summary card">
        <div className="ep-summary-item"><span>Kalorien</span><strong>{totalKcal} kcal</strong></div>
        <div className="ep-summary-sep" />
        <div className="ep-summary-item"><span>Protein</span><strong>{totalP} g</strong></div>
        <div className="ep-summary-sep" />
        <div className="ep-summary-item" style={{ color: totalKcal >= 3200 && totalKcal <= 3400 ? 'var(--julius)' : 'var(--mittel)' }}>
          <span>Ziel</span><strong>3300 kcal</strong>
        </div>
      </div>

      {/* Mahlzeiten */}
      <div className="ep-meals">
        {dayMeals.map(({ key, label, emoji, meal }, si) => (
          <div key={key} className="card ep-meal-card">
            <div className="ep-meal-header">
              <span className="ep-meal-label">{emoji} {label}</span>
              <button className="ep-alt-btn" onClick={() => cycle(si)} title="Alternative">
                <RefreshCw size={15} />
                <span>Alternative</span>
              </button>
            </div>
            <div className="ep-meal-name">{meal.name}</div>
            <div className="ep-meal-macros">
              <span>{meal.kcal} kcal</span>
              <span className="ep-macro-sep">·</span>
              <span>{meal.p}g Protein</span>
              <span className="ep-macro-sep">·</span>
              <span>{meal.k}g Carbs</span>
              <span className="ep-macro-sep">·</span>
              <span>{meal.f}g Fett</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
