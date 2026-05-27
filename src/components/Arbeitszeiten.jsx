import { useState, useEffect } from 'react'
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { Plus, Trash2, Clock, X, BarChart2 } from 'lucide-react'
import { PERSONEN, slug } from '../constants'

function calcHours(start, end) {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60)
}

function fmtHours(h) {
  const hours = Math.floor(h)
  const mins = Math.round((h - hours) * 60)
  if (hours === 0 && mins === 0) return '0h'
  if (mins === 0) return `${hours}h`
  if (hours === 0) return `${mins}min`
  return `${hours}h ${mins}min`
}

function getWeekBounds() {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { monday, sunday }
}

function getLastWeekBounds() {
  const { monday } = getWeekBounds()
  const end = new Date(monday)
  end.setDate(monday.getDate() - 1)
  end.setHours(23, 59, 59, 999)
  const start = new Date(end)
  start.setDate(end.getDate() - 6)
  start.setHours(0, 0, 0, 0)
  return { start, end }
}

function getLastMonthBounds() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const end = new Date(now.getFullYear(), now.getMonth(), 0)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

function inRange(dateStr, start, end) {
  const d = new Date(dateStr + 'T00:00:00')
  return d >= start && d <= end
}

function hoursForPerson(entries, person, start, end) {
  return entries
    .filter(e => e.person === person && inRange(e.date, start, end))
    .reduce((sum, e) => sum + calcHours(e.startTime, e.endTime), 0)
}

const TODAY = new Date().toISOString().split('T')[0]

// ── Comparison bar card ──────────────────────────
function CompCard({ label, h1, h2 }) {
  const p1 = PERSONEN[0]
  const p2 = PERSONEN[1]
  const max = Math.max(h1, h2, 0.01)
  const winner = h1 > h2 ? p1 : h2 > h1 ? p2 : null
  return (
    <div className="comp-card card">
      <div className="comp-card-title">
        {label}
        {winner && <span className="comp-winner-badge">🏆 {winner}</span>}
        {!winner && (h1 > 0 || h2 > 0) && <span className="comp-winner-badge" style={{background:'#f1f5f9',color:'var(--text-secondary)'}}>Gleichstand</span>}
      </div>
      <div className="comp-row">
        <span className={`comp-name ${slug(p1)}`}>{p1}</span>
        <div className="comp-track">
          <div className={`comp-fill ${slug(p1)}`} style={{ width: `${(h1 / max) * 100}%` }} />
        </div>
        <span className="comp-hours">{fmtHours(h1)}</span>
      </div>
      <div className="comp-row">
        <span className={`comp-name ${slug(p2)}`}>{p2}</span>
        <div className="comp-track">
          <div className={`comp-fill ${slug(p2)}`} style={{ width: `${(h2 / max) * 100}%` }} />
        </div>
        <span className="comp-hours">{fmtHours(h2)}</span>
      </div>
    </div>
  )
}

// ── Säulendiagramm ───────────────────────────────
function Saeulendiagramm({ entries }) {
  const p1 = PERSONEN[0]
  const p2 = PERSONEN[1]

  const dateMap = {}
  entries.forEach(e => {
    if (!dateMap[e.date]) dateMap[e.date] = { [slug(p1)]: 0, [slug(p2)]: 0 }
    const k = slug(e.person)
    dateMap[e.date][k] = (dateMap[e.date][k] || 0) + calcHours(e.startTime, e.endTime)
  })

  const days = Object.keys(dateMap).sort().slice(-14)
  const maxH = Math.max(...days.flatMap(d => [dateMap[d][slug(p1)], dateMap[d][slug(p2)]]), 0.5)
  const CHART_H = 120

  if (days.length === 0) {
    return <p className="no-data-chart">Noch keine Daten vorhanden</p>
  }

  return (
    <div className="saeulen-card card">
      <div className="comp-card-title">Tagesverlauf</div>
      <div className="saeulen-chart">
        {days.map(date => {
          const d = dateMap[date]
          const h1 = d[slug(p1)] || 0
          const h2 = d[slug(p2)] || 0
          const dateObj = new Date(date + 'T00:00:00')
          const label = dateObj.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' })
          return (
            <div key={date} className="saeulen-day">
              <div className="saeulen-bars">
                <div
                  className={`saeulen-bar ${slug(p1)}`}
                  style={{ height: `${Math.max((h1 / maxH) * CHART_H, h1 > 0 ? 3 : 0)}px` }}
                  title={`${p1}: ${fmtHours(h1)}`}
                />
                <div
                  className={`saeulen-bar ${slug(p2)}`}
                  style={{ height: `${Math.max((h2 / maxH) * CHART_H, h2 > 0 ? 3 : 0)}px` }}
                  title={`${p2}: ${fmtHours(h2)}`}
                />
              </div>
              <div className="saeulen-day-label">{label}</div>
            </div>
          )
        })}
      </div>
      <div className="chart-legend">
        <span className="legend-item"><span className={`legend-dot ${slug(p1)}`} />{p1}</span>
        <span className="legend-item"><span className={`legend-dot ${slug(p2)}`} />{p2}</span>
      </div>
    </div>
  )
}

