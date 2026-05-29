import { useState, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { Plus, X, Trash2, Edit2 } from 'lucide-react'
import { PERSONEN, slug } from '../constants'

const MEAL_CHIPS = ['Frühstück', 'Mittagessen', 'Abendessen', 'Snack', 'Shake', 'Post-Workout']

const GOALS = {
  'Mateo':    { kcal: 2500, protein: 115, carbs: 280, fat: 80 },
  'Zhuo Jun': { kcal: 2200, protein: 105, carbs: 245, fat: 70 },
  'Julius':   { kcal: 2400, protein: 110, carbs: 260, fat: 75 },
}

const MACRO_META = [
  { key: 'kcal',    label: 'Kalorien', unit: 'kcal', color: 'var(--primary)' },
  { key: 'protein', label: 'Protein',  unit: 'g',    color: 'var(--mateo)' },
  { key: 'carbs',   label: 'Kohlenhydrate', unit: 'g', color: '#f59e0b' },
  { key: 'fat',     label: 'Fett',     unit: 'g',    color: '#a78bfa' },
]

const EMPTY_FORM = { person: PERSONEN[0], meal: '', kcal: '', protein: '', carbs: '', fat: '' }

function pad(n) { return String(n).padStart(2, '0') }
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function getWeekDays() {
  const today = new Date()
  const dow = (today.getDay() + 6) % 7
  const labels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - dow + i)
    return {
      str: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      label: labels[i], isToday: i === dow,
    }
  })
}

