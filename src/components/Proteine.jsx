import { useState, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { Plus, X, Trash2, Edit2 } from 'lucide-react'
import { PERSONEN, slug, PROTEIN_GOALS } from '../constants'

const MEAL_CHIPS = ['Frühstück', 'Mittagessen', 'Abendessen', 'Snack', 'Shake', 'Post-Workout']

function pad(n) { return String(n).padStart(2, '0') }
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function niceMax(maxVal) {
  const raw = (maxVal || 1) * 1.1
  const step = raw >= 1000 ? 500 : raw >= 200 ? 100 : raw >= 100 ? 50 : 25
  return Math.ceil(raw / step) * step
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
      label: labels[i],
      isToday: i === dow,
    }
  })
}

export default function Proteine() {
  const [entries, setEntries] = useState([])
  const [view, setView] = useState('heute')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ person: PERSONEN[0], amount: '', meal: '' })
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'proteine'), orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, snap =>
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    return unsub
  }, [])

  const today = todayStr()
  const todayEntries = entries.filter(e => e.date === today)

  function dayTotal(person, dateStr) {
    return entries.filter(e => e.person === person && e.date === dateStr)
      .reduce((s, e) => s + (e.amount || 0), 0)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const amount = parseInt(form.amount)
    if (!amount || amount <= 0) return
    if (editingId) {
      await updateDoc(doc(db, 'proteine', editingId), {
        person: form.person, amount, meal: form.meal.trim()
      })
      setEditingId(null)
    } else {
      await addDoc(collection(db, 'proteine'), {
        person: form.person, amount, meal: form.meal.trim(),
        date: today, createdAt: serverTimestamp()
      })
    }
    setForm({ person: PERSONEN[0], amount: '', meal: '' })
    setShowForm(false)
  }

  async function handleDelete(id) {
    await deleteDoc(doc(db, 'proteine', id))
  }

  function startEdit(entry) {
    setEditingId(entry.id)
    setForm({ person: entry.person, amount: String(entry.amount), meal: entry.meal || '' })
    setShowForm(true)
  }

  function openAdd() {
    setEditingId(null)
    setForm({ person: PERSONEN[0], amount: '', meal: '' })
    setShowForm(v => !v)
  }

  const weekDays = getWeekDays()
  const weekMax = Math.max(
    ...PERSONEN.flatMap(p => weekDays.map(d => dayTotal(p, d.str))),
    ...Object.values(PROTEIN_GOALS)
  )
  const CHART_H = 120
  const yMax = niceMax(weekMax)
  const ySteps = [0, 1, 2, 3, 4].map(i => Math.round((i / 4) * yMax))

  return (
    <div className="page">
      <div className="page-header">
        <h1>Proteine</h1>
        <button className="btn-icon" onClick={openAdd}>
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
            <h3>{editingId ? 'Eintrag bearbeiten' : 'Protein eintragen'}</h3>
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
            <label>Protein in Gramm
              <input type="number" min="1" max="500" autoFocus value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="z.B. 30" required />
            </label>
            <label>Mahlzeit (optional)
              <input value={form.meal} onChange={e => setForm(f => ({ ...f, meal: e.target.value }))}
                placeholder="z.B. Hühnchenbrust, Shake…" />
            </label>
            <div className="meal-chips">
              {MEAL_CHIPS.map(m => (
                <button key={m} type="button"
                  className={`meal-chip ${form.meal === m ? 'active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, meal: f.meal === m ? '' : m }))}>{m}</button>
              ))}
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
            const total = dayTotal(p, today)
            const goal = PROTEIN_GOALS[p]
            const pct = Math.min(100, Math.round((total / goal) * 100))
            return (
              <div key={p} className="card protein-progress-card">
                <div className="protein-progress-header">
                  <span className={`protein-name ${slug(p)}`}>{p}</span>
                  <span className="protein-goal-label">Ziel: {goal}g</span>
                </div>
                <div className="protein-amount-row">
                  <span className={`protein-amount-big ${slug(p)}`}>{total}g</span>
                  {total >= goal && <span className="protein-reached-badge">🎯 Ziel erreicht!</span>}
                  {total < goal && total > 0 && (
                    <span className="protein-remaining">{goal - total}g fehlen noch</span>
                  )}
                </div>
                <div className="protein-track">
                  <div className={`protein-fill ${slug(p)}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="protein-pct">{pct}% vom Tagesziel</div>
              </div>
            )
          })}

          <div className="protein-entries-list">
            {todayEntries.length === 0 && (
              <div className="empty-state small">Noch keine Einträge heute — auf + drücken um hinzuzufügen</div>
            )}
            {[...todayEntries].reverse().map(entry => (
              <div key={entry.id} className={`card protein-entry person-border-${slug(entry.person)}`}>
                <div className="protein-entry-info">
                  <span className={`person-chip chip-${slug(entry.person)}`}>{entry.person}</span>
                  <span className="protein-entry-amount">{entry.amount}g</span>
                  {entry.meal && <span className="protein-entry-meal">{entry.meal}</span>}
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
            <span className="stat-section-title">Diese Woche</span>
          </div>
          <div className="macro-chart-row">
            <div className="macro-y-col" style={{ height: CHART_H }}>
              {[...ySteps].reverse().map(v => (
                <span key={v} className="macro-y-tick"
                  style={{ bottom: `${(v / yMax) * 100}%`, transform: 'translateY(50%)' }}>
                  {v}
                </span>
              ))}
            </div>
            <div className="macro-plot" style={{ height: CHART_H }}>
              {ySteps.map(v => (
                <div key={v} className="macro-hgrid" style={{ bottom: `${(v / yMax) * 100}%` }} />
              ))}
              {weekDays.map(day => (
                <div key={day.str} className="macro-day-col">
                  <div className="macro-bars-group">
                    {PERSONEN.map(p => {
                      const val = dayTotal(p, day.str)
                      const barH = yMax > 0 ? Math.max(Math.round((val / yMax) * CHART_H), val > 0 ? 2 : 0) : 0
                      return (
                        <div key={p} className="macro-bar-col">
                          <div className={`macro-bar ${slug(p)}`}
                            style={{ height: barH }}
                            title={`${p}: ${val}g`} />
                        </div>
                      )
                    })}
                  </div>
                  <span className={`saeulen-day-label${day.isToday ? ' protein-today-label' : ''}`}>
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-legend">
            {PERSONEN.map(p => (
              <div key={p} className="legend-item">
                <div className={`legend-dot ${slug(p)}`} />
                {p}
              </div>
            ))}
          </div>
          <div className="protein-week-totals">
            {PERSONEN.map(p => {
              const weekTotal = weekDays.reduce((s, d) => s + dayTotal(p, d.str), 0)
              const weekGoal = PROTEIN_GOALS[p] * 7
              const pct = Math.min(100, Math.round((weekTotal / weekGoal) * 100))
              return (
                <div key={p} className="comp-row" style={{ marginTop: 4 }}>
                  <span className={`comp-name ${slug(p)}`}>{p}</span>
                  <div className="comp-track">
                    <div className={`comp-fill ${slug(p)}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="comp-hours">{weekTotal}g</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
