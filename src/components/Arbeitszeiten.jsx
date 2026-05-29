import { useState, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { Plus, Trash2, Clock, X, Edit2 } from 'lucide-react'
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

function getCurrentMonthBounds() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

function pad(n) { return String(n).padStart(2, '0') }

function getCurrentWeekDays() {
  const { monday } = getWeekBounds()
  const LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return { date: d.toISOString().split('T')[0], label: LABELS[i] }
  })
}

function getCurrentMonthWeeks() {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const lastDay = new Date(y, m + 1, 0).getDate()
  const mm = pad(m + 1)
  return [
    { start: `${y}-${mm}-01`, end: `${y}-${mm}-07`, label: '1–7' },
    { start: `${y}-${mm}-08`, end: `${y}-${mm}-14`, label: '8–14' },
    { start: `${y}-${mm}-15`, end: `${y}-${mm}-21`, label: '15–21' },
    { start: `${y}-${mm}-22`, end: `${y}-${mm}-${pad(lastDay)}`, label: `22–${lastDay}` },
  ]
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

function CompCard({ label, h1, h2 }) {
  const p1 = PERSONEN[0], p2 = PERSONEN[1]
  const max = Math.max(h1, h2, 0.01)
  const winner = h1 > h2 ? p1 : h2 > h1 ? p2 : null
  return (
    <div className="comp-card card">
      <div className="comp-card-title">
        {label}
        {winner && <span className="comp-winner-badge">🏆 {winner}</span>}
        {!winner && (h1 > 0 || h2 > 0) && <span className="comp-winner-badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>Gleichstand</span>}
      </div>
      <div className="comp-row">
        <span className={`comp-name ${slug(p1)}`}>{p1}</span>
        <div className="comp-track"><div className={`comp-fill ${slug(p1)}`} style={{ width: `${(h1 / max) * 100}%` }} /></div>
        <span className="comp-hours">{fmtHours(h1)}</span>
      </div>
      <div className="comp-row">
        <span className={`comp-name ${slug(p2)}`}>{p2}</span>
        <div className="comp-track"><div className={`comp-fill ${slug(p2)}`} style={{ width: `${(h2 / max) * 100}%` }} /></div>
        <span className="comp-hours">{fmtHours(h2)}</span>
      </div>
    </div>
  )
}

function Saeulendiagramm({ entries }) {
  const [mode, setMode] = useState('woche')
  const p1 = PERSONEN[0], p2 = PERSONEN[1]
  const CHART_H = 120

  const wocheData = getCurrentWeekDays().map(({ date, label }) => ({
    label,
    h1: entries.filter(e => e.person === p1 && e.date === date).reduce((s, e) => s + calcHours(e.startTime, e.endTime), 0),
    h2: entries.filter(e => e.person === p2 && e.date === date).reduce((s, e) => s + calcHours(e.startTime, e.endTime), 0),
  }))

  const monatData = getCurrentMonthWeeks().map(({ start, end, label }) => ({
    label,
    h1: entries.filter(e => e.person === p1 && e.date >= start && e.date <= end).reduce((s, e) => s + calcHours(e.startTime, e.endTime), 0),
    h2: entries.filter(e => e.person === p2 && e.date >= start && e.date <= end).reduce((s, e) => s + calcHours(e.startTime, e.endTime), 0),
  }))

  const data = mode === 'woche' ? wocheData : monatData
  const maxH = Math.max(...data.flatMap(d => [d.h1, d.h2]), 0.5)

  return (
    <div className="saeulen-card card">
      <div className="saeulen-header">
        <span className="comp-card-title">Säulendiagramm</span>
        <div className="chart-mode-toggle">
          <button className={`chart-mode-btn ${mode === 'woche' ? 'active' : ''}`} onClick={() => setMode('woche')}>Woche</button>
          <button className={`chart-mode-btn ${mode === 'monat' ? 'active' : ''}`} onClick={() => setMode('monat')}>Monat</button>
        </div>
      </div>
      <div className="saeulen-chart">
        {data.map((d, i) => (
          <div key={i} className="saeulen-day">
            <div className="saeulen-bars">
              <div className={`saeulen-bar ${slug(p1)}`} style={{ height: `${Math.max((d.h1 / maxH) * CHART_H, d.h1 > 0 ? 4 : 0)}px` }} title={`${p1}: ${fmtHours(d.h1)}`} />
              <div className={`saeulen-bar ${slug(p2)}`} style={{ height: `${Math.max((d.h2 / maxH) * CHART_H, d.h2 > 0 ? 4 : 0)}px` }} title={`${p2}: ${fmtHours(d.h2)}`} />
            </div>
            <div className="saeulen-day-label">{d.label}</div>
          </div>
        ))}
      </div>
      <div className="chart-legend">
        <span className="legend-item"><span className={`legend-dot ${slug(p1)}`} />{p1}</span>
        <span className="legend-item"><span className={`legend-dot ${slug(p2)}`} />{p2}</span>
      </div>
    </div>
  )
}

function StatistikView({ entries }) {
  const p1 = PERSONEN[0], p2 = PERSONEN[1]
  const { monday, sunday } = getWeekBounds()
  const { start: mStart, end: mEnd } = getCurrentMonthBounds()
  const wH1 = hoursForPerson(entries, p1, monday, sunday)
  const wH2 = hoursForPerson(entries, p2, monday, sunday)
  const mH1 = hoursForPerson(entries, p1, mStart, mEnd)
  const mH2 = hoursForPerson(entries, p2, mStart, mEnd)
  const totalH1 = entries.filter(e => e.person === p1).reduce((s, e) => s + calcHours(e.startTime, e.endTime), 0)
  const totalH2 = entries.filter(e => e.person === p2).reduce((s, e) => s + calcHours(e.startTime, e.endTime), 0)
  return (
    <div className="statistik-view">
      <div className="stat-section-title">Vergleich</div>
      <CompCard label="Diese Woche" h1={wH1} h2={wH2} />
      <CompCard label="Dieser Monat" h1={mH1} h2={mH2} />
      <CompCard label="Gesamt" h1={totalH1} h2={totalH2} />
      <div className="stat-section-title">Säulendiagramm</div>
      <Saeulendiagramm entries={entries} />
    </div>
  )
}

const EMPTY_FORM = { date: TODAY, startTime: '', endTime: '', description: '' }

export default function Arbeitszeiten() {
  const [person, setPerson] = useState(PERSONEN[0])
  const [entries, setEntries] = useState([])
  const [view, setView] = useState('Einträge')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

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
  const weekHours = personEntries.filter(e => inRange(e.date, monday, sunday))
    .reduce((s, e) => s + calcHours(e.startTime, e.endTime), 0)

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.date || !form.startTime || !form.endTime) return
    await addDoc(collection(db, 'arbeitszeiten'), {
      person, ...form,
      description: form.description.trim(),
      hours: calcHours(form.startTime, form.endTime),
      createdAt: serverTimestamp(),
    })
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  function startEdit(entry) {
    setEditingId(entry.id)
    setEditForm({ date: entry.date, startTime: entry.startTime, endTime: entry.endTime, description: entry.description || '', person: entry.person })
  }

  async function handleEdit(e) {
    e.preventDefault()
    await updateDoc(doc(db, 'arbeitszeiten', editingId), {
      date: editForm.date,
      startTime: editForm.startTime,
      endTime: editForm.endTime,
      description: editForm.description.trim(),
      person: editForm.person,
      hours: calcHours(editForm.startTime, editForm.endTime),
    })
    setEditingId(null)
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
        {view === 'Einträge' && (
          <button className="btn-icon" onClick={() => { setShowForm(v => !v); setEditingId(null) }}>
            {showForm ? <X size={22} /> : <Plus size={22} />}
          </button>
        )}
      </div>

      <div className="view-toggle">
        {['Einträge', 'Statistik'].map(v => (
          <button key={v} className={`view-toggle-btn ${view === v ? 'active' : ''}`}
            onClick={() => { setView(v); setShowForm(false); setEditingId(null) }}>
            {v === 'Statistik' ? '📊 Statistik' : '📋 Einträge'}
          </button>
        ))}
      </div>

      {view === 'Statistik' ? <StatistikView entries={entries} /> : (
        <>
          <div className="person-tabs">
            {PERSONEN.map(p => (
              <button key={p} className={`person-tab ${person === p ? `active ${slug(p)}` : ''}`}
                onClick={() => { setPerson(p); setEditingId(null) }}>{p}</button>
            ))}
          </div>

          {showForm && (
            <div className="card form-card">
              <div className="form-header">
                <h3>Neue Einheit – {person}</h3>
                <button className="btn-icon-sm" onClick={() => setShowForm(false)}><X size={18} /></button>
              </div>
              <form onSubmit={handleAdd}>
                <label>Datum<input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required /></label>
                <div className="row">
                  <label>Von<input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} required /></label>
                  <label>Bis<input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} required /></label>
                </div>
                <label>Beschreibung<textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Was wurde gemacht?" /></label>
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
              <div className="empty-state">Noch keine Einträge für {person}.<br />Auf + drücken um zu beginnen.</div>
            )}
            {sortedDates.map(date => {
              const dateEntries = grouped[date]
              const dayHours = dateEntries.reduce((s, e) => s + calcHours(e.startTime, e.endTime), 0)
              const dateObj = new Date(date + 'T00:00:00')
              return (
                <div key={date} className="date-group">
                  <div className="date-header">
                    <span>{dateObj.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'long', year: dateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })}</span>
                    <span className="date-total">{fmtHours(dayHours)}</span>
                  </div>
                  {dateEntries.map(entry => (
                    editingId === entry.id ? (
                      <div key={entry.id} className="card edit-inline-form">
                        <form onSubmit={handleEdit}>
                          <label>Person
                            <div className="person-select">
                              {PERSONEN.map(p => (
                                <button key={p} type="button"
                                  className={`person-btn ${editForm.person === p ? `active chip-${slug(p)}` : ''}`}
                                  onClick={() => setEditForm(f => ({ ...f, person: p }))}>{p}</button>
                              ))}
                            </div>
                          </label>
                          <label>Datum<input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} required /></label>
                          <div className="row">
                            <label>Von<input type="time" value={editForm.startTime} onChange={e => setEditForm(f => ({ ...f, startTime: e.target.value }))} required /></label>
                            <label>Bis<input type="time" value={editForm.endTime} onChange={e => setEditForm(f => ({ ...f, endTime: e.target.value }))} required /></label>
                          </div>
                          <label>Beschreibung<textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={2} /></label>
                          <div className="form-actions">
                            <button type="button" className="btn-secondary" onClick={() => setEditingId(null)}>Abbrechen</button>
                            <button type="submit" className="btn-primary">Speichern</button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <div key={entry.id} className="entry-card card">
                        <div className="entry-main">
                          <div className="entry-time">
                            <span>{entry.startTime} – {entry.endTime}</span>
                            <span className="entry-hours">{fmtHours(calcHours(entry.startTime, entry.endTime))}</span>
                          </div>
                          {entry.description && <p className="entry-desc">{entry.description}</p>}
                        </div>
                        {confirmDeleteId === entry.id ? (
                          <div className="delete-confirm">
                            <span className="delete-confirm-text">Löschen?</span>
                            <button className="btn-confirm-yes" onClick={() => { setConfirmDeleteId(null); handleDelete(entry.id) }}>Ja</button>
                            <button className="btn-confirm-no" onClick={() => setConfirmDeleteId(null)}>Nein</button>
                          </div>
                        ) : (
                          <div className="entry-actions-row">
                            <button className="btn-edit" onClick={() => startEdit(entry)}><Edit2 size={16} /></button>
                            <button className="btn-delete" onClick={() => setConfirmDeleteId(entry.id)}><Trash2 size={16} /></button>
                          </div>
                        )}
                      </div>
                    )
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