export default function Makros() {
  const [entries, setEntries] = useState([])
  const [view, setView] = useState('heute')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'makros'), orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, snap =>
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    return unsub
  }, [])

  const today = todayStr()
  const todayEntries = entries.filter(e => e.date === today)

  function dayTotals(person, dateStr) {
    return entries.filter(e => e.person === person && e.date === dateStr)
      .reduce((s, e) => ({
        kcal: s.kcal + (e.kcal || 0),
        protein: s.protein + (e.protein || 0),
        carbs: s.carbs + (e.carbs || 0),
        fat: s.fat + (e.fat || 0),
      }), { kcal: 0, protein: 0, carbs: 0, fat: 0 })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const data = {
      person: form.person, meal: form.meal.trim(),
      kcal: parseInt(form.kcal) || 0,
      protein: parseInt(form.protein) || 0,
      carbs: parseInt(form.carbs) || 0,
      fat: parseInt(form.fat) || 0,
    }
    if (!data.kcal && !data.protein && !data.carbs && !data.fat) return
    if (editingId) {
      await updateDoc(doc(db, 'makros', editingId), data)
      setEditingId(null)
    } else {
      await addDoc(collection(db, 'makros'), { ...data, date: today, createdAt: serverTimestamp() })
    }
    setForm(EMPTY_FORM); setShowForm(false)
  }

  async function handleDelete(id) { await deleteDoc(doc(db, 'makros', id)) }

  function startEdit(entry) {
    setEditingId(entry.id)
    setForm({
      person: entry.person, meal: entry.meal || '',
      kcal: String(entry.kcal || ''), protein: String(entry.protein || ''),
      carbs: String(entry.carbs || ''), fat: String(entry.fat || ''),
    })
    setShowForm(true)
  }

  const weekDays = getWeekDays()

  return (
    <div className="page">
      <div className="page-header">
        <h1>Makros</h1>
        <button className="btn-icon" onClick={() => { setShowForm(v => !v); setEditingId(null); setForm(EMPTY_FORM) }}>
          {showForm ? <X size={22} /> : <Plus size={22} />}
        </button>
      </div>

      <div className="view-toggle">
        <button className={`view-toggle-btn ${view === 'heute' ? 'active' : ''}`} onClick={() => setView('heute')}>Heute</button>
        <button className={`view-toggle-btn ${view === 'woche' ? 'active' : ''}`} onClick={() => setView('woche')}>Woche</button>
      </div>

      {showForm && (
        <div className="card form-card">
          <div className="form-header">
            <h3>{editingId ? 'Eintrag bearbeiten' : 'Mahlzeit eintragen'}</h3>
            <button className="btn-icon-sm" onClick={() => { setShowForm(false); setEditingId(null) }}><X size={18} /></button>
          </div>
          <form onSubmit={handleSubmit}>
            <label>Person
              <div className="person-select">
                {PERSONEN.map(p => (
                  <button key={p} type="button"
                    className={`person-btn ${form.person === p ? `active chip-${slug(p)}` : ''}`}
                    onClick={() => setForm(f => ({ ...f, person: p }))}>{p}</button>
                ))}
              </div>
            </label>
            <label>Mahlzeit (optional)
              <input value={form.meal} onChange={e => setForm(f => ({ ...f, meal: e.target.value }))} placeholder="z.B. Hähnchenbrust mit Reis" autoFocus />
            </label>
            <div className="meal-chips">
              {MEAL_CHIPS.map(m => (
                <button key={m} type="button"
                  className={`meal-chip ${form.meal === m ? 'active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, meal: f.meal === m ? '' : m }))}>{m}</button>
              ))}
            </div>
            <div className="row">
              <label>Kalorien (kcal)<input type="number" min="0" value={form.kcal} onChange={e => setForm(f => ({ ...f, kcal: e.target.value }))} placeholder="z.B. 450" /></label>
              <label>Protein (g)<input type="number" min="0" value={form.protein} onChange={e => setForm(f => ({ ...f, protein: e.target.value }))} placeholder="z.B. 35" /></label>
            </div>
            <div className="row">
              <label>Kohlenhydrate (g)<input type="number" min="0" value={form.carbs} onChange={e => setForm(f => ({ ...f, carbs: e.target.value }))} placeholder="z.B. 60" /></label>
              <label>Fett (g)<input type="number" min="0" value={form.fat} onChange={e => setForm(f => ({ ...f, fat: e.target.value }))} placeholder="z.B. 12" /></label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingId(null) }}>Abbrechen</button>
              <button type="submit" className="btn-primary">{editingId ? 'Speichern' : 'Eintragen'}</button>
            </div>
          </form>
        </div>
      )}

      {view === 'heute' && (
        <>
          {PERSONEN.map(p => {
            const totals = dayTotals(p, today)
            const goals = GOALS[p]
            return (
              <div key={p} className="card macro-card">
                <div className="protein-progress-header">
                  <span className={`protein-name ${slug(p)}`}>{p}</span>
                  <span className="protein-goal-label">{totals.kcal} / {goals.kcal} kcal</span>
                </div>
                {MACRO_META.map(m => {
                  const val = totals[m.key]
                  const goal = goals[m.key]
                  const pct = Math.min(100, goal > 0 ? Math.round((val / goal) * 100) : 0)
                  return (
                    <div key={m.key} className="macro-row">
                      <span className="macro-label">{m.label}</span>
                      <div className="macro-track">
                        <div className="macro-fill" style={{ width: `${pct}%`, background: m.color }} />
                      </div>
                      <span className="macro-value">{val}<span className="macro-unit">{m.unit}</span></span>
                    </div>
                  )
                })}
              </div>
            )
          })}

          <div className="protein-entries-list">
            {todayEntries.length === 0 && (
              <div className="empty-state small">Noch keine Einträge heute — auf + drücken</div>
            )}
            {[...todayEntries].reverse().map(entry => (
              <div key={entry.id} className={`card protein-entry person-border-${slug(entry.person)}`}>
                <div className="protein-entry-info">
                  <span className={`person-chip chip-${slug(entry.person)}`}>{entry.person}</span>
                  <div style={{ flex: 1 }}>
                    {entry.meal && <div className="protein-entry-meal">{entry.meal}</div>}
                    <div className="macro-entry-stats">
                      {entry.kcal > 0 && <span>{entry.kcal} kcal</span>}
                      {entry.protein > 0 && <span>{entry.protein}g P</span>}
                      {entry.carbs > 0 && <span>{entry.carbs}g K</span>}
                      {entry.fat > 0 && <span>{entry.fat}g F</span>}
                    </div>
                  </div>
                </div>
                <div className="entry-actions">
                  {confirmDeleteId === entry.id ? (
                    <div className="delete-confirm">
                      <span className="delete-confirm-text">Löschen?</span>
                      <button className="btn-confirm-yes" onClick={() => { setConfirmDeleteId(null); handleDelete(entry.id) }}>Ja</button>
                      <button className="btn-confirm-no" onClick={() => setConfirmDeleteId(null)}>Nein</button>
                    </div>
                  ) : (
                    <>
                      <button className="btn-edit" onClick={() => startEdit(entry)}><Edit2 size={15} /></button>
                      <button className="btn-delete" onClick={() => setConfirmDeleteId(entry.id)}><Trash2 size={15} /></button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {view === 'woche' && (
        <div className="card saeulen-card">
          <div className="saeulen-header">
            <span className="stat-section-title">Kalorien diese Woche</span>
          </div>
          <div className="saeulen-chart">
            {weekDays.map(day => {
              const vals = PERSONEN.map(p => dayTotals(p, day.str).kcal)
              const maxKcal = Math.max(...GOALS['Mateo'].kcal > 0 ? [GOALS['Mateo'].kcal] : [], ...vals, 1)
              return (
                <div key={day.str} className="saeulen-day">
                  <div className="saeulen-bars">
                    {PERSONEN.map((p, pi) => {
                      const val = vals[pi]
                      const barH = Math.round((val / maxKcal) * 120)
                      return (
                        <div key={p} className={`saeulen-bar ${slug(p)}`}
                          style={{ height: `${Math.max(barH, val > 0 ? 3 : 0)}px` }}
                          title={`${p}: ${val} kcal`} />
                      )
                    })}
                  </div>
                  <span className={`saeulen-day-label${day.isToday ? ' protein-today-label' : ''}`}>{day.label}</span>
                </div>
              )
            })}
          </div>
          <div className="chart-legend">
            {PERSONEN.map(p => (
              <div key={p} className="legend-item"><div className={`legend-dot ${slug(p)}`} />{p}</div>
            ))}
          </div>
          <div className="protein-week-totals">
            {PERSONEN.map(p => {
              const weekKcal = weekDays.reduce((s, d) => s + dayTotals(p, d.str).kcal, 0)
              const weekProtein = weekDays.reduce((s, d) => s + dayTotals(p, d.str).protein, 0)
              return (
                <div key={p} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className={`comp-name ${slug(p)}`} style={{ fontSize: 13, marginBottom: 2 }}>{p}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {weekKcal} kcal · {weekProtein}g Protein diese Woche
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