// ── Statistik view ───────────────────────────────
function StatistikView({ entries }) {
  const p1 = PERSONEN[0]
  const p2 = PERSONEN[1]

  const { monday, sunday } = getWeekBounds()
  const { start: lwStart, end: lwEnd } = getLastWeekBounds()
  const { start: lmStart, end: lmEnd } = getLastMonthBounds()

  const lwH1 = hoursForPerson(entries, p1, lwStart, lwEnd)
  const lwH2 = hoursForPerson(entries, p2, lwStart, lwEnd)
  const lmH1 = hoursForPerson(entries, p1, lmStart, lmEnd)
  const lmH2 = hoursForPerson(entries, p2, lmStart, lmEnd)
  const totalH1 = entries.filter(e => e.person === p1).reduce((s, e) => s + calcHours(e.startTime, e.endTime), 0)
  const totalH2 = entries.filter(e => e.person === p2).reduce((s, e) => s + calcHours(e.startTime, e.endTime), 0)

  return (
    <div className="statistik-view">
      <div className="stat-section-title">Vergleich</div>
      <CompCard label="Letzte Woche" h1={lwH1} h2={lwH2} />
      <CompCard label="Letzter Monat" h1={lmH1} h2={lmH2} />
      <CompCard label="Gesamt" h1={totalH1} h2={totalH2} />
      <div className="stat-section-title">Säulendiagramm</div>
      <Saeulendiagramm entries={entries} />
    </div>
  )
}

// ── Main component ───────────────────────────────
export default function Arbeitszeiten() {
  const [person, setPerson] = useState(PERSONEN[0])
  const [entries, setEntries] = useState([])
  const [view, setView] = useState('Einträge')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ date: TODAY, startTime: '', endTime: '', description: '' })

  useEffect(() => {
    const q = query(collection(db, 'arbeitszeiten'), orderBy('date', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [])

  const { monday, sunday } = getWeekBounds()
  const personEntries = entries.filter(e => e.person === person)
  const weekHours = personEntries
    .filter(e => inRange(e.date, monday, sunday))
    .reduce((s, e) => s + calcHours(e.startTime, e.endTime), 0)

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.date || !form.startTime || !form.endTime) return
    await addDoc(collection(db, 'arbeitszeiten'), {
      person,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      description: form.description.trim(),
      hours: calcHours(form.startTime, form.endTime),
      createdAt: serverTimestamp(),
    })
    setForm({ date: TODAY, startTime: '', endTime: '', description: '' })
    setShowForm(false)
  }

  async function handleDelete(id) {
    await deleteDoc(doc(db, 'arbeitszeiten', id))
  }

  const grouped = personEntries.reduce((acc, entry) => {
    (acc[entry.date] = acc[entry.date] || []).push(entry)
    return acc
  }, {})
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div className="page">
      <div className="page-header">
        <h1>Arbeitszeiten</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {view === 'Einträge' && (
            <button className="btn-icon" onClick={() => setShowForm(v => !v)}>
              {showForm ? <X size={22} /> : <Plus size={22} />}
            </button>
          )}
        </div>
      </div>

      <div className="view-toggle">
        {['Einträge', 'Statistik'].map(v => (
          <button
            key={v}
            className={`view-toggle-btn ${view === v ? 'active' : ''}`}
            onClick={() => { setView(v); setShowForm(false) }}
          >
            {v === 'Statistik' ? '📊 Statistik' : '📋 Einträge'}
          </button>
        ))}
      </div>

      {view === 'Statistik' ? (
        <StatistikView entries={entries} />
      ) : (
        <>
          <div className="person-tabs">
            {PERSONEN.map(p => (
              <button
                key={p}
                className={`person-tab ${person === p ? `active ${slug(p)}` : ''}`}
                onClick={() => setPerson(p)}
              >
                {p}
              </button>
            ))}
          </div>

          {showForm && (
            <div className="card form-card">
              <div className="form-header">
                <h3>Neue Einheit – {person}</h3>
                <button className="btn-icon-sm" onClick={() => setShowForm(false)}><X size={18} /></button>
              </div>
              <form onSubmit={handleAdd}>
                <label>
                  Datum
                  <input type="date" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                </label>
                <div className="row">
                  <label>
                    Von
                    <input type="time" value={form.startTime}
                      onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} required />
                  </label>
                  <label>
                    Bis
                    <input type="time" value={form.endTime}
                      onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} required />
                  </label>
                </div>
                <label>
                  Beschreibung
                  <textarea value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={2} placeholder="Was wurde gemacht?" />
                </label>
                {form.startTime && form.endTime && calcHours(form.startTime, form.endTime) > 0 && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Dauer: <strong>{fmtHours(calcHours(form.startTime, form.endTime))}</strong>
                  </div>
                )}
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Abbrechen</button>
                  <button type="submit" className="btn-primary">Eintragen</button>
                </div>
              </form>
            </div>
          )}

          <div className={`week-summary ${slug(person)}-accent`}>
            <Clock size={18} />
            <span>Diese Woche: <strong>{fmtHours(weekHours)}</strong></span>
          </div>

          <div className="entries-list">
            {loading && <div className="empty-state">Lädt…</div>}
            {!loading && sortedDates.length === 0 && (
              <div className="empty-state">
                Noch keine Einträge für {person}.<br />Auf + drücken um zu beginnen.
              </div>
            )}
            {sortedDates.map(date => {
              const dateEntries = grouped[date]
              const dayHours = dateEntries.reduce((s, e) => s + calcHours(e.startTime, e.endTime), 0)
              const dateObj = new Date(date + 'T00:00:00')
              return (
                <div key={date} className="date-group">
                  <div className="date-header">
                    <span>
                      {dateObj.toLocaleDateString('de-DE', {
                        weekday: 'short', day: 'numeric', month: 'long',
                        year: dateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
                      })}
                    </span>
                    <span className="date-total">{fmtHours(dayHours)}</span>
                  </div>
                  {dateEntries.map(entry => (
                    <div key={entry.id} className="entry-card card">
                      <div className="entry-time">
                        <span>{entry.startTime} – {entry.endTime}</span>
                        <span className="entry-hours">{fmtHours(calcHours(entry.startTime, entry.endTime))}</span>
                      </div>
                      {entry.description && <p className="entry-desc">{entry.description}</p>}
                      <button className="btn-delete" onClick={() => handleDelete(entry.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
